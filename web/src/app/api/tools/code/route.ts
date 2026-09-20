import { NextResponse } from "next/server";
import { requireEmail } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  if (!rateLimit(`code:${email}`, 10)) return NextResponse.json({ error: "rate" }, { status: 429 });

  const body = (await req.json()) as { code?: string };
  const code = body.code?.trim().slice(0, 4000);
  if (!code) return NextResponse.json({ error: "code" }, { status: 400 });
  if (/process|require|import|fetch|eval|Function|globalThis|window|document/i.test(code)) {
    return NextResponse.json({ text: "Blocked: unsafe identifiers in snippet." });
  }

  try {
    const fn = new Function(`"use strict"; return (() => { ${code} })();`);
    const out = fn();
    const text = out === undefined ? "(no return value)" : typeof out === "string" ? out : JSON.stringify(out, null, 2);
    return NextResponse.json({ text: String(text).slice(0, 8000) });
  } catch (e) {
    return NextResponse.json({ text: `Error: ${String(e)}` });
  }
}
