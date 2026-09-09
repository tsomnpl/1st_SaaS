import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  RODIUMAI_API_KEY: z.string().optional(),
  RODIUMAI_BASE_URL: z.string().url().default("https://api.rodiumai.io/v1"),
  RODIUMAI_MODEL: z.string().default("gpt-4.1-mini"),
  MONEY_FUSION_API_URL: z.string().url().optional(),
  MONEY_FUSION_WEBHOOK_URL: z.string().url().optional(),
  ADMIN_CLERK_USER_IDS: z.string().optional(),
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
  MONEY_FUSION_API_URL: process.env.MONEY_FUSION_API_URL,
  MONEY_FUSION_WEBHOOK_URL: process.env.MONEY_FUSION_WEBHOOK_URL,
  ADMIN_CLERK_USER_IDS: process.env.ADMIN_CLERK_USER_IDS,
});

export function getAdminClerkIds(): Set<string> {
  return new Set(
    (env.ADMIN_CLERK_USER_IDS ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
  );
}
