import { NextResponse } from "next/server";
import { PaymentStatus } from "@prisma/client";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdminUser();

    const [usersTotal, payments, generations, mintAggregate] = await Promise.all([
      prisma.user.count(),
      prisma.payment.findMany(),
      prisma.generation.findMany(),
      prisma.creditAccount.aggregate({ _sum: { balance: true } }),
    ]);

    const revenue = payments
      .filter((p) => p.status === PaymentStatus.COMPLETED)
      .reduce((sum, p) => sum + p.amountFcfa, 0);
    const pendingPayments = payments.filter((p) => p.status === PaymentStatus.PENDING).length;
    const failedPayments = payments.filter((p) => p.status === PaymentStatus.FAILED).length;
    const rodiCost = generations.reduce((sum, g) => sum + (g.rodiCost ?? 0), 0);

    return NextResponse.json({
      ok: true,
      usersTotal,
      generations: generations.length,
      revenueFcfa: revenue,
      pendingPayments,
      failedPayments,
      remainingMints: mintAggregate._sum.balance ?? 0,
      rodiCostEstimated: Number(rodiCost.toFixed(3)),
      grossMarginEstimate: Number((revenue - rodiCost).toFixed(3)),
      targetRodiPerPoster: "10-20",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "UNKNOWN_ERROR" },
      { status: 403 },
    );
  }
}
