import { NextResponse } from "next/server";
import { requireEmail } from "@/lib/session";
import { readJson, workflowSchema } from "@/lib/api-guard";
import { listWorkflows, saveWorkflow } from "@/lib/store";

export async function GET(req: Request) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  return NextResponse.json({ workflows: await listWorkflows(email) });
}

export async function POST(req: Request) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  const parsed = await readJson(req, workflowSchema, 30_000);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;
  const row = await saveWorkflow(email, { id: body.id, name: body.name, yaml: body.yaml, enabled: body.enabled !== false });
  return NextResponse.json(row);
}
