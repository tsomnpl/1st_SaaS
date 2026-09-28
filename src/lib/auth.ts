import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { UserRole, UserStatus } from "@prisma/client";
import { collectClerkEmails, isConfiguredAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function requireAuth() {
  const session = await auth();
  if (!session.userId) {
    throw new Error("UNAUTHORIZED");
  }
  return session.userId;
}

function identityFromClerkUser(user: {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  primaryEmailAddress?: { emailAddress?: string | null } | null;
  emailAddresses?: Array<{ emailAddress?: string | null }>;
}) {
  const collected = collectClerkEmails({
    primary: user.primaryEmailAddress?.emailAddress,
    addresses: (user.emailAddresses ?? []).map((address) => address.emailAddress),
  });
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
  return { email: collected.email, name, verifiedEmails: collected.emails };
}

export async function readClerkIdentity(clerkUserId: string) {
  const empty = {
    email: null as string | null,
    name: null as string | null,
    verifiedEmails: [] as string[],
  };
  try {
    const clerkUser = await currentUser();
    if (clerkUser && clerkUser.id === clerkUserId) return identityFromClerkUser(clerkUser);
  } catch {
    // Clerk session user can be missing while auth() still has the id.
  }
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(clerkUserId);
    if (user?.id === clerkUserId) return identityFromClerkUser(user);
  } catch {
    return empty;
  }
  return empty;
}

export async function ensureUserProfile(clerkUserId: string) {
  const identity = await readClerkIdentity(clerkUserId);
  const identityKnown = Boolean(identity.email || identity.verifiedEmails.length > 0);
  const admin = isConfiguredAdmin({
    clerkUserId,
    email: identity.email,
    emails: identity.verifiedEmails,
  });
  return prisma.user.upsert({
    where: { clerkUserId },
    update: {
      email: identity.email ?? undefined,
      name: identity.name ?? undefined,
      ...(identityKnown ? { role: admin ? UserRole.ADMIN : UserRole.USER } : {}),
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
  if (!isConfiguredAdmin({ clerkUserId, email: identity.email, emails: identity.verifiedEmails })) {
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
  return isConfiguredAdmin({
    clerkUserId: session.userId,
    email: identity.email,
    emails: identity.verifiedEmails,
  });
}

export function assertActiveUser(status: UserStatus) {
  if (status === UserStatus.SUSPENDED) {
    throw new Error("ACCOUNT_SUSPENDED");
  }
}
