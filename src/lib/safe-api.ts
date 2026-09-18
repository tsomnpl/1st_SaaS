import { NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/errors";

const STATUS_BY_CODE: Record<string, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  ACCOUNT_SUSPENDED: 403,
  RATE_LIMITED: 429,
  USER_NOT_FOUND: 404,
  PAYMENT_NOT_FOUND: 404,
  NOT_FOUND: 404,
};

export function errorCode(error: unknown) {
  return error instanceof Error ? error.message : "UNKNOWN";
}

export function safeJsonError(error: unknown, fallbackStatus = 400) {
  const code = errorCode(error);
  const status = STATUS_BY_CODE[code] ?? fallbackStatus;
  return NextResponse.json(
    {
      ok: false,
      error: publicErrorMessage(error),
    },
    { status },
  );
}
