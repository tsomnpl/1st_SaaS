import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeJsonError } from "@/lib/safe-api";

export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) {
      return NextResponse.json({ ok: true, users: [], payments: [], generations: [], transactions: [], references: [] });
    }
    const [users, payments, generations, transactions, references] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { clerkUserId: { contains: q } },
            { id: { contains: q } },
          ],
        },
        take: 8,
      }),
      prisma.payment.findMany({
        where: {
          OR: [{ orderId: { contains: q } }, { tokenPay: { contains: q } }, { id: { contains: q } }],
        },
        take: 8,
      }),
      prisma.generation.findMany({
        where: { id: { contains: q } },
        take: 8,
      }),
      prisma.creditTransaction.findMany({
        where: {
          OR: [{ id: { contains: q } }, { reference: { contains: q } }],
        },
        take: 8,
      }),
      prisma.reference.findMany({
        where: {
          OR: [
            { domain: { contains: q, mode: "insensitive" } },
            { style: { contains: q, mode: "insensitive" } },
            { composition: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 8,
      }),
    ]);
    return NextResponse.json({
      ok: true,
      users: users.map((u) => ({ id: u.id, email: u.email, name: u.name })),
      payments: payments.map((p) => ({ id: p.id, orderId: p.orderId, status: p.status })),
      generations: generations.map((g) => ({ id: g.id, status: g.status })),
      transactions: transactions.map((t) => ({ id: t.id, type: t.type, reference: t.reference })),
      references: references.map((r) => ({ id: r.id, domain: r.domain, style: r.style })),
    });
  } catch (error) {
    return safeJsonError(error, 403);
  }
}
