import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { SHOWCASE_SHEETS } from "../src/lib/showcase-sheets.ts";
import {
  buildShowcasePrompt,
  referenceCategorisation,
  supabaseDomainForSheet,
} from "../src/lib/showcase-design.ts";
import { dnaHasStructure, dnaPromptBlock, dnaSummaryLine, parseCreativeDna, type CreativeDna } from "../src/lib/creative-dna.ts";
import {
  applyRepair,
  isCriticalQcFailure,
  parseQcReport,
  qcPrompt,
  qcWasSkipped,
  shouldRepair,
  type PosterQcReport,
} from "../src/lib/quality-control.ts";
import { DESIGN_RULE_LABELS } from "../src/lib/design-rules.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "public/creations");
const HERO_DIR = path.join(OUT_DIR, "hero");
const MASTER_DIR = path.join(ROOT, "storage/masters");
const WEB_DIR = path.join(ROOT, "storage/web");
const MANIFEST = path.join(ROOT, "docs/inspirations/showcase-manifest.json");
const CATALOGUE = path.join(ROOT, "docs/inspirations/catalogue-extrait.json");
const PAGE_MAP = path.join(ROOT, "docs/inspirations/reference-page-map.json");
const REF_CATALOG = path.join(ROOT, "docs/inspirations/references-catalog.json");
const MASTER_SIZE = "1024x1536";
const FALLBACK_SIZE = "1024x1536";
const FORCE_REGEN = process.env.FORCE_REGEN === "1";
const FORCE_REGEN_ALL = process.env.FORCE_REGEN === "all";
const MAX_QC_ATTEMPTS = 3;

const HERO_IDS = [
  "evenementiel-01",
  "evenementiel-02",
  "restauration-03",
  "mode-03",
  "beaute-03",
  "immobilier-business-01",
  "immobilier-business-03",
  "techno-education-03",
  "sport-finance-01",
  "sante-tourisme-associations-02",
];

const DESIGN_RULES = [...DESIGN_RULE_LABELS];

type CatalogueFile = { fiches: Array<{ id: string }> };
type PageMapFile = {
  fiches: Array<{ id: string; page_reference_pdf: number | null; local_ref_path?: string }>;
};
type ImageResponse = {
  data?: Array<{ url?: string; b64_json?: string }>;
  usage?: { total_tokens?: number };
  model?: string;
};
type ChatResponse = {
  choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }>;
};

type VisualRef = {
  id: string;
  storagePath: string;
  dataUrl: string;
  bytes: number;
  domain: string;
  source: "supabase" | "local";
};

async function loadLocalEnv() {
  for (const name of [".env.local", ".env"]) {
    try {
      const text = await readFile(path.join(ROOT, name), "utf8");
      for (const line of text.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
        const eq = trimmed.indexOf("=");
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (key && process.env[key] === undefined) process.env[key] = value;
      }
    } catch {
      // optional
    }
  }
}

function rodiumHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "x-api-key": apiKey,
  };
}

function estimateRodi(model: string, tokens: number) {
  const perThousand = model.toLowerCase().includes("gpt") ? 3.5 : 4.2;
  return Number(((tokens / 1000) * perThousand).toFixed(3));
}

function shortErrorBody(text: string) {
  return text.replace(/\s+/g, " ").slice(0, 180);
}

