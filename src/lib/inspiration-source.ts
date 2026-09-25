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

const SUBJECT_SLUGS: Array<{ slug: string; pattern: RegExp }> = [
  { slug: "education", pattern: /\b(formation|formations|cours|atelier|masterclass|seminaire|webinaire|ecole|inscription|etudiant|coaching|bootcamp)\b/ },
  { slug: "emploi", pattern: /\b(recrutement|recrute|emploi|stage|job|candidature|poste)\b/ },
  { slug: "musique", pattern: /\b(concert|album|showcase|single|dj|festival)\b/ },
  { slug: "religion-culture", pattern: /\b(eglise|culte|priere|veillee|croisade|ministere|prophete|pasteur|adoration)\b/ },
  { slug: "restauration", pattern: /\b(menu|restaurant|burger|pizza|plat|livraison repas)\b/ },
  { slug: "mariage", pattern: /\b(mariage|wedding|fiancailles)\b/ },
  { slug: "anniversaire", pattern: /\b(anniversaire|birthday)\b/ },
  { slug: "sport", pattern: /\b(match|tournoi|marathon|fitness|gym)\b/ },
  { slug: "beaute", pattern: /\b(spa|coiffure|salon|onglerie|maquillage|soins)\b/ },
  { slug: "immobilier", pattern: /\b(appartement|villa|terrain|location|immobilier)\b/ },
];

const STOPWORDS = new Set([
  "avec", "pour", "dans", "des", "les", "une", "sur", "par", "plus", "tres", "sans", "entre", "vers", "leur", "cette", "votre", "notre",
]);

function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tokens(value: string) {
  return new Set(
    normalizeText(value)
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 4 && !STOPWORDS.has(word)),
  );
}

/** Domain folders worth searching: the chosen domain plus any folder the brief subject clearly points to. */
export function referenceSlugsForBrief(domain: string, subject: string) {
  const own = slugForDomain(domain);
  const text = normalizeText(subject);
  const inferred = SUBJECT_SLUGS.filter((row) => row.pattern.test(text)).map((row) => row.slug);
  return { own, inferred: inferred.filter((slug) => slug !== own) };
}

/** Rank reference analyses by closeness to the brief; ties are shuffled so one poster is not reused forever. */
export function rankReferenceAnalyses(
  items: InspirationAnalysis[],
  briefText: string,
  options: { own?: string | null; inferred?: string[]; random?: () => number } = {},
) {
  const wanted = tokens(briefText);
  const random = options.random ?? Math.random;
  return items
    .map((item) => {
      const words = tokens(`${item.visuel} ${item.textes} ${item.style_general} ${item.arriere_plan}`);
      let score = 0;
      for (const word of wanted) if (words.has(word)) score += 1;
      if (options.inferred?.includes(item.domaine)) score += 3;
      if (item.domaine === options.own) score += 1;
      return { item, score, tie: random() };
    })
    .sort((a, b) => b.score - a.score || a.tie - b.tie)
    .map((row) => row.item);
}

export function briefSubjectText(brief: {
  title: string;
  subtitle?: string;
  description?: string;
  objective?: string;
  visualType?: string;
  targetAudience?: string;
  adaptiveData?: Record<string, string>;
}) {
  return [
    brief.title,
    brief.subtitle,
    brief.description,
    brief.objective,
    brief.visualType,
    brief.targetAudience,
    ...Object.entries(brief.adaptiveData ?? {}).flatMap(([key, value]) => (value ? [key, value] : [])),
  ]
    .filter(Boolean)
    .join(" ");
}

/** Fetch the real Supabase bitmap closest to the brief and mark it usable for Rodium image models. */
export async function loadVisualReferenceForDomain(
  domain: string,
  briefText = "",
): Promise<VisualReference | null> {
  const config = supabaseConfig();
  const { own, inferred } = referenceSlugsForBrief(domain, briefText);
  const slugs = [...inferred, ...(own ? [own] : [])];
  if (!config || slugs.length === 0) return null;

  const analyses = (await Promise.all(slugs.map((slug) => loadDomainIndex(slug)))).flat();
  const response = await fetch(
    `${config.url}/rest/v1/inspiration_source?domaine=in.(${slugs.map(encodeURIComponent).join(",")})&select=id,domaine,storage_path&limit=200`,
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

  const ranked = rankReferenceAnalyses(analyses, briefText, { own, inferred });
  const byId = new Map(rows.map((row) => [row.id, row]));
  const rankedRows = ranked.flatMap((item) => {
    const row = byId.get(item.id);
    return row ? [row] : [];
  });
  const ordered = [...rankedRows, ...rows.filter((row) => !rankedRows.includes(row))];

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
