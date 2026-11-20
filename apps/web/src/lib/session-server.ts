import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "./session";

/**
 * Seconds until the JWT expires, read from its `exp` claim. The signature is not
 * checked here (the API does that on every request) — this only keeps the cookie
 * from outliving the token it carries.
 */
function secondsUntilExpiry(token: string): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()) as {
      exp?: unknown;
    };
    if (typeof payload.exp === "number") {
      return Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
    }
  } catch {
    // Malformed token: fall through to the default.
  }
  return SESSION_MAX_AGE_SECONDS;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: secondsUntilExpiry(token),
  });
}
