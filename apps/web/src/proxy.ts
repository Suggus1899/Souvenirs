import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

/** Pages for signed-out visitors: a signed-in user is sent to the dashboard instead. */
const GUEST_PATHS = ["/", "/login", "/register", "/forgot-password", "/reset-password"];
/** Pages anyone can open, signed in or not (the client's payment page). */
const OPEN_PREFIXES = ["/pay/"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (OPEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  const isGuestPath = GUEST_PATHS.includes(pathname);

  if (!hasSession && !isGuestPath) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (hasSession && isGuestPath) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
