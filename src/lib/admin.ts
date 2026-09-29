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

export function collectClerkEmails(input: {
  primary?: string | null;
  addresses?: Array<string | null | undefined> | null;
}) {
  const emails = [input.primary, ...(input.addresses ?? [])]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean);
  return {
    email: emails[0] ?? null,
    emails: [...new Set(emails.map((value) => value.toLowerCase()))],
  };
}

export function isConfiguredAdmin(input: {
  clerkUserId?: string | null;
  email?: string | null;
  emails?: Array<string | null | undefined> | null;
}) {
  if (input.clerkUserId && getAdminClerkIds().has(input.clerkUserId)) return true;
  const configured = [getConfiguredAdminEmail(), process.env.GMAIL_USER?.trim() || ""];
  const candidates = [input.email, ...(input.emails ?? [])];
  return configured.some((inbox) => inbox && candidates.some((email) => emailsMatch(email, inbox)));
}
