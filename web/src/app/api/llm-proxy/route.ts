import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "auth" }, { status: 401 });
  const enabled = process.env.AEKO_LLM_PROXY === "1" || process.env.LYAN_LLM_PROXY === "1";
  if (!enabled) return NextResponse.json({ error: "proxy off" }, { status: 403 });
  const body = (await req.json()) as { url?: string; headers?: Record<string, string>; payload?: unknown };
  if (!body.url || !body.url.includes("/v1/chat/completions")) {
    return NextResponse.json({ error: "url" }, { status: 400 });
  }
  const res = await fetch(body.url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(body.headers || {}) },
    body: JSON.stringify(body.payload),
  });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
}
