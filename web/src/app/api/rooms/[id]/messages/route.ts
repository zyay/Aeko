import { NextResponse } from "next/server";
import { requireEmail } from "@/lib/session";
import { addAudit, addMessage, enabledWorkflows, membership, membersOf, messagesOf, reactionsFor } from "@/lib/store";
import { pushRoomEvent } from "@/lib/room-events";
import { messageSchema, readJson } from "@/lib/api-guard";
import { rateLimit } from "@/lib/rate-limit";

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
    reactions: await reactionsFor(id),
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { id } = await ctx.params;
  if (!(await membership(id, email))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!(await rateLimit(`msg:${email}`, 120))) return NextResponse.json({ error: "rate" }, { status: 429 });
  const parsed = await readJson(req, messageSchema, 200_000);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;
  const msg = await addMessage({ roomId: id, from: email, iv: body.iv, ciphertext: body.ciphertext, parentId: body.parentId });
  await addAudit(id, email, "message.send", body.ciphertext);
  const flows = (await enabledWorkflows()).filter((w) => w.yaml.includes("on: message") && w.yaml.includes(id));
  for (const flow of flows) await addAudit(id, email, "workflow.run", flow.name);
  pushRoomEvent(id, { type: "message.new", at: msg.createdAt, messageId: msg.id });
  return NextResponse.json({ ...msg, workflows: flows.map((f) => f.id) });
}
