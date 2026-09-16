import { NextResponse } from "next/server";
import { dbKind } from "@/lib/store";

export async function GET() {
  const db = dbKind();
  return NextResponse.json({
    ok: true,
    db,
    store: db,
    auth: Boolean(process.env.AUTH_SECRET),
  });
}
