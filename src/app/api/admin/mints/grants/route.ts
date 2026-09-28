import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/auth";
import { safeJsonError } from "@/lib/safe-api";
import { createPendingMintGrant } from "@/server/mint-grants";

const grantSchema = z.object({
  email: z.string().min(3).max(180),
  amount: z.number().int(),
  reason: z.string().min(2).max(240),
  expiresAt: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = grantSchema.parse(await request.json());
    const grant = await createPendingMintGrant({
      adminUserId: admin.id,
      email: body.email,
      amount: body.amount,
      reason: body.reason,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    });
    return NextResponse.json({
      ok: true,
      id: grant.id,
      email: grant.email,
      amount: grant.amount,
      status: grant.status,
      reason: grant.reason,
    });
  } catch (error) {
    return safeJsonError(error);
  }
}
