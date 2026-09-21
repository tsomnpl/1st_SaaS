export function safeInternalPath(value?: string | null) {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.includes("://")) return null;
  if (value.includes("\\")) return null;
  return value;
}

export function postAuthDestination(input: {
  isAdmin: boolean;
  requested?: string | null;
}) {
  const requested = safeInternalPath(input.requested);
  if (requested) {
    const adminOnly = requested === "/admin" || requested.startsWith("/admin/") || requested.startsWith("/c/");
    if (adminOnly && !input.isAdmin) return "/forbidden";
    return requested;
  }
  return input.isAdmin ? "/admin" : "/dashboard";
}
