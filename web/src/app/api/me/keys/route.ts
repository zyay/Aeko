import { NextResponse } from "next/server";
import { requireEmail } from "@/lib/session";
import { publicKeySchema, readJson } from "@/lib/api-guard";
import { getUser, upsertUser } from "@/lib/store";

export async function GET(req: Request) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  return NextResponse.json({ email, publicKey: (await getUser(email))?.publicKey ?? null });
}

export async function PUT(req: Request) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  const parsed = await readJson(req, publicKeySchema);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;
  await upsertUser(email, body.publicKey);
  return NextResponse.json({ ok: true });
}
