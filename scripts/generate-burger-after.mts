/**
 * One-off: regenerate the pinned Avant/Après poster from the attached
 * composition model (red delivery poster, chili left). Do not regenerate the catalogue.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { GLOBAL_DESIGN_PROMPT, STYLE_REFERENCE_PROMPT } from "../src/lib/design-rules.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "public/creations/restauration-burger.webp");
const HERO = path.join(ROOT, "public/creations/hero/restauration-burger.webp");
const REF = path.join(ROOT, "storage/private/apres-inspiration.jpg");
const WIDTH = 896;
const HEIGHT = 1200;

const PROMPT = [
  "You are FlyerMint's senior art director, not a generic image generator.",
  STYLE_REFERENCE_PROMPT,
  GLOBAL_DESIGN_PROMPT,
  "Vertical advertising poster 3:4.",
  "A real poster bitmap is attached. It is the COMPOSITION MODEL, not a theme hint.",
  "KEEP STRUCTURE: saturated red field, huge white title top-right, orange subtitle badge,",
  "large out-of-focus red chili pepper in the LEFT foreground, photoreal person occupying the lower half,",
  "circular white badge overlapping the person, white curved band along the BOTTOM for price + CTA.",
  "WIPE every original letter, logo, phone, brand (including Ghana High), scooter identity and copy from the attached image.",
  "REPLACE the scooter scene with this client scene while keeping the same grid:",
  "Photoreal West or Central African man, natural skin and hands, looking toward the camera.",
  "In FRONT of him, at the BOTTOM of the poster, a gourmet burger served IN A BOWL, large, appetizing, clearly visible.",
  "He is presenting / sitting with that bowl — the bowl is the hero food, not a burger floating in his hands at chest height.",
  "LEFT FOREGROUND: the same blurred red chili pepper as the model.",
  "Palette limited to #DC2626, #FFFFFF, #F97316.",
  "CLIENT FACTS ONLY, exact spelling, no extra letters:",
  "TITLE: MENU DU SOIR",
  "SUBTITLE: Burger + boisson",
  "PRICE: 5 000 FCFA",
  "CTA: Commander",
  "Small FLYERMINT badge only. No other brand. No phone number. No Ghana High. No copied logos.",
  "Do not invent a dark kitchen photo. Do not drop the red field. Do not drop the chili.",
].join(" ");

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

function extractUrl(data: {
  data?: Array<{ url?: string; b64_json?: string }>;
  choices?: Array<{
    message?: {
      content?: string | Array<{ image_url?: { url?: string } }>;
      images?: Array<{ image_url?: { url?: string }; url?: string }>;
    };
  }>;
}) {
  const first = data.data?.[0];
  if (first?.url) return first.url;
  if (first?.b64_json) return `data:image/png;base64,${first.b64_json}`;
  const message = data.choices?.[0]?.message;
  const fromList = message?.images?.[0]?.image_url?.url || message?.images?.[0]?.url;
  if (fromList) return fromList;
  const content = message?.content;
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.image_url?.url) return part.image_url.url;
    }
  }
  return "";
}

async function toBuffer(url: string) {
  if (url.startsWith("data:")) {
    const base64 = url.split(",")[1] ?? "";
    return Buffer.from(base64, "base64");
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`DOWNLOAD_${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function referenceDataUrl() {
  const sharp = (await import("sharp")).default;
  const jpeg = await sharp(await readFile(REF))
    .rotate()
    .resize({ width: 640, height: 768, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 72 })
    .toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}

async function generatePoster(base: string, key: string, model: string, attached: string) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
    "x-api-key": key,
  };
  const content: Array<Record<string, unknown>> = [{ type: "text", text: PROMPT }];
  if (attached) content.push({ type: "image_url", image_url: { url: attached } });
  let lastError = "RODIUM_CHAT_IMAGE_FAILED";
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content }],
        temperature: 0.35,
      }),
    });
    const raw = await response.text();
    if (response.ok) {
      const url = extractUrl(JSON.parse(raw));
      if (url) return toBuffer(url);
      lastError = "RODIUM_INVALID_IMAGE_RESPONSE";
    } else {
      lastError = `RODIUM_${response.status}: ${raw.replace(/\s+/g, " ").slice(0, 220)}`;
      if (raw.includes("insufficient_balance") || raw.includes("insufficient_quota")) {
        throw new Error(lastError);
      }
      if (response.status < 500 && response.status !== 429) break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
  }
  throw new Error(lastError);
}

async function main() {
  await loadLocalEnv();
  const base = process.env.RODIUMAI_BASE_URL?.replace(/\/$/, "") || "https://api.rodiumai.io/v1";
  const key = process.env.RODIUM_API_KEY?.trim() || process.env.RODIUMAI_API_KEY?.trim() || "";
  const model = process.env.RODIUMAI_IMAGE_MODEL_IMAGE_EDIT?.trim() || "google/gemini-3.1-flash-lite-image";
  if (!key) throw new Error("RODIUM_API_KEY_MISSING");
  const attached = await referenceDataUrl();
  console.log("attached_ref_bytes", Math.round((attached.length * 3) / 4));
  const photo = await generatePoster(base, key, model, attached);
  const sharp = (await import("sharp")).default;
  const web = await sharp(photo).resize(WIDTH, HEIGHT, { fit: "cover", position: "centre" }).webp({ quality: 82 }).toBuffer();
  const hero = await sharp(web).resize(480, 640, { fit: "cover" }).webp({ quality: 74 }).toBuffer();
  await mkdir(path.dirname(HERO), { recursive: true });
  await writeFile(OUT, web);
  await writeFile(HERO, hero);
  const { spawnSync } = await import("node:child_process");
  const overlay = spawnSync("python3", [path.join(ROOT, "scripts/overlay-burger-type.py")], { stdio: "inherit" });
  if (overlay.status !== 0) throw new Error("BURGER_TYPE_OVERLAY_FAILED");
  console.log(`wrote ${OUT} (${web.length} bytes) then filled CE WEEKEND badge`);
}

await main();