function pickIndex(seed: string, length: number) {
  if (length <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}

async function bufferToJpegDataUrl(buffer: Buffer) {
  const sharp = (await import("sharp")).default;
  const jpeg = await sharp(buffer)
    .rotate()
    .resize({ width: 384, height: 576, fit: "inside", withoutEnlargement: true })
    .blur(0.6)
    .jpeg({ quality: 55 })
    .toBuffer();
  return { dataUrl: `data:image/jpeg;base64,${jpeg.toString("base64")}`, bytes: jpeg.length };
}

async function referenceDataUrl(localPath?: string | null): Promise<VisualRef | null> {
  if (!localPath) return null;
  const abs = path.join(ROOT, localPath);
  try {
    const { readFile: read } = await import("node:fs/promises");
    const raw = await read(abs);
    const jpeg = await bufferToJpegDataUrl(raw);
    return {
      id: localPath,
      storagePath: localPath,
      dataUrl: jpeg.dataUrl,
      bytes: jpeg.bytes,
      domain: "",
      source: "local",
    };
  } catch {
    return null;
  }
}

async function fetchSupabaseReference(domaine: string, seed: string): Promise<VisualRef | null> {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, "") ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!base || !key || !domaine) return null;
  const query = new URLSearchParams({
    domaine: `eq.${domaine}`,
    select: "id,domaine,storage_path,uploaded_at",
    order: "uploaded_at.asc",
    limit: "40",
  });
  const list = await fetch(`${base}/rest/v1/inspiration_source?${query.toString()}`, {
    headers: { Authorization: `Bearer ${key}`, apikey: key, Accept: "application/json" },
  });
  if (!list.ok) return null;
  const rows = (await list.json()) as Array<{ id: string; domaine: string; storage_path: string }>;
  if (!Array.isArray(rows) || !rows.length) return null;
  const row = rows[pickIndex(seed, rows.length)] ?? rows[0];
  const encoded = row.storage_path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  const file = await fetch(`${base}/storage/v1/object/inspirations-source/${encoded}`, {
    headers: { Authorization: `Bearer ${key}`, apikey: key },
  });
  if (!file.ok) return null;
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!buffer.length) return null;
  const jpeg = await bufferToJpegDataUrl(buffer);
  return {
    id: row.id,
    storagePath: row.storage_path,
    dataUrl: jpeg.dataUrl,
    bytes: jpeg.bytes,
    domain: row.domaine,
    source: "supabase",
  };
}

async function chatJson(params: { baseUrl: string; apiKey: string; prompt: string; images: string[] }) {
  const content: Array<Record<string, unknown>> = [{ type: "text", text: params.prompt }];
  for (const url of params.images) {
    if (url && url.length < 900_000) content.push({ type: "image_url", image_url: { url } });
  }
  const response = await fetch(`${params.baseUrl}/chat/completions`, {
    method: "POST",
    headers: rodiumHeaders(params.apiKey),
    body: JSON.stringify({
      model: process.env.RODIUMAI_TEXT_MODEL?.trim() || process.env.RODIUMAI_MODEL?.trim() || "google/gemini-3.5-flash",
      messages: [{ role: "user", content }],
      temperature: 0,
      max_tokens: 2500,
    }),
  });
  if (!response.ok) return "";
  const data = (await response.json()) as ChatResponse;
  const raw = data.choices?.[0]?.message?.content;
  if (typeof raw === "string") return raw.trim();
  if (Array.isArray(raw)) return raw.map((part) => part.text ?? "").join("\n").trim();
  return "";
}

async function analyzeDna(params: {
  baseUrl: string;
  apiKey: string;
  imageUrl: string;
  domain: string;
  referenceId: string;
}): Promise<CreativeDna | null> {
  const prompt = [
    "You are FlyerMint's art director. Analyze this poster as a COMPOSITION MODEL.",
    `Domain: ${params.domain}. Reference id: ${params.referenceId}.`,
    "Describe STRUCTURE only. Never transcribe brand names, logos, phone numbers, or identifiable people.",
    "Return JSON only with keys: background, composition, layout, humanPlacement, subjectScale, textPosition, titleHierarchy, humanRole, imageTreatment, typographyHierarchy, colorPalette, contrast, spacing, whiteSpace, margins, safeZone, ctaPosition, pricePosition, mood, visualDensity, aspectRatio.",
  ].join(" ");
  const raw = await chatJson({
    baseUrl: params.baseUrl,
    apiKey: params.apiKey,
    prompt,
    images: [params.imageUrl],
  });
  const dna = parseCreativeDna(raw, { referenceId: params.referenceId, domain: params.domain });
  return dnaHasStructure(dna) ? dna : dna.composition ? dna : null;
}

