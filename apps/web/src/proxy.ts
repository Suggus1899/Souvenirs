import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

const PUBLIC_PATHS = ["/", "/login", "/register"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (!hasSession && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (hasSession && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
