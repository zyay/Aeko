import { consumeClaim } from "@/lib/store";
import { NextResponse } from "next/server";
import { claimSchema, readJson } from "@/lib/api-guard";
import { rateLimit, requestIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!(await rateLimit(`claim:${requestIp(req)}`, 5))) {
    return NextResponse.json({ error: "Too many claim attempts. Wait a minute." }, { status: 429 });
  }
  const parsed = await readJson(req, claimSchema);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;
  const row = await consumeClaim(body.code);
  if (!row) return NextResponse.json({ error: "expired" }, { status: 410 });
  return NextResponse.json(row);
}
