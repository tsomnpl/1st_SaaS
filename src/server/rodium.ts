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

export function selectImageModel(
  brief: CreateBriefInput,
  finalPrompt: string,
  available: string[] = [],
  options: { hasStyleReference?: boolean } = {},
) {
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

  const editModel = env.RODIUMAI_IMAGE_MODEL_IMAGE_EDIT?.trim() || "google/gemini-3.1-flash-image";
  const preferred = (() => {
    if (brief.mainImageUrl || brief.logoUrl || options.hasStyleReference) {
      return editModel;
    }
    if (textHeavyFields >= 6) {
      return env.RODIUMAI_IMAGE_MODEL_TEXT_HEAVY?.trim() || "openai/gpt-image-2";
    }
    if (premiumKeywords.some((k) => promptText.includes(k))) {
      return env.RODIUMAI_IMAGE_MODEL_PREMIUM?.trim() || "openai/gpt-image-2";
    }
    return env.RODIUMAI_IMAGE_MODEL_FAST?.trim() || "openai/gpt-image-2";
  })();

  const allowed = getAllowedImageModels();
  const pool = (available.length ? available : [preferred])
    .filter(isLikelyImageModel)
    .filter((id) => (allowed.length ? allowed.includes(id) : true));

  if (options.hasStyleReference || brief.mainImageUrl || brief.logoUrl) {
    const visionPool = pool.filter(canConsumeReferenceBitmap);
    if (visionPool.includes(preferred)) return preferred;
    if (visionPool.includes(editModel)) return editModel;
    if (visionPool.length > 0) return visionPool[0];
    if (canConsumeReferenceBitmap(editModel) && allowed.length === 0 && available.length === 0) {
      return editModel;
    }
    throw new Error("RODIUM_NO_IMAGE_EDIT_MODEL");
  }

  if (pool.includes(preferred)) return preferred;
  if (pool.length > 0) return pool[0];
  if (isLikelyImageModel(preferred) && allowed.length === 0) return preferred;
  throw new Error("RODIUM_NO_IMAGE_MODEL");
}

export function canConsumeReferenceBitmap(modelId: string) {
  const id = modelId.toLowerCase();
  if (id.includes("gpt-image") || id.includes("dall-e") || id.includes("dalle")) return false;
  return (
    id.includes("gemini") ||
    id.includes("imagen") ||
    id.includes("flux") ||
    id.includes("banana") ||
    id.includes("seedream") ||
    id.includes("image-edit")
  );
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

export async function generateWithRodium(input: {
  prompt: string;
  brief: CreateBriefInput;
  styleReferenceDataUrl?: string;
}) {
  if (!env.RODIUMAI_API_KEY) {
    throw new Error("RODIUMAI_API_KEY_MISSING");
  }

  const available = await listRodiumImageModels();
  const imageModel = selectImageModel(input.brief, input.prompt, available, {
    hasStyleReference: Boolean(input.styleReferenceDataUrl),
  });
  const render = await renderImage({
    model: imageModel,
    prompt: input.prompt,
    brief: input.brief,
    styleReferenceDataUrl: input.styleReferenceDataUrl,
  });

  const totalTokens = render.usage?.total_tokens ?? 0;

  return {
    model: imageModel,
    imageModel,
    imageUrl: render.imageUrl,
    rawText: render.rawText,
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
  styleReferenceDataUrl?: string;
}) {
  const endpoint = `${env.RODIUMAI_BASE_URL}/images/generations`;
  const body: Record<string, unknown> = {
    model: params.model,
    prompt: params.prompt,
    n: 1,
    size: sizeForFormat(params.brief.format),
  };
  const clientReference = params.brief.mainImageUrl || params.brief.logoUrl;
  const styleReference = params.styleReferenceDataUrl;
  if (canConsumeReferenceBitmap(params.model)) {
    if (clientReference?.startsWith("data:image/")) {
      body.image = clientReference;
    } else if (styleReference?.startsWith("data:image/")) {
      body.image = styleReference;
    }
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
  return { imageUrl, rawText: JSON.stringify({ model: data.model }), usage: data.usage };
}

export function sizeForFormat(format: string) {
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

export async function reviewPosterQuality(input: {
  imageUrl: string;
  prompt: string;
  referenceImageUrl?: string;
}) {
  if (!env.RODIUMAI_API_KEY) return "";
  const model = env.RODIUMAI_TEXT_MODEL?.trim() || env.RODIUMAI_MODEL?.trim() || "google/gemini-3.5-flash";
  const content: Array<Record<string, unknown>> = [
    { type: "text", text: input.prompt },
    { type: "image_url", image_url: { url: input.imageUrl } },
  ];
  if (input.referenceImageUrl && input.referenceImageUrl.length < 900_000) {
    content.push({
      type: "image_url",
      image_url: { url: input.referenceImageUrl },
    });
  }
  try {
    const response = await fetch(`${env.RODIUMAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: rodiumHeaders(),
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content }],
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

export async function analyzeStyleReference(input: {
  imageUrl: string;
  domain: string;
  referenceId: string;
}) {
  if (!env.RODIUMAI_API_KEY || !input.imageUrl) return "";
  const model = env.RODIUMAI_TEXT_MODEL?.trim() || env.RODIUMAI_MODEL?.trim() || "google/gemini-3.5-flash";
  const prompt = [
    "You are FlyerMint's art director. Analyze this poster as a COMPOSITION MODEL.",
    `Domain: ${input.domain}. Reference id: ${input.referenceId}.`,
    "Describe STRUCTURE only. Never transcribe brand names, logos, phone numbers, or identifiable people.",
    "Return JSON only with keys:",
    "composition, layout, humanPlacement, humanRole, imageTreatment, typographyHierarchy,",
    "colorPalette (string[] of 2-4 descriptive swatches, not brand names), contrast, spacing,",
    "ctaPosition, mood, visualDensity, aspectRatio.",
  ].join(" ");
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
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: input.imageUrl } },
            ],
          },
        ],
        temperature: 0,
        max_tokens: 700,
      }),
    });
    if (!response.ok) return "";
    const data = (await response.json()) as RodiumResponse;
    return textFromChat(data).trim();
  } catch {
    return "";
  }
}
