import { lookup } from "node:dns/promises";
import { NextResponse } from "next/server";
import { requireEmail } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { isPrivateAddress, isPublicHttpsUrl } from "@/lib/public-url";

async function resolvesPublic(url: string) {
  if (!isPublicHttpsUrl(url)) return false;
  const host = new URL(url).hostname;
  const records = await lookup(host, { all: true, verbatim: true }).catch(() => []);
  if (!records.length) return false;
  return records.every((row) => !isPrivateAddress(row.address));
}

async function readPublic(start: string) {
  let current = start;
  for (let hop = 0; hop < 3; hop++) {
    if (!(await resolvesPublic(current))) return null;
    const res = await fetch(current, {
      redirect: "manual",
      headers: { "User-Agent": "Aeko/1.0", Accept: "text/html,text/plain,application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status >= 300 && res.status < 400) {
      const next = res.headers.get("location");
      if (!next) return null;
      current = new URL(next, current).toString();
      continue;
    }
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!/text\/|application\/json|application\/xml/.test(type)) return "Unsupported page type.";
    const raw = (await res.text()).slice(0, 200_000);
    return raw
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 12_000);
  }
  return null;
}

export async function POST(req: Request) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  if (!rateLimit(`fetch:${email}`, 15)) return NextResponse.json({ error: "rate" }, { status: 429 });

  const body = (await req.json()) as { url?: string };
  const url = body.url?.trim();
  if (!url || !isPublicHttpsUrl(url)) return NextResponse.json({ error: "url" }, { status: 400 });
  const text = await readPublic(url).catch(() => null);
  return NextResponse.json({ text: text || "Could not read that page." });
}
