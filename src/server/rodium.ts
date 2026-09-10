import type { CreateBriefInput } from "@/lib/flyermint";
import { env, getAllowedImageModels } from "@/lib/env";

type RodiumMessage = { role: "system" | "user"; content: string };

type RodiumResponse = {
  id?: string;
  model?: string;
  choices?: Array<{ message?: { content?: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

type RodiumGenerationInput = {
  prompt: string;
  brief: CreateBriefInput;
};

export async function generateWithRodium(input: RodiumGenerationInput) {
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
          "You are FlyerMint strategy engine. Convert user brief to a compact, high-quality visual generation plan and output JSON with keys: finalPrompt, qualityChecks, complexityHint.",
      },
      { role: "user", content: input.prompt },
    ],
  });

  const parsedReasoning = safeJsonParse(reasoning.content);
  const finalPrompt =
    (parsedReasoning?.finalPrompt as string | undefined)?.trim() || input.prompt;
  const chosenImageModel = selectImageModel(input.brief, finalPrompt);
  const imageModel = resolveAllowedImageModel(chosenImageModel);

  const render = await callRodiumChat({
    model: imageModel,
    messages: [
      {
        role: "system",
        content:
          "You are FlyerMint rendering engine. Output JSON with imageUrl, alt, renderNotes, and preservedFields. Keep business text readable and faithful to the brief.",
      },
      { role: "user", content: finalPrompt },
    ],
  });

  const totalTokens =
    (reasoning.usage?.total_tokens ?? 0) + (render.usage?.total_tokens ?? 0);
  const rodiCostEstimate = estimateRodiCost(imageModel, totalTokens);

  return {
    model: `${textModel} -> ${imageModel}`,
    rawText: render.content,
    usage: {
      text: reasoning.usage ?? null,
      render: render.usage ?? null,
      totalTokens,
    },
    rodiCostEstimate,
  };
}

export function estimateRodiCost(model: string, totalTokens: number) {
  // Placeholder configurable estimation aligned with target 10-20 RODI/generation.
  const perThousandTokens = model.toLowerCase().includes("gpt") ? 3.5 : 4.2;
  return Number(((totalTokens / 1000) * perThousandTokens).toFixed(3));
}

async function callRodiumChat(params: {
  model: string;
  messages: RodiumMessage[];
}) {
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
      temperature: 0.5,
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

function selectImageModel(brief: CreateBriefInput, finalPrompt: string) {
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
}

function resolveAllowedImageModel(preferred: string) {
  const allowed = getAllowedImageModels();
  if (allowed.length === 0) return preferred;
  if (allowed.includes(preferred)) return preferred;
  return allowed[0];
}

function safeJsonParse(value: string): Record<string, unknown> | null {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}
