import { CreditTransactionType, PendingMintGrantStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { grantCredits, removeCredits } from "@/server/credits";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function mintAdminMax() {
  const raw = process.env.MINT_ADMIN_MAX;
  if (!raw) return 500;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 5000) return 500;
  return value;
}

export function normalizeGrantEmail(raw: string) {
  return raw.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, "");
}

export function assertGrantEmail(raw: string) {
  const email = normalizeGrantEmail(raw);
  if (!EMAIL_PATTERN.test(email)) throw new Error("INVALID_EMAIL");
  return email;
}

export function assertMintQuantity(amount: number) {
  const max = mintAdminMax();
  if (!Number.isInteger(amount) || amount < 1 || amount > max) {
    throw new Error("INVALID_MINT_AMOUNT");
  }
  return amount;
}

export function assertMintReason(reason: string) {
  const trimmed = reason.trim();
  if (trimmed.length < 2 || trimmed.length > 240) throw new Error("REASON_REQUIRED");
  return trimmed;
}

export function mintGrantReference(grantId: string) {
  return `MINT_GRANT:${grantId}`;
}

export async function adjustUserMints(input: {
  adminUserId: string;
  targetUserId: string;
  amount: number;
  reason: string;
}) {
  const reason = assertMintReason(input.reason);
  if (!Number.isInteger(input.amount) || input.amount === 0) {
    throw new Error("INVALID_MINT_AMOUNT");
  }
  assertMintQuantity(Math.abs(input.amount));

  const target = await prisma.user.findUnique({ where: { id: input.targetUserId } });
  if (!target) throw new Error("USER_NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    const shared = {
      tx,
      reference: "ADMIN_ADJUSTMENT",
      metadata: { reason, adminUserId: input.adminUserId } satisfies Prisma.InputJsonValue,
    };

    const credited =
      input.amount > 0
        ? await grantCredits(input.targetUserId, input.amount, CreditTransactionType.ADMIN_ADD, shared, null)
        : await removeCredits(input.targetUserId, Math.abs(input.amount), shared);

    await tx.adminLog.create({
      data: {
        adminUserId: input.adminUserId,
        action: input.amount > 0 ? "ADMIN_ADD_MINT" : "ADMIN_REMOVE_MINT",
        targetType: "USER",
        targetId: input.targetUserId,
        metadata: {
          amount: credited.transaction.amount,
          reason,
          balanceBefore: credited.transaction.balanceBefore,
          balanceAfter: credited.balanceAfter,
        },
      },
    });

    return {
      type: credited.transaction.type,
      amount: credited.transaction.amount,
      reason,
      balanceBefore: credited.transaction.balanceBefore,
      balanceAfter: credited.balanceAfter,
      ledgerId: credited.transaction.id,
    };
  });
}

export async function createPendingMintGrant(input: {
  adminUserId: string;
  email: string;
  amount: number;
  reason: string;
  expiresAt?: Date | null;
}) {
  const email = assertGrantEmail(input.email);
  const amount = assertMintQuantity(input.amount);
  const reason = assertMintReason(input.reason);
  const expiresAt = input.expiresAt ?? null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) throw new Error("INVALID_MINT_AMOUNT");

  return prisma.$transaction(async (tx) => {
    const grant = await tx.pendingMintGrant.create({
      data: {
        email,
        amount,
        reason,
        adminUserId: input.adminUserId,
        expiresAt,
        status: PendingMintGrantStatus.PENDING,
      },
    });
    await tx.adminLog.create({
      data: {
        adminUserId: input.adminUserId,
        action: "PENDING_MINT_GRANT",
        targetType: "PENDING_MINT_GRANT",
        targetId: grant.id,
        metadata: { email, amount, reason, expiresAt: expiresAt?.toISOString() ?? null },
      },
    });
    return grant;
  });
}

export async function cancelPendingMintGrant(input: { adminUserId: string; grantId: string }) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.pendingMintGrant.updateMany({
      where: { id: input.grantId, status: PendingMintGrantStatus.PENDING },
      data: { status: PendingMintGrantStatus.CANCELLED },
    });
    if (updated.count !== 1) throw new Error("GRANT_NOT_PENDING");
    await tx.adminLog.create({
      data: {
        adminUserId: input.adminUserId,
        action: "CANCEL_MINT_GRANT",
        targetType: "PENDING_MINT_GRANT",
        targetId: input.grantId,
        metadata: {},
      },
    });
  });
}

export function isMissingPendingMintGrantTable(error: unknown) {
  const code =
    error && typeof error === "object" && "code" in error ? String((error as { code?: unknown }).code) : "";
  const message = error instanceof Error
    ? error.message
    : String((error as { message?: unknown } | null)?.message ?? error ?? "");
  if (!/pendingmintgrant/i.test(message)) return false;
  return code === "P2021" || code === "P2022" || /does not exist|n'existe pas/i.test(message);
}

export async function listRecentMintGrants(take = 40) {
  try {
    return await prisma.pendingMintGrant.findMany({
      orderBy: { createdAt: "desc" },
      take,
      include: { admin: true, user: true },
    });
  } catch (error) {
    if (!isMissingPendingMintGrantTable(error)) throw error;
    return [];
  }
}

export async function redeemPendingMintGrants(input: { userId: string; verifiedEmails: string[] }) {
  const emails = [...new Set(input.verifiedEmails.map(normalizeGrantEmail).filter((email) => EMAIL_PATTERN.test(email)))];
  if (!emails.length) return { appliedIds: [] as string[] };

  const now = new Date();
  let pending;
  try {
    pending = await prisma.pendingMintGrant.findMany({
      where: {
        email: { in: emails },
        status: PendingMintGrantStatus.PENDING,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });
  } catch (error) {
    if (!isMissingPendingMintGrantTable(error)) throw error;
    return { appliedIds: [] as string[] };
  }

  const appliedIds: string[] = [];
  for (const grant of pending) {
    const applied = await prisma.$transaction(async (tx) => {
      const reference = mintGrantReference(grant.id);
      const already = await tx.creditTransaction.findFirst({ where: { reference } });
      const claimed = await tx.pendingMintGrant.updateMany({
        where: {
          id: grant.id,
          status: PendingMintGrantStatus.PENDING,
          claimKey: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        data: {
          status: PendingMintGrantStatus.REDEEMED,
          userId: input.userId,
          redeemedAt: now,
          claimKey: grant.id,
        },
      });
      if (claimed.count !== 1) return false;
      if (already) return false;
      await grantCredits(
        input.userId,
        grant.amount,
        CreditTransactionType.ADMIN_ADD,
        {
          tx,
          reference,
          metadata: {
            reason: grant.reason,
            pendingMintGrantId: grant.id,
            source: "EMAIL_GRANT",
            adminUserId: grant.adminUserId,
          },
        },
        grant.expiresAt,
      );
      return true;
    });
    if (applied) appliedIds.push(grant.id);
  }

  return { appliedIds };
}
