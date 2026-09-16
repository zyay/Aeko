import { NextResponse } from "next/server";
import { requireEmail } from "@/lib/session";
import { getUser } from "@/lib/store";

export async function GET(req: Request) {
  if (!(await requireEmail(req))) return NextResponse.json({ error: "auth" }, { status: 401 });
  const email = new URL(req.url).searchParams.get("email")?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "email" }, { status: 400 });
  const user = getUser(email);
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(user);
}
