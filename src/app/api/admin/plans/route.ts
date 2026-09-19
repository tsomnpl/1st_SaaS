import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeJsonError } from "@/lib/safe-api";
import { writeAdminLog } from "@/server/admin-audit";
import { ensureOfficialPlans } from "@/server/plans";

const updateSchema = z.object({
  planId: z.string().min(3),
  confirm: z.literal(true),
  name: z.string().min(2).max(80).optional(),
  priceFcfa: z.number().int().min(0).max(10_000_000).optional(),
  mintAmount: z.number().int().min(0).max(500).optional(),
  durationDays: z.number().int().min(1).max(3650).nullable().optional(),
  editableExport: z.boolean().optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  try {
    await requireAdminUser();
    await ensureOfficialPlans();
    const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ ok: true, plans });
  } catch (error) {
    return safeJsonError(error, 403);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = updateSchema.parse(await request.json());
    const before = await prisma.plan.findUnique({ where: { id: body.planId } });
    if (!before) throw new Error("NOT_FOUND");

    const updated = await prisma.plan.update({
      where: { id: body.planId },
      data: {
        name: body.name,
        priceFcfa: body.priceFcfa,
        mintAmount: body.mintAmount,
        durationDays: body.durationDays,
        editableExport: body.editableExport,
        active: body.active,
      },
    });

    await writeAdminLog({
      adminUserId: admin.id,
      action: "PLAN_UPDATED",
      targetType: "PLAN",
      targetId: updated.id,
      metadata: {
        before: {
          name: before.name,
          priceFcfa: before.priceFcfa,
          mintAmount: before.mintAmount,
          active: before.active,
        },
        after: {
          name: updated.name,
          priceFcfa: updated.priceFcfa,
          mintAmount: updated.mintAmount,
          active: updated.active,
        },
      },
    });

    return NextResponse.json({ ok: true, plan: updated });
  } catch (error) {
    return safeJsonError(error);
  }
}
