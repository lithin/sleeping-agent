import { Router } from "express";
import prisma from "../db";

type SleepWakeRecord = { timestamp: Date; notes: string | null };
type SleepRecord = {
  startTimeRaw: string | null;
  endTimeRaw: string | null;
  wakes: SleepWakeRecord[];
};

const router = Router();

const buildInsightsPayload = async () => {
  const [baby, sleeps] = await Promise.all([
    prisma.baby.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.sleep.findMany({
      orderBy: { startTime: "desc" },
      take: 100,
      include: {
        wakes: {
          orderBy: { timestamp: "asc" },
        },
      },
    }) as Promise<SleepRecord[]>,
  ]);

  const payload = {
    sleeps: sleeps.map((sleep: SleepRecord) => ({
      startTime: sleep.startTimeRaw,
      endTime: sleep.endTimeRaw,
      wakes: sleep.wakes.map((wake) => ({
        timestamp: wake.timestamp.toISOString(),
        notes: wake.notes,
      })),
    })),
  };

  const babyAgeWeeks =
    baby?.dateOfBirth
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - baby.dateOfBirth.getTime()) /
              (1000 * 60 * 60 * 24 * 7),
          ),
        )
      : null;

  return { payload, babyAgeWeeks };
};

const requestOpenAiJson = async <T>(
  apiKey: string,
  prompt: string,
  payload: unknown,
  responseSchema: {
    name: string;
    schema: Record<string, unknown>;
    strict: boolean;
  },
  maxOutputTokens: number,
) => {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5",
      input: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: `Baby data:\n${JSON.stringify(payload, null, 2)}`,
        },
      ],
      max_output_tokens: maxOutputTokens,
      reasoning: { effort: "low" },
      text: {
        format: {
          type: "json_schema",
          name: responseSchema.name,
          schema: responseSchema.schema,
          strict: responseSchema.strict,
        },
        verbosity: "low",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "openai error");
  }

  const data = (await response.json()) as {
    output_text?: string | string[];
    output?: Array<{
      content?: Array<{ type?: string; text?: string | { value?: string } }>;
    }>;
  };

  const outputTextFromTopLevel = Array.isArray(data.output_text)
    ? data.output_text.join("\n")
    : data.output_text ?? "";

  const outputTextFromContent =
    data.output
      ?.flatMap((item) => item.content ?? [])
      .filter((item) => item.type === "output_text" || item.type === "summary_text" || item.type === "refusal")
      .map((item) => {
        if (typeof item.text === "string") {
          return item.text;
        }
        if (item.text && typeof item.text === "object" && typeof item.text.value === "string") {
          return item.text.value;
        }
        return "";
      })
      .filter((text) => text.length > 0)
      .join("\n") ?? "";

  let content = (outputTextFromTopLevel || outputTextFromContent || "").trim();

  if (!content.trim()) {
    console.error("Empty OpenAI response:", JSON.stringify(data, null, 2));
    throw new Error("empty openai response");
  }

  content = content
    .replace(/^```(?:json)?\s*\n?/, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(content) as T;
  } catch (err) {
    throw new Error("Failed to parse insights response");
  }
};

router.get("/insights/next-nap", async (_req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not configured" });
  }

  try {
    const latestSleep = await prisma.sleep.findFirst({
      where: { endTime: { not: null } },
      orderBy: { endTime: "desc" },
    });
    const lastSleepEnd = latestSleep?.endTime ?? null;
    const hasRecentSleep =
      lastSleepEnd && Date.now() - lastSleepEnd.getTime() <= 12 * 60 * 60 * 1000;

    if (!hasRecentSleep) {
      return res.json({ sleepTime: null, confidence: null });
    }

    const cacheKey = "sleep-next-nap";
    const [cached, lastSleep, lastWake] = await Promise.all([
      prisma.cacheEntry.findUnique({ where: { key: cacheKey } }),
      prisma.sleep.aggregate({
        _max: { updatedAt: true, createdAt: true },
      }),
      prisma.sleepWake.aggregate({
        _max: { updatedAt: true, createdAt: true },
      }),
    ]);

    const latestSleepChange = lastSleep._max.updatedAt ?? lastSleep._max.createdAt ?? null;
    const latestWakeChange = lastWake._max.updatedAt ?? lastWake._max.createdAt ?? null;
    const latestChange =
      latestSleepChange && latestWakeChange
        ? new Date(Math.max(latestSleepChange.getTime(), latestWakeChange.getTime()))
        : latestSleepChange ?? latestWakeChange;

    if (cached) {
      const ageMs = Date.now() - cached.timestamp.getTime();
      const isFresh = ageMs < 24 * 60 * 60 * 1000;
      const isNewerThanData = !latestChange || cached.timestamp >= latestChange;

      if (isFresh && isNewerThanData) {
        try {
          const parsed = JSON.parse(cached.data) as { sleepTime?: string | null; confidence?: number };
          return res.json({ 
            sleepTime: typeof parsed.sleepTime === "string" ? parsed.sleepTime : null,
            confidence: typeof parsed.confidence === "number" ? parsed.confidence : null
          });
        } catch {
          return res.json({ sleepTime: cached.data, confidence: null });
        }
      }
    }

    const { payload, babyAgeWeeks } = await buildInsightsPayload();

    const prompt = `You are a sleep coach analyzing baby sleep patterns.

We have a baby that's ${babyAgeWeeks ?? "unknown"} weeks old.

Determine the next nap time (sleepTime) = last sleep end time + age-appropriate wake window
- If there is no baby data or no sleeps, set "sleepTime" to null.
- Consider typical wake windows for the baby's age.
- Consider the actual wake times observed in the sleeps data.
- Consider the time of day and how it affects their wake windows and nap length.

Also provide a confidence level (0-100) indicating how confident you are in this recommendation:
- 100 = very confident (plenty of data, clear patterns, typical timing)
- 70-90 = moderately confident (some data, reasonable patterns)
- 40-60 = somewhat confident (limited data or mixed patterns)
- 0-30 = low confidence (very little data or irregular patterns)

Only return valid JSON that matches the provided schema. Do not include markdown fences, commentary, or any other text.`;

    const responseSchema = {
      name: "SleepNextNap",
      schema: {
        type: "object",
        properties: {
          sleepTime: { type: ["string", "null"], description: "Suggested next nap time in ISO 8601." },
          confidence: { type: "number", description: "Confidence level from 0-100" },
        },
        required: ["sleepTime", "confidence"],
        additionalProperties: false,
      },
      strict: true,
    } as const;

    const result = await requestOpenAiJson<{ sleepTime: string | null; confidence: number }>(
      apiKey,
      prompt,
      payload,
      responseSchema,
      1600,
    );

    const sleepTime = typeof result.sleepTime === "string" ? result.sleepTime : null;
    const confidence = typeof result.confidence === "number" ? Math.max(0, Math.min(100, result.confidence)) : null;
    const cachedValue = JSON.stringify({ sleepTime, confidence });

    await prisma.cacheEntry.upsert({
      where: { key: cacheKey },
      create: {
        key: cacheKey,
        timestamp: new Date(),
        data: cachedValue,
      },
      update: {
        timestamp: new Date(),
        data: cachedValue,
      },
    });

    res.json({ sleepTime, confidence });
  } catch (err) {
    console.error("Next nap insights error", err);
    res.status(500).json({ error: (err as Error).message || "insights error" });
  }
});

router.get("/insights/analysis", async (_req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not configured" });
  }

  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSleepCount = await prisma.sleep.count({
      where: { startTime: { gte: weekAgo } },
    });

    if (recentSleepCount < 5) {
      return res.json({ analysis: null });
    }

    const cacheKey = "sleep-analysis";
    const cached = await prisma.cacheEntry.findUnique({ where: { key: cacheKey } });
    if (cached) {
      const ageMs = Date.now() - cached.timestamp.getTime();
      if (ageMs < 24 * 60 * 60 * 1000 && cached.data.trim()) {
        return res.json({ analysis: cached.data });
      }
    }

    const { payload, babyAgeWeeks } = await buildInsightsPayload();

    const prompt = `You are a sleep coach analyzing baby sleep patterns.

We have a baby that's ${babyAgeWeeks ?? "unknown"} weeks old.

Analyze sleeps over the last 7 days
- Take into account baby's age and typical sleep behaviour of babies that age.
- Take into account types of sleep (nap vs night), wakes during sleeps, and notes on sleep.
- Provide a short summary (around 4 sentences) of sleep trends in the "analysis" field, focusing both on day (nap) sleep and night sleep. Write it for a parent, not a scientist.

Only return valid JSON that matches the provided schema. Do not include markdown fences, commentary, or any other text.`;

    const responseSchema = {
      name: "SleepAnalysis",
      schema: {
        type: "object",
        properties: {
          analysis: { type: "string", description: "Short analysis of recent sleep trends." },
        },
        required: ["analysis"],
        additionalProperties: false,
      },
      strict: true,
    } as const;

    const result = await requestOpenAiJson<{ analysis: string }>(
      apiKey,
      prompt,
      payload,
      responseSchema,
      1600,
    );

    const analysis = typeof result.analysis === "string" ? result.analysis : "";

    await prisma.cacheEntry.upsert({
      where: { key: cacheKey },
      create: {
        key: cacheKey,
        timestamp: new Date(),
        data: analysis,
      },
      update: {
        timestamp: new Date(),
        data: analysis,
      },
    });

    res.json({ analysis });
  } catch (err) {
    console.error("Sleep analysis error", err);
    res.status(500).json({ error: (err as Error).message || "insights error" });
  }
});

export default router;
