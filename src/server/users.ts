import { UserStatus } from "@prisma/client";
import { requireAuth, ensureUserProfile } from "@/lib/auth";
import { ensureCreditAccount, expireCredits, grantWelcomeMintIfNeeded } from "@/server/credits";

export async function getOrCreateCurrentUser() {
  const clerkUserId = await requireAuth();
  const user = await ensureUserProfile(clerkUserId);

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