async function reviewQc(params: {
  baseUrl: string;
  apiKey: string;
  imageUrl: string;
  title: string;
  domain: string;
  facts: string[];
  dnaSummary: string;
  referenceImageUrl?: string;
}): Promise<PosterQcReport> {
  const raw = await chatJson({
    baseUrl: params.baseUrl,
    apiKey: params.apiKey,
    prompt: qcPrompt(params.title, params.domain, params.facts, "affiche 3:4", params.dnaSummary),
    images: [params.imageUrl, params.referenceImageUrl ?? ""],
  });
  return raw ? parseQcReport(raw) : parseQcReport("");
}

async function callRodium(params: {
  baseUrl: string;
  apiKey: string;
  model: string;
  prompt: string;
  referenceDataUrl: string;
  size: string;
}) {
  const headers = rodiumHeaders(params.apiKey);
  const body: Record<string, unknown> = {
    model: params.model,
    prompt: params.prompt,
    n: 1,
    size: params.size,
  };
  const gemini = params.model.toLowerCase().includes("gemini");
  if (gemini && params.referenceDataUrl) {
    body.image = params.referenceDataUrl;
  }

  let lastError = "RODIUM_IMAGES_FAILED";
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${params.baseUrl}/images/generations`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const raw = await response.text();
    if (response.ok) {
      const data = JSON.parse(raw) as ImageResponse;
      const first = data.data?.[0];
      const url = first?.url || (first?.b64_json ? `data:image/png;base64,${first.b64_json}` : "");
      if (!url) throw new Error("RODIUM_INVALID_IMAGE_RESPONSE");
      return { url, tokens: data.usage?.total_tokens ?? 0, model: data.model ?? params.model };
    }
    lastError = `RODIUM_IMAGES_${response.status}_${shortErrorBody(raw)}`;
    if (raw.includes("insufficient_balance") || raw.includes("insufficient_quota")) {
      throw new Error(`RODIUM_INSUFFICIENT_BALANCE_${shortErrorBody(raw)}`);
    }
    if (response.status === 400 && params.size !== FALLBACK_SIZE) {
      body.size = FALLBACK_SIZE;
      continue;
    }
    if (response.status < 500 && response.status !== 429) break;
    await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
  }
  throw new Error(lastError);
}

async function loadImageBuffer(url: string) {
  if (url.startsWith("data:")) {
    const base64 = url.split(",")[1] ?? "";
    return Buffer.from(base64, "base64");
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`DOWNLOAD_${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function writeMasterAndWeb(buffer: Buffer, id: string) {
  const sharp = (await import("sharp")).default;
  const meta = await sharp(buffer).metadata();
  const masterPath = path.join(MASTER_DIR, `${id}-master.webp`);
  const webPath = path.join(WEB_DIR, `${id}.webp`);
  const publicPath = path.join(OUT_DIR, `${id}.webp`);
  const heroPath = path.join(HERO_DIR, `${id}.webp`);

  const master = await sharp(buffer).rotate().webp({ quality: 90 }).toBuffer();
  await writeFile(masterPath, master);

  let quality = 85;
  let web = await sharp(buffer)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true, kernel: "lanczos3" })
    .webp({ quality })
    .toBuffer();
  while (web.length > 1_500_000 && quality > 70) {
    quality -= 5;
    web = await sharp(buffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true, kernel: "lanczos3" })
      .webp({ quality })
      .toBuffer();
  }
  await writeFile(webPath, web);
  await writeFile(publicPath, web);
  await sharp(buffer)
    .rotate()
    .resize({ width: 640, withoutEnlargement: true, kernel: "lanczos3" })
    .webp({ quality: 82 })
    .toFile(heroPath);

  const webMeta = await sharp(web).metadata();
  return {
    masterWidth: meta.width ?? 0,
    masterHeight: meta.height ?? 0,
    webWidth: webMeta.width ?? 0,
    webHeight: webMeta.height ?? 0,
    webBytes: web.length,
  };
}

function isGptImageModel(model: unknown) {
  return String(model ?? "").toLowerCase().includes("gpt-image");
}

function shouldSkipPrevious(previous: Record<string, unknown> | undefined, sheetId: string) {
  if (!previous || previous.statut !== "genere" || !previous.fichier_image) return false;
  if (FORCE_REGEN_ALL) return false;
  if (isGptImageModel(previous.modele_image_utilise)) return true;
  if (!HERO_IDS.includes(sheetId)) return true;
  return !FORCE_REGEN;
}

