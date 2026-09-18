import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function csv(rows: Array<Record<string, string | number | null | undefined>>) {
  if (!rows.length) return "empty\n";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((key) => escape(row[key])).join(","))].join("\n");
}

export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const type = new URL(request.url).searchParams.get("type") ?? "users";
    let rows: Array<Record<string, string | number | null | undefined>> = [];
    if (type === "payments") {
      const payments = await prisma.payment.findMany({ include: { user: true, plan: true }, take: 2000 });
      rows = payments.map((p) => ({
        orderId: p.orderId,
        email: p.user.email,
        plan: p.plan.code,
        amount: p.amountFcfa,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
      }));
    } else if (type === "generations") {
      const gens = await prisma.generation.findMany({ include: { user: true }, take: 2000 });
      rows = gens.map((g) => ({
        id: g.id,
        email: g.user.email,
        status: g.status,
        model: g.model,
        rodiCost: g.rodiCost ?? "",
        createdAt: g.createdAt.toISOString(),
      }));
    } else if (type === "mints") {
      const txs = await prisma.creditTransaction.findMany({ take: 2000, orderBy: { createdAt: "desc" } });
      rows = txs.map((t) => ({
        userId: t.userId,
        type: t.type,
        amount: t.amount,
        reference: t.reference,
        createdAt: t.createdAt.toISOString(),
      }));
    } else {
      const users = await prisma.user.findMany({ include: { creditAccount: true }, take: 2000 });
      rows = users.map((u) => ({
        id: u.id,
        email: u.email,
        status: u.status,
        role: u.role,
        balance: u.creditAccount?.balance ?? 0,
        createdAt: u.createdAt.toISOString(),
      }));
    }
    return new NextResponse(csv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="flyermint-${type}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }
}
