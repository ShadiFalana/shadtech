-- AlterEnum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'CONTENT_MANAGER';

-- AlterTable
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "ticketNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");

-- AlterTable
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "company" TEXT;
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "serviceInterest" TEXT;
