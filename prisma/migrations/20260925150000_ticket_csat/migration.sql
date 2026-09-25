-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "csatScore" INTEGER,
ADD COLUMN "csatComment" TEXT,
ADD COLUMN "csatAskedAt" TIMESTAMP(3),
ADD COLUMN "csatAnsweredAt" TIMESTAMP(3);
