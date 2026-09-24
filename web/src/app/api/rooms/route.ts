import { NextResponse } from "next/server";
import { requireEmail } from "@/lib/session";
import { readJson, roomCreateSchema } from "@/lib/api-guard";
import { rateLimit } from "@/lib/rate-limit";
import { addAudit, createRoom, roomsSummaryFor } from "@/lib/store";

export async function GET(req: Request) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  if (!(await rateLimit(`rooms:${email}`, 60))) return NextResponse.json({ error: "rate" }, { status: 429 });
  return NextResponse.json({ rooms: await roomsSummaryFor(email) });
}

export async function POST(req: Request) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  if (!(await rateLimit(`rooms-write:${email}`, 20))) return NextResponse.json({ error: "rate" }, { status: 429 });
  const parsed = await readJson(req, roomCreateSchema);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;
  const id = await createRoom(body.title, email, body.wrappedKey, body.wrapIv, body.peerPub, {
    kind: body.kind,
    visibility: body.visibility,
    topic: body.topic,
  });
  await addAudit(id, email, "room.create", body.title);
  return NextResponse.json({ id });
}
