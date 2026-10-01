import { cookies } from "next/headers";
import { UserStatus } from "@prisma/client";
import { requireAuth, ensureUserProfile, readClerkIdentity } from "@/lib/auth";
import { REFERRAL_COOKIE } from "@/lib/referral-code";
import { ensureCreditAccount, expireCredits, grantWelcomeMintIfNeeded } from "@/server/credits";
import { redeemPendingMintGrants } from "@/server/mint-grants";
import { claimReferral, ensureReferralCode } from "@/server/referral";

export async function getOrCreateCurrentUser() {
  const clerkUserId = await requireAuth();
  const user = await ensureUserProfile(clerkUserId);
  const identity = await readClerkIdentity(clerkUserId);

  await ensureCreditAccount(user.id);
  await quietAccountStep(() => expireCredits(new Date(), undefined, user.id));
  await quietAccountStep(() => grantWelcomeMintIfNeeded(user));
  await quietAccountStep(() =>
    redeemPendingMintGrants({
      userId: user.id,
      verifiedEmails: identity.verifiedEmails,
    }),
  );
  const referralCode = await quietAccountStep(() => ensureReferralCode(user.id));
  await quietAccountStep(() => claimReferralFromCookie(user));
  return { ...user, referralCode: referralCode ?? "" };
}

async function quietAccountStep<T>(step: () => Promise<T>): Promise<T | null> {
  try {
    return await step();
  } catch (error) {
    console.error("account-step", error instanceof Error ? error.message : error);
    return null;
  }
}

async function claimReferralFromCookie(user: { id: string; clerkUserId: string; createdAt: Date }) {
  let code: string | undefined;
  try {
    const jar = await cookies();
    code = jar.get(REFERRAL_COOKIE)?.value;
  } catch {
    return;
  }
  if (!code) return;
  await claimReferral({
    referredUserId: user.id,
    referredClerkUserId: user.clerkUserId,
    referredCreatedAt: user.createdAt,
    code,
  });
}

export async function requireActiveCurrentUser() {
  const user = await getOrCreateCurrentUser();
  if (user.status === UserStatus.SUSPENDED) {
    throw new Error("ACCOUNT_SUSPENDED");
  }
  return user;
}
