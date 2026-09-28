CREATE TYPE "PendingMintGrantStatus" AS ENUM ('PENDING', 'REDEEMED', 'CANCELLED');

CREATE TABLE "PendingMintGrant" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "status" "PendingMintGrantStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT,
    "redeemedAt" TIMESTAMP(3),
    "claimKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PendingMintGrant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PendingMintGrant_claimKey_key" ON "PendingMintGrant"("claimKey");
CREATE INDEX "PendingMintGrant_email_status_idx" ON "PendingMintGrant"("email", "status");
CREATE INDEX "PendingMintGrant_adminUserId_idx" ON "PendingMintGrant"("adminUserId");

ALTER TABLE "PendingMintGrant"
ADD CONSTRAINT "PendingMintGrant_adminUserId_fkey"
FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PendingMintGrant"
ADD CONSTRAINT "PendingMintGrant_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
