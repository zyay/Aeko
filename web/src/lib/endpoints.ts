export type EndpointTemplate = {
  id: string;
  provider: string;
  label: string;
  baseUrl: string;
  model: string;
  mode: "byok" | "server";
  note: string;
};

export type ProviderSpec = {
  id: string;
  name: string;
  baseUrl: string;
  mode: "byok" | "server";
  defaultModel: string;
  keyHint: string;
};

/** OpenAI-compatible roots. Cloudflare still needs the account id filled in. */
export const PROVIDERS: ProviderSpec[] = [
  { id: "openai", name: "OpenAI", baseUrl: "https://api.openai.com/v1", mode: "byok", defaultModel: "gpt-6-astra", keyHint: "sk-…" },
  { id: "anthropic", name: "Anthropic Claude", baseUrl: "https://api.anthropic.com/v1", mode: "byok", defaultModel: "claude-sonnet-4-5", keyHint: "sk-ant-…" },
  { id: "gemini", name: "Google Gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", mode: "byok", defaultModel: "gemini-2.5-pro", keyHint: "AIza…" },
  { id: "xai", name: "xAI Grok", baseUrl: "https://api.x.ai/v1", mode: "byok", defaultModel: "grok-4", keyHint: "xai-…" },
  { id: "deepseek", name: "DeepSeek", baseUrl: "https://api.deepseek.com/v1", mode: "byok", defaultModel: "deepseek-chat", keyHint: "sk-…" },
  { id: "mistral", name: "Mistral AI", baseUrl: "https://api.mistral.ai/v1", mode: "byok", defaultModel: "mistral-large-latest", keyHint: "…" },
  { id: "groq", name: "Groq", baseUrl: "https://api.groq.com/openai/v1", mode: "byok", defaultModel: "llama-3.3-70b-versatile", keyHint: "gsk_…" },
  { id: "openrouter", name: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", mode: "byok", defaultModel: "openai/gpt-6-astra", keyHint: "sk-or-…" },
  { id: "together", name: "Together AI", baseUrl: "https://api.together.xyz/v1", mode: "byok", defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo", keyHint: "…" },
  { id: "fireworks", name: "Fireworks AI", baseUrl: "https://api.fireworks.ai/inference/v1", mode: "byok", defaultModel: "accounts/fireworks/models/llama-v3p3-70b-instruct", keyHint: "fw_…" },
  { id: "cerebras", name: "Cerebras", baseUrl: "https://api.cerebras.ai/v1", mode: "byok", defaultModel: "llama-3.3-70b", keyHint: "csk-…" },
  { id: "perplexity", name: "Perplexity", baseUrl: "https://api.perplexity.ai", mode: "byok", defaultModel: "sonar-pro", keyHint: "pplx-…" },
  { id: "cohere", name: "Cohere", baseUrl: "https://api.cohere.ai/v1", mode: "byok", defaultModel: "command-a-03-2025", keyHint: "…" },
  { id: "replicate", name: "Replicate", baseUrl: "https://api.replicate.com/v1", mode: "byok", defaultModel: "openai/gpt-4o", keyHint: "r8_…" },
  { id: "huggingface", name: "Hugging Face", baseUrl: "https://api.huggingface.co/v1", mode: "byok", defaultModel: "meta-llama/Llama-3.3-70B-Instruct", keyHint: "hf_…" },
  { id: "cloudflare", name: "Cloudflare Workers AI", baseUrl: "https://api.cloudflare.com/client/v4/accounts/{id}/ai/v1", mode: "byok", defaultModel: "@cf/meta/llama-3.3-70b-instruct-fp8-fast", keyHint: "Account token" },
  { id: "nvidia", name: "NVIDIA NIM", baseUrl: "https://integrate.api.nvidia.com/v1", mode: "byok", defaultModel: "meta/llama-3.3-70b-instruct", keyHint: "nvapi-…" },
  { id: "sambanova", name: "SambaNova", baseUrl: "https://api.sambanova.ai/v1", mode: "byok", defaultModel: "Meta-Llama-3.3-70B-Instruct", keyHint: "…" },
  { id: "predictionguard", name: "PredictionGuard", baseUrl: "https://api.predictionguard.com/v1", mode: "byok", defaultModel: "Hermes-3-Llama-3.1-70B", keyHint: "…" },
  { id: "friendli", name: "FriendliAI", baseUrl: "https://api.friendli.ai/v1", mode: "byok", defaultModel: "meta-llama-3.3-70b-instruct", keyHint: "…" },
  { id: "lemonfox", name: "LemonFox", baseUrl: "https://api.lemonfox.ai/v1", mode: "byok", defaultModel: "llama-3.3-70b", keyHint: "…" },
  { id: "featherless", name: "Featherless AI", baseUrl: "https://api.featherless.ai/v1", mode: "byok", defaultModel: "meta-llama/Llama-3.3-70B-Instruct", keyHint: "rc_…" },
  { id: "novita", name: "Novita AI", baseUrl: "https://api.novita.ai/v1", mode: "byok", defaultModel: "meta-llama/llama-3.3-70b-instruct", keyHint: "…" },
  { id: "siliconflow", name: "SiliconFlow", baseUrl: "https://api.siliconflow.cn/v1", mode: "byok", defaultModel: "deepseek-ai/DeepSeek-V3", keyHint: "sk-…" },
  { id: "qwen", name: "Alibaba Qwen", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", mode: "byok", defaultModel: "qwen-plus", keyHint: "sk-…" },
  { id: "minimax", name: "MiniMax", baseUrl: "https://api.minimax.chat/v1", mode: "byok", defaultModel: "MiniMax-Text-01", keyHint: "…" },
  { id: "moonshot", name: "Moonshot Kimi", baseUrl: "https://api.moonshot.cn/v1", mode: "byok", defaultModel: "kimi-latest", keyHint: "sk-…" },
  { id: "vercel", name: "Vercel AI Gateway", baseUrl: "https://ai-gateway.vercel.sh/v1", mode: "byok", defaultModel: "openai/gpt-4o-mini", keyHint: "AI Gateway key" },
  { id: "ollama", name: "Ollama", baseUrl: "http://localhost:11434/v1", mode: "server", defaultModel: "llama3.3", keyHint: "Not used on this machine" },
  { id: "lmstudio", name: "LM Studio", baseUrl: "http://127.0.0.1:1234/v1", mode: "server", defaultModel: "local", keyHint: "Not used on this machine" },
  { id: "llamacpp", name: "llama.cpp", baseUrl: "http://127.0.0.1:8080/v1", mode: "server", defaultModel: "local", keyHint: "Not used on this machine" },
];

export const ENDPOINT_TEMPLATES: EndpointTemplate[] = PROVIDERS.map((provider) => ({
  id: provider.id,
  provider: provider.name,
  label: provider.name,
  baseUrl: provider.baseUrl,
  model: provider.defaultModel,
  mode: provider.mode,
  note: provider.mode === "server" ? "On this machine" : hostOf(provider.baseUrl),
}));

export function hostOf(baseUrl: string) {
  try {
    return new URL(baseUrl.replace("{id}", "account")).host;
  } catch {
    return baseUrl;
  }
}

export function isLoopback(baseUrl: string) {
  try {
    const host = new URL(baseUrl).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

/** Chat completions URL for an OpenAI-compatible root, including roots that do not end in /v1. */
export function completionsUrl(baseUrl: string) {
  const root = baseUrl.replace(/\/$/, "");
  if (isCompatRoot(root)) return `${root}/chat/completions`;
  try {
    if (new URL(root).hostname === "api.perplexity.ai") return `${root}/chat/completions`;
  } catch {
    /* typed URL */
  }
  return `${root}/v1/chat/completions`;
}

export function modelsUrl(baseUrl: string) {
  const root = baseUrl.replace(/\/$/, "");
  if (isCompatRoot(root)) return `${root}/models`;
  try {
    if (new URL(root).hostname === "api.perplexity.ai") return `${root}/models`;
  } catch {
    /* typed URL */
  }
  return `${root}/v1/models`;
}

function isCompatRoot(root: string) {
  return /\/v\d+(?:beta)?(?:\/openai)?$|\/openai$|\/compatible-mode\/v\d+$/.test(root);
}

export function authHeaders(baseUrl: string, apiKey: string) {
  const headers: Record<string, string> = {};
  const key = apiKey.trim();
  if (!key) return headers;
  headers.Authorization = `Bearer ${key}`;
  try {
    if (new URL(baseUrl).hostname === "api.anthropic.com") {
      headers["x-api-key"] = key;
      headers["anthropic-version"] = "2023-06-01";
    }
    if (new URL(baseUrl).hostname === "ai-gateway.vercel.sh") {
      headers["x-ai-gateway-api-key"] = key;
    }
  } catch {
    /* ignore */
  }
  return headers;
}

/** True when this base URL is one of the known providers. Loopback is allowed only in the browser. */
export function allowedProviderUrl(baseUrl: string, allowLoopback: boolean) {
  let url: URL;
  try {
    url = new URL(baseUrl.trim());
  } catch {
    return false;
  }
  if (url.username || url.password || url.search || url.hash) return false;
  if (isLoopback(baseUrl)) return allowLoopback && url.protocol === "http:";
  if (url.protocol !== "https:") return false;
  const path = url.pathname.replace(/\/$/, "");
  if (url.hostname === "api.cloudflare.com") {
    return /^\/client\/v4\/accounts\/[A-Za-z0-9_-]{8,64}\/ai\/v1$/.test(path);
  }
  return PROVIDERS.some((provider) => {
    if (provider.baseUrl.includes("{id}")) return false;
    try {
      const expected = new URL(provider.baseUrl);
      return expected.hostname === url.hostname && expected.pathname.replace(/\/$/, "") === path;
    } catch {
      return false;
    }
  });
}

const NON_CHAT = new Set(["embedding", "image", "video", "reranking", "speech", "transcription", "realtime", "evaluation"]);

export function modelIdsFrom(json: unknown) {
  if (!json || typeof json !== "object") return [];
  const record = json as { data?: unknown; models?: unknown };
  const list = Array.isArray(record.data) ? record.data : Array.isArray(record.models) ? record.models : [];
  const ids = list
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        const row = item as { id?: unknown; type?: unknown };
        if (typeof row.type === "string" && NON_CHAT.has(row.type)) return "";
        if (typeof row.id === "string") return row.id.trim();
      }
      return "";
    })
    .filter(Boolean);
  return [...new Set(ids)].slice(0, 400);
}
