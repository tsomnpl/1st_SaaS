import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveCurrentUser } from "@/server/users";
import { getBrandKit, saveBrandKit } from "@/server/brand-kit";
import { safeJsonError } from "@/lib/safe-api";

const bodySchema = z.object({
  colors: z.array(z.string().max(40)).max(3).default([]),
  logoUrl: z.string().max(3_000_000).optional(),
});

export async function GET() {
  try {
    const user = await requireActiveCurrentUser();
    const kit = await getBrandKit(user.id);
    return NextResponse.json({
      ok: true,
      kit: kit
        ? { colors: kit.colors, logoUrl: kit.logoUrl, hasLogo: Boolean(kit.logoUrl) }
        : { colors: [], logoUrl: null, hasLogo: false },
    });
  } catch (error) {
    return safeJsonError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireActiveCurrentUser();
    const body = bodySchema.parse(await request.json());
    const kit = await saveBrandKit(user.id, body);
    return NextResponse.json({
      ok: true,
      kit: kit
        ? { colors: kit.colors, hasLogo: Boolean(kit.logoUrl) }
        : { colors: body.colors, hasLogo: Boolean(body.logoUrl) },
    });
  } catch (error) {
    return safeJsonError(error, 400);
  }
}
