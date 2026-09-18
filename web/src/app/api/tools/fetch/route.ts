import { NextResponse } from "next/server";
import { requireEmail } from "@/lib/session";

function allowed(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && !u.hostname.match(/localhost|127\.0\.0\.1|0\.0\.0\.0/);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!(await requireEmail(req))) return NextResponse.json({ error: "auth" }, { status: 401 });
  const body = (await req.json()) as { url?: string };
  const url = body.url?.trim();
  if (!url || !allowed(url)) return NextResponse.json({ error: "url" }, { status: 400 });
  const res = await fetch(url, { headers: { "User-Agent": "Aeko/1.0" } });
  const raw = await res.text();
  const text = raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);
  return NextResponse.json({ text: text || "Empty page." });
}
