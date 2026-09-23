export type SearchHit = { title: string; url: string; snippet: string };

function decodeHref(raw: string): string {
  const href = raw.replace(/&amp;/g, "&");
  try {
    const abs = href.startsWith("//") ? `https:${href}` : href;
    const url = new URL(abs, "https://duckduckgo.com");
    const uddg = url.searchParams.get("uddg");
    if (uddg) return uddg;
    if (url.protocol === "https:") return url.toString();
  } catch {
    return "";
  }
  return "";
}

export function parseDuckHtml(html: string): SearchHit[] {
  const hits: SearchHit[] = [];
  const anchors = [...html.matchAll(/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
  const snippets = [...html.matchAll(/class="result__snippet"[^>]*>([\s\S]*?)<\/(?:a|td|span)/gi)].map((m) =>
    m[1]!.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
  );
  anchors.forEach((m, i) => {
    const url = decodeHref(m[1]!);
    const title = m[2]!.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (!title || !url.startsWith("https://")) return;
    hits.push({ title, url, snippet: snippets[i] ?? "" });
  });
  return hits.slice(0, 5);
}

export function formatHits(hits: SearchHit[]): string {
  if (!hits.length) return "";
  return hits
    .map((h, i) => `${i + 1}. ${h.title}\n${h.url}${h.snippet ? `\n${h.snippet}` : ""}`)
    .join("\n\n");
}
