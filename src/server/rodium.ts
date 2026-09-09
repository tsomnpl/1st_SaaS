import { env } from "@/lib/env";

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

export async function generateWithRodium(prompt: string) {
  if (!env.RODIUMAI_API_KEY) {
    throw new Error("RODIUMAI_API_KEY_MISSING");
  }

  const endpoint = `${env.RODIUMAI_BASE_URL}/chat/completions`;
  const model = env.RODIUMAI_MODEL;
  const messages: RodiumMessage[] = [
    {
      role: "system",
      content:
        "You are FlyerMint creative engine. Generate professional, readable, conversion-focused ad visual instructions and output JSON.",
    },
    { role: "user", content: prompt },
  ];

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.RODIUMAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.5,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`RODIUM_REQUEST_FAILED_${response.status}`);
  }

  const data = (await response.json()) as RodiumResponse;
  const content = data.choices?.[0]?.message?.content ?? "{}";
  const totalTokens = data.usage?.total_tokens ?? 0;
  const rodiCostEstimate = estimateRodiCost(model, totalTokens);

  return {
    model: data.model ?? model,
    rawText: content,
    usage: data.usage ?? null,
    rodiCostEstimate,
  };
}

export function estimateRodiCost(model: string, totalTokens: number) {
  // Placeholder configurable estimation aligned with target 10-20 RODI/generation.
  const perThousandTokens = model.toLowerCase().includes("gpt") ? 3.5 : 4.2;
  return Number(((totalTokens / 1000) * perThousandTokens).toFixed(3));
}
