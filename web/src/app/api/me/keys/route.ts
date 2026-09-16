import { NextResponse } from "next/server";
import { requireEmail } from "@/lib/session";
import { getUser, upsertUser } from "@/lib/store";

export async function GET(req: Request) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  return NextResponse.json({ email, publicKey: getUser(email)?.publicKey ?? null });
}

export async function PUT(req: Request) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  const body = (await req.json()) as { publicKey?: string };
  if (!body.publicKey) return NextResponse.json({ error: "publicKey" }, { status: 400 });
  upsertUser(email, body.publicKey);
  return NextResponse.json({ ok: true });
}
