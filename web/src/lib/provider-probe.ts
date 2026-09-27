import { allowedProviderUrl, authHeaders, completionsUrl, isLoopback, modelIdsFrom, modelsUrl } from "@/lib/endpoints";

export type ProbeResult = {
  ok: boolean;
  models: string[];
  detail: string;
};

const PUBLIC_CATALOG = new Set(["ai-gateway.vercel.sh"]);

export async function probeProvider(baseUrl: string, apiKey: string, model?: string, loopback = false): Promise<ProbeResult> {
  const root = baseUrl.trim();
  const key = apiKey.trim();
  if (root.includes("{id}")) {
    return { ok: false, models: [], detail: "Replace {id} with your Cloudflare account id, then check the key again." };
  }
  if (!allowedProviderUrl(root, loopback)) {
    return { ok: false, models: [], detail: "That address is not one of the providers Aeko can check." };
  }
  if (!key && !isLoopback(root)) {
    return { ok: false, models: [], detail: "Paste the API key first." };
  }

  const host = (() => {
    try {
      return new URL(root).hostname;
    } catch {
      return "";
    }
  })();
  const publicCatalog = PUBLIC_CATALOG.has(host);

  const listed = await fetch(modelsUrl(root), {
    method: "GET",
    headers: publicCatalog ? {} : authHeaders(root, key),
    redirect: "manual",
    signal: AbortSignal.timeout(publicCatalog ? 20000 : 8000),
  }).catch(() => null);

  if (!listed) return { ok: false, models: [], detail: "Could not reach that provider." };
  if (listed.status >= 300 && listed.status < 400) {
    return { ok: false, models: [], detail: "The provider tried to redirect. The check was stopped." };
  }
  if (listed.status === 401 || listed.status === 403) {
    return { ok: false, models: [], detail: "That key was rejected." };
  }
  if (!listed.ok) {
    return { ok: false, models: [], detail: `The provider answered ${listed.status}. The key was not accepted.` };
  }

  const models = modelIdsFrom(await listed.json().catch(() => null));
  if (publicCatalog && key) {
    const pingModel = model && models.includes(model) ? model : models.find((id) => id === "openai/gpt-4o-mini") || models[0] || "";
    const ping = await pingKey(root, key, pingModel);
    if (!ping.ok) {
      return { ok: false, models, detail: models.length ? `${ping.detail} The public model list is still shown.` : ping.detail };
    }
  }

  if (!models.length) {
    return { ok: true, models: [], detail: "The key was accepted. This provider returned no model list. Type a model id." };
  }
  return { ok: true, models, detail: `Key works. ${models.length} model${models.length === 1 ? "" : "s"}.` };
}

async function pingKey(baseUrl: string, apiKey: string, model: string): Promise<{ ok: boolean; detail: string }> {
  if (!model) return { ok: false, detail: "That key was rejected." };
  const res = await fetch(completionsUrl(baseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(baseUrl, apiKey) },
    body: JSON.stringify({ model, messages: [{ role: "user", content: "hi" }], max_tokens: 16, stream: false }),
    redirect: "manual",
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  if (!res) return { ok: false, detail: "Could not reach that provider." };
  if (res.status === 401 || res.status === 403) return { ok: false, detail: "That key was rejected." };
  if (res.status >= 300 && res.status < 400) return { ok: false, detail: "The provider tried to redirect. The check was stopped." };
  if (!res.ok) return { ok: true, detail: "The key was accepted. Pick a model from the list." };
  return { ok: true, detail: "" };
}
