import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { safeJsonError } from "@/lib/safe-api";
import { monitoringSnapshot } from "@/server/monitoring";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdminUser();
    const snapshot = await monitoringSnapshot();
    const incidents = await prisma.incident.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
    return NextResponse.json({ ok: true, snapshot, incidents });
  } catch (error) {
    return safeJsonError(error);
  }
}
