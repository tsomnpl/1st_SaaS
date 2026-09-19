import { slugForDomain } from "@/lib/inspiration-folders";

export type InspirationAnalysis = {
  id: string;
  domaine: string;
  arriere_plan: string;
  textes: string;
  visuel: string;
  palette_dominante: string[];
  style_general: string;
};

const BUCKET = "inspirations-source";

function supabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

export function pickInspirationAnalyses(items: InspirationAnalysis[], count = 3) {
  const unique = new Map<string, InspirationAnalysis>();
  for (const item of items) unique.set(item.id, item);
  return [...unique.values()].sort((a, b) => a.id.localeCompare(b.id)).slice(0, count);
}

export function formatInspirationForPrompt(items: InspirationAnalysis[]) {
  if (items.length === 0) return [];
  const lines = [
    "Internal style library (composition/palette/mood only).",
    "Never reproduce a logo, brand name, or identifiable text from a reference.",
    "Never display or copy the source image. Compose a 100% original poster.",
  ];
  items.forEach((item, index) => {
    lines.push(
      `${index + 1}) style=${item.style_general}; fond=${item.arriere_plan}; textes=${item.textes}; visuel=${item.visuel}; palette=${item.palette_dominante.join(", ")}; ref=insp-${item.id}`,
    );
  });
  return lines;
}

export function analysesFromIndex(slug: string, payload: unknown): InspirationAnalysis[] {
  if (!payload || typeof payload !== "object") return [];
  const items = (payload as { items?: unknown }).items;
  if (!Array.isArray(items)) return [];
  const out: InspirationAnalysis[] = [];
  for (const raw of items) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as { id?: unknown; analysis?: Record<string, unknown> };
    const analysis = row.analysis ?? {};
    const palette = Array.isArray(analysis.palette_dominante)
      ? analysis.palette_dominante.map(String).slice(0, 3)
      : [];
    if (typeof row.id !== "string") continue;
    out.push({
      id: row.id,
      domaine: slug,
      arriere_plan: String(analysis.arriere_plan ?? ""),
      textes: String(analysis.textes ?? ""),
      visuel: String(analysis.visuel ?? ""),
      palette_dominante: palette,
      style_general: String(analysis.style_general ?? ""),
    });
  }
  return out;
}

export async function loadDomainInspirationAnalyses(domain: string, count = 3) {
  const config = supabaseConfig();
  const slug = slugForDomain(domain);
  if (!config || !slug) return [];

  const path = `_analysis/by-domain/${slug}.json`;
  const response = await fetch(
    `${config.url}/storage/v1/object/${BUCKET}/${path}`,
    {
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
      },
      cache: "no-store",
    },
  );
  if (!response.ok) return [];
  const payload = (await response.json()) as unknown;
  return pickInspirationAnalyses(analysesFromIndex(slug, payload), count);
}
