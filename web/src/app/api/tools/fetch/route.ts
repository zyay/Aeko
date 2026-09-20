import { NextResponse } from "next/server";
import { requireEmail } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

const ALLOW = new Set(["github.com", "developer.mozilla.org", "npmjs.com", "vercel.com", "getaeko.com"]);

function allowed(url: string) {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    if (u.hostname.match(/localhost|127\.0\.0\.1|0\.0\.0\.0|10\.|192\.168\./)) return false;
    return ALLOW.has(u.hostname) || u.hostname.endsWith(".github.io");
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  if (!rateLimit(`fetch:${email}`, 15)) return NextResponse.json({ error: "rate" }, { status: 429 });

  const body = (await req.json()) as { url?: string };
  const url = body.url?.trim();
  if (!url || !allowed(url)) return NextResponse.json({ error: "url" }, { status: 400 });
  const res = await fetch(url, { headers: { "User-Agent": "Aeko/1.0" }, redirect: "follow" });
  const raw = await res.text();
  const text = raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 16_000);
  return NextResponse.json({ text: text || "Empty page." });
}
