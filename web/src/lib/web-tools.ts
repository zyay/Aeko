export async function webSearch(query: string) {
  const res = await fetch("/api/tools/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: query.slice(0, 180) }),
  });
  if (!res.ok) throw new Error(`search ${res.status}`);
  const json = (await res.json()) as { text: string };
  return `web_search:\n${json.text}`;
}

export async function httpFetch(url: string) {
  const res = await fetch("/api/tools/fetch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const json = (await res.json()) as { text: string };
  return `http_fetch:\n${json.text}`;
}

export function readVault(vault?: string, name?: string) {
  if (!vault?.trim()) return "file_read:\n(no vault attached)";
  const head = name ? `# ${name}\n` : "";
  return `file_read:\n${head}${vault.slice(0, 8000)}`;
}

export async function runCodeSnippet(code: string) {
  const res = await fetch("/api/tools/code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: code.slice(0, 4000) }),
  });
  if (!res.ok) throw new Error(`code ${res.status}`);
  const json = (await res.json()) as { text: string };
  return `code_run:\n${json.text}`;
}
