import { auth } from "@/auth";
import { getLearnProfile, upsertLearnProfile } from "@/lib/learn-db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ mode: "local" });
  }
  const snapshot = await getLearnProfile(session.user.email);
  if (!snapshot) return NextResponse.json({ mode: "local", synced: false });
  return NextResponse.json({ mode: "remote", snapshot, synced: true });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "auth", mode: "local" }, { status: 401 });
  }
  const body = (await req.json()) as { snapshot?: unknown };
  if (!body.snapshot || typeof body.snapshot !== "object") {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const ok = await upsertLearnProfile(session.user.email, body.snapshot as Parameters<typeof upsertLearnProfile>[1]);
  return NextResponse.json({ synced: ok });
}
