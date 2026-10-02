import { createHash, randomUUID } from "node:crypto";
import { DOMAINS } from "@/lib/domains";
import { slugForDomain } from "@/lib/inspiration-folders";

const BUCKET = "inspirations-source";

export function inspirationObjectPath(slug: string, hash: string, extension: string) {
  return `${slug}/${hash}.${extension}`;
}

export function extensionForImage(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/jpeg") return "jpg";
  return null;
}

export async function uploadInspirationSource(input: { domain: string; bytes: Buffer; contentType: string }) {
  const domain = DOMAINS.find((item) => item === input.domain);
  const slug = domain ? slugForDomain(domain) : null;
  const extension = extensionForImage(input.contentType);
  if (!domain || !slug || !extension) throw new Error("INVALID_SOURCE");
  if (input.bytes.length < 32 || input.bytes.length > 5_000_000) throw new Error("INVALID_IMAGE");

  const url = process.env.SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("SOURCE_STORAGE_MISSING");

  const hash = createHash("md5").update(input.bytes).digest("hex");
  const storagePath = inspirationObjectPath(slug, hash, extension);
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const existing = await fetch(
    `${url}/rest/v1/inspiration_source?storage_path=eq.${encodeURIComponent(storagePath)}&select=id,storage_path`,
    { headers },
  );
  if (existing.ok) {
    const rows = (await existing.json()) as Array<{ id: string; storage_path: string }>;
    if (rows[0]) return { id: rows[0].id, storagePath: rows[0].storage_path, already: true };
  }

  const uploaded = await fetch(`${url}/storage/v1/object/${BUCKET}/${storagePath}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": input.contentType, "x-upsert": "true" },
    body: new Uint8Array(input.bytes),
  });
  if (!uploaded.ok) throw new Error("SOURCE_UPLOAD_FAILED");

  const id = randomUUID();
  const created = await fetch(`${url}/rest/v1/inspiration_source`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({
      id,
      domaine: slug,
      storage_path: storagePath,
      file_hash: hash,
      uploaded_at: new Date().toISOString(),
    }),
  });
  if (!created.ok) throw new Error("SOURCE_RECORD_FAILED");
  return { id, storagePath, already: false };
}
