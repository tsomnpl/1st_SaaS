import type { CreateBriefInput } from "@/lib/flyermint";
import { env, getAllowedImageModels } from "@/lib/env";

type RodiumResponse = {
  id?: string;
  model?: string;
  choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string; image_url?: { url?: string } }> } }>;
  data?: Array<{ url?: string; b64_json?: string }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

type RodiumModel = { id?: string; name?: string };

const IMAGE_MODEL_HINTS = [
  "image",
  "dall-e",
  "dalle",
  "gpt-image",
  "flux",
  "sdxl",
  "stable-diffusion",
  "imagen",
  "banana",
  "seedream",
];

const TEXT_ONLY_HINTS = [
  "whisper",
  "tts",
  "embedding",
  "embed",
  "moderation",
  "audio",
  "video",
  "transcri",
];

export function isLikelyImageModel(modelId: string) {
  const id = modelId.toLowerCase();
  if (TEXT_ONLY_HINTS.some((hint) => id.includes(hint))) return false;
  return IMAGE_MODEL_HINTS.some((hint) => id.includes(hint));
}

export function selectImageModel(brief: CreateBriefInput, finalPrompt: string, available: string[] = []) {
  const premiumKeywords = ["premium", "lux", "luxe", "haut de gamme", "editorial"];
  const promptText = `${brief.style ?? ""} ${brief.mood ?? ""} ${brief.objective} ${finalPrompt}`.toLowerCase();
  const textHeavyFields = [
    brief.title,
    brief.subtitle,
    brief.description,
    brief.price,
    brief.date,
    brief.location,
    brief.contactPhone,
    brief.whatsapp,
    brief.cta,
  ].filter(Boolean).length;

  const preferred = (() => {
    if (brief.mainImageUrl || brief.logoUrl) {
      return env.RODIUMAI_IMAGE_MODEL_IMAGE_EDIT?.trim() || "google/gemini-3.1-flash-image";
    }
    if (textHeavyFields >= 6) {
      return env.RODIUMAI_IMAGE_MODEL_TEXT_HEAVY?.trim() || "openai/gpt-image-2";
    }
    if (premiumKeywords.some((k) => promptText.includes(k))) {
      return env.RODIUMAI_IMAGE_MODEL_PREMIUM?.trim() || "openai/gpt-image-2";
    }
    return env.RODIUMAI_IMAGE_MODEL_FAST?.trim() || "openai/gpt-image-1-mini";
  })();

  const allowed = getAllowedImageModels();
  const pool = (available.length ? available : [preferred])
    .filter(isLikelyImageModel)
    .filter((id) => (allowed.length ? allowed.includes(id) : true));

  if (pool.includes(preferred)) return preferred;
  if (pool.length > 0) return pool[0];
  if (isLikelyImageModel(preferred) && allowed.length === 0) return preferred;
  throw new Error("RODIUM_NO_IMAGE_MODEL");
}

export async function listRodiumImageModels() {
  if (!env.RODIUMAI_API_KEY) return [];
  try {
    const response = await fetch(`${env.RODIUMAI_BASE_URL}/models`, {
      headers: rodiumHeaders(),
      cache: "no-store",
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { data?: RodiumModel[] } | RodiumModel[];
    const rows = Array.isArray(payload) ? payload : payload.data ?? [];
    return rows
      .map((row) => String(row.id ?? row.name ?? ""))
      .filter(Boolean)
      .filter(isLikelyImageModel);
  } catch {
    return [];
  }
}

function rodiumHeaders() {
  const key = env.RODIUMAI_API_KEY ?? "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
    "x-api-key": key,
  };
}

export async function generateWithRodium(input: { prompt: string; brief: CreateBriefInput }) {
  if (!env.RODIUMAI_API_KEY) {
    throw new Error("RODIUMAI_API_KEY_MISSING");
  }

  const available = await listRodiumImageModels();
  const imageModel = selectImageModel(input.brief, input.prompt, available);
  const render = await renderImage({
    model: imageModel,
    prompt: input.prompt,
    brief: input.brief,
  });

  const totalTokens = render.usage?.total_tokens ?? 0;

  return {
    model: imageModel,
    imageModel,
    imageUrl: render.imageUrl,
    rawText: render.rawText,
    visualRefSent: render.visualRefSent,
    usage: {
      text: null,
      render: render.usage ?? null,
      totalTokens,
    },
    rodiCostEstimate: estimateRodiCost(imageModel, totalTokens),
  };
}

export function estimateRodiCost(model: string, totalTokens: number) {
  const perThousandTokens = model.toLowerCase().includes("gpt") ? 3.5 : 4.2;
  return Number(((totalTokens / 1000) * perThousandTokens).toFixed(3));
}

async function renderImage(params: {
  model: string;
  prompt: string;
  brief: CreateBriefInput;
}) {
  const endpoint = `${env.RODIUMAI_BASE_URL}/images/generations`;
  const body: Record<string, unknown> = {
    model: params.model,
    prompt: params.prompt,
    n: 1,
    size: sizeForFormat(params.brief.format),
  };
  const reference = params.brief.mainImageUrl || params.brief.logoUrl;
  const acceptsBitmap = !params.model.toLowerCase().includes("gpt-image");
  let visualRefSent = false;
  if (reference?.startsWith("data:image/") && acceptsBitmap) {
    body.image = reference;
    visualRefSent = true;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: rodiumHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`RODIUM_IMAGES_FAILED_${response.status}`);
  }
  const data = (await response.json()) as RodiumResponse;
  const first = data.data?.[0];
  const imageUrl = first?.url
    ? first.url
    : first?.b64_json
      ? `data:image/png;base64,${first.b64_json}`
      : "";
  if (!imageUrl) throw new Error("RODIUM_INVALID_IMAGE_RESPONSE");
  return { imageUrl, rawText: JSON.stringify({ model: data.model, visualRefSent }), usage: data.usage, visualRefSent };
}

export function sizeForFormat(format: string) {
  // GPT Image 2 max portrait on Rodium is 1024x1536, not 4K.
  if (
    format.includes("story") ||
    format.includes("whatsapp") ||
    format.includes("9:16") ||
    format.includes("a3") ||
    format.includes("a4") ||
    format.includes("affiche")
  ) {
    return "1024x1536";
  }
  return "1024x1024";
}

export async function getRodiumWallet() {
  if (!env.RODIUMAI_API_KEY) return null;
  const response = await fetch(`${env.RODIUMAI_BASE_URL}/wallet`, {
    headers: rodiumHeaders(),
    cache: "no-store",
  });
  if (!response.ok) return null;
  return (await response.json()) as Record<string, unknown>;
}

function textFromChat(data: RodiumResponse) {
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((part) => part.text ?? "").join("\n");
  }
  return "";
}

export async function reviewPosterQuality(input: { imageUrl: string; prompt: string }) {
  if (!env.RODIUMAI_API_KEY) return "";
  const model = env.RODIUMAI_TEXT_MODEL?.trim() || env.RODIUMAI_MODEL?.trim() || "google/gemini-3.5-flash";
  try {
    const response = await fetch(`${env.RODIUMAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: rodiumHeaders(),
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: input.prompt },
              { type: "image_url", image_url: { url: input.imageUrl } },
            ],
          },
        ],
        temperature: 0,
        max_tokens: 500,
      }),
    });
    if (!response.ok) return "";
    const data = (await response.json()) as RodiumResponse;
    return textFromChat(data).trim();
  } catch {
    return "";
  }
}