function catalogueOrder(fiches: Array<Record<string, unknown>>) {
  const byId = new Map(fiches.map((row) => [String(row.id), row]));
  const ordered = SHOWCASE_SHEETS.map((sheet) => byId.get(sheet.id)).filter(
    (row): row is Record<string, unknown> => Boolean(row),
  );
  for (const row of fiches) {
    if (!byId.has(String(row.id))) continue;
    if (!ordered.includes(row)) ordered.push(row);
  }
  return ordered;
}

function successEntry(params: {
  sheet: (typeof SHOWCASE_SHEETS)[number];
  prompt: string;
  model: string;
  rodi: number;
  dims: Awaited<ReturnType<typeof writeMasterAndWeb>>;
  pageRef: number | null;
  visualRef: VisualRef | null;
  dna: CreativeDna | null;
  qc: PosterQcReport | null;
}) {
  const { sheet, prompt, model, rodi, dims, pageRef, visualRef, dna, qc } = params;
  return {
    id: sheet.id,
    domaine: sheet.domaine,
    titre_original_catalogue: sheet.titre_original_catalogue,
    titre_affiche_finale: sheet.titre_affiche_finale,
    sous_titre_affiche_finale: sheet.sous_titre_affiche_finale,
    prompt_image_final: prompt,
    regles_design_appliquees: DESIGN_RULES,
    modele_texte_utilise: "",
    modele_image_utilise: model,
    cout_rodi: rodi,
    fichier_image_master: `storage/masters/${sheet.id}-master.webp`,
    fichier_image_master_4k: `storage/masters/${sheet.id}-master.webp`,
    master_width: dims.masterWidth,
    master_height: dims.masterHeight,
    fichier_image_web: `/creations/${sheet.id}.webp`,
    fichier_image: `/creations/${sheet.id}.webp`,
    fichier_image_hero: `/creations/hero/${sheet.id}.webp`,
    poids_web_ko: Number((dims.webBytes / 1024).toFixed(1)),
    poids_ko: Number((dims.webBytes / 1024).toFixed(1)),
    web_width: dims.webWidth,
    web_height: dims.webHeight,
    resize: "sharp lanczos3 width<=1600 webp q85 — native pixels recorded, not 4K",
    page_reference_pdf: pageRef,
    visual_ref_used: Boolean(visualRef?.dataUrl),
    reference_id: visualRef?.id ?? "",
    reference_image: visualRef?.storagePath ?? "",
    reference_source: visualRef?.source ?? "none",
    reference_analysis: dna,
    human_present: qc && !qcWasSkipped(qc) ? qc.has_person : null,
    design_rules_check: qc && !qcWasSkipped(qc) ? qc.design_rules : null,
    reference_match_check: qc && !qcWasSkipped(qc) ? qc.composition_match : null,
    bitmap_attached: Boolean(visualRef?.dataUrl) && String(model).toLowerCase().includes("gemini"),
    reference_analyzed: Boolean(dna && dnaHasStructure(dna)),
    resolution: `${dims.masterWidth}x${dims.masterHeight}`,
    rodi: rodi,
    qc: qc && !qcWasSkipped(qc) ? qc : null,
    reference_categorisation: referenceCategorisation(sheet),
    statut: "genere",
    final_status: qc && !qcWasSkipped(qc) && qc.pass ? "VALIDATED" : "GENERATED_QC_PENDING",
    hero_loop: false,
  };
}

