import { Router } from "express";
import prisma from "../db";

const router = Router();

router.post("/sleep-wakes", async (req, res) => {
  const { sleep_id, timestamp, notes } = req.body;
  if (!sleep_id || !timestamp) {
    return res.status(400).json({ error: "sleep_id and timestamp are required" });
  }
  try {
    const wake = await prisma.sleepWake.create({
      data: {
        sleepId: sleep_id,
        timestamp: new Date(timestamp),
        notes: notes || null,
      },
    });
    res.status(201).json(wake);
  } catch (err) {
    console.error("DB insert error", err);
    res.status(500).json({ error: "db error" });
  }
});

router.delete("/sleep-wakes/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "valid id required" });
  }
  try {
    await prisma.sleepWake.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error("DB delete error", err);
    res.status(404).json({ error: "wake not found" });
  }
});

export default router;
