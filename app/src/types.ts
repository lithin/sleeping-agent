import { z } from "zod";

export type SleepType = "night" | "nap";

export type SleepWake = {
  id: number;
  sleepId: number;
  timestamp: string;
  notes?: string | null;
};

export type Baby = {
  id: number;
  name?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  feeding?: string | null;
};

export type Sleep = {
  id: number;
  startTime: string;
  endTime: string | null;
  type: SleepType;
  notes?: string | null;
  wakes: SleepWake[];
};

export const sleepSchema = z.object({
  start_date: z.string().min(1, "Start date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_date: z.string().optional(),
  end_time: z.string().optional(),
  type: z.enum(["night", "nap"]),
  notes: z.string().optional(),
});

export const wakeSchema = z.object({
  wakes: z
    .record(
      z.object({
        date: z.string().optional(),
        time: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .default({}),
});

export const babySchema = z.object({
  name: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  feeding: z.string().optional(),
});

export type SleepFormValues = z.infer<typeof sleepSchema>;
export type WakeFormValues = z.infer<typeof wakeSchema>;
export type BabyFormValues = z.infer<typeof babySchema>;
