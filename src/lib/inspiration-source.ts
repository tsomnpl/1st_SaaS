import { slugForDomain } from "@/lib/inspiration-folders";
import type { DomainReference } from "@/lib/reference-select";

const BUCKET = "inspirations-source";

type SourceRow = {
  id?: string;
  domaine?: string;
  storage_path?: string;
};

type AnalysisItem = {
  id?: string;
  analysis?: {
    arriere_plan?: string;
    textes?: string;
    visuel?: string;
    palette_dominante?: string[];
    style_general?: string;
  };
};

function supabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

function headers(key: string) {
  return { apikey: key, Authorization: `Bearer ${key}` };
}

export function joinDomainReferences(input: {
  domain: string;
  slug: string;
  rows: SourceRow[];
  analyses: AnalysisItem[];
}): DomainReference[] {
  const byId = new Map<string, AnalysisItem>();
  for (const item of input.analyses) {
    if (item.id) byId.set(item.id, item);
  }
  const out: DomainReference[] = [];
  for (const row of input.rows) {
    if (!row.id || !row.storage_path) continue;
    if (row.domaine && row.domaine !== input.slug) continue;
    if (!row.storage_path.startsWith(`${input.slug}/`)) continue;
    const analysis = byId.get(row.id)?.analysis;
    const palette = Array.isArray(analysis?.palette_dominante)
      ? analysis.palette_dominante.map(String).slice(0, 6)
      : [];
    out.push({
      id: row.id,
      domain: input.domain,
      slug: input.slug,
      storagePath: row.storage_path,
      style: String(analysis?.style_general ?? ""),
      background: String(analysis?.arriere_plan ?? ""),
      texts: String(analysis?.textes ?? ""),
      visual: String(analysis?.visuel ?? ""),
      palette,
      analyzed: Boolean(analysis),
    });
  }
  return out;
}

export async function loadDomainReferences(domain: string): Promise<DomainReference[]> {
  const slug = slugForDomain(domain);
  const config = supabaseConfig();
  if (!slug || !config) return [];

  const query = new URL(`${config.url}/rest/v1/inspiration_source`);
  query.searchParams.set("select", "id,domaine,storage_path");
  query.searchParams.set("domaine", `eq.${slug}`);

  const [tableRes, indexRes] = await Promise.all([
    fetch(query, { headers: headers(config.key), cache: "no-store" }),
    fetch(`${config.url}/storage/v1/object/${BUCKET}/_analysis/by-domain/${slug}.json`, {
      headers: headers(config.key),
      cache: "no-store",
    }),
  ]);

  if (!tableRes.ok) return [];
  const rows = (await tableRes.json()) as SourceRow[];
  let analyses: AnalysisItem[] = [];
  if (indexRes.ok) {
    const payload = (await indexRes.json()) as { items?: AnalysisItem[] };
    analyses = Array.isArray(payload.items) ? payload.items : [];
  }
  return joinDomainReferences({
    domain,
    slug,
    rows: Array.isArray(rows) ? rows : [],
    analyses,
  });
}

export async function downloadReferenceDataUrl(storagePath: string) {
  const config = supabaseConfig();
  if (!config) throw new Error("REFERENCE_LIBRARY_UNAVAILABLE");
  if (!/^[a-z0-9-]+\/[a-zA-Z0-9._-]+$/.test(storagePath)) throw new Error("REFERENCE_PATH_INVALID");

  const response = await fetch(`${config.url}/storage/v1/object/${BUCKET}/${storagePath}`, {
    headers: headers(config.key),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("REFERENCE_DOWNLOAD_FAILED");
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 32 || bytes.length > 8_000_000) throw new Error("REFERENCE_DOWNLOAD_FAILED");
  const type = response.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";
  const mime = type.startsWith("image/") ? type : "image/jpeg";
  return `data:${mime};base64,${bytes.toString("base64")}`;
}
