import { NextResponse } from "next/server";
import { requireEmail } from "@/lib/session";
import { addMember, membership } from "@/lib/store";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { id } = await ctx.params;
  if (!(await membership(id, email))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json()) as { email?: string; wrappedKey?: string; wrapIv?: string; peerPub?: string };
  if (!body.email || !body.wrappedKey || !body.wrapIv || !body.peerPub) {
    return NextResponse.json({ error: "fields" }, { status: 400 });
  }
  await addMember(id, body.email.trim().toLowerCase(), body.wrappedKey, body.wrapIv, body.peerPub);
  return NextResponse.json({ ok: true });
}
