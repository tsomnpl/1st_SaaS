import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { SHOWCASE_SHEETS } from "../src/lib/showcase-sheets.ts";
import { buildShowcasePrompt, referenceCategorisation } from "../src/lib/showcase-design.ts";
import { MASTER_LONG_SIDE, writePosterDerivatives } from "../src/lib/poster-derivatives.ts";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "public/creations");
const HERO_DIR = path.join(OUT_DIR, "hero");
const MASTER_DIR = path.join(ROOT, "storage/masters");
const WEB_DIR = path.join(ROOT, "storage/web");
const MANIFEST = path.join(ROOT, "docs/inspirations/showcase-manifest.json");
const CATALOGUE = path.join(ROOT, "docs/inspirations/catalogue-extrait.json");
const PAGE_MAP = path.join(ROOT, "docs/inspirations/reference-page-map.json");
const REF_CATALOG = path.join(ROOT, "docs/inspirations/references-catalog.json");
const MODEL_REQUEST_SIZE = "1024x1536";
const FALLBACK_SIZE = "1024x1536";
const MASTER_LABEL = `master long side ${MASTER_LONG_SIDE}px after measured lanczos3 upscale; model request ${MODEL_REQUEST_SIZE}`;
const FORCE_REGEN = process.env.FORCE_REGEN === "1";
const FORCE_REGEN_ALL = process.env.FORCE_REGEN === "all";
const ONLY_IDS = new Set(
  (process.env.ONLY_ID ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);

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

type CatalogueFile = { fiches: Array<{ id: string }> };
type PageMapFile = {
  fiches: Array<{ id: string; page_reference_pdf: number | null; local_ref_path?: string }>;
};
type ImageResponse = {
  data?: Array<{ url?: string; b64_json?: string }>;
  usage?: { total_tokens?: number };
  model?: string;
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

async function referenceDataUrl(localPath?: string) {
  if (!localPath) return "";
  const abs = path.join(ROOT, localPath);
  try {
    const sharp = (await import("sharp")).default;
    const jpeg = await sharp(abs)
      .rotate()
      .resize({ width: 1024, height: 1536, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 72 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return "";
  }
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
  const gemini = !isGptImageModel(params.model);
  let imageAttached = false;
  if (gemini && params.referenceDataUrl) {
    body.image = params.referenceDataUrl;
    imageAttached = true;
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
      return {
        url,
        tokens: data.usage?.total_tokens ?? 0,
        model: data.model ?? params.model,
        visualRefSent: imageAttached,
      };
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

async function ensureReferenceImage(id: string, page: number | null, localPath?: string) {
  if (localPath) {
    try {
      await readFile(path.join(ROOT, localPath));
      return localPath;
    } catch {
      // The mapped jpeg is not on disk; render the PDF page below.
    }
  }
  if (!page) return "";
  const rel = path.join("storage/private/ref-pages", `${id}-p${page}.jpg`);
  const dest = path.join(ROOT, rel);
  await mkdir(path.dirname(dest), { recursive: true });
  const pdf = path.join(ROOT, "docs/inspirations/references.pdf");
  const py = [
    "import pymupdf, sys",
    "doc = pymupdf.open(sys.argv[1])",
    "page = doc[int(sys.argv[2]) - 1]",
    "pix = page.get_pixmap(matrix=pymupdf.Matrix(1.6, 1.6))",
    "pix.save(sys.argv[3], jpg_quality=82)",
  ].join("\n");
  await execFileAsync("python3", ["-c", py, pdf, String(page), dest]);
  return rel;
}

async function writeMasterAndWeb(buffer: Buffer, id: string) {
  return writePosterDerivatives({
    buffer,
    masterPath: path.join(MASTER_DIR, `${id}-master.webp`),
    webPath: path.join(WEB_DIR, `${id}.webp`),
    publicPath: path.join(OUT_DIR, `${id}.webp`),
    heroPath: path.join(HERO_DIR, `${id}.webp`),
  });
}

function isGptImageModel(model: unknown) {
  return String(model ?? "").toLowerCase().includes("gpt-image");
}

function shouldSkipPrevious(previous: Record<string, unknown> | undefined, sheetId: string) {
  if (!previous || previous.statut !== "genere" || !previous.fichier_image) return false;
  if (ONLY_IDS.has(sheetId)) return false;
  if (FORCE_REGEN_ALL) return false;
  if (FORCE_REGEN) return false;
  if (isGptImageModel(previous.modele_image_utilise)) return true;
  if (!HERO_IDS.includes(sheetId)) return true;
  return true;
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

  const manifest = {
    source: "docs/inspirations/catalogue-extrait.json",
    generated_at: new Date().toISOString(),
    count: merged.length,
    rodi_total: Number(merged.reduce((sum, row) => sum + Number(row.cout_rodi ?? 0), 0).toFixed(3)),
    master_size_requested: MODEL_REQUEST_SIZE,
    master_size_note: MASTER_LABEL,
    hero_loop_count: loop.length,
    note:
      extra.note ??
      "Visual references are PDF page rasters sent only to a model that accepts a bitmap. visual_ref_used is true only after that send succeeds. Masters are upscaled with sharp lanczos3 until the long side is at least 3840px, then the web file is a smaller derivative.",
    fiches: merged,
  };
  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  return { successIds, loop, rodi_total: manifest.rodi_total };
}

async function main() {
  await loadLocalEnv();
  const baseUrl = process.env.RODIUMAI_BASE_URL?.trim() || "https://api.rodiumai.io/v1";
  const apiKey = process.env.RODIUMAI_API_KEY?.trim() || "";
  const gpt = process.env.RODIUMAI_IMAGE_MODEL_PREMIUM?.trim() || "openai/gpt-image-2";
  const geminiFast = process.env.RODIUMAI_IMAGE_MODEL_IMAGE_EDIT?.trim() || "google/gemini-3.1-flash-image";
  const geminiPremium = process.env.RODIUMAI_IMAGE_MODEL_IMAGE_EDIT?.trim() || "google/gemini-3.1-flash-image";

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
      const wallet = (await walletResponse.json()) as { balance_rodi?: string };
      console.log("wallet", wallet.balance_rodi, "RODI", "ref_model", geminiFast, "text_model", gpt, "request", MODEL_REQUEST_SIZE, "master", MASTER_LONG_SIDE);
    } else {
      console.log("wallet_status", walletResponse.status, "ref_model", geminiFast, "request", MODEL_REQUEST_SIZE);
    }
  } catch {
    console.log("wallet_unavailable", "ref_model", geminiFast, "request", MODEL_REQUEST_SIZE);
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
    if (ONLY_IDS.size && !ONLY_IDS.has(sheet.id)) {
      if (previous) fiches.push(previous);
      continue;
    }
    const categorisation = referenceCategorisation(sheet);
    const promptForSkip = buildShowcasePrompt(sheet, false);

    if (previous && shouldSkipPrevious(previous, sheet.id)) {
      fiches.push({
        ...previous,
        prompt_image_final: typeof previous.prompt_image_final === "string" ? previous.prompt_image_final : promptForSkip,
        page_reference_pdf: pageRef,
        modele_image_utilise: previous.modele_image_utilise,
        visual_ref_used: previous.visual_ref_used === true,
        regles_design_appliquees: [
          "palette limitée 2-3 couleurs",
          "2 familles typographiques max",
          "hiérarchie titre dominante",
          "contraste fort texte/fond",
          "alignement sur grille",
          "proximité des infos liées",
          "espace blanc / safe zone",
          "un seul héros visuel",
        ],
        reference_categorisation: categorisation,
      });
      console.log("skip", sheet.id, previous.modele_image_utilise, hero ? "hero" : "fill", "page", pageRef);
      continue;
    }

    const refPath = await ensureReferenceImage(sheet.id, pageRef, mapRow?.local_ref_path || undefined);
    const reference = refPath ? await referenceDataUrl(refPath) : "";
    const model = reference ? geminiFast : gpt;
    const attachBitmap = Boolean(reference) && !isGptImageModel(model);
    const prompt = buildShowcasePrompt(sheet, attachBitmap);

    try {
      console.log("gen", sheet.id, model, attachBitmap ? "ref" : "text", hero ? "hero" : "fill");
      const result = await callRodium({
        baseUrl,
        apiKey,
        model,
        prompt,
        referenceDataUrl: attachBitmap ? reference : "",
        size: MODEL_REQUEST_SIZE,
      });
      const buffer = await loadImageBuffer(result.url);
      const dims = await writeMasterAndWeb(buffer, sheet.id);
      const entry = {
        id: sheet.id,
        domaine: sheet.domaine,
        titre_original_catalogue: sheet.titre_original_catalogue,
        titre_affiche_finale: sheet.titre_affiche_finale,
        sous_titre_affiche_finale: sheet.sous_titre_affiche_finale,
        prompt_image_final: prompt,
        regles_design_appliquees: [
          "palette limitée 2-3 couleurs",
          "2 familles typographiques max",
          "hiérarchie titre dominante",
          "contraste fort texte/fond",
          "alignement sur grille",
          "proximité des infos liées",
          "espace blanc / safe zone",
          "un seul héros visuel",
        ],
        modele_texte_utilise: "",
        modele_image_utilise: result.model,
        cout_rodi: estimateRodi(result.model, result.tokens),
        fichier_image_master: `storage/masters/${sheet.id}-master.webp`,
        master_size: `${dims.masterWidth}x${dims.masterHeight}`,
        master_width: dims.masterWidth,
        master_height: dims.masterHeight,
        is_4k: dims.is4k,
        fichier_image_web: `/creations/${sheet.id}.webp`,
        fichier_image: `/creations/${sheet.id}.webp`,
        fichier_image_hero: `/creations/hero/${sheet.id}.webp`,
        poids_web_ko: Number((dims.webBytes / 1024).toFixed(1)),
        poids_ko: Number((dims.webBytes / 1024).toFixed(1)),
        web_width: dims.webWidth,
        web_height: dims.webHeight,
        resize: dims.resize,
        page_reference_pdf: pageRef,
        visual_ref_used: result.visualRefSent === true,
        reference_categorisation: categorisation,
        statut: "genere",
        hero_loop: false,
      };
      fiches.push(entry);
      console.log("ok", sheet.id, dims.masterWidth, "x", dims.masterHeight, entry.poids_web_ko, "Ko", result.model);
      await persistOutputs(fiches);
    } catch (error) {
      fiches.push({
        id: sheet.id,
        domaine: sheet.domaine,
        titre_original_catalogue: sheet.titre_original_catalogue,
        titre_affiche_finale: sheet.titre_affiche_finale,
        sous_titre_affiche_finale: sheet.sous_titre_affiche_finale,
        prompt_image_final: prompt,
        regles_design_appliquees: [
          "palette limitée 2-3 couleurs",
          "hiérarchie titre dominante",
          "contraste fort texte/fond",
        ],
        modele_texte_utilise: "",
        modele_image_utilise: model,
        cout_rodi: 0,
        fichier_image_master: "",
        fichier_image_web: "",
        fichier_image: "",
        fichier_image_hero: "",
        poids_web_ko: 0,
        poids_ko: 0,
        page_reference_pdf: pageRef,
        visual_ref_used: false,
        reference_categorisation: categorisation,
        statut: "echec",
        hero_loop: false,
        erreur: error instanceof Error ? error.message.slice(0, 180) : "unknown",
      });
      console.error("fail", sheet.id, error instanceof Error ? error.message : error);
      const insufficient = error instanceof Error && error.message.includes("RODIUM_INSUFFICIENT_BALANCE");
      if (insufficient && hero && !model.toLowerCase().includes("gemini")) {
        try {
          console.log("fallback", sheet.id, geminiPremium);
          const fallbackPrompt = buildShowcasePrompt(sheet, attachBitmap);
          const fallback = await callRodium({
            baseUrl,
            apiKey,
            model: geminiPremium,
            prompt: fallbackPrompt,
            referenceDataUrl: attachBitmap ? reference : "",
            size: MODEL_REQUEST_SIZE,
          });
          const buffer = await loadImageBuffer(fallback.url);
          const dims = await writeMasterAndWeb(buffer, sheet.id);
          fiches.pop();
          fiches.push({
            id: sheet.id,
            domaine: sheet.domaine,
            titre_original_catalogue: sheet.titre_original_catalogue,
            titre_affiche_finale: sheet.titre_affiche_finale,
            sous_titre_affiche_finale: sheet.sous_titre_affiche_finale,
            prompt_image_final: fallbackPrompt,
            regles_design_appliquees: [
              "palette limitée 2-3 couleurs",
              "2 familles typographiques max",
              "hiérarchie titre dominante",
              "contraste fort texte/fond",
              "alignement sur grille",
              "proximité des infos liées",
              "espace blanc / safe zone",
              "un seul héros visuel",
            ],
            modele_texte_utilise: "",
            modele_image_utilise: fallback.model,
            cout_rodi: estimateRodi(fallback.model, fallback.tokens),
            fichier_image_master: `storage/masters/${sheet.id}-master.webp`,
            master_size: `${dims.masterWidth}x${dims.masterHeight}`,
            master_width: dims.masterWidth,
            master_height: dims.masterHeight,
            is_4k: dims.is4k,
            fichier_image_web: `/creations/${sheet.id}.webp`,
            fichier_image: `/creations/${sheet.id}.webp`,
            fichier_image_hero: `/creations/hero/${sheet.id}.webp`,
            poids_web_ko: Number((dims.webBytes / 1024).toFixed(1)),
            poids_ko: Number((dims.webBytes / 1024).toFixed(1)),
            web_width: dims.webWidth,
            web_height: dims.webHeight,
            resize: dims.resize,
            page_reference_pdf: pageRef,
            visual_ref_used: fallback.visualRefSent === true,
            reference_categorisation: categorisation,
            statut: "genere",
            hero_loop: false,
          });
          console.log("ok", sheet.id, "fallback", fallback.model);
          await persistOutputs(fiches);
          continue;
        } catch (fallbackError) {
          console.error("fallback_fail", sheet.id, fallbackError instanceof Error ? fallbackError.message : fallbackError);
        }
      }
      await persistOutputs(fiches);
    }
  }

  const summary = await persistOutputs(fiches);
  console.log("manifest", MANIFEST, "success", summary.successIds.length, "hero", summary.loop.length, "rodi", summary.rodi_total);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
