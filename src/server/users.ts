import { auth, currentUser } from "@clerk/nextjs/server";
import { UserRole, UserStatus } from "@prisma/client";
import { getAdminClerkIds } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { ensureCreditAccount, expireCredits, grantWelcomeMintIfNeeded } from "@/server/credits";

export async function getOrCreateCurrentUser() {
  const session = await auth();
  if (!session.userId) throw new Error("UNAUTHORIZED");

  const clerkUser = await currentUser();
  const isAdmin = getAdminClerkIds().has(session.userId);

  const user = await prisma.user.upsert({
    where: { clerkUserId: session.userId },
    update: {
      email: clerkUser?.primaryEmailAddress?.emailAddress ?? undefined,
      name: [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || undefined,
      role: isAdmin ? UserRole.ADMIN : undefined,
    },
    create: {
      clerkUserId: session.userId,
      email: clerkUser?.primaryEmailAddress?.emailAddress ?? null,
      name: [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || null,
      role: isAdmin ? UserRole.ADMIN : UserRole.USER,
    },
  });

  await ensureCreditAccount(user.id);
  await expireCredits();
  await grantWelcomeMintIfNeeded(user);
  return user;
}

export async function requireActiveCurrentUser() {
  const user = await getOrCreateCurrentUser();
  if (user.status === UserStatus.SUSPENDED) {
    throw new Error("ACCOUNT_SUSPENDED");
  }
  return user;
}
