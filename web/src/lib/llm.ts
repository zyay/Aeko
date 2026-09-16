export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function chatComplete(opts: {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
}): Promise<string> {
  const root = opts.baseUrl.replace(/\/$/, "");
  const url = root.endsWith("/v1") ? `${root}/chat/completions` : `${root}/v1/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(opts.apiKey ? { Authorization: `Bearer ${opts.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: opts.model || "gpt-4o-mini",
      messages: opts.messages,
      temperature: 0.4,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM ${res.status}: ${text.slice(0, 240)}`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content?.trim() || "(empty)";
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
