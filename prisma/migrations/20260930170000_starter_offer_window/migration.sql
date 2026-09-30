-- The 2 000 FCFA pack can be switched on for a chosen number of days.
-- Other plans are unchanged. Mint expiry stays on durationDays.

ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "offerDays" INTEGER;
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "offerEndsAt" TIMESTAMP(3);
