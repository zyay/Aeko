export async function webSearch(query: string) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query.slice(0, 180))}`;
  const res = await fetch(url);
  const html = await res.text();
  const titles = [...html.matchAll(/class="result__a"[^>]*>(.*?)<\/a>/gi)].map((m) => m[1].replace(/<[^>]+>/g, "").trim()).filter(Boolean).slice(0, 5);
  if (!titles.length) return `web_search:\nNo hits (or CORS blocked) for "${query}"`;
  return `web_search:\n` + titles.map((t, i) => `${i + 1}. ${t}`).join("\n");
}

export async function httpFetch(url: string) {
  if (!url.startsWith("https://")) return "http_fetch:\nBlocked URL";
  const res = await fetch(url);
  const text = (await res.text()).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000);
  return `http_fetch:\n${text || "Empty page."}`;
}
