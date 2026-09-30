export const REFERRAL_COOKIE = "fm-ref";
export const REFERRAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const REFERRAL_CODE_PATTERN = /^FM-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
export const REFERRAL_BONUS_MINTS = 1;
export const REFERRAL_CLAIM_WINDOW_MS = 15 * 60 * 1000;

export function normalizeReferralCode(value: string | null | undefined) {
  const code = value?.trim().toUpperCase() ?? "";
  return REFERRAL_CODE_PATTERN.test(code) ? code : null;
}

export function referralPath(code: string) {
  return `/sign-up?ref=${code}`;
}
