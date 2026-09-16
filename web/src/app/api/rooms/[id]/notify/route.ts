import { NextResponse } from "next/server";
import { requireEmail } from "@/lib/session";
import { getRoom, membership, pushForRoom } from "@/lib/store";
import { sendRoomPushes } from "@/lib/push";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { id } = await ctx.params;
  if (!(await membership(id, email))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const room = await getRoom(id);
  const title = room?.title || "task";
  const payload = { title: `New activity in ${title}` };
  const subs = (await pushForRoom(id, email));
  await sendRoomPushes(subs, payload);
  return NextResponse.json({ ok: true, title: payload.title });
}
