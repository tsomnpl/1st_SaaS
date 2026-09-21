import { auth, currentUser } from "@clerk/nextjs/server";
import { UserRole, UserStatus } from "@prisma/client";
import { getPrimaryVerifiedEmail, isConfiguredAdmin } from "@/lib/admin";
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
  const verified = getPrimaryVerifiedEmail(clerkUser);
  const email =
    verified ??
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    null;
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
  return { email, name };
}

export async function isAdmin() {
  try {
    const session = await auth();
    if (!session.userId) return false;
    const clerkUser = await currentUser();
    if (!clerkUser || clerkUser.id !== session.userId) return false;
    return isConfiguredAdmin({
      clerkUserId: clerkUser.id,
      email: getPrimaryVerifiedEmail(clerkUser),
    });
  } catch {
    return false;
  }
}

export async function ensureUserProfile(clerkUserId: string) {
  const identity = await readClerkIdentity(clerkUserId);
  const clerkUser = await currentUser();
  const verified =
    clerkUser && clerkUser.id === clerkUserId ? getPrimaryVerifiedEmail(clerkUser) : null;
  const admin = isConfiguredAdmin({ clerkUserId, email: verified });
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
  if (!(await isAdmin())) {
    throw new Error("FORBIDDEN");
  }
  const user = await ensureUserProfile(clerkUserId);
  if (user.role !== UserRole.ADMIN) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function currentUserIsAdmin() {
  return isAdmin();
}

export function assertActiveUser(status: UserStatus) {
  if (status === UserStatus.SUSPENDED) {
    throw new Error("ACCOUNT_SUSPENDED");
  }
}
