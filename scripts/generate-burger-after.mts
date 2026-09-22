/**
 * One-off: generate the pinned Avant/Après burger poster.
 * Photo from Rodium, exact French type overlaid — do not regenerate the catalogue.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "public/creations/restauration-burger.webp");
const HERO = path.join(ROOT, "public/creations/hero/restauration-burger.webp");
const WIDTH = 896;
const HEIGHT = 1200;

const PHOTO_PROMPT = [
  "Vertical advertising photograph 3:4, restaurant campaign, NO TEXT anywhere.",
  "Zero letters, zero numbers, zero logos, zero watermarks, no captions.",
  "Photoreal West or Central African chef in a black chef jacket and black headband,",
  "standing slightly right of center, holding a tall gourmet burger on a small wooden board toward the camera.",
  "Natural skin, real pores, correct five-finger hands, no plastic AI face.",
  "LEFT FOREGROUND: a large red chili pepper, out of focus, shallow depth of field, framing the chef.",
  "Warm kitchen tungsten light, dark moody background, light steam.",
  "Leave a clean dark empty band at the top and a clean dark empty band at the bottom for later typography.",
  "Do not copy a real restaurant identity.",
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

async function generatePhoto(base: string, key: string, model: string) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
    "x-api-key": key,
  };
  let lastError = "RODIUM_CHAT_IMAGE_FAILED";
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: [{ type: "text", text: PHOTO_PROMPT }] }],
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

function typeOverlay() {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="topFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.78"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="280" fill="url(#topFade)"/>
  <rect y="900" width="${WIDTH}" height="300" fill="url(#bottomFade)"/>
  <text x="448" y="92" text-anchor="middle" fill="#FFFFFF" font-family="Inter, Noto Sans, Arial" font-size="58" font-weight="800" letter-spacing="2">MENU DU SOIR</text>
  <text x="448" y="148" text-anchor="middle" fill="#F8FAFC" font-family="Inter, Noto Sans, Arial" font-size="28" font-weight="500">Burger + boisson</text>
  <text x="448" y="1028" text-anchor="middle" fill="#FFFFFF" font-family="Inter, Noto Sans, Arial" font-size="48" font-weight="800">5 000 FCFA</text>
  <rect x="324" y="1058" width="248" height="52" rx="26" fill="#FFFFFF"/>
  <text x="448" y="1093" text-anchor="middle" fill="#0F172A" font-family="Inter, Noto Sans, Arial" font-size="22" font-weight="700">Commander</text>
  <text x="848" y="1172" text-anchor="end" fill="#E2E8F0" font-family="Inter, Noto Sans, Arial" font-size="13" font-weight="600" letter-spacing="1.4">FLYERMINT</text>
</svg>`);
}

async function main() {
  await loadLocalEnv();
  const base = process.env.RODIUMAI_BASE_URL?.replace(/\/$/, "") || "https://api.rodiumai.io/v1";
  const key = process.env.RODIUM_API_KEY?.trim() || process.env.RODIUMAI_API_KEY?.trim() || "";
  const model = process.env.RODIUMAI_IMAGE_MODEL_FAST?.trim() || "google/gemini-3.1-flash-lite-image";
  if (!key) throw new Error("RODIUM_API_KEY_MISSING");

  const photo = await generatePhoto(base, key, model);
  const sharp = (await import("sharp")).default;
  const composed = await sharp(photo)
    .resize(WIDTH, HEIGHT, { fit: "cover", position: "center" })
    .composite([{ input: typeOverlay(), top: 0, left: 0 }])
    .webp({ quality: 80 })
    .toBuffer();
  const hero = await sharp(composed).resize(480, 640, { fit: "cover" }).webp({ quality: 72 }).toBuffer();
  await mkdir(path.dirname(HERO), { recursive: true });
  await writeFile(OUT, composed);
  await writeFile(HERO, hero);
  const { spawnSync } = await import("node:child_process");
  const overlay = spawnSync("python3", [path.join(ROOT, "scripts/overlay-burger-type.py")], { stdio: "inherit" });
  if (overlay.status !== 0) throw new Error("BURGER_TYPE_OVERLAY_FAILED");
  console.log(`wrote ${OUT} (${composed.length} bytes) then overlaid exact French type`);
}

await main();
