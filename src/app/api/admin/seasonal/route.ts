import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/auth";
import { safeJsonError } from "@/lib/safe-api";
import { updateSeasonalCampaign } from "@/server/seasonal";

const updateSchema = z.object({
  id: z.string().min(3).max(80),
  active: z.boolean().optional(),
  priority: z.number().int().min(0).max(1000).optional(),
  startDate: z.string().max(40).nullable().optional(),
  endDate: z.string().max(40).nullable().optional(),
  markets: z.array(z.enum(["TG", "BJ", "GLOBAL"])).max(3).optional(),
  domains: z.array(z.string().max(80)).max(30).optional(),
  referenceIds: z.array(z.string().max(160)).max(20).optional(),
});

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = updateSchema.parse(await request.json());
    const campaign = await updateSeasonalCampaign(admin.id, body);
    return NextResponse.json({ ok: true, campaign });
  } catch (error) {
    return safeJsonError(error, 403);
  }
}
