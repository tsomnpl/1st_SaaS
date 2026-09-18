import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const referenceSchema = z.object({
  domain: z.string().min(2),
  style: z.string().optional(),
  composition: z.string().optional(),
  colorPalette: z.string().optional(),
  typography: z.string().optional(),
  imageTreatment: z.string().optional(),
  layout: z.string().optional(),
  density: z.string().optional(),
  mood: z.string().optional(),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
});

export async function GET() {
  try {
    await requireAdminUser();
    const refs = await prisma.reference.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ ok: true, data: refs });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "UNKNOWN_ERROR" },
      { status: 403 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const payload = referenceSchema.parse(await request.json());
    const created = await prisma.reference.create({ data: payload });
    await prisma.adminLog.create({
      data: {
        adminUserId: admin.id,
        action: "REFERENCE_ADDED",
        targetType: "REFERENCE",
        targetId: created.id,
      },
    });
    return NextResponse.json({ ok: true, data: created });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "UNKNOWN_ERROR" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdminUser();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "ID_REQUIRED" }, { status: 400 });
    await prisma.reference.delete({ where: { id } });
    await prisma.adminLog.create({
      data: {
        adminUserId: admin.id,
        action: "REFERENCE_DELETED",
        targetType: "REFERENCE",
        targetId: id,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "UNKNOWN_ERROR" },
      { status: 400 },
    );
  }
}
