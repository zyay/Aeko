import { NextResponse } from "next/server";
import { requireEmail } from "@/lib/session";
import { listWorkflows, saveWorkflow } from "@/lib/store";

export async function GET(req: Request) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  return NextResponse.json({ workflows: await listWorkflows(email) });
}

export async function POST(req: Request) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  const body = (await req.json()) as { id?: string; name?: string; yaml?: string; enabled?: boolean };
  if (!body.name || !body.yaml) return NextResponse.json({ error: "fields" }, { status: 400 });
  const row = await saveWorkflow(email, { id: body.id, name: body.name, yaml: body.yaml, enabled: body.enabled !== false });
  return NextResponse.json(row);
}
