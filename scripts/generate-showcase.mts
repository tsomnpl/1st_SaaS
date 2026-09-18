import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { SHOWCASE_SHEETS } from "../src/lib/showcase-sheets.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "public/creations");
const HERO_DIR = path.join(OUT_DIR, "hero");
const MANIFEST = path.join(ROOT, "docs/inspirations/showcase-manifest.json");
const CATALOGUE = path.join(ROOT, "docs/inspirations/catalogue-extrait.json");

const BASE_URL = process.env.RODIUMAI_BASE_URL?.trim() || "https://api.rodiumai.io/v1";
const API_KEY = process.env.RODIUMAI_API_KEY?.trim() || "";
const FAST = process.env.RODIUMAI_IMAGE_MODEL_FAST?.trim() || "google/gemini-3.1-flash-image";
const PREMIUM = process.env.RODIUMAI_IMAGE_MODEL_PREMIUM?.trim() || "google/gemini-3-pro-image";

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

function estimateRodi(model: string, tokens: number) {
  const perThousand = model.toLowerCase().includes("gpt") ? 3.5 : 4.2;
  return Number(((tokens / 1000) * perThousand).toFixed(3));
}

async function callRodium(model: string, prompt: string) {
  const images = await fetch(`${BASE_URL}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ model, prompt, size: "1024x1792" }),
  });
  if (images.ok) {
    const data = (await images.json()) as {
      data?: Array<{ url?: string; b64_json?: string }>;
      usage?: { total_tokens?: number };
      model?: string;
    };
    const first = data.data?.[0];
    const url = first?.url || (first?.b64_json ? `data:image/png;base64,${first.b64_json}` : "");
    if (url) {
      return { url, tokens: data.usage?.total_tokens ?? 0, model: data.model ?? model };
    }
  }

  const chat = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "Generate one professional poster. Return JSON {imageUrl} or {b64_json}. Keep text readable.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      response_format: { type: "json_object" },
    }),
  });
  if (!chat.ok) {
    throw new Error(`RODIUM_${chat.status}_${await chat.text().then((t) => t.slice(0, 180))}`);
  }
  const payload = (await chat.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
    model?: string;
  };
  const raw = payload.choices?.[0]?.message?.content ?? "{}";
  let parsed: Record<string, string> = {};
  try {
    parsed = JSON.parse(raw) as Record<string, string>;
  } catch {
    parsed = {};
  }
  const url = parsed.imageUrl || parsed.url || (parsed.b64_json ? `data:image/png;base64,${parsed.b64_json}` : "");
  if (!url) throw new Error("RODIUM_NO_IMAGE");
  return { url, tokens: payload.usage?.total_tokens ?? 0, model: payload.model ?? model };
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
  if (!API_KEY) {
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

    const model = sheet.premium ? PREMIUM : FAST;
    try {
      const result = await callRodium(model, sheet.prompt);
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
      console.error("fail", sheet.id, error);
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
  console.error(error);
  process.exit(1);
});
