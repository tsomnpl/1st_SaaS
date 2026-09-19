import { NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/errors";
import { requireActiveCurrentUser } from "@/server/users";
import { initMoneyFusionPayment } from "@/server/payments";
import { z } from "zod";

const initSchema = z.object({
  planCode: z.string().min(2).max(40),
  numeroSend: z.string().regex(/^[0-9+\s().-]{8,20}$/, "INVALID_PHONE"),
  nomclient: z.string().min(2).max(80),
});

export async function POST(request: Request) {
  try {
    const user = await requireActiveCurrentUser();
    const body = initSchema.parse(await request.json());
    const payment = await initMoneyFusionPayment({
      userId: user.id,
      planCode: body.planCode,
      numeroSend: body.numeroSend,
      nomclient: body.nomclient,
    });
    return NextResponse.json({ ok: true, ...payment });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: publicErrorMessage(error) },
      { status: 400 },
    );
  }
}