async function persistOutputs(
  fiches: Array<Record<string, unknown>>,
  extra: { note?: string } = {},
) {
  let previous: Array<Record<string, unknown>> = [];
  try {
    const existing = JSON.parse(await readFile(MANIFEST, "utf8")) as { fiches?: Array<Record<string, unknown>> };
    previous = existing.fiches ?? [];
  } catch {
    previous = [];
  }
  const byId = new Map<string, Record<string, unknown>>();
  for (const row of previous) byId.set(String(row.id), row);
  for (const row of fiches) byId.set(String(row.id), row);
  const merged = catalogueOrder([...byId.values()]);

  const successIds = merged.filter((row) => row.statut === "genere").map((row) => String(row.id));
  const loop = HERO_IDS.filter((id) => successIds.includes(id));
  for (const id of successIds) {
    if (loop.length >= 10) break;
    if (!loop.includes(id)) loop.push(id);
  }
  for (const row of merged) {
    row.hero_loop = loop.includes(String(row.id));
  }

  const catalog = {
    rule: "Style templates only. Never store original catalogue copy (titles, prices, real brands) as reusable content. Never serve references.pdf extracts.",
    count: SHOWCASE_SHEETS.length,
    items: SHOWCASE_SHEETS.map((sheet) => {
      const row = merged.find((item) => item.id === sheet.id);
      return {
        id: sheet.id,
        domaine: sheet.domaine,
        ...referenceCategorisation(sheet),
        imageUrl: row?.fichier_image_web || row?.fichier_image || "",
      };
    }),
  };
  await writeFile(REF_CATALOG, `${JSON.stringify(catalog, null, 2)}\n`);

  const generated = merged.filter((row) => row.statut === "genere");
  const failed = merged.filter((row) => row.statut === "echec");
  const withHuman = generated.filter((row) => row.human_present === true).length;
  const rejectedNoHuman = merged.filter((row) => row.human_present === false && row.statut === "echec").length;
  const refsUsed = generated.filter((row) => row.visual_ref_used === true);
  const manifest = {
    source: "docs/inspirations/catalogue-extrait.json + supabase inspirations-source",
    generated_at: new Date().toISOString(),
    count: merged.length,
    rodi_total: Number(merged.reduce((sum, row) => sum + Number(row.cout_rodi ?? 0), 0).toFixed(3)),
    master_size_requested: MASTER_SIZE,
    master_size_note: "Rodium max poster size is 1024x1536. This is not 4K.",
    hero_loop_count: loop.length,
    evidence: {
      references_selected: refsUsed.length,
      reference_ids: refsUsed.map((row) => row.reference_id).filter(Boolean),
      generated: generated.length,
      failed: failed.length,
      human_present: withHuman,
      rejected_no_human: rejectedNoHuman,
      resolution: MASTER_SIZE,
    },
    note:
      extra.note ??
      "Existing GPT Image posters kept. Missing catalogue posters generated with Gemini + a real Supabase bitmap. Recorded pixels are 1024x1536, not 4K.",
    fiches: merged,
  };
  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  return { successIds, loop, rodi_total: manifest.rodi_total, evidence: manifest.evidence };
}

