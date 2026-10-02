import { randomBytes } from "node:crypto";
import { CreditTransactionType, PaymentStatus, Prisma, ReferralStatus } from "@prisma/client";
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
  | { status: "linked"; referralId: string }
  | { status: "rewarded"; referralId: string };

async function payReferralPair(referralId: string, tx: Prisma.TransactionClient, now: Date) {
  const claimed = await tx.referral.updateMany({
    where: { id: referralId, status: ReferralStatus.PENDING },
    data: { status: ReferralStatus.REWARDED, rewardedAt: now },
  });
  if (claimed.count !== 1) return false;
  const referral = await tx.referral.findUniqueOrThrow({ where: { id: referralId } });
  const reason = `Parrainage, ${referral.code}`;
  await grantCredits(
    referral.referrerUserId,
    REFERRAL_BONUS_MINTS,
    CreditTransactionType.BONUS,
    {
      tx,
      reference: `referral:${referral.id}:referrer`,
      metadata: { reason, referredUserId: referral.referredUserId },
    },
    null,
  );
  await grantCredits(
    referral.referredUserId,
    REFERRAL_BONUS_MINTS,
    CreditTransactionType.BONUS,
    {
      tx,
      reference: `referral:${referral.id}:guest`,
      metadata: { reason, referrerUserId: referral.referrerUserId },
    },
    null,
  );
  return true;
}

export async function settleReferralReward(referredUserId: string, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    const referral = await tx.referral.findUnique({ where: { referredUserId } });
    if (!referral || referral.status !== ReferralStatus.PENDING) return false;
    const paid = await tx.payment.findFirst({
      where: { userId: referredUserId, status: PaymentStatus.COMPLETED, creditedAt: { not: null } },
      select: { id: true },
    });
    if (!paid) return false;
    return payReferralPair(referral.id, tx, now);
  });
}

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
  if (existing) {
    if (existing.status === ReferralStatus.PENDING && (await settleReferralReward(input.referredUserId, now))) {
      return { status: "rewarded", referralId: existing.id };
    }
    return { status: "already" };
  }

  try {
    const referralId = await prisma.$transaction(async (tx) => {
      const created = await tx.referral.create({
        data: {
          referrerUserId: referrer.id,
          referredUserId: input.referredUserId,
          code,
          status: ReferralStatus.PENDING,
        },
      });
      return created.id;
    });
    if (await settleReferralReward(input.referredUserId, now)) {
      return { status: "rewarded", referralId };
    }
    return { status: "linked", referralId };
  } catch (error) {
    if (isUnique(error)) return { status: "already" };
    throw error;
  }
}
