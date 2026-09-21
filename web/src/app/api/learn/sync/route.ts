import { auth } from "@/auth";
import { getLearnProfile, upsertLearnProfile } from "@/lib/learn-db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "auth" }, { status: 401 });
  }
  const body = (await req.json()) as { snapshot?: unknown; strategy?: "merge" | "replace" };
  if (!body.snapshot || typeof body.snapshot !== "object") {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const incoming = body.snapshot as Parameters<typeof upsertLearnProfile>[1];
  if (body.strategy === "merge") {
    const remote = await getLearnProfile(session.user.email);
    if (remote) {
      incoming.activity = { ...remote.activity, ...incoming.activity };
      if (!incoming.profile) incoming.profile = remote.profile;
      if (!incoming.vocabulary.length) incoming.vocabulary = remote.vocabulary;
    }
  }
  const ok = await upsertLearnProfile(session.user.email, incoming);
  return NextResponse.json({ synced: ok });
}
