import {
  CreditTransaction,
  CreditTransactionType,
  Prisma,
  PrismaClient,
  User,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

type CreditOptions = {
  tx?: Prisma.TransactionClient;
  reference?: string;
  metadata?: Prisma.InputJsonValue;
};

function getClient(tx?: Prisma.TransactionClient): PrismaClient | Prisma.TransactionClient {
  return tx ?? prisma;
}

export async function ensureCreditAccount(userId: string, tx?: Prisma.TransactionClient) {
  const client = getClient(tx);
  return client.creditAccount.upsert({
    where: { userId },
    update: {},
    create: { userId, balance: 0 },
  });
}

async function lockCreditAccount(userId: string, client: Prisma.TransactionClient) {
  await ensureCreditAccount(userId, client);
  await client.$queryRaw`SELECT "id" FROM "CreditAccount" WHERE "userId" = ${userId} FOR UPDATE`;
  return client.creditAccount.findUniqueOrThrow({ where: { userId } });
}

export async function grantCredits(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  options: CreditOptions = {},
  expiresAt: Date | null = null,
): Promise<{ transaction: CreditTransaction; balanceAfter: number }> {
  if (!options.tx) {
    return prisma.$transaction((tx) => grantCredits(userId, amount, type, { ...options, tx }, expiresAt));
  }
  if (amount <= 0) throw new Error("INVALID_CREDIT_AMOUNT");
  const client = getClient(options.tx);
  const account = await lockCreditAccount(userId, options.tx);
  const balanceBefore = account.balance;
  const balanceAfter = balanceBefore + amount;

  const transaction = await client.creditTransaction.create({
    data: {
      userId,
      type,
      amount,
      balanceBefore,
      balanceAfter,
      reference: options.reference,
      metadata: options.metadata,
    },
  });

  await client.creditAccount.update({
    where: { userId },
    data: { balance: balanceAfter },
  });

  await client.creditBucket.create({
    data: {
      userId,
      sourceTransactionId: transaction.id,
      sourceType: type,
      totalAmount: amount,
      remainingAmount: amount,
      expiresAt,
    },
  });

  return { transaction, balanceAfter };
}

export async function consumeOneMint(
  userId: string,
  options: CreditOptions = {},
): Promise<{ transaction: CreditTransaction; balanceAfter: number }> {
  if (!options.tx) {
    return prisma.$transaction((tx) => consumeOneMint(userId, { ...options, tx }));
  }
  const client = getClient(options.tx);
  await expireCredits(new Date(), options.tx, userId);
  const account = await lockCreditAccount(userId, options.tx);
  if (account.balance < 1) throw new Error("INSUFFICIENT_MINTS");

  const now = new Date();
  const buckets = await client.creditBucket.findMany({
    where: {
      userId,
      remainingAmount: { gt: 0 },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: [{ expiresAt: "asc" }, { createdAt: "asc" }],
  });

  if (!buckets.length) throw new Error("INSUFFICIENT_MINTS");

  const firstBucket = buckets[0];
  await client.creditBucket.update({
    where: { id: firstBucket.id },
    data: { remainingAmount: { decrement: 1 } },
  });

  const balanceBefore = account.balance;
  const balanceAfter = balanceBefore - 1;
  const transaction = await client.creditTransaction.create({
    data: {
      userId,
      type: CreditTransactionType.GENERATION,
      amount: -1,
      balanceBefore,
      balanceAfter,
      reference: options.reference,
      metadata: options.metadata,
    },
  });

  await client.creditAccount.update({
    where: { userId },
    data: { balance: balanceAfter },
  });

  return { transaction, balanceAfter };
}

export async function removeCredits(
  userId: string,
  amount: number,
  options: CreditOptions = {},
): Promise<{ removed: number; balanceAfter: number; transaction: CreditTransaction }> {
  if (!options.tx) {
    return prisma.$transaction((tx) => removeCredits(userId, amount, { ...options, tx }));
  }
  if (amount <= 0) throw new Error("INVALID_REMOVE_AMOUNT");
  const client = getClient(options.tx);
  const account = await lockCreditAccount(userId, options.tx);
  if (account.balance < amount) {
    throw new Error("BALANCE_WOULD_BE_NEGATIVE");
  }

  const removable = amount;
  let left = removable;

  const buckets = await client.creditBucket.findMany({
    where: {
      userId,
      remainingAmount: { gt: 0 },
    },
    orderBy: [{ expiresAt: "asc" }, { createdAt: "asc" }],
  });

  for (const bucket of buckets) {
    if (left <= 0) break;
    const take = Math.min(left, bucket.remainingAmount);
    await client.creditBucket.update({
      where: { id: bucket.id },
      data: { remainingAmount: { decrement: take } },
    });
    left -= take;
  }

  const balanceBefore = account.balance;
  const balanceAfter = balanceBefore - removable;
  const transaction = await client.creditTransaction.create({
    data: {
      userId,
      type: CreditTransactionType.ADMIN_REMOVE,
      amount: -removable,
      balanceBefore,
      balanceAfter,
      reference: options.reference,
      metadata: options.metadata,
    },
  });
  await client.creditAccount.update({
    where: { userId },
    data: { balance: balanceAfter },
  });

  return { removed: removable, balanceAfter, transaction };
}

export async function expireCredits(now = new Date(), tx?: Prisma.TransactionClient, userId?: string) {
  const run = async (client: PrismaClient | Prisma.TransactionClient) => {
    const expiredBuckets = await client.creditBucket.findMany({
      where: {
        ...(userId ? { userId } : {}),
        expiresAt: { lte: now },
        remainingAmount: { gt: 0 },
      },
    });

    for (const bucket of expiredBuckets) {
      const account = await ensureCreditAccount(bucket.userId, client === prisma ? undefined : (client as Prisma.TransactionClient));
      const balanceBefore = account.balance;
      const amount = bucket.remainingAmount;
      const balanceAfter = Math.max(0, balanceBefore - amount);

      await client.creditTransaction.create({
        data: {
          userId: bucket.userId,
          type: CreditTransactionType.EXPIRATION,
          amount: -amount,
          balanceBefore,
          balanceAfter,
          reference: bucket.id,
          metadata: {
            sourceBucketId: bucket.id,
          },
        },
      });

      await client.creditAccount.update({
        where: { userId: bucket.userId },
        data: { balance: balanceAfter },
      });

      await client.creditBucket.update({
        where: { id: bucket.id },
        data: { remainingAmount: 0 },
      });
    }

    return expiredBuckets.length;
  };

  if (tx) return run(tx);
  return prisma.$transaction((inner) => run(inner));
}

export async function grantWelcomeMintIfNeeded(user: User) {
  const alreadyGranted = await prisma.creditTransaction.findFirst({
    where: {
      userId: user.id,
      type: CreditTransactionType.FREE_GRANT,
      reference: "WELCOME_GRANT",
    },
  });
  if (alreadyGranted) return;
  await grantCredits(
    user.id,
    1,
    CreditTransactionType.FREE_GRANT,
    { reference: "WELCOME_GRANT" },
    null,
  );
}
