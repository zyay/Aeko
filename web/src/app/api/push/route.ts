import { NextResponse } from "next/server";
import { requireEmail } from "@/lib/session";
import { pushSchema, readJson } from "@/lib/api-guard";
import { savePush } from "@/lib/store";
import { vapidPublic } from "@/lib/push";

export async function GET() {
  return NextResponse.json({ publicKey: vapidPublic() });
}

export async function POST(req: Request) {
  const email = await requireEmail(req);
  if (!email) return NextResponse.json({ error: "auth" }, { status: 401 });
  const parsed = await readJson(req, pushSchema);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;
  await savePush({ email, endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth });
  return NextResponse.json({ ok: true });
}
