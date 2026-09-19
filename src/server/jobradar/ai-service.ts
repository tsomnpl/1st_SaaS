import { env } from "@/lib/env";
import {
  assertJobRadarRodiumEnabled,
  JOBRADAR_RODIUM_DISABLED_CODE,
} from "@/server/jobradar/rodium-guard";

type RodiumMessage = { role: "system" | "user" | "assistant"; content: string };

type RodiumChatResponse = {
  id?: string;
  model?: string;
  choices?: Array<{ message?: { content?: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

export { JOBRADAR_RODIUM_DISABLED_CODE };

/**
 * Unique Rodium entrypoint for JobRadar.
 * FlyerMint generation must keep using `@/server/rodium`.
 * This function never reaches the network while JOBRADAR_RODIUMAI_ENABLED is off.
 */
export async function callJobRadarRodiumChat(params: {
  model: string;
  messages: RodiumMessage[];
  maxTokens?: number;
}) {
  assertJobRadarRodiumEnabled();

  if (!env.RODIUMAI_API_KEY) {
    throw new Error("RODIUMAI_API_KEY_MISSING");
  }

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
      ...(params.maxTokens ? { max_tokens: params.maxTokens } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`RODIUM_REQUEST_FAILED_${response.status}_${params.model}`);
  }

  const data = (await response.json()) as RodiumChatResponse;
  return {
    content: data.choices?.[0]?.message?.content ?? "",
    usage: data.usage,
    model: data.model ?? params.model,
  };
}
