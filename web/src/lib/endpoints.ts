export type EndpointTemplate = {
  id: string;
  provider: string;
  label: string;
  baseUrl: string;
  model: string;
  mode: "byok" | "server";
  note: string;
};

export const ENDPOINT_TEMPLATES: EndpointTemplate[] = [
  { id: "openai-astra", provider: "OpenAI", label: "GPT-6 Astra", baseUrl: "https://api.openai.com/v1", model: "gpt-6-astra", mode: "byok", note: "Flagship" },
  { id: "openai-sol", provider: "OpenAI", label: "GPT-5.6 Sol", baseUrl: "https://api.openai.com/v1", model: "gpt-5.6-sol", mode: "byok", note: "Professional" },
  { id: "openai-terra", provider: "OpenAI", label: "GPT-5.6 Terra", baseUrl: "https://api.openai.com/v1", model: "gpt-5.6-terra", mode: "byok", note: "Balanced" },
  { id: "openai-luna", provider: "OpenAI", label: "GPT-5.6 Luna", baseUrl: "https://api.openai.com/v1", model: "gpt-5.6-luna", mode: "byok", note: "Fast" },
  { id: "router-astra", provider: "OpenRouter", label: "Astra via OpenRouter", baseUrl: "https://openrouter.ai/api/v1", model: "openai/gpt-6-astra", mode: "byok", note: "One key, many models" },
  { id: "router-sol", provider: "OpenRouter", label: "Sol via OpenRouter", baseUrl: "https://openrouter.ai/api/v1", model: "openai/gpt-5.6-sol", mode: "byok", note: "One key, many models" },
  { id: "router-terra", provider: "OpenRouter", label: "Terra via OpenRouter", baseUrl: "https://openrouter.ai/api/v1", model: "openai/gpt-5.6-terra", mode: "byok", note: "One key, many models" },
  { id: "groq-llama", provider: "Groq", label: "Llama 3.3 70B", baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile", mode: "byok", note: "Fast open model" },
  { id: "groq-instant", provider: "Groq", label: "Llama 3.1 8B", baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.1-8b-instant", mode: "byok", note: "Low latency" },
  { id: "mistral", provider: "Mistral", label: "Mistral Large", baseUrl: "https://api.mistral.ai/v1", model: "mistral-large-latest", mode: "byok", note: "Mistral API" },
  { id: "ollama", provider: "Ollama", label: "Ollama local", baseUrl: "http://127.0.0.1:11434/v1", model: "llama3.3", mode: "server", note: "On this machine" },
  { id: "lmstudio", provider: "LM Studio", label: "LM Studio", baseUrl: "http://127.0.0.1:1234/v1", model: "local", mode: "server", note: "On this machine" },
  { id: "llamacpp", provider: "llama.cpp", label: "llama-server", baseUrl: "http://127.0.0.1:8080/v1", model: "local", mode: "server", note: "On this machine" },
];
