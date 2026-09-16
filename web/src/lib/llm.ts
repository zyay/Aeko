export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

function completionsUrl(baseUrl: string) {
  const root = baseUrl.replace(/\/$/, "");
  return root.endsWith("/v1") ? `${root}/chat/completions` : `${root}/v1/chat/completions`;
}

export async function chatComplete(opts: {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
}): Promise<string> {
  let acc = "";
  await streamChat({ ...opts, onDelta: (d) => (acc += d) });
  return acc.trim() || "(empty)";
}

export async function streamChat(opts: {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  onDelta: (chunk: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const res = await fetch(completionsUrl(opts.baseUrl), {
    method: "POST",
    signal: opts.signal,
    headers: {
      "Content-Type": "application/json",
      ...(opts.apiKey ? { Authorization: `Bearer ${opts.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: opts.model || "gpt-4o-mini",
      messages: opts.messages,
      temperature: 0.4,
      stream: true,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM ${res.status}: ${text.slice(0, 240)}`);
  }
  if (!res.body) throw new Error("empty stream");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n");
    buffer = parts.pop() || "";
    for (const line of parts) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const json = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
        const piece = json.choices?.[0]?.delta?.content || "";
        if (piece) {
          full += piece;
          opts.onDelta(piece);
        }
      } catch {
        /* keep scanning */
      }
    }
  }
  return full.trim() || "(empty)";
}

export async function testBrain(baseUrl: string, apiKey: string, model: string) {
  const reply = await chatComplete({
    baseUrl,
    apiKey,
    model,
    messages: [{ role: "user", content: "Reply with the single word: pong" }],
  });
  return reply.toLowerCase().includes("pong") || reply.length > 0;
}
