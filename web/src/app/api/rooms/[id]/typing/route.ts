import { NextResponse } from "next/server";
import { requireEmail } from "@/lib/session";
import { readJson, typingSchema } from "@/lib/api-guard";
import { membership } from "@/lib/store";
import { activeTypers, setTyping } from "@/lib/room-events";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { id } = await ctx.params;
  if (!(await membership(id, email))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json({ typing: activeTypers(id, email) });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { id } = await ctx.params;
  if (!(await membership(id, email))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const parsed = await readJson(req, typingSchema);
  if ("error" in parsed) return parsed.error;
  setTyping(id, email, Boolean(parsed.data.active));
  return NextResponse.json({ ok: true });
}
