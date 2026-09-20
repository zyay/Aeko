export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type StreamOpts = {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  onDelta: (chunk: string) => void;
  signal?: AbortSignal;
  useProxy?: boolean;
};

function completionsUrl(baseUrl: string) {
  const root = baseUrl.replace(/\/$/, "");
  return root.endsWith("/v1") ? `${root}/chat/completions` : `${root}/v1/chat/completions`;
}

export function shouldUseProxy(baseUrl: string, mode: string, proxyViaVercel: boolean) {
  if (proxyViaVercel || mode === "server") {
    try {
      const host = new URL(baseUrl).hostname.toLowerCase();
      if (host === "127.0.0.1" || host === "localhost" || host === "::1") return true;
    } catch {
      return false;
    }
  }
  return proxyViaVercel;
}

async function readSseStream(res: Response, onDelta: (chunk: string) => void) {
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
          onDelta(piece);
        }
      } catch {
        /* keep scanning */
      }
    }
  }
  return full.trim() || "(empty)";
}

export async function chatComplete(opts: Omit<StreamOpts, "onDelta" | "signal">): Promise<string> {
  let acc = "";
  await streamChat({ ...opts, onDelta: (d) => (acc += d) });
  return acc.trim() || "(empty)";
}

export async function streamChat(opts: StreamOpts): Promise<string> {
  const url = completionsUrl(opts.baseUrl);
  const payload = {
    model: opts.model || "gpt-4o-mini",
    messages: opts.messages,
    temperature: 0.4,
    stream: true,
  };

  if (opts.useProxy) {
    const res = await fetch("/api/llm-proxy", {
      method: "POST",
      signal: opts.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        headers: opts.apiKey ? { Authorization: `Bearer ${opts.apiKey}` } : {},
        payload,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`LLM proxy ${res.status}: ${text.slice(0, 240)}`);
    }
    return readSseStream(res, opts.onDelta);
  }

  const res = await fetch(url, {
    method: "POST",
    signal: opts.signal,
    headers: {
      "Content-Type": "application/json",
      ...(opts.apiKey ? { Authorization: `Bearer ${opts.apiKey}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM ${res.status}: ${text.slice(0, 240)}`);
  }
  return readSseStream(res, opts.onDelta);
}

export async function testBrain(baseUrl: string, apiKey: string, model: string, useProxy = false) {
  const reply = await chatComplete({
    baseUrl,
    apiKey,
    model,
    useProxy,
    messages: [{ role: "user", content: "Reply with the single word: pong" }],
  });
  return reply.toLowerCase().includes("pong");
}
