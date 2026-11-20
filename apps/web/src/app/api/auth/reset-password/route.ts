import { NextRequest, NextResponse } from "next/server";
import { extractErrorMessage, parseJsonBody } from "@/lib/api-error";
import { setSessionCookie } from "@/lib/session-server";

/** Sets the new password and, on success, opens the session (same as login). */
export async function POST(req: NextRequest) {
  const res = await fetch(`${process.env.API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await req.text(),
    cache: "no-store",
  });
  const body = await parseJsonBody(res);
  if (!res.ok) {
    return NextResponse.json(
      { message: extractErrorMessage(body, "No pudimos cambiar la contraseña") },
      { status: res.status },
    );
  }
  const { accessToken, user } = body as { accessToken: string; user: unknown };
  await setSessionCookie(accessToken);
  return NextResponse.json({ user });
}
