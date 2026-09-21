import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  value === "" || value === undefined ? undefined : value;

const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());
const optionalString = z.preprocess(emptyToUndefined, z.string().optional());

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: optionalUrl,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: optionalString,
  CLERK_SECRET_KEY: optionalString,
  DATABASE_URL: optionalString,
  RODIUMAI_API_KEY: optionalString,
  RODIUMAI_BASE_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().default("https://api.rodiumai.io/v1"),
  ),
  RODIUMAI_MODEL: z.preprocess(emptyToUndefined, z.string().default("gpt-4.1-mini")),
  RODIUMAI_TEXT_MODEL: optionalString,
  RODIUMAI_IMAGE_MODEL_FAST: optionalString,
  RODIUMAI_IMAGE_MODEL_PREMIUM: optionalString,
  RODIUMAI_IMAGE_MODEL_TEXT_HEAVY: optionalString,
  RODIUMAI_IMAGE_MODEL_IMAGE_EDIT: optionalString,
  RODIUMAI_ALLOWED_IMAGE_MODELS: optionalString,
  MONEY_FUSION_API_URL: optionalUrl,
  MONEY_FUSION_WEBHOOK_URL: optionalUrl,
  ADMIN_CLERK_USER_IDS: optionalString,
  ADMIN_PRIVATE_PATH: optionalString,
  ADMIN_EMAIL: optionalString,
  NEXT_PUBLIC_ANALYTICS_DOMAIN: optionalString,
});

export const env = envSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  RODIUMAI_API_KEY: process.env.RODIUMAI_API_KEY,
  RODIUMAI_BASE_URL: process.env.RODIUMAI_BASE_URL,
  RODIUMAI_MODEL: process.env.RODIUMAI_MODEL,
  RODIUMAI_TEXT_MODEL: process.env.RODIUMAI_TEXT_MODEL,
  RODIUMAI_IMAGE_MODEL_FAST: process.env.RODIUMAI_IMAGE_MODEL_FAST,
  RODIUMAI_IMAGE_MODEL_PREMIUM: process.env.RODIUMAI_IMAGE_MODEL_PREMIUM,
  RODIUMAI_IMAGE_MODEL_TEXT_HEAVY: process.env.RODIUMAI_IMAGE_MODEL_TEXT_HEAVY,
  RODIUMAI_IMAGE_MODEL_IMAGE_EDIT: process.env.RODIUMAI_IMAGE_MODEL_IMAGE_EDIT,
  RODIUMAI_ALLOWED_IMAGE_MODELS: process.env.RODIUMAI_ALLOWED_IMAGE_MODELS,
  MONEY_FUSION_API_URL: process.env.MONEY_FUSION_API_URL,
  MONEY_FUSION_WEBHOOK_URL: process.env.MONEY_FUSION_WEBHOOK_URL,
  ADMIN_CLERK_USER_IDS: process.env.ADMIN_CLERK_USER_IDS,
  ADMIN_PRIVATE_PATH: process.env.ADMIN_PRIVATE_PATH,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  NEXT_PUBLIC_ANALYTICS_DOMAIN: process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN,
});

export { getAdminClerkIds } from "@/lib/admin";

export function getAdminPrivatePath() {
  return (process.env.ADMIN_PRIVATE_PATH ?? "").trim();
}

export function getAdminBasePath() {
  return "/admin";
}

export function getAllowedImageModels() {
  return (env.RODIUMAI_ALLOWED_IMAGE_MODELS ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export const PRODUCTION_APP_URL = "https://flyermint-t.vercel.app";

export function getAppUrl() {
  if (env.NEXT_PUBLIC_APP_URL) return env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
    return PRODUCTION_APP_URL;
  }
  return "http://localhost:3000";
}

export function moneyFusionPublicUrls(appUrl = getAppUrl()) {
  const base = appUrl.replace(/\/$/, "");
  return {
    returnUrl: `${base}/payment/success`,
    webhookUrl: `${base}/api/webhooks/moneyfusion`,
  };
}
