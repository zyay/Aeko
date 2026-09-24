export const QUALITY_MODEL = "gpt-6-astra";

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
};

export type ToolCallResult = { id: string; name: string; arguments: string };

export type StreamOpts = {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  onDelta: (chunk: string) => void;
  signal?: AbortSignal;
  useProxy?: boolean;
  tools?: { type: "function"; function: { name: string; description: string; parameters: object } }[];
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

async function readSseStream(res: Response, onDelta: (chunk: string) => void): Promise<{ text: string; toolCalls: ToolCallResult[] }> {
  if (!res.body) throw new Error("empty stream");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  const calls = new Map<number, ToolCallResult>();
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
        const json = JSON.parse(data) as {
          choices?: { delta?: { content?: string; tool_calls?: { index?: number; id?: string; function?: { name?: string; arguments?: string } }[] } }[];
        };
        const delta = json.choices?.[0]?.delta;
        const piece = delta?.content || "";
        if (piece) {
          full += piece;
          onDelta(piece);
        }
        for (const call of delta?.tool_calls ?? []) {
          const index = call.index ?? 0;
          const current = calls.get(index) ?? { id: "", name: "", arguments: "" };
          if (call.id) current.id = call.id;
          if (call.function?.name) current.name += call.function.name;
          if (call.function?.arguments) current.arguments += call.function.arguments;
          calls.set(index, current);
        }
      } catch {
        /* keep scanning */
      }
    }
  }
  return { text: full.trim(), toolCalls: [...calls.values()].filter((call) => call.name) };
}

export async function chatComplete(opts: Omit<StreamOpts, "onDelta" | "signal">): Promise<string> {
  let acc = "";
  const turn = await streamChat({ ...opts, onDelta: (d) => (acc += d) });
  return turn.text.trim() || acc.trim() || "(empty)";
}

export async function streamChat(opts: StreamOpts): Promise<{ text: string; toolCalls: ToolCallResult[] }> {
  const url = completionsUrl(opts.baseUrl);
  const payload: Record<string, unknown> = {
    model: opts.model || QUALITY_MODEL,
    messages: opts.messages,
    temperature: 0.4,
    stream: true,
  };
  if (opts.tools?.length) payload.tools = opts.tools;

  const send = async (body: Record<string, unknown>) => {
    if (opts.useProxy) {
      const res = await fetch("/api/llm-proxy", {
        method: "POST",
        signal: opts.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          headers: opts.apiKey ? { Authorization: `Bearer ${opts.apiKey}` } : {},
          payload: body,
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
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`LLM ${res.status}: ${text.slice(0, 240)}`);
    }
    return readSseStream(res, opts.onDelta);
  };

  try {
    return await send(payload);
  } catch (error) {
    if (!opts.tools?.length) throw error;
    const message = String(error);
    if (!/400|404|422|tools/i.test(message)) throw error;
    const retry = { ...payload };
    delete retry.tools;
    return send(retry);
  }
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
