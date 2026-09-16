import { NextResponse } from "next/server";
import { dbKind } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ ok: true, store: dbKind(), auth: Boolean(process.env.AUTH_SECRET) });
}
