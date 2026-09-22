import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC = new Set(["/login", "/privacy", "/terms", "/api/health"]);

function isPublic(pathname: string) {
  if (PUBLIC.has(pathname)) return true;
  if (pathname.startsWith("/learn")) return true;
  if (pathname.startsWith("/api/learn")) return true;
  if (pathname.startsWith("/api/skills")) return true;
  if (pathname === "/api/workflows/hook") return true;
  if (pathname.startsWith("/api/auth")) return true;
  return false;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const loggedIn = Boolean(req.auth?.user?.email);

  if (loggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (!loggedIn && !isPublic(pathname)) {
    const login = new URL("/login", req.url);
    if (pathname !== "/") login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
