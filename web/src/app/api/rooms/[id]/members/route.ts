import { NextResponse } from "next/server";
import { requireEmail } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { addMember, membership, removeMember } from "@/lib/store";
import { pushRoomEvent } from "@/lib/room-events";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { id } = await ctx.params;
  if (!rateLimit(`members:${email}`, 20)) return NextResponse.json({ error: "rate" }, { status: 429 });
  if (!(await membership(id, email))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json()) as { email?: string; wrappedKey?: string; wrapIv?: string; peerPub?: string };
  if (!body.email || !body.wrappedKey || !body.wrapIv || !body.peerPub) {
    return NextResponse.json({ error: "fields" }, { status: 400 });
  }
  const invited = body.email.trim().toLowerCase();
  await addMember(id, invited, body.wrappedKey, body.wrapIv, body.peerPub);
  pushRoomEvent(id, { type: "member.joined", at: Date.now(), email: invited });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  if (!rateLimit(`members-remove:${email}`, 20)) return NextResponse.json({ error: "rate" }, { status: 429 });
  const { id } = await ctx.params;
  if (!(await membership(id, email))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  let target = email;
  try {
    const body = (await req.json()) as { email?: string };
    if (body.email?.trim()) target = body.email.trim().toLowerCase();
  } catch {
    target = email;
  }
  const removed = await removeMember(id, target);
  if (!removed) return NextResponse.json({ error: "not a member" }, { status: 404 });
  pushRoomEvent(id, { type: "member.left", at: Date.now(), email: target });
  return NextResponse.json({ ok: true });
}
