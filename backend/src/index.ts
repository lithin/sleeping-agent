import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import prisma from "./db";
import sleepsRouter from "./routes/sleeps";
import wakesRouter from "./routes/wakes";
import insightsRouter from "./routes/insights";

// Construct DATABASE_URL from individual environment variables if not already set
if (!process.env.DATABASE_URL) {
  const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME, DB_SOCKET_PATH } = process.env;
  if (DB_USER && DB_PASSWORD && DB_NAME && DB_SOCKET_PATH) {
    const socketPath = encodeURIComponent(DB_SOCKET_PATH);
    process.env.DATABASE_URL = `postgresql://${DB_USER}:${DB_PASSWORD}@localhost/${DB_NAME}?host=${socketPath}&schema=public`;
  } else if (DB_USER && DB_PASSWORD && DB_HOST && DB_PORT && DB_NAME) {
    process.env.DATABASE_URL = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public`;
  }
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

// API Key authentication middleware
const API_SECRET_KEY = process.env.API_SECRET_KEY;

if (!API_SECRET_KEY) {
  console.error("FATAL: API_SECRET_KEY environment variable is not set!");
  console.error("Set API_SECRET_KEY in your .env file or environment variables.");
  process.exit(1);
}

app.use((req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== API_SECRET_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

app.use(sleepsRouter);
app.use(wakesRouter);
app.use(insightsRouter);

app.get("/baby", async (_req, res) => {
  try {
    const baby = await prisma.baby.findFirst({
      orderBy: { createdAt: "desc" },
    });
    res.json(baby ?? null);
  } catch (err) {
    console.error("DB fetch error", err);
    res.status(500).json({ error: "db error" });
  }
});

app.put("/baby", async (req, res) => {
  const { name, date_of_birth, gender, feeding } = req.body;
  try {
    const baby = await prisma.baby.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        name: name || null,
        dateOfBirth: date_of_birth ? new Date(date_of_birth) : null,
        gender: gender || null,
        feeding: feeding || null,
      },
      update: {
        name: name || null,
        dateOfBirth: date_of_birth ? new Date(date_of_birth) : null,
        gender: gender || null,
        feeding: feeding || null,
      },
    });
    res.json(baby);
  } catch (err) {
    console.error("DB upsert error", err);
    res.status(500).json({ error: "db error" });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening on ${port}`));
