import { NextResponse } from "next/server";
import { requireEmail } from "@/lib/session";
import { savePush } from "@/lib/store";
import { vapidPublic } from "@/lib/push";

export async function GET() {
  return NextResponse.json({ publicKey: vapidPublic() });
}

export async function POST(req: Request) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  const body = (await req.json()) as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: "fields" }, { status: 400 });
  }
  await savePush({ email, endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth });
  return NextResponse.json({ ok: true });
}
