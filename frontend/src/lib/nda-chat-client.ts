import type { NdaChatRequest, NdaChatResponse } from "./chat-types";

const REQUEST_TIMEOUT_MS = 35_000;

export async function postNdaChatTurn(request: NdaChatRequest): Promise<NdaChatResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("/api/chat/nda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`NDA chat request failed with status ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}
