import { NextResponse } from "next/server";
import { requireEmail } from "@/lib/session";
import { addAudit, addReaction, membership } from "@/lib/store";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { id } = await ctx.params;
  if (!(await membership(id, email))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json()) as { messageId?: string; emoji?: string };
  if (!body.messageId || !body.emoji) return NextResponse.json({ error: "fields" }, { status: 400 });
  const emoji = body.emoji.slice(0, 8);
  await addReaction(body.messageId, email, emoji);
  await addAudit(id, email, "reaction", `${body.messageId}:${emoji}`);
  return NextResponse.json({ ok: true });
}
