CREATE TYPE "SupportCategory" AS ENUM ('GENERATION', 'PAYMENT', 'ACCOUNT', 'EXPORT', 'PERSONAL_REFERENCE', 'BUG', 'SUGGESTION', 'OTHER');
CREATE TYPE "SupportPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "SupportStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED');
CREATE TYPE "SupportAuthorType" AS ENUM ('USER', 'SUPPORT');
CREATE TYPE "SupportEmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

CREATE TABLE "SupportSequence" (
    "id" INTEGER NOT NULL,
    "next" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "SupportSequence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" "SupportCategory" NOT NULL,
    "priority" "SupportPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "SupportStatus" NOT NULL DEFAULT 'OPEN',
    "generationId" TEXT,
    "paymentId" TEXT,
    "context" JSONB,
    "clientRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorType" "SupportAuthorType" NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportAttachment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "messageId" TEXT,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "bytes" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportAttachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportEmailEvent" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "messageId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "status" "SupportEmailStatus" NOT NULL DEFAULT 'PENDING',
    "providerMessageId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SupportEmailEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");
CREATE UNIQUE INDEX "SupportTicket_userId_clientRequestId_key" ON "SupportTicket"("userId", "clientRequestId");
CREATE INDEX "SupportTicket_userId_updatedAt_idx" ON "SupportTicket"("userId", "updatedAt");
CREATE INDEX "SupportTicket_status_priority_updatedAt_idx" ON "SupportTicket"("status", "priority", "updatedAt");
CREATE INDEX "SupportMessage_ticketId_createdAt_idx" ON "SupportMessage"("ticketId", "createdAt");
CREATE UNIQUE INDEX "SupportAttachment_storageKey_key" ON "SupportAttachment"("storageKey");
CREATE INDEX "SupportAttachment_ticketId_idx" ON "SupportAttachment"("ticketId");
CREATE UNIQUE INDEX "SupportEmailEvent_eventKey_key" ON "SupportEmailEvent"("eventKey");
CREATE INDEX "SupportEmailEvent_ticketId_createdAt_idx" ON "SupportEmailEvent"("ticketId", "createdAt");

ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "Generation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportAttachment" ADD CONSTRAINT "SupportAttachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportAttachment" ADD CONSTRAINT "SupportAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "SupportMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportEmailEvent" ADD CONSTRAINT "SupportEmailEvent_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
