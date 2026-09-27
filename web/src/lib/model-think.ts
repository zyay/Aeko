export function modelThinks(model: string) {
  return /\b(o1|o3|o4|gpt-5|gpt-6|reason|thinking|deepseek-r|r1|sonar-reasoning|claude-3-7|claude-sonnet-4|claude-opus-4|gemini-2\.5|astra)\b/i.test(model);
}
