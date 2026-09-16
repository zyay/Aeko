import { NextResponse } from "next/server";
import { requireEmail } from "@/lib/session";
import { addMessage, membership, membersOf, messagesOf } from "@/lib/store";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { id } = await ctx.params;
  const mine = await membership(id, email);
  if (!mine) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const people = await membersOf(id);
  return NextResponse.json({
    membership: mine,
    members: people.map((m) => ({ email: m.email, peerPub: m.peerPub })),
    messages: await messagesOf(id),
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { id } = await ctx.params;
  if (!(await membership(id, email))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json()) as { iv?: string; ciphertext?: string };
  if (!body.iv || !body.ciphertext) return NextResponse.json({ error: "fields" }, { status: 400 });
  const msg = await addMessage({ roomId: id, from: email, iv: body.iv, ciphertext: body.ciphertext });
  return NextResponse.json(msg);
}
