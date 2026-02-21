-- CreateTable
CREATE TABLE IF NOT EXISTS "feeds" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "sleeps" (
    "id" SERIAL NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "type" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sleeps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "sleep_wakes" (
    "id" SERIAL NOT NULL,
    "sleep_id" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sleep_wakes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sleep_wakes_sleep_id_idx" ON "sleep_wakes"("sleep_id");

-- AddForeignKey
ALTER TABLE "sleep_wakes" ADD CONSTRAINT "sleep_wakes_sleep_id_fkey" FOREIGN KEY ("sleep_id") REFERENCES "sleeps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
