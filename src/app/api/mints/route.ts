import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "FORBIDDEN", message: "Le solde de Mints n’est pas modifiable depuis le navigateur." },
    { status: 403 },
  );
}

export async function PUT() {
  return POST();
}

export async function PATCH() {
  return POST();
}
