import { consumeClaim } from "@/lib/store";
import { NextResponse } from "next/server";
import { rateLimit, requestIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!rateLimit(`claim:${requestIp(req)}`, 5)) {
    return NextResponse.json({ error: "Too many claim attempts. Wait a minute." }, { status: 429 });
  }
  const body = (await req.json()) as { code?: string };
  if (!body.code) return NextResponse.json({ error: "code" }, { status: 400 });
  const row = await consumeClaim(body.code);
  if (!row) return NextResponse.json({ error: "expired" }, { status: 410 });
  return NextResponse.json(row);
}
