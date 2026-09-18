import { CreditTransactionType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { grantCredits, removeCredits } from "@/server/credits";

const adjustSchema = z.object({
  targetUserId: z.string().min(3),
  amount: z.number().int().refine((n) => n !== 0),
  reason: z.string().min(2),
  reference: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = adjustSchema.parse(await request.json());

    const result = await prisma.$transaction(async (tx) => {
      if (body.amount > 0) {
        await grantCredits(
          body.targetUserId,
          body.amount,
          CreditTransactionType.ADMIN_ADD,
          {
            tx,
            reference: body.reference ?? "ADMIN_ADJUSTMENT",
            metadata: { reason: body.reason, adminUserId: admin.id },
          },
          null,
        );
      } else {
        await removeCredits(body.targetUserId, Math.abs(body.amount), {
          tx,
          reference: body.reference ?? "ADMIN_ADJUSTMENT",
          metadata: { reason: body.reason, adminUserId: admin.id },
        });
      }

      await tx.adminLog.create({
        data: {
          adminUserId: admin.id,
          action: body.amount > 0 ? "ADMIN_ADD_MINT" : "ADMIN_REMOVE_MINT",
          targetType: "USER",
          targetId: body.targetUserId,
          metadata: {
            amount: body.amount,
            reason: body.reason,
            reference: body.reference ?? null,
          },
        },
      });

      const account = await tx.creditAccount.findUnique({
        where: { userId: body.targetUserId },
      });
      return account?.balance ?? 0;
    });

    return NextResponse.json({ ok: true, balance: result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "UNKNOWN_ERROR" },
      { status: 400 },
    );
  }
}
