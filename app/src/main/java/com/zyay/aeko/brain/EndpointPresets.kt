package com.zyay.aeko.brain

data class EndpointPreset(
    val label: String,
    val provider: String,
    val baseUrl: String,
    val model: String,
    val mode: String
)

val ENDPOINT_PRESETS = listOf(
    EndpointPreset("GPT-6 Astra", "OpenAI", "https://api.openai.com/v1", "gpt-6-astra", "byok"),
    EndpointPreset("GPT-5.6 Sol", "OpenAI", "https://api.openai.com/v1", "gpt-5.6-sol", "byok"),
    EndpointPreset("GPT-5.6 Terra", "OpenAI", "https://api.openai.com/v1", "gpt-5.6-terra", "byok"),
    EndpointPreset("GPT-5.6 Luna", "OpenAI", "https://api.openai.com/v1", "gpt-5.6-luna", "byok"),
    EndpointPreset("Astra via OpenRouter", "OpenRouter", "https://openrouter.ai/api/v1", "openai/gpt-6-astra", "byok"),
    EndpointPreset("Llama 3.3 70B", "Groq", "https://api.groq.com/openai/v1", "llama-3.3-70b-versatile", "byok"),
    EndpointPreset("Mistral Large", "Mistral", "https://api.mistral.ai/v1", "mistral-large-latest", "byok"),
    EndpointPreset("Ollama", "Ollama", "http://127.0.0.1:11434/v1", "llama3.3", "server"),
    EndpointPreset("LM Studio", "LM Studio", "http://127.0.0.1:1234/v1", "local", "server"),
    EndpointPreset("llama-server", "llama.cpp", "http://127.0.0.1:8080/v1", "local", "server")
)
