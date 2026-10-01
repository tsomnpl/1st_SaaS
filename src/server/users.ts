import { cookies } from "next/headers";
import { UserStatus } from "@prisma/client";
import { requireAuth, ensureUserProfile, readClerkIdentity } from "@/lib/auth";
import { REFERRAL_COOKIE } from "@/lib/referral-code";
import { ensureCreditAccount, expireCredits, grantWelcomeMintIfNeeded } from "@/server/credits";
import { redeemPendingMintGrants } from "@/server/mint-grants";
import { claimReferral, ensureReferralCode } from "@/server/referral";
import { ensureAccountColumns, isMissingColumn } from "@/server/schema-heal";

export async function getOrCreateCurrentUser() {
  const clerkUserId = await requireAuth();
  await quietAccountStep(() => ensureAccountColumns());
  const user = await openProfile(clerkUserId);
  const identity = await readClerkIdentity(clerkUserId);

  await quietAccountStep(() => ensureCreditAccount(user.id));
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

async function openProfile(clerkUserId: string) {
  try {
    return await ensureUserProfile(clerkUserId);
  } catch (error) {
    if (isMissingColumn(error)) throw error;
    console.error("account-profile", error instanceof Error ? error.message : error);
    return ensureUserProfile(clerkUserId);
  }
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
