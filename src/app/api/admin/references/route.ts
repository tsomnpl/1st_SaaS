import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeJsonError } from "@/lib/safe-api";

const imageUrl = z
  .string()
  .optional()
  .refine(
    (value) =>
      !value ||
      value.startsWith("https://") ||
      /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(value),
    "INVALID_IMAGE",
  );

const referenceSchema = z.object({
  id: z.string().min(3).optional(),
  domain: z.string().min(2).max(80),
  style: z.string().max(80).optional(),
  composition: z.string().max(400).optional(),
  colorPalette: z.string().max(200).optional(),
  typography: z.string().max(120).optional(),
  imageTreatment: z.string().max(120).optional(),
  layout: z.string().max(120).optional(),
  density: z.string().max(80).optional(),
  mood: z.string().max(80).optional(),
  imageUrl,
  tags: z.array(z.string().max(40)).max(20).default([]),
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
    return safeJsonError(error, 403);
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
    return safeJsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdminUser();
    const payload = referenceSchema.parse(await request.json());
    if (!payload.id) throw new Error("NOT_FOUND");
    const { id, ...data } = payload;
    const updated = await prisma.reference.update({ where: { id }, data });
    await prisma.adminLog.create({
      data: {
        adminUserId: admin.id,
        action: "REFERENCE_UPDATED",
        targetType: "REFERENCE",
        targetId: updated.id,
      },
    });
    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    return safeJsonError(error);
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
    return safeJsonError(error);
  }
}
