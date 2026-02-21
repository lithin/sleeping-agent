import { Router } from "express";
import prisma from "../db";

const router = Router();

router.post("/sleeps", async (req, res) => {
  const { start_time, end_time, type, notes } = req.body;
  if (!start_time || !type) {
    return res.status(400).json({ error: "start_time and type are required" });
  }
  try {
    const sleep = await prisma.sleep.create({
      data: {
        startTime: start_time,
        endTime: end_time ?? null,
        startTimeRaw: start_time,
        endTimeRaw: end_time ?? null,
        type,
        notes: notes || null,
      },
    });
    res.status(201).json((sleep));
  } catch (err) {
    console.error("DB insert error", err);
    res.status(500).json({ error: "db error" });
  }
});

router.get("/sleeps", async (_req, res) => {
  try {
    const sleeps = await prisma.sleep.findMany({
      orderBy: { startTime: "desc" },
      include: { wakes: true },
      take: 100,
    });
    console.log("Fetched sleeps", sleeps);
    res.json(sleeps);
  } catch (err) {
    console.error("DB fetch error", err);
    res.status(500).json({ error: "db error" });
  }
});

router.put("/sleeps/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "valid id required" });
  }
  const { start_time, end_time, type, notes } = req.body;
  if (!start_time || !type) {
    return res.status(400).json({ error: "start_time and type are required" });
  }
  try {
    const sleep = await prisma.sleep.update({
      where: { id },
      data: {
        startTime: start_time,
        endTime: end_time ?? null,
        startTimeRaw: start_time,
        endTimeRaw: end_time ?? null,
        type,
        notes: notes || null,
      },
    });
    res.json((sleep));
  } catch (err) {
    console.error("DB update error", err);
    res.status(404).json({ error: "sleep not found" });
  }
});

router.delete("/sleeps/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "valid id required" });
  }
  try {
    await prisma.sleep.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error("DB delete error", err);
    res.status(404).json({ error: "sleep not found" });
  }
});

export default router;
