import type { CreateBriefInput } from "@/lib/flyermint";
import { env, getAllowedImageModels } from "@/lib/env";

type RodiumMessage =
  | { role: "system" | "user"; content: string }
  | {
      role: "user";
      content: Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
    };

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
      return env.RODIUMAI_IMAGE_MODEL_IMAGE_EDIT?.trim() || "openai/gpt-image-2";
    }
    if (textHeavyFields >= 6) {
      return env.RODIUMAI_IMAGE_MODEL_TEXT_HEAVY?.trim() || "google/gemini-3-pro-image";
    }
    if (premiumKeywords.some((k) => promptText.includes(k))) {
      return env.RODIUMAI_IMAGE_MODEL_PREMIUM?.trim() || "google/gemini-3-pro-image";
    }
    return env.RODIUMAI_IMAGE_MODEL_FAST?.trim() || "google/gemini-3.1-flash-image";
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
      headers: { Authorization: `Bearer ${env.RODIUMAI_API_KEY}` },
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

export async function generateWithRodium(input: { prompt: string; brief: CreateBriefInput }) {
  if (!env.RODIUMAI_API_KEY) {
    throw new Error("RODIUMAI_API_KEY_MISSING");
  }

  const textModel = env.RODIUMAI_TEXT_MODEL?.trim() || env.RODIUMAI_MODEL;
  const reasoning = await callRodiumChat({
    model: textModel,
    messages: [
      {
        role: "system",
        content:
          "You are FlyerMint art director. Convert the brief into a compact image-generation prompt. Output JSON keys: finalPrompt, qualityChecks, complexityHint. Preserve every business text exactly (title, price, date, phone, CTA).",
      },
      { role: "user", content: input.prompt },
    ],
  });

  const parsedReasoning = safeJsonParse(asText(reasoning.content));
  const finalPrompt =
    (parsedReasoning?.finalPrompt as string | undefined)?.trim() || input.prompt;

  const available = await listRodiumImageModels();
  const imageModel = selectImageModel(input.brief, finalPrompt, available);
  const render = await renderImage({
    model: imageModel,
    prompt: finalPrompt,
    brief: input.brief,
  });

  const totalTokens =
    (reasoning.usage?.total_tokens ?? 0) + (render.usage?.total_tokens ?? 0);

  return {
    model: `${textModel} -> ${imageModel}`,
    imageModel,
    imageUrl: render.imageUrl,
    rawText: render.rawText,
    usage: {
      text: reasoning.usage ?? null,
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
  const imagesEndpointError = await tryImagesEndpoint(params).catch((error) => error);
  if (imagesEndpointError && !(imagesEndpointError instanceof Error)) {
    return imagesEndpointError;
  }

  const userContent: RodiumMessage = params.brief.mainImageUrl
    ? {
        role: "user",
        content: [
          { type: "text", text: params.prompt },
          { type: "image_url", image_url: { url: params.brief.mainImageUrl } },
        ],
      }
    : { role: "user", content: params.prompt };

  const chat = await callRodiumChat({
    model: params.model,
    messages: [
      {
        role: "system",
        content:
          "You generate a professional poster. Return JSON with imageUrl or b64_json. Keep all business text readable and exact. If a user product/photo is provided, keep it as the main subject.",
      },
      userContent,
    ],
  });

  const parsed = safeJsonParse(asText(chat.content));
  const imageUrl =
    extractImageUrl(parsed, chat.content, undefined) ||
    (typeof parsed?.b64_json === "string" ? `data:image/png;base64,${parsed.b64_json}` : "");

  if (!imageUrl) {
    throw new Error("RODIUM_INVALID_IMAGE_RESPONSE");
  }

  return {
    imageUrl,
    rawText: asText(chat.content),
    usage: chat.usage,
  };
}

async function tryImagesEndpoint(params: { model: string; prompt: string; brief: CreateBriefInput }) {
  const endpoint = `${env.RODIUMAI_BASE_URL}/images/generations`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.RODIUMAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: params.model,
      prompt: params.prompt,
      size: sizeForFormat(params.brief.format),
    }),
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
  return { imageUrl, rawText: JSON.stringify(data), usage: data.usage };
}

async function callRodiumChat(params: { model: string; messages: RodiumMessage[] }) {
  const endpoint = `${env.RODIUMAI_BASE_URL}/chat/completions`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.RODIUMAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      temperature: 0.4,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`RODIUM_REQUEST_FAILED_${response.status}_${params.model}`);
  }

  const data = (await response.json()) as RodiumResponse;
  return {
    content: data.choices?.[0]?.message?.content ?? "{}",
    usage: data.usage,
    model: data.model ?? params.model,
  };
}

function sizeForFormat(format: string) {
  if (format.includes("story") || format.includes("9:16")) return "1024x1792";
  if (format.includes("a3") || format.includes("a4")) return "1024x1792";
  return "1024x1024";
}

function asText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) return String(part.text ?? "");
        return "";
      })
      .join("\n");
  }
  return String(content ?? "{}");
}

function extractImageUrl(
  parsed: Record<string, unknown> | null,
  content: unknown,
  fallback?: string,
) {
  const fromParsed = String(parsed?.imageUrl ?? parsed?.url ?? parsed?.image_url ?? "");
  if (fromParsed.startsWith("http") || fromParsed.startsWith("data:image/")) return fromParsed;
  if (typeof content === "string" && content.startsWith("data:image/")) return content;
  if (Array.isArray(content)) {
    for (const part of content) {
      const url = part && typeof part === "object" ? part.image_url?.url : undefined;
      if (url) return url;
    }
  }
  return fallback ?? "";
}

function safeJsonParse(value: string): Record<string, unknown> | null {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}
