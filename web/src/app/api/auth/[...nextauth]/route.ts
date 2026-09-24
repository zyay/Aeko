import { signIn, handlers } from "@/auth";
import type { NextRequest } from "next/server";

export const POST = handlers.POST;

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.pathname.match(/\/api\/auth\/signin\/(github|google)$/)?.[1];
  if (provider === "github" || provider === "google") {
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl") || "/";
    await signIn(provider, { redirectTo: callbackUrl.startsWith("/") ? callbackUrl : "/" });
  }
  return handlers.GET(req);
}
