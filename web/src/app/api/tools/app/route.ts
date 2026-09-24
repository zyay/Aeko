import { NextResponse } from "next/server";
import { accountFrom, appCallFailed, buildAppRequest, explainAppResponse } from "@/lib/connected-apps";
import { rateLimit } from "@/lib/rate-limit";
import { requireEmail } from "@/lib/session";

function stringArgs(value: unknown) {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (typeof item === "string") out[key] = item;
  }
  return out;
}

export async function POST(req: Request) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "Sign in before using a connected app." }, { status: 401 });
  if (!rateLimit(`app:${email}`, 20)) return NextResponse.json({ error: "Too many app calls. Wait a minute and try again." }, { status: 429 });

  let body: { app?: string; action?: string; args?: unknown; token?: string };
  try {
    body = (await req.json()) as { app?: string; action?: string; args?: unknown; token?: string };
  } catch {
    return NextResponse.json({ error: "The request was not valid JSON." }, { status: 400 });
  }

  const token = body.token?.trim() ?? "";
  if (!/^[A-Za-z0-9_\-.]{10,200}$/.test(token)) {
    return NextResponse.json({ error: "That token does not look usable. Paste it with no spaces." }, { status: 400 });
  }

  let built;
  try {
    built = buildAppRequest(body.app ?? "", body.action ?? "", stringArgs(body.args), token);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "That action is not available." }, { status: 400 });
  }

  const res = await fetch(built.url, {
    method: built.method,
    headers: built.headers,
    body: built.body,
    redirect: "manual",
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);

  if (!res) return NextResponse.json({ error: "Could not reach the app. Try again." }, { status: 502 });
  if (res.status >= 300 && res.status < 400) {
    return NextResponse.json({ error: "The app tried to redirect. That call was stopped." }, { status: 502 });
  }

  const raw = (await res.text()).slice(0, 200_000);
  const text = explainAppResponse(body.app ?? "", res.status, raw, token);
  if (appCallFailed(body.app ?? "", res.status, raw)) {
    return NextResponse.json({ error: text }, { status: 422 });
  }
  return NextResponse.json({ text, account: accountFrom(body.app ?? "", raw) });
}
