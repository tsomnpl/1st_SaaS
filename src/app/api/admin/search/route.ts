import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) {
      return NextResponse.json({ ok: true, users: [], payments: [], generations: [] });
    }
    const [users, payments, generations] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { clerkUserId: { contains: q } },
          ],
        },
        take: 10,
      }),
      prisma.payment.findMany({
        where: {
          OR: [{ orderId: { contains: q } }, { tokenPay: { contains: q } }],
        },
        take: 10,
      }),
      prisma.generation.findMany({
        where: { id: { contains: q } },
        take: 10,
      }),
    ]);
    return NextResponse.json({
      ok: true,
      users: users.map((u) => ({ id: u.id, email: u.email, name: u.name })),
      payments: payments.map((p) => ({ id: p.id, orderId: p.orderId, status: p.status })),
      generations: generations.map((g) => ({ id: g.id, status: g.status })),
    });
  } catch {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }
}
