import { NextResponse } from "next/server";
import { hookSchema, readJson } from "@/lib/api-guard";
import { addAudit } from "@/lib/store";

export async function POST(req: Request) {
  const secret = process.env.AEKO_WORKFLOW_SECRET;
  if (!secret || req.headers.get("x-aeko-secret") !== secret) {
    return NextResponse.json({ error: "auth" }, { status: 401 });
  }
  const parsed = await readJson(req, hookSchema);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;
  await addAudit(body.roomId, "webhook", "workflow.hook", body.name);
  return NextResponse.json({ ok: true });
}
