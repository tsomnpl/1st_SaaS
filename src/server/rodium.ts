import type { CreateBriefInput } from "@/lib/flyermint";
import { env, getAllowedImageModels, getRodiumApiKey } from "@/lib/env";

type RodiumResponse = {
  id?: string;
  model?: string;
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string; image_url?: { url?: string } }>;
      images?: Array<{ image_url?: { url?: string }; url?: string }>;
    };
  }>;
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
  const fastModel = env.RODIUMAI_IMAGE_MODEL_FAST?.trim() || "google/gemini-3.1-flash-lite-image";
  const referenceCopyModels = [
    env.RODIUMAI_IMAGE_MODEL_REFERENCE_COPY?.trim(),
    "google/gemini-3-pro-image",
    "google/gemini-3-pro-image-preview",
    "google/gemini-3.1-flash-image",
    editModel,
  ].filter((id): id is string => Boolean(id));
  const preferred = (() => {
    if (options.hasStyleReference) return referenceCopyModels[0];
    if (brief.mainImageUrl || brief.logoUrl) {
      return editModel;
    }
    if (textHeavyFields >= 6) {
      return env.RODIUMAI_IMAGE_MODEL_TEXT_HEAVY?.trim() || fastModel;
    }
    if (premiumKeywords.some((k) => promptText.includes(k))) {
      return env.RODIUMAI_IMAGE_MODEL_PREMIUM?.trim() || fastModel;
    }
    return fastModel;
  })();

  const allowed = getAllowedImageModels();
  const pool = (available.length ? available : [preferred])
    .filter(isLikelyImageModel)
    .filter((id) => (allowed.length ? allowed.includes(id) : true));

  if (options.hasStyleReference || brief.mainImageUrl || brief.logoUrl) {
    const visionPool = pool.filter(canConsumeReferenceBitmap);
    if (options.hasStyleReference) {
      const copyModel = referenceCopyModels.find(
        (id) => canConsumeReferenceBitmap(id) && (available.length === 0 ? allowed.length === 0 || allowed.includes(id) : visionPool.includes(id)),
      );
      if (copyModel) return copyModel;
      const nonLite = visionPool.find((id) => !id.toLowerCase().includes("lite"));
      if (nonLite) return nonLite;
    }
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
  if (!getRodiumApiKey()) return [];
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
  const key = getRodiumApiKey();
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
  if (!getRodiumApiKey()) {
    throw new Error("RODIUMAI_API_KEY_MISSING");
  }

  const disponible = rodiumDisponible(await getRodiumWallet().catch(() => null));
  if (disponible !== null && disponible < 1) {
    throw new Error("RODIUM_INSUFFICIENT_BALANCE");
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
    bitmapAttached: render.bitmapAttached,
    attachmentsSent: render.attachmentsSent,
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

function isProvidedQuotaError(text: string) {
  return (
    text.includes("insufficient_balance") ||
    text.includes("insufficient_quota") ||
    text.includes("provided")
  );
}

export type ImageAttachment = { role: "reference" | "photo" | "logo"; url: string };

const ATTACHMENT_LABELS: Record<ImageAttachment["role"], string> = {
  reference: "IMAGE — REFERENCE POSTER: the poster to copy (layout, fonts, boxes, colors, background, people poses).",
  photo: "IMAGE — CLIENT PHOTO: put this exact person/product in place of the main subject of the reference.",
  logo: "IMAGE — CLIENT LOGO: place this exact logo in the logo spot of the reference, small and sharp. Do not redraw it.",
};

export function collectImageAttachments(brief: CreateBriefInput, styleReferenceDataUrl?: string): ImageAttachment[] {
  const list: ImageAttachment[] = [];
  if (styleReferenceDataUrl?.startsWith("data:image/")) list.push({ role: "reference", url: styleReferenceDataUrl });
  if (brief.mainImageUrl && /^(data:image\/|https:\/\/)/.test(brief.mainImageUrl)) list.push({ role: "photo", url: brief.mainImageUrl });
  if (brief.logoUrl && /^(data:image\/|https:\/\/)/.test(brief.logoUrl)) list.push({ role: "logo", url: brief.logoUrl });
  return list;
}

export function geminiImageRequestBody(model: string, prompt: string, attachments: ImageAttachment[]) {
  const content: Array<Record<string, unknown>> = [{ type: "text", text: prompt }];
  for (const attachment of attachments) {
    content.push({ type: "text", text: ATTACHMENT_LABELS[attachment.role] });
    content.push({ type: "image_url", image_url: { url: attachment.url } });
  }
  return {
    model,
    messages: [{ role: "user", content }],
    temperature: attachments.some((item) => item.role === "reference") ? 0.2 : 0.4,
  };
}

async function postGeminiImage(model: string, prompt: string, attachments: ImageAttachment[]): Promise<{
  imageUrl: string;
  rawText: string;
  usage: RodiumResponse["usage"];
  bitmapAttached: boolean;
  attachmentsSent: ImageAttachment["role"][];
}> {
  const response = await fetch(`${env.RODIUMAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: rodiumHeaders(),
    body: JSON.stringify(geminiImageRequestBody(model, prompt, attachments)),
  });
  const raw = await response.text();
  // No silent retry without the images: a text-only poster would ignore the reference.
  if (!response.ok) throwRodiumHttpError(response.status, raw);
  const data = JSON.parse(raw) as RodiumResponse;
  const imageUrl = extractGeneratedImageUrl(data);
  if (!imageUrl) throw new Error("RODIUM_INVALID_IMAGE_RESPONSE");
  const attachmentsSent = attachments.map((item) => item.role);
  return {
    imageUrl,
    rawText: JSON.stringify({ model: data.model, attachments: attachmentsSent }),
    usage: data.usage,
    bitmapAttached: attachmentsSent.includes("reference"),
    attachmentsSent,
  };
}

function extractGeneratedImageUrl(data: RodiumResponse) {
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

async function renderImage(params: {
  model: string;
  prompt: string;
  brief: CreateBriefInput;
  styleReferenceDataUrl?: string;
}) {
  const attachments = collectImageAttachments(params.brief, params.styleReferenceDataUrl);

  if (canConsumeReferenceBitmap(params.model) || params.model.toLowerCase().includes("gemini")) {
    return postGeminiImage(params.model, params.prompt, attachments);
  }
  if (attachments.length > 0) throw new Error("RODIUM_NO_IMAGE_EDIT_MODEL");

  const endpoint = `${env.RODIUMAI_BASE_URL}/images/generations`;
  const body: Record<string, unknown> = {
    model: params.model,
    prompt: params.prompt,
    n: 1,
    size: sizeForFormat(params.brief.format),
  };
  const response = await fetch(endpoint, {
    method: "POST",
    headers: rodiumHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const raw = await response.text();
    if (response.status === 402 || isProvidedQuotaError(raw)) {
      const fallback = env.RODIUMAI_IMAGE_MODEL_IMAGE_EDIT?.trim() || "google/gemini-3.1-flash-image";
      return postGeminiImage(fallback, params.prompt, []);
    }
    throwRodiumHttpError(response.status, raw);
  }
  const data = (await response.json()) as RodiumResponse;
  const imageUrl = extractGeneratedImageUrl(data);
  if (!imageUrl) throw new Error("RODIUM_INVALID_IMAGE_RESPONSE");
  return {
    imageUrl,
    rawText: JSON.stringify({ model: data.model }),
    usage: data.usage,
    bitmapAttached: false,
    attachmentsSent: [] as ImageAttachment["role"][],
  };
}

function throwRodiumHttpError(status: number, raw: string): never {
  if (status === 402 || isProvidedQuotaError(raw)) {
    throw new Error("RODIUM_INSUFFICIENT_BALANCE");
  }
  throw new Error(`RODIUM_IMAGES_FAILED_${status}`);
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

/** Spendable RODI = balance − reserved; reserved credits cannot pay for a new image. */
export function rodiumDisponible(wallet: Record<string, unknown> | null | undefined) {
  if (!wallet) return null;
  const balance = Number(wallet.balance_rodi ?? wallet.balance ?? NaN);
  const reserved = Number(wallet.reserved_rodi ?? wallet.reserved ?? 0);
  if (!Number.isFinite(balance)) return null;
  return Math.max(0, balance - (Number.isFinite(reserved) ? reserved : 0));
}

export async function getRodiumWallet() {
  if (!getRodiumApiKey()) return null;
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
  if (!getRodiumApiKey()) return "";
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
        max_tokens: 3000,
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
  if (!getRodiumApiKey() || !input.imageUrl) return "";
  const model = env.RODIUMAI_TEXT_MODEL?.trim() || env.RODIUMAI_MODEL?.trim() || "google/gemini-3.5-flash";
  const prompt = [
    "You are FlyerMint's art director. Analyze this poster as a COMPOSITION MODEL.",
    `Domain: ${input.domain}. Reference id: ${input.referenceId}.`,
    "Describe STRUCTURE only. Never transcribe brand names, logos, phone numbers, or identifiable people.",
    "Return JSON only with keys:",
    "background, composition, layout, humanPlacement, subjectScale, textPosition, titleHierarchy,",
    "humanRole, imageTreatment, typographyHierarchy, colorPalette (string[] of 2-4 descriptive swatches, not brand names),",
    "contrast, spacing, whiteSpace, margins, safeZone, ctaPosition, pricePosition, mood, visualDensity, aspectRatio.",
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
        max_tokens: 2500,
      }),
    });
    if (!response.ok) return "";
    const data = (await response.json()) as RodiumResponse;
    return textFromChat(data).trim();
  } catch {
    return "";
  }
}
