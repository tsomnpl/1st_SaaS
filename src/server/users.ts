import { UserStatus } from "@prisma/client";
import { requireAuth, ensureUserProfile, readClerkIdentity } from "@/lib/auth";
import { ensureCreditAccount, expireCredits, grantWelcomeMintIfNeeded } from "@/server/credits";
import { redeemPendingMintGrants } from "@/server/mint-grants";

export async function getOrCreateCurrentUser() {
  const clerkUserId = await requireAuth();
  const user = await ensureUserProfile(clerkUserId);
  const identity = await readClerkIdentity(clerkUserId);

  await ensureCreditAccount(user.id);
  await expireCredits();
  await grantWelcomeMintIfNeeded(user);
  await redeemPendingMintGrants({
    userId: user.id,
    verifiedEmails: identity.verifiedEmails,
  });
  return user;
}

export async function requireActiveCurrentUser() {
  const user = await getOrCreateCurrentUser();
  if (user.status === UserStatus.SUSPENDED) {
    throw new Error("ACCOUNT_SUSPENDED");
  }
  return user;
}
