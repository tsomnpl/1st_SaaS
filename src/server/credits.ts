import {
  CreditTransactionType,
  Prisma,
  PrismaClient,
  User,
} from "@prisma/client";
import { sortMintBucketsFefo } from "@/lib/mint-buckets";
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

export async function grantCredits(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  options: CreditOptions = {},
  expiresAt: Date | null = null,
) {
  if (amount <= 0) throw new Error("INVALID_CREDIT_AMOUNT");
  const client = getClient(options.tx);
  const account = await ensureCreditAccount(userId, options.tx);
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
) {
  const client = getClient(options.tx);
  await expireCredits(new Date(), options.tx);
  const account = await ensureCreditAccount(userId, options.tx);
  if (account.balance < 1) throw new Error("INSUFFICIENT_MINTS");

  const now = new Date();
  const buckets = await client.creditBucket.findMany({
    where: {
      userId,
      remainingAmount: { gt: 0 },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: [{ expiresAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
  });

  if (!buckets.length) throw new Error("INSUFFICIENT_MINTS");

  const firstBucket = sortMintBucketsFefo(buckets)[0];
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
) {
  if (amount <= 0) throw new Error("INVALID_REMOVE_AMOUNT");
  const client = getClient(options.tx);
  const account = await ensureCreditAccount(userId, options.tx);
  if (account.balance <= 0) {
    return { removed: 0, balanceAfter: 0 };
  }

  const removable = Math.min(amount, account.balance);
  let left = removable;

  const buckets = sortMintBucketsFefo(
    await client.creditBucket.findMany({
      where: {
        userId,
        remainingAmount: { gt: 0 },
      },
      orderBy: [{ expiresAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
    }),
  );

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
  await client.creditTransaction.create({
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

  return { removed: removable, balanceAfter };
}

export async function expireCredits(now = new Date(), tx?: Prisma.TransactionClient) {
  const run = async (client: PrismaClient | Prisma.TransactionClient) => {
    const expiredBuckets = await client.creditBucket.findMany({
      where: {
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
