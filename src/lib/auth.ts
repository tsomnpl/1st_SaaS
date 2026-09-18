import { auth, currentUser } from "@clerk/nextjs/server";
import { UserRole, UserStatus } from "@prisma/client";
import { isConfiguredAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function requireAuth() {
  const session = await auth();
  if (!session.userId) {
    throw new Error("UNAUTHORIZED");
  }
  return session.userId;
}

export async function readClerkIdentity(clerkUserId: string) {
  const clerkUser = await currentUser();
  if (!clerkUser || clerkUser.id !== clerkUserId) {
    return { email: null as string | null, name: null as string | null };
  }
  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    null;
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
  return { email, name };
}

export async function ensureUserProfile(clerkUserId: string) {
  const identity = await readClerkIdentity(clerkUserId);
  const admin = isConfiguredAdmin({ clerkUserId, email: identity.email });
  return prisma.user.upsert({
    where: { clerkUserId },
    update: {
      email: identity.email ?? undefined,
      name: identity.name ?? undefined,
      role: admin ? UserRole.ADMIN : UserRole.USER,
    },
    create: {
      clerkUserId,
      email: identity.email,
      name: identity.name,
      role: admin ? UserRole.ADMIN : UserRole.USER,
    },
  });
}

export async function requireAdminUser() {
  const clerkUserId = await requireAuth();
  const identity = await readClerkIdentity(clerkUserId);
  if (!isConfiguredAdmin({ clerkUserId, email: identity.email })) {
    throw new Error("FORBIDDEN");
  }
  const user = await ensureUserProfile(clerkUserId);
  if (user.role !== UserRole.ADMIN) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function currentUserIsAdmin() {
  const session = await auth();
  if (!session.userId) return false;
  const identity = await readClerkIdentity(session.userId);
  return isConfiguredAdmin({ clerkUserId: session.userId, email: identity.email });
}

export function assertActiveUser(status: UserStatus) {
  if (status === UserStatus.SUSPENDED) {
    throw new Error("ACCOUNT_SUSPENDED");
  }
}
