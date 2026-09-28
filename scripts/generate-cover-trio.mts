import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { designLawsBlock } from "../src/lib/design-rules.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "public/creations");
const MODEL = process.env.RODIUMAI_IMAGE_MODEL_PREMIUM?.trim() || "openai/gpt-image-2";
const BASE = process.env.RODIUMAI_BASE_URL?.trim() || "https://api.rodiumai.io/v1";

type Job = {
  id: string;
  file: string;
  domain: string;
  inspirationId: string;
  inspiration: string;
  brief: string;
};

const JOBS: Job[] = [
  {
    id: "cover-sport",
    file: "cover-sport.webp",
    domain: "Sport",
    inspirationId: "f148936d-0c86-4cbe-8b0d-70653bac8633",
    inspiration:
      "Style dynamique. Fond ciel bleu clair, nuages, dégradé vers le bas. Un seul coureur photoréel en héros, pas une mosaïque de photos. Titre blanc très grand. Infos de course groupées en bas. Palette #0077B6 et blanc.",
    brief:
      "Title exactly: SPRINT 10K. Subtitle: Édition jeune. Meta grouped: Sam 7h · Corniche · 2 000 FCFA. CTA band: Je m'inscris. One photoreal young runner, natural skin, correct hands, city sky.",
  },
  {
    id: "cover-mode",
    file: "cover-mode.webp",
    domain: "Mode",
    inspirationId: "e11a2d5c-ced6-426e-ac5b-248fd18d57e7",
    inspiration:
      "Style audacieux. Motifs géométriques et texture pointillée. Un seul mannequin photoréel, pas trois personnes. Titre centré en capitales. Palette noir, bleu #0077cc, orange #ff8c00. Beaucoup d'air autour du titre.",
    brief:
      "Title exactly: LOOK NEUF. Subtitle: Collection nuit. Meta: Édition limitée. CTA: Voir le look. One photoreal young man in a tailored jacket, studio light, correct hands and face.",
  },
  {
    id: "cover-musique",
    file: "cover-musique.webp",
    domain: "Musique",
    inspirationId: "04b60ae9-963a-4568-b049-501d02dc1899",
    inspiration:
      "Style moderne musical. Fond bleu et blanc, nuages stylisés. Un guitariste photoréel de face, un seul héros. Titre énorme en bas. Palette noir, blanc, bleu #336699. Date et lieu regroupés, séparés du titre.",
    brief:
      "Title exactly: SESSION LIVE. Subtitle: Guitare & voix. Meta grouped: Ven 21h · Plateau. CTA: Prends ta place. One photoreal young guitarist, readable face, correct hands.",
  },
  {
    id: "promo-burger",
    file: "promo-burger.webp",
    domain: "Restauration",
    inspirationId: "35b53114-b7ef-4681-99af-1eabb7c2d555",
    inspiration:
      "Style urgent de promo resto. Fond rouge vif. Titre très grand en haut. Bandeau d'appel à l'action en bas. Un piment stylisé sur le bord gauche. Palette #E60000 et blanc. Ne pas dessiner un livreur à moto.",
    brief:
      "This poster must match this offer exactly. Title exactly: PROMO CE WEEKEND. Red badge: Burger + boisson. Price exactly: 5 000 FCFA. Bottom label: Après. Small word: Appelle. Hero: one photoreal young West African waiter, white shirt, dark vest, holding a plate with one burger toward the camera, warm restaurant lights behind him. No ramen, no noodles, no second dish.",
  },
];

function headers(apiKey: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "x-api-key": apiKey,
  };
}

function promptFor(job: Job) {
  return [
    "Vertical poster 3:4, print-sharp. Original artwork. Do not copy a reference poster.",
    `Domain: ${job.domain}.`,
    `Inspiration notes only, compose an original: ${job.inspiration}`,
    `Internal ref insp-${job.inspirationId}. Never print this id. Never copy a logo or a real brand.`,
    job.brief,
    "Every visible word is French, spelled correctly, sharp, high contrast. No gibberish, no dummy latin.",
    "One hero, then the title, then the offer, then one CTA. Two type families maximum. Safe margins.",
    designLawsBlock(),
  ].join("\n");
}

async function main() {
  const apiKey = process.env.RODIUMAI_API_KEY?.trim() || "";
  if (!apiKey) throw new Error("RODIUMAI_API_KEY_MISSING");
  const laws = designLawsBlock();
  await mkdir(OUT, { recursive: true });
  const sharp = (await import("sharp")).default;

  for (const job of JOBS) {
    const prompt = promptFor(job);
    if (!prompt.includes(laws)) throw new Error(`LAWS_MISSING_${job.id}`);
    console.log("gen", job.id, "insp", job.inspirationId);
    const response = await fetch(`${BASE}/images/generations`, {
      method: "POST",
      headers: headers(apiKey),
      body: JSON.stringify({ model: MODEL, prompt, n: 1, size: "1024x1536" }),
    });
    const raw = await response.text();
    if (!response.ok) {
      const safe = raw.replace(apiKey, "[key]").replace(/\s+/g, " ").slice(0, 240);
      throw new Error(`RODIUM_${response.status}_${safe}`);
    }
    const data = JSON.parse(raw) as {
      model?: string;
      usage?: { total_tokens?: number };
      data?: Array<{ url?: string; b64_json?: string }>;
    };
    const first = data.data?.[0];
    const url = first?.url || (first?.b64_json ? `data:image/png;base64,${first.b64_json}` : "");
    if (!url) throw new Error(`EMPTY_${job.id}`);
    const buffer = url.startsWith("data:")
      ? Buffer.from(url.split(",")[1] ?? "", "base64")
      : Buffer.from(await (await fetch(url)).arrayBuffer());
    const web = await sharp(buffer)
      .rotate()
      .resize({ width: 896, height: 1200, fit: "cover" })
      .webp({ quality: 82 })
      .toBuffer();
    await writeFile(path.join(OUT, job.file), web);
    console.log("ok", job.id, Math.round(web.length / 1024), "Ko", "tokens", data.usage?.total_tokens ?? 0);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message.replace(/rd_sk_[A-Za-z0-9]+/g, "[key]"));
  process.exit(1);
});
