import { NextRequest, NextResponse } from "next/server";
import { extractErrorMessage, parseJsonBody } from "@/lib/api-error";
import { setSessionCookie } from "@/lib/session-server";

export async function POST(req: NextRequest) {
  const payload = await req.text();

  const res = await fetch(`${process.env.API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    cache: "no-store",
  });

  const body = await parseJsonBody(res);

  if (!res.ok) {
    return NextResponse.json(
      { message: extractErrorMessage(body, "Registration failed") },
      { status: res.status },
    );
  }

  const { accessToken, user } = body as { accessToken: string; user: unknown };
  await setSessionCookie(accessToken);

  return NextResponse.json({ user });
}
