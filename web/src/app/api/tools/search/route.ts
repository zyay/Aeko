import { NextResponse } from "next/server";
import { requireEmail } from "@/lib/session";

export async function POST(req: Request) {
  if (!(await requireEmail(req))) return NextResponse.json({ error: "auth" }, { status: 401 });
  const body = (await req.json()) as { query?: string };
  const query = body.query?.trim().slice(0, 200);
  if (!query) return NextResponse.json({ error: "query" }, { status: 400 });
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "User-Agent": "Aeko/1.0" } });
  const html = await res.text();
  const titles = [...html.matchAll(/class="result__a"[^>]*>(.*?)<\/a>/gi)]
    .map((m) => m[1].replace(/<[^>]+>/g, "").trim())
    .filter(Boolean)
    .slice(0, 5);
  if (!titles.length) return NextResponse.json({ text: `No hits for "${query}"` });
  return NextResponse.json({ text: titles.map((t, i) => `${i + 1}. ${t}`).join("\n") });
}
