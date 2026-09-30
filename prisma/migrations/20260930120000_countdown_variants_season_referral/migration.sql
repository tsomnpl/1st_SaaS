CREATE TYPE "GenerationVariant" AS ENUM ('A', 'B');

CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'REWARDED', 'REJECTED');

CREATE TABLE "GenerationGroup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "selectedGenerationId" TEXT,
    "mintCost" INTEGER NOT NULL DEFAULT 1,
    "rodiCostA" DOUBLE PRECISION,
    "rodiCostB" DOUBLE PRECISION,
    "rodiCostTotal" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GenerationGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerUserId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "rewardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SeasonalCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "markets" TEXT[],
    "domains" TEXT[],
    "styleProfile" JSONB NOT NULL,
    "referenceIds" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "movable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SeasonalCampaign_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "User" ADD COLUMN "referralCode" TEXT;

ALTER TABLE "Generation" ADD COLUMN "groupId" TEXT;
ALTER TABLE "Generation" ADD COLUMN "variant" "GenerationVariant";

CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
CREATE INDEX "GenerationGroup_userId_createdAt_idx" ON "GenerationGroup"("userId", "createdAt");
CREATE UNIQUE INDEX "Referral_referredUserId_key" ON "Referral"("referredUserId");
CREATE INDEX "Referral_referrerUserId_createdAt_idx" ON "Referral"("referrerUserId", "createdAt");
CREATE UNIQUE INDEX "SeasonalCampaign_slug_key" ON "SeasonalCampaign"("slug");
CREATE INDEX "Generation_groupId_idx" ON "Generation"("groupId");

ALTER TABLE "GenerationGroup" ADD CONSTRAINT "GenerationGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Generation" ADD CONSTRAINT "Generation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GenerationGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerUserId_fkey" FOREIGN KEY ("referrerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
