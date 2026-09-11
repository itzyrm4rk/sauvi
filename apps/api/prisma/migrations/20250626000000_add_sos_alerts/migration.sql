-- CreateEnum
CREATE TYPE "SosStatus" AS ENUM ('active', 'closed', 'fulfilled');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('sos_share');

-- CreateTable
CREATE TABLE "sos_alerts" (
    "id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "blood_type_needed" "BloodType" NOT NULL,
    "units_needed" INTEGER NOT NULL,
    "priority" TEXT NOT NULL,
    "hospital_name" TEXT NOT NULL,
    "hospital_address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "city" TEXT NOT NULL,
    "status" "SosStatus" NOT NULL DEFAULT 'active',
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sos_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sos_alerts_requester_id_status_idx" ON "sos_alerts"("requester_id", "status");

-- CreateIndex
CREATE INDEX "sos_alerts_city_status_idx" ON "sos_alerts"("city", "status");

-- AddForeignKey
ALTER TABLE "sos_alerts" ADD CONSTRAINT "sos_alerts_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "in_app_notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "sos_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'sos_share',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "share_url" TEXT,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "in_app_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "in_app_notifications_user_id_read_at_idx" ON "in_app_notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "in_app_notifications_sos_id_idx" ON "in_app_notifications"("sos_id");

-- AddForeignKey
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_sos_id_fkey" FOREIGN KEY ("sos_id") REFERENCES "sos_alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
