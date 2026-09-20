import { NextResponse } from "next/server";
import { requireEmail } from "@/lib/session";
import { addMember, membership } from "@/lib/store";
import { pushRoomEvent } from "@/lib/room-events";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { id } = await ctx.params;
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
