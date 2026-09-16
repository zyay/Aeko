import { consumeClaim } from "@/lib/store";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = (await req.json()) as { code?: string };
  if (!body.code) return NextResponse.json({ error: "code" }, { status: 400 });
  const row = await consumeClaim(body.code);
  if (!row) return NextResponse.json({ error: "expired" }, { status: 410 });
  return NextResponse.json(row);
}
