import { INSPIRATION_DOMAIN_MAP, slugForDomain } from "@/lib/inspiration-folders";

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

async function loadDomainIndex(slug: string) {
  const config = supabaseConfig();
  if (!config) return [];
  const path = `_analysis/by-domain/${slug}.json`;
  const response = await fetch(`${config.url}/storage/v1/object/${BUCKET}/${path}`, {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
    },
    cache: "no-store",
  });
  if (!response.ok) return [];
  const payload = (await response.json()) as unknown;
  return analysesFromIndex(slug, payload);
}

export async function loadDomainInspirationAnalyses(domain: string, count = 3) {
  const slug = slugForDomain(domain);
  if (!slug) return [];
  return pickInspirationAnalyses(await loadDomainIndex(slug), count);
}

export async function loadInspirationCoverage() {
  const rows = await Promise.all(
    INSPIRATION_DOMAIN_MAP.map(async (row) => {
      const items = await loadDomainIndex(row.slug);
      return { slug: row.slug, domaine: row.domaine, described: items.length };
    }),
  );
  return {
    described: rows.reduce((sum, row) => sum + row.described, 0),
    domains: rows,
  };
}

export type CreativeDna = {
  referenceId: string;
  domain: string;
  background: string;
  composition: string;
  layout: string;
  humanPlacement: string;
  typographyHierarchy: string;
  colorPalette: string[];
  mood: string;
  imageTreatment: string;
};

export type VisualReference = {
  id: string;
  domaine: string;
  storagePath: string;
  dataUrl: string;
  analysis?: InspirationAnalysis;
  creativeDna: CreativeDna;
  visualBytesSent: boolean;
};

function creativeDnaFromAnalysis(row: { id: string; domaine: string; storage_path?: string }, analysis?: InspirationAnalysis): CreativeDna {
  return {
    referenceId: row.id,
    domain: row.domaine,
    background: analysis?.arriere_plan || "unknown",
    composition: analysis?.visuel || "unknown",
    layout: analysis?.textes || "unknown",
    humanPlacement: analysis?.visuel || "domain-relevant human in scene",
    typographyHierarchy: analysis?.textes || "title dominant, facts grouped",
    colorPalette: analysis?.palette_dominante?.length ? analysis.palette_dominante : ["#1E293B", "#6D28D9", "#FFFFFF"],
    mood: analysis?.style_general || "professional",
    imageTreatment: analysis?.style_general || "photographic",
  };
}

async function downloadStorageObject(path: string) {
  const config = supabaseConfig();
  if (!config) return null;
  const response = await fetch(`${config.url}/storage/v1/object/${BUCKET}/${path}`, {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
    },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const mime = response.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 32 || buffer.length > 1_800_000) return null;
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

export async function countInspirationSourceRows() {
  const config = supabaseConfig();
  if (!config) return 0;
  const response = await fetch(`${config.url}/rest/v1/inspiration_source?select=id`, {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      Prefer: "count=exact",
      Range: "0-0",
    },
    cache: "no-store",
  });
  const range = response.headers.get("content-range") || "";
  const total = Number(range.split("/")[1] || 0);
  return Number.isFinite(total) ? total : 0;
}

/** Fetch one real Supabase bitmap for a domain and mark it usable for Rodium image models. */
export async function loadVisualReferenceForDomain(domain: string): Promise<VisualReference | null> {
  const config = supabaseConfig();
  const slug = slugForDomain(domain);
  if (!config || !slug) return null;

  const analyses = await loadDomainIndex(slug);
  const response = await fetch(
    `${config.url}/rest/v1/inspiration_source?domaine=eq.${encodeURIComponent(slug)}&select=id,domaine,storage_path&limit=12`,
    {
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
      },
      cache: "no-store",
    },
  );
  if (!response.ok) return null;
  const rows = (await response.json()) as Array<{ id: string; domaine: string; storage_path: string }>;
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const preferred = analyses[0] ? rows.find((row) => row.id === analyses[0].id) : null;
  const ordered = preferred ? [preferred, ...rows.filter((row) => row.id !== preferred.id)] : rows;

  for (const row of ordered) {
    const dataUrl = await downloadStorageObject(row.storage_path);
    if (!dataUrl) continue;
    const analysis = analyses.find((item) => item.id === row.id);
    return {
      id: row.id,
      domaine: row.domaine,
      storagePath: row.storage_path,
      dataUrl,
      analysis,
      creativeDna: creativeDnaFromAnalysis(row, analysis),
      visualBytesSent: false,
    };
  }
  return null;
}

export function formatCreativeDnaForPrompt(dna: CreativeDna) {
  return [
    "Creative DNA from the attached visual reference (follow structure, replace commercial facts):",
    `referenceId=${dna.referenceId}`,
    `domain=${dna.domain}`,
    `background=${dna.background}`,
    `composition=${dna.composition}`,
    `layout=${dna.layout}`,
    `humanPlacement=${dna.humanPlacement}`,
    `typography=${dna.typographyHierarchy}`,
    `palette=${dna.colorPalette.join(", ")}`,
    `mood=${dna.mood}`,
    `imageTreatment=${dna.imageTreatment}`,
  ].join("\n");
}

export function publicArtDirection(artDirection: {
  differentiators: string[];
  reference_ids: string[];
}) {
  return {
    differentiators: artDirection.differentiators,
    library_refs: artDirection.reference_ids.filter((id) => id.startsWith("insp-")).length,
  };
}
