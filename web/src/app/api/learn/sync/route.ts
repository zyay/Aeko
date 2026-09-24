import { auth } from "@/auth";
import { getLearnProfile, upsertLearnProfile } from "@/lib/learn-db";
import { learnSnapshotSchema, readJson } from "@/lib/api-guard";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "auth" }, { status: 401 });
  }
  const parsed = await readJson(req, learnSnapshotSchema, 400_000);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;
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