async function main() {
  await loadLocalEnv();
  const baseUrl = process.env.RODIUMAI_BASE_URL?.trim() || "https://api.rodiumai.io/v1";
  const apiKey = process.env.RODIUMAI_API_KEY?.trim() || "";
  const gpt = process.env.RODIUMAI_IMAGE_MODEL_PREMIUM?.trim() || "openai/gpt-image-2";
  const gemini = process.env.RODIUMAI_IMAGE_MODEL_IMAGE_EDIT?.trim() || "google/gemini-3.1-flash-image";

  if (!apiKey) throw new Error("RODIUMAI_API_KEY_MISSING");

  const catalogue = JSON.parse(await readFile(CATALOGUE, "utf8")) as CatalogueFile;
  if (catalogue.fiches.length !== 27) throw new Error(`CATALOGUE_COUNT_${catalogue.fiches.length}`);
  if (SHOWCASE_SHEETS.length !== 27) throw new Error("SHEETS_COUNT");
  for (let i = 0; i < 27; i += 1) {
    if (catalogue.fiches[i].id !== SHOWCASE_SHEETS[i].id) {
      throw new Error(`ALIGN_${i}_${catalogue.fiches[i].id}_${SHOWCASE_SHEETS[i].id}`);
    }
  }

  let pageMap: PageMapFile = { fiches: [] };
  try {
    pageMap = JSON.parse(await readFile(PAGE_MAP, "utf8")) as PageMapFile;
  } catch {
    pageMap = { fiches: [] };
  }

  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(HERO_DIR, { recursive: true });
  await mkdir(MASTER_DIR, { recursive: true });
  await mkdir(WEB_DIR, { recursive: true });

  try {
    const walletResponse = await fetch(`${baseUrl}/wallet`, { headers: rodiumHeaders(apiKey) });
    if (walletResponse.ok) {
      const wallet = (await walletResponse.json()) as { balance_rodi?: string; reserved_rodi?: string };
      console.log("wallet", wallet.balance_rodi, "reserved", wallet.reserved_rodi, "fill_model", gemini, "size", MASTER_SIZE, "not_4k");
    } else {
      console.log("wallet_status", walletResponse.status, "fill_model", gemini, "size", MASTER_SIZE);
    }
  } catch {
    console.log("wallet_unavailable", "fill_model", gemini, "size", MASTER_SIZE);
  }

  let existing: { fiches?: Array<Record<string, unknown>> } = {};
  try {
    existing = JSON.parse(await readFile(MANIFEST, "utf8")) as typeof existing;
  } catch {
    existing = {};
  }

  const queue = [
    ...SHOWCASE_SHEETS.filter((sheet) => HERO_IDS.includes(sheet.id)),
    ...SHOWCASE_SHEETS.filter((sheet) => !HERO_IDS.includes(sheet.id)),
  ];

  const fiches = [];
  for (const sheet of queue) {
    const mapRow = pageMap.fiches.find((row) => row.id === sheet.id);
    const previous = existing.fiches?.find((row) => row.id === sheet.id);
    const hero = HERO_IDS.includes(sheet.id);
    const pageRef = mapRow?.page_reference_pdf ?? null;
    const categorisation = referenceCategorisation(sheet);

    if (previous && shouldSkipPrevious(previous, sheet.id)) {
      fiches.push({
        ...previous,
        prompt_image_final: previous.prompt_image_final ?? buildShowcasePrompt(sheet, Boolean(previous.visual_ref_used)),
        page_reference_pdf: pageRef,
        modele_image_utilise: previous.modele_image_utilise,
        visual_ref_used: previous.visual_ref_used ?? false,
        regles_design_appliquees: previous.regles_design_appliquees ?? DESIGN_RULES,
        reference_categorisation: categorisation,
        resize: previous.resize ?? "sharp lanczos3 width<=1600 webp q85 — native pixels recorded, not 4K",
      });
      console.log("skip", sheet.id, previous.modele_image_utilise, hero ? "hero" : "fill", "page", pageRef, "visual_ref", previous.visual_ref_used ?? false);
      continue;
    }

    const supabaseDomain = supabaseDomainForSheet(sheet.id);
    let visualRef = await fetchSupabaseReference(supabaseDomain, `${sheet.id}|${sheet.titre_affiche_finale}`);
    if (!visualRef) {
      visualRef = await referenceDataUrl(mapRow?.local_ref_path);
    }
    const dna = visualRef
      ? await analyzeDna({
          baseUrl,
          apiKey,
          imageUrl: visualRef.dataUrl,
          domain: sheet.domaine,
          referenceId: visualRef.id,
        })
      : null;
    const dnaBlock = dna && dnaHasStructure(dna) ? dnaPromptBlock(dna) : "";
    let prompt = buildShowcasePrompt(sheet, Boolean(visualRef?.dataUrl), dnaBlock);
    const facts = [sheet.titre_affiche_finale, sheet.sous_titre_affiche_finale, sheet.meta, sheet.cta];
    const dnaSummary = dnaSummaryLine(dna);

    async function renderWith(model: string, attachBitmap: boolean) {
      let nextPrompt = buildShowcasePrompt(sheet, attachBitmap && Boolean(visualRef?.dataUrl), dnaBlock);
      let result: { url: string; tokens: number; model: string } | null = null;
      let qc: PosterQcReport | null = null;
      let rodi = 0;
      const attempts = 2;
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        result = await callRodium({
          baseUrl,
          apiKey,
          model,
          prompt: nextPrompt,
          referenceDataUrl: attachBitmap ? visualRef?.dataUrl ?? "" : "",
          size: MASTER_SIZE,
        });
        rodi = Number((rodi + estimateRodi(result.model, result.tokens)).toFixed(3));
        qc = await reviewQc({
          baseUrl,
          apiKey,
          imageUrl: result.url,
          title: sheet.titre_affiche_finale,
          domain: sheet.domaine,
          facts,
          dnaSummary,
          referenceImageUrl: attachBitmap ? visualRef?.dataUrl : undefined,
        });
        console.log("qc", sheet.id, model, "attempt", attempt + 1, "pass", qc.pass, "human", qc.has_person, "generic", qc.looks_ai_generic, qc.issues.join("|"));
        if (!shouldRepair(qc) || qcWasSkipped(qc)) break;
        if (attempt === attempts - 1) break;
        nextPrompt = applyRepair(nextPrompt, qc);
      }
      if (!result) throw new Error("RODIUM_INVALID_IMAGE_RESPONSE");
      if (qc && isCriticalQcFailure(qc)) {
        throw new Error(`RODIUM_QUALITY_FAILED_${(qc.issues.join("|") || "critical").slice(0, 120)}`);
      }
      return { result, qc, rodi, prompt: nextPrompt };
    }

    try {
      let rendered: Awaited<ReturnType<typeof renderWith>>;
      try {
        console.log("gen", sheet.id, gemini, visualRef ? visualRef.source : "no-ref", visualRef?.id ?? "", hero ? "hero" : "fill");
        rendered = await renderWith(gemini, Boolean(visualRef?.dataUrl));
      } catch (firstError) {
        const message = firstError instanceof Error ? firstError.message : String(firstError);
        console.error("gemini_fail", sheet.id, message);
        console.log("fallback_gpt", sheet.id, gpt, "dna", Boolean(dnaBlock));
        rendered = await renderWith(gpt, false);
      }
      const buffer = await loadImageBuffer(rendered.result.url);
      const dims = await writeMasterAndWeb(buffer, sheet.id);
      const entry = successEntry({
        sheet,
        prompt: rendered.prompt,
        model: rendered.result.model,
        rodi: rendered.rodi,
        dims,
        pageRef,
        visualRef,
        dna,
        qc: rendered.qc,
      });
      fiches.push(entry);
      console.log("ok", sheet.id, dims.masterWidth, "x", dims.masterHeight, entry.poids_web_ko, "Ko", rendered.result.model, "ref", visualRef?.id ?? "none");
      await persistOutputs(fiches);
    } catch (error) {
      fiches.push({
        id: sheet.id,
        domaine: sheet.domaine,
        titre_original_catalogue: sheet.titre_original_catalogue,
        titre_affiche_finale: sheet.titre_affiche_finale,
        sous_titre_affiche_finale: sheet.sous_titre_affiche_finale,
        prompt_image_final: prompt,
        regles_design_appliquees: DESIGN_RULES,
        modele_texte_utilise: "",
        modele_image_utilise: gemini,
        cout_rodi: 0,
        fichier_image_master_4k: "",
        fichier_image_web: "",
        fichier_image: "",
        fichier_image_hero: "",
        poids_web_ko: 0,
        poids_ko: 0,
        page_reference_pdf: pageRef,
        visual_ref_used: Boolean(visualRef?.dataUrl),
        reference_id: visualRef?.id ?? "",
        reference_image: visualRef?.storagePath ?? "",
        reference_analysis: dna,
        human_present: false,
        design_rules_check: false,
        reference_match_check: false,
        reference_categorisation: categorisation,
        statut: "echec",
        final_status: "FAILED",
        hero_loop: false,
        erreur: error instanceof Error ? error.message.slice(0, 180) : "unknown",
      });
      console.error("fail", sheet.id, error instanceof Error ? error.message : error);
      await persistOutputs(fiches);
      if (error instanceof Error && error.message.includes("RODIUM_INSUFFICIENT_BALANCE")) {
        console.error("stop_insufficient_balance");
        break;
      }
    }
  }

  const summary = await persistOutputs(fiches);
  console.log("manifest", MANIFEST, "success", summary.successIds.length, "hero", summary.loop.length, "rodi", summary.rodi_total);
  console.log("evidence", JSON.stringify(summary.evidence));
  void gpt;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
