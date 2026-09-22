import { NextResponse } from "next/server";
import { addAudit } from "@/lib/store";

export async function POST(req: Request) {
  const secret = process.env.AEKO_WORKFLOW_SECRET;
  if (!secret || req.headers.get("x-aeko-secret") !== secret) {
    return NextResponse.json({ error: "auth" }, { status: 401 });
  }
  const body = (await req.json()) as { roomId?: string; name?: string };
  if (!body.roomId || !body.name) return NextResponse.json({ error: "fields" }, { status: 400 });
  await addAudit(body.roomId, "webhook", "workflow.hook", body.name);
  return NextResponse.json({ ok: true });
}
