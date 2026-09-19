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
}) {
  const email = normalizeEmail(input.email);
  const configuredEmail = normalizeEmail(getConfiguredAdminEmail());
  if (configuredEmail && email && email === configuredEmail) {
    return true;
  }
  if (input.clerkUserId && getAdminClerkIds().has(input.clerkUserId)) {
    return true;
  }
  return false;
}
