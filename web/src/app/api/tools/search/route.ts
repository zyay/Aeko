import { NextResponse } from "next/server";
import { requireEmail } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { formatHits, parseDuckHtml, type SearchHit } from "@/lib/search-results";

export async function POST(req: Request) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  if (!rateLimit(`search:${email}`, 20)) return NextResponse.json({ error: "rate" }, { status: 429 });

  const body = (await req.json()) as { query?: string };
  const query = body.query?.trim().slice(0, 200);
  if (!query) return NextResponse.json({ error: "query" }, { status: 400 });

  const hits: SearchHit[] = [];
  const api = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const instant = await fetch(api, { headers: { "User-Agent": "Aeko/1.0" }, signal: AbortSignal.timeout(8000) }).catch(() => null);
  if (instant?.ok) {
    const json = (await instant.json()) as {
      AbstractText?: string;
      AbstractURL?: string;
      RelatedTopics?: { Text?: string; FirstURL?: string }[];
    };
    if (json.AbstractText && json.AbstractURL?.startsWith("https://")) {
      hits.push({ title: json.AbstractText.slice(0, 180), url: json.AbstractURL, snippet: json.AbstractText });
    }
    for (const topic of json.RelatedTopics ?? []) {
      if (topic.Text && topic.FirstURL?.startsWith("https://")) {
        hits.push({ title: topic.Text.slice(0, 180), url: topic.FirstURL, snippet: "" });
      }
    }
  }

  if (hits.length < 3) {
    const html = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": "Aeko/1.0" },
      signal: AbortSignal.timeout(8000),
    })
      .then((r) => (r.ok ? r.text() : ""))
      .catch(() => "");
    for (const hit of parseDuckHtml(html)) {
      if (!hits.some((h) => h.url === hit.url)) hits.push(hit);
    }
  }

  const text = formatHits(hits.slice(0, 5));
  return NextResponse.json({ text: text || `No public hits for "${query}"` });
}
