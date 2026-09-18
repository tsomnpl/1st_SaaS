import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { SHOWCASE_SHEETS } from "../src/lib/showcase-sheets.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "public/creations");
const HERO_DIR = path.join(OUT_DIR, "hero");
const MANIFEST = path.join(ROOT, "docs/inspirations/showcase-manifest.json");
const CATALOGUE = path.join(ROOT, "docs/inspirations/catalogue-extrait.json");
const POSTER_SIZE = "1024x1536";

const HERO_IDS = [
  "evenementiel-01",
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
      // optional local files
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

async function callRodium(baseUrl: string, apiKey: string, model: string, prompt: string) {
  const headers = rodiumHeaders(apiKey);
  let lastError = "RODIUM_IMAGES_FAILED";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(`${baseUrl}/images/generations`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size: POSTER_SIZE,
      }),
    });
    const raw = await response.text();
    if (response.ok) {
      const data = JSON.parse(raw) as ImageResponse;
      const first = data.data?.[0];
      const url = first?.url || (first?.b64_json ? `data:image/png;base64,${first.b64_json}` : "");
      if (!url) throw new Error("RODIUM_INVALID_IMAGE_RESPONSE");
      return { url, tokens: data.usage?.total_tokens ?? 0, model: data.model ?? model };
    }
    lastError = `RODIUM_IMAGES_${response.status}_${shortErrorBody(raw)}`;
    if (response.status < 500 && response.status !== 429) break;
    await new Promise((resolve) => setTimeout(resolve, 1200));
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

async function writeWebp(buffer: Buffer, file: string, width: number) {
  const sharp = (await import("sharp")).default;
  let quality = 85;
  let out = await sharp(buffer).rotate().resize({ width, withoutEnlargement: true }).webp({ quality }).toBuffer();
  while (out.length > 1_500_000 && quality > 60) {
    quality -= 5;
    out = await sharp(buffer).rotate().resize({ width, withoutEnlargement: true }).webp({ quality }).toBuffer();
  }
  await writeFile(file, out);
  return out.length;
}

async function main() {
  await loadLocalEnv();
  const baseUrl = process.env.RODIUMAI_BASE_URL?.trim() || "https://api.rodiumai.io/v1";
  const apiKey = process.env.RODIUMAI_API_KEY?.trim() || "";
  const fast = process.env.RODIUMAI_IMAGE_MODEL_FAST?.trim() || "google/gemini-3.1-flash-image";
  const premium = process.env.RODIUMAI_IMAGE_MODEL_PREMIUM?.trim() || "google/gemini-3-pro-image";

  if (!apiKey) {
    throw new Error("RODIUMAI_API_KEY_MISSING");
  }

  const catalogue = JSON.parse(await readFile(CATALOGUE, "utf8")) as CatalogueFile;
  if (catalogue.fiches.length !== 27) throw new Error(`CATALOGUE_COUNT_${catalogue.fiches.length}`);
  if (SHOWCASE_SHEETS.length !== 27) throw new Error("SHEETS_COUNT");
  for (let i = 0; i < 27; i += 1) {
    if (catalogue.fiches[i].id !== SHOWCASE_SHEETS[i].id) {
      throw new Error(`ALIGN_${i}_${catalogue.fiches[i].id}_${SHOWCASE_SHEETS[i].id}`);
    }
  }

  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(HERO_DIR, { recursive: true });

  let existing: { fiches?: Array<Record<string, unknown>> } = {};
  try {
    existing = JSON.parse(await readFile(MANIFEST, "utf8")) as typeof existing;
  } catch {
    existing = {};
  }

  const fiches = [];
  for (const sheet of SHOWCASE_SHEETS) {
    const previous = existing.fiches?.find((row) => row.id === sheet.id);
    if (previous?.statut === "genere" && previous.fichier_image) {
      fiches.push(previous);
      console.log("skip", sheet.id);
      continue;
    }

    const model = sheet.premium ? premium : fast;
    try {
      const result = await callRodium(baseUrl, apiKey, model, sheet.prompt);
      const buffer = await loadImageBuffer(result.url);
      const fullPath = path.join(OUT_DIR, `${sheet.id}.webp`);
      const heroPath = path.join(HERO_DIR, `${sheet.id}.webp`);
      const bytes = await writeWebp(buffer, fullPath, 1600);
      await writeWebp(buffer, heroPath, 640);
      const entry = {
        id: sheet.id,
        domaine: sheet.domaine,
        titre_original_catalogue: sheet.titre_original_catalogue,
        titre_affiche_finale: sheet.titre_affiche_finale,
        sous_titre_affiche_finale: sheet.sous_titre_affiche_finale,
        prompt_image_final: sheet.prompt,
        modele_texte_utilise: "",
        modele_image_utilise: result.model,
        cout_rodi: estimateRodi(result.model, result.tokens),
        fichier_image: `/creations/${sheet.id}.webp`,
        fichier_image_hero: `/creations/hero/${sheet.id}.webp`,
        poids_ko: Number((bytes / 1024).toFixed(1)),
        statut: "genere",
        hero_loop: false,
      };
      fiches.push(entry);
      console.log("ok", sheet.id, entry.poids_ko, "Ko", result.model);
    } catch (error) {
      fiches.push({
        id: sheet.id,
        domaine: sheet.domaine,
        titre_original_catalogue: sheet.titre_original_catalogue,
        titre_affiche_finale: sheet.titre_affiche_finale,
        sous_titre_affiche_finale: sheet.sous_titre_affiche_finale,
        prompt_image_final: sheet.prompt,
        modele_texte_utilise: "",
        modele_image_utilise: model,
        cout_rodi: 0,
        fichier_image: "",
        fichier_image_hero: "",
        poids_ko: 0,
        statut: "echec",
        hero_loop: false,
        erreur: error instanceof Error ? error.message.slice(0, 180) : "unknown",
      });
      console.error("fail", sheet.id, error instanceof Error ? error.message : error);
    }
  }

  const successIds = fiches.filter((row) => row.statut === "genere").map((row) => row.id);
  const loop = HERO_IDS.filter((id) => successIds.includes(id));
  for (const row of fiches) {
    row.hero_loop = loop.includes(row.id);
  }

  const manifest = {
    source: "docs/inspirations/catalogue-extrait.json",
    generated_at: new Date().toISOString(),
    count: fiches.length,
    rodi_total: Number(fiches.reduce((sum, row) => sum + Number(row.cout_rodi ?? 0), 0).toFixed(3)),
    fiches,
  };
  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log("manifest", MANIFEST, "success", successIds.length, "rodi", manifest.rodi_total);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
