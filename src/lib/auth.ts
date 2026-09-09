import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { getAdminClerkIds } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function requireAuth() {
  const session = await auth();
  if (!session.userId) {
    throw new Error("UNAUTHORIZED");
  }
  return session.userId;
}

export async function ensureUserProfile(clerkUserId: string) {
  const shouldBeAdmin = getAdminClerkIds().has(clerkUserId);
  return prisma.user.upsert({
    where: { clerkUserId },
    update: {
      role: shouldBeAdmin ? UserRole.ADMIN : undefined,
    },
    create: {
      clerkUserId,
      role: shouldBeAdmin ? UserRole.ADMIN : UserRole.USER,
    },
  });
}

export async function requireAdminUser() {
  const clerkUserId = await requireAuth();
  const user = await ensureUserProfile(clerkUserId);
  if (user.role !== UserRole.ADMIN) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
