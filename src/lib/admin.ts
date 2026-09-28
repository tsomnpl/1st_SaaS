function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

export function emailsMatch(left?: string | null, right?: string | null) {
  const a = normalizeEmail(left);
  const b = normalizeEmail(right);
  return Boolean(a && b && a === b);
}

export function getConfiguredAdminEmail() {
  return process.env.ADMIN_EMAIL?.trim() || "";
}

export function getAdminClerkIds() {
  return new Set(
    (process.env.ADMIN_CLERK_USER_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export function isConfiguredAdmin(input: {
  clerkUserId?: string | null;
  email?: string | null;
  emails?: Array<string | null | undefined> | null;
}) {
  if (input.clerkUserId && getAdminClerkIds().has(input.clerkUserId)) return true;
  const configured = getConfiguredAdminEmail();
  if (!configured) return false;
  const candidates = [input.email, ...(input.emails ?? [])];
  return candidates.some((email) => emailsMatch(email, configured));
}
