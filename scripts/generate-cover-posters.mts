import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { designLawsBlock } from "../src/lib/design-rules.ts";
import { buildShowcasePrompt } from "../src/lib/showcase-design.ts";
import { SHOWCASE_SHEETS } from "../src/lib/showcase-sheets.ts";

const IDS = ["evenementiel-03", "mode-02", "sport-finance-01"] as const;
const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "public/creations");
const MODEL = process.env.RODIUMAI_IMAGE_MODEL_PREMIUM?.trim() || "openai/gpt-image-2";
const BASE = process.env.RODIUMAI_BASE_URL?.trim() || "https://api.rodiumai.io/v1";

function headers(apiKey: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "x-api-key": apiKey,
  };
}

async function main() {
  const apiKey = process.env.RODIUMAI_API_KEY?.trim() || "";
  if (!apiKey) throw new Error("RODIUMAI_API_KEY_MISSING");
  const laws = designLawsBlock();
  await mkdir(OUT, { recursive: true });

  for (const id of IDS) {
    const sheet = SHOWCASE_SHEETS.find((row) => row.id === id);
    if (!sheet) throw new Error(`MISSING_${id}`);
    const prompt = buildShowcasePrompt(sheet, false);
    if (!prompt.includes(laws)) throw new Error(`LAWS_MISSING_${id}`);
    console.log("gen", id, MODEL);
    const response = await fetch(`${BASE}/images/generations`, {
      method: "POST",
      headers: headers(apiKey),
      body: JSON.stringify({
        model: MODEL,
        prompt,
        n: 1,
        size: "1024x1536",
      }),
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
    if (!url) throw new Error(`EMPTY_${id}`);
    const buffer = url.startsWith("data:")
      ? Buffer.from(url.split(",")[1] ?? "", "base64")
      : Buffer.from(await (await fetch(url)).arrayBuffer());
    const sharp = (await import("sharp")).default;
    const web = await sharp(buffer).rotate().resize({ width: 896, height: 1200, fit: "cover" }).webp({ quality: 82 }).toBuffer();
    const file = path.join(OUT, `cover-${id}.webp`);
    await writeFile(file, web);
    const meta = await sharp(web).metadata();
    console.log("ok", id, meta.width, meta.height, Math.round(web.length / 1024), "Ko", "tokens", data.usage?.total_tokens ?? 0, "model", data.model ?? MODEL);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
