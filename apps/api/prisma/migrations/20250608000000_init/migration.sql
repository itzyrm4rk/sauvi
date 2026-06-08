-- CreateEnum
CREATE TYPE "BloodType" AS ENUM ('O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('masculin', 'feminin');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "google_id" TEXT,
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "blood_type" "BloodType" NOT NULL,
    "gender" "Gender" NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "avatar_url" TEXT,
    "reputation_points" INTEGER NOT NULL DEFAULT 0,
    "last_donation_date" TIMESTAMP(3),
    "next_eligible_date" TIMESTAMP(3),
    "is_eligible" BOOLEAN NOT NULL DEFAULT true,
    "fcm_token" TEXT,
    "refresh_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
