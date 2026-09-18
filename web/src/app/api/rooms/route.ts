import { NextResponse } from "next/server";
import { requireEmail } from "@/lib/session";
import { createRoom, roomsSummaryFor } from "@/lib/store";

export async function GET(req: Request) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  return NextResponse.json({ rooms: await roomsSummaryFor(email) });
}

export async function POST(req: Request) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  const body = (await req.json()) as { title?: string; wrappedKey?: string; wrapIv?: string; peerPub?: string };
  if (!body.title || !body.wrappedKey || !body.wrapIv || !body.peerPub) {
    return NextResponse.json({ error: "fields" }, { status: 400 });
  }
  const id = await createRoom(body.title, email, body.wrappedKey, body.wrapIv, body.peerPub);
  return NextResponse.json({ id });
}
