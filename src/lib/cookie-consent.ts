export const COOKIE_CONSENT_KEY = "fm-cookie-consent";
export const COOKIE_CONSENT_EVENT = "fm-analytics-consent";
export const COOKIE_SETTINGS_EVENT = "fm-cookie-settings";

export type CookieConsentValue = "necessary" | "analytics";

export function isAnalyticsConsent(value: string | null): value is "analytics" {
  return value === "analytics";
}
