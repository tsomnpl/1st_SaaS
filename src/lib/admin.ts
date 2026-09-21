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

export function isValidAdminEmail(value?: string | null) {
  const email = normalizeEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getAdminClerkIds() {
  return new Set(
    (process.env.ADMIN_CLERK_USER_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export type ClerkEmailLike = {
  id?: string;
  emailAddress?: string | null;
  verification?: { status?: string | null } | null;
};

export type ClerkUserLike = {
  id?: string | null;
  primaryEmailAddressId?: string | null;
  primaryEmailAddress?: ClerkEmailLike | null;
  emailAddresses?: ClerkEmailLike[] | null;
};

export function getPrimaryVerifiedEmail(user?: ClerkUserLike | null) {
  if (!user) return null;
  const primary = user.primaryEmailAddress;
  if (primary?.emailAddress && primary.verification?.status === "verified") {
    return primary.emailAddress;
  }
  const byId = user.emailAddresses?.find(
    (item) => item.id && item.id === user.primaryEmailAddressId,
  );
  if (byId?.emailAddress && byId.verification?.status === "verified") {
    return byId.emailAddress;
  }
  return null;
}

export function isConfiguredAdmin(input: {
  clerkUserId?: string | null;
  email?: string | null;
}) {
  const configuredEmail = getConfiguredAdminEmail();
  if (!isValidAdminEmail(configuredEmail)) {
    return false;
  }
  const email = normalizeEmail(input.email);
  if (email && email === normalizeEmail(configuredEmail)) {
    return true;
  }
  if (input.clerkUserId && getAdminClerkIds().has(input.clerkUserId)) {
    return true;
  }
  return false;
}
