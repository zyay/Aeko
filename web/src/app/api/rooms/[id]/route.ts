import { NextResponse } from "next/server";
import { requireEmail } from "@/lib/session";
import { readJson, titleSchema } from "@/lib/api-guard";
import { deleteRoom, updateRoomTitle } from "@/lib/store";
import { pushRoomEvent } from "@/lib/room-events";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { id } = await ctx.params;
  const parsed = await readJson(req, titleSchema);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;
  const ok = await updateRoomTitle(id, email, body.title);
  if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  pushRoomEvent(id, { type: "room.renamed", at: Date.now(), title: body.title.trim() });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { id } = await ctx.params;
  const ok = await deleteRoom(id, email);
  if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json({ ok: true });
}
