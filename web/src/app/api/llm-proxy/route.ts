import { auth } from "@/auth";
import { NextResponse } from "next/server";

function proxyAllowed(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (!url.pathname.includes("/v1/chat/completions") && !raw.includes("/v1/chat/completions")) return false;
  const host = url.hostname.toLowerCase();
  if (host === "127.0.0.1" || host === "localhost" || host === "::1") return true;
  const extra = (process.env.AEKO_LLM_PROXY_ALLOW || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return extra.includes(host);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "auth" }, { status: 401 });
  const enabled = process.env.AEKO_LLM_PROXY === "1" || process.env.LYAN_LLM_PROXY === "1";
  if (!enabled || process.env.VERCEL_ENV === "production") return NextResponse.json({ error: "proxy off" }, { status: 403 });

  const body = (await req.json()) as { url?: string; headers?: Record<string, string>; payload?: unknown };
  if (!body.url || !proxyAllowed(body.url)) {
    return NextResponse.json({ error: "url not allowed" }, { status: 400 });
  }
  const res = await fetch(body.url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(body.headers || {}) },
    body: JSON.stringify(body.payload),
  });
  return new NextResponse(res.body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
