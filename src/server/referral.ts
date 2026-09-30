import { randomBytes } from "node:crypto";
import { CreditTransactionType, Prisma, ReferralStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  REFERRAL_ALPHABET,
  REFERRAL_BONUS_MINTS,
  REFERRAL_CLAIM_WINDOW_MS,
  normalizeReferralCode,
} from "@/lib/referral-code";
import { grantCredits } from "@/server/credits";

export function randomReferralCode() {
  const bytes = randomBytes(6);
  let body = "";
  for (let index = 0; index < 6; index += 1) {
    body += REFERRAL_ALPHABET[bytes[index] % REFERRAL_ALPHABET.length];
  }
  return `FM-${body}`;
}

function isUnique(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function ensureReferralCode(userId: string) {
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (current?.referralCode) return current.referralCode;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: randomReferralCode() },
        select: { referralCode: true },
      });
      if (updated.referralCode) return updated.referralCode;
    } catch (error) {
      if (!isUnique(error)) throw error;
      const again = await prisma.user.findUnique({
        where: { id: userId },
        select: { referralCode: true },
      });
      if (again?.referralCode) return again.referralCode;
    }
  }
  throw new Error("REFERRAL_CODE_FAILED");
}

export type ClaimResult =
  | { status: "invalid" }
  | { status: "too_old" }
  | { status: "self" }
  | { status: "already" }
  | { status: "rewarded"; referralId: string };

export async function claimReferral(input: {
  referredUserId: string;
  referredClerkUserId: string;
  referredCreatedAt: Date;
  code: string | null | undefined;
  now?: Date;
}): Promise<ClaimResult> {
  const code = normalizeReferralCode(input.code);
  if (!code) return { status: "invalid" };
  const now = input.now ?? new Date();
  if (now.getTime() - input.referredCreatedAt.getTime() > REFERRAL_CLAIM_WINDOW_MS) {
    return { status: "too_old" };
  }

  const referrer = await prisma.user.findUnique({ where: { referralCode: code } });
  if (!referrer) return { status: "invalid" };
  if (referrer.id === input.referredUserId || referrer.clerkUserId === input.referredClerkUserId) {
    return { status: "self" };
  }

  const existing = await prisma.referral.findUnique({ where: { referredUserId: input.referredUserId } });
  if (existing) return { status: "already" };

  try {
    const referralId = await prisma.$transaction(async (tx) => {
      const created = await tx.referral.create({
        data: {
          referrerUserId: referrer.id,
          referredUserId: input.referredUserId,
          code,
          status: ReferralStatus.REWARDED,
          rewardedAt: now,
        },
      });
      await grantCredits(
        referrer.id,
        REFERRAL_BONUS_MINTS,
        CreditTransactionType.BONUS,
        {
          tx,
          reference: created.id,
          metadata: { reason: `Parrainage, ${code}`, referredUserId: input.referredUserId },
        },
        null,
      );
      return created.id;
    });
    return { status: "rewarded", referralId };
  } catch (error) {
    if (isUnique(error)) return { status: "already" };
    throw error;
  }
}
