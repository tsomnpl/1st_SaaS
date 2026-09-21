import { env } from "@/lib/env";

export const INSPIRATION_BUCKET = "inspirations-source";

export type InspirationSourceRow = {
  id: string;
  domaine: string;
  storage_path: string;
  file_hash?: string | null;
  uploaded_at?: string | null;
};

function supabaseConfigured() {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

function supabaseHeaders() {
  const key = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return {
    Authorization: `Bearer ${key}`,
    apikey: key,
    Accept: "application/json",
  };
}

function supabaseUrl(path: string) {
  return `${(env.SUPABASE_URL ?? "").replace(/\/$/, "")}${path}`;
}

export async function listInspirationByDomain(domaine: string, limit = 40) {
  if (!supabaseConfigured() || !domaine) return [] as InspirationSourceRow[];
  const query = new URLSearchParams({
    domaine: `eq.${domaine}`,
    select: "id,domaine,storage_path,file_hash,uploaded_at",
    order: "uploaded_at.asc",
    limit: String(Math.min(Math.max(limit, 1), 80)),
  });
  const response = await fetch(supabaseUrl(`/rest/v1/inspiration_source?${query.toString()}`), {
    headers: supabaseHeaders(),
    cache: "no-store",
  });
  if (!response.ok) return [];
  const rows = (await response.json()) as InspirationSourceRow[];
  return Array.isArray(rows) ? rows.filter((row) => row.id && row.storage_path) : [];
}

export async function countInspirationByDomain() {
  if (!supabaseConfigured()) return { total: 0, byDomain: {} as Record<string, number> };
  const response = await fetch(
    supabaseUrl("/rest/v1/inspiration_source?select=domaine"),
    { headers: { ...supabaseHeaders(), Prefer: "count=exact" }, cache: "no-store" },
  );
  if (!response.ok) return { total: 0, byDomain: {} as Record<string, number> };
  const rows = (await response.json()) as Array<{ domaine: string }>;
  const byDomain: Record<string, number> = {};
  for (const row of rows) {
    const key = row.domaine || "unknown";
    byDomain[key] = (byDomain[key] ?? 0) + 1;
  }
  return { total: rows.length, byDomain };
}

export async function downloadInspirationObject(storagePath: string) {
  if (!supabaseConfigured() || !storagePath || storagePath.includes("..")) return null;
  const encoded = storagePath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  const response = await fetch(
    supabaseUrl(`/storage/v1/object/${INSPIRATION_BUCKET}/${encoded}`),
    { headers: supabaseHeaders(), cache: "no-store" },
  );
  if (!response.ok) return null;
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length || buffer.length > 4_000_000) return null;
  const mime = response.headers.get("content-type") || "image/jpeg";
  if (!mime.startsWith("image/")) return null;
  return { buffer, mime, bytes: buffer.length };
}

export function bufferToDataUrl(buffer: Buffer, mime: string) {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

export function isSupabaseConfigured() {
  return supabaseConfigured();
}
