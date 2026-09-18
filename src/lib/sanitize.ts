const SENSITIVE_KEY =
  /secret|password|passwd|api[_-]?key|authorization|clerk|rodium|private[_-]?key|credential/i;

export function sanitizeRecord(input: unknown, depth = 0): unknown {
  if (input == null || depth > 6) return input;
  if (Array.isArray(input)) {
    return input.slice(0, 80).map((value) => sanitizeRecord(value, depth + 1));
  }
  if (typeof input !== "object") return input;

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    out[key] = SENSITIVE_KEY.test(key) ? "[redacted]" : sanitizeRecord(value, depth + 1);
  }
  return out;
}
