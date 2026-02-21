-- CreateTable
CREATE TABLE IF NOT EXISTS "babies" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "gender" TEXT,
    "feeding" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "babies_pkey" PRIMARY KEY ("id")
);
