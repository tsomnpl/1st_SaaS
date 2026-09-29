export const ADMIN_ALERT_OK_KEY = "fm-admin-alerts-ok";

export function acknowledgedAlertIds(stored: unknown, activeIds: string[]) {
  const active = new Set(activeIds);
  if (!Array.isArray(stored)) return [];
  return stored.filter((item): item is string => typeof item === "string" && active.has(item));
}
