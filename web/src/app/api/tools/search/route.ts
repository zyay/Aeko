import { NextResponse } from "next/server";
import { requireEmail } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  if (!rateLimit(`search:${email}`, 20)) return NextResponse.json({ error: "rate" }, { status: 429 });

  const body = (await req.json()) as { query?: string };
  const query = body.query?.trim().slice(0, 200);
  if (!query) return NextResponse.json({ error: "query" }, { status: 400 });

  const api = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const res = await fetch(api, { headers: { "User-Agent": "Aeko/1.0" } });
  const json = (await res.json()) as {
    AbstractText?: string;
    AbstractURL?: string;
    RelatedTopics?: { Text?: string; FirstURL?: string }[];
  };

  const lines: string[] = [];
  if (json.AbstractText) lines.push(json.AbstractText, json.AbstractURL || "");
  for (const topic of json.RelatedTopics?.slice(0, 5) ?? []) {
    if (topic.Text) lines.push(`- ${topic.Text}${topic.FirstURL ? ` (${topic.FirstURL})` : ""}`);
  }

  if (!lines.length) {
    const html = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": "Aeko/1.0" },
    }).then((r) => r.text());
    const titles = [...html.matchAll(/class="result__a"[^>]*>(.*?)<\/a>/gi)]
      .map((m) => m[1].replace(/<[^>]+>/g, "").trim())
      .filter(Boolean)
      .slice(0, 5);
    if (titles.length) return NextResponse.json({ text: titles.map((t, i) => `${i + 1}. ${t}`).join("\n") });
    return NextResponse.json({ text: `No hits for "${query}"` });
  }

  return NextResponse.json({ text: lines.filter(Boolean).join("\n") });
}
