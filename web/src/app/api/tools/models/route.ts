import { NextResponse } from "next/server";
import { providerProbeSchema, readJson } from "@/lib/api-guard";
import { isLoopback } from "@/lib/endpoints";
import { probeProvider } from "@/lib/provider-probe";
import { rateLimit } from "@/lib/rate-limit";
import { requireEmail } from "@/lib/session";

export async function POST(req: Request) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "Sign in before checking a key." }, { status: 401 });
  if (!(await rateLimit(`models:${email}`, 15))) {
    return NextResponse.json({ error: "Too many key checks. Wait a minute and try again." }, { status: 429 });
  }

  const parsed = await readJson(req, providerProbeSchema, 4_000);
  if ("error" in parsed) return parsed.error;
  const { baseUrl, apiKey = "", model } = parsed.data;
  if (isLoopback(baseUrl)) {
    return NextResponse.json({ error: "A local model is checked in this browser." }, { status: 400 });
  }
  if (/[\r\n]/.test(apiKey)) {
    return NextResponse.json({ error: "That key is not usable." }, { status: 400 });
  }

  const result = await probeProvider(baseUrl, apiKey, model, false);
  return NextResponse.json({ ok: result.ok, models: result.models, detail: result.detail });
}
