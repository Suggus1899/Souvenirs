import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { extractErrorMessage } from "@/lib/api-error";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/session";

export async function POST(req: NextRequest) {
  const payload = await req.text();

  const res = await fetch(`${process.env.API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    cache: "no-store",
  });

  const text = await res.text();
  const body: unknown = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    return NextResponse.json(
      { message: extractErrorMessage(body, "Login failed") },
      { status: res.status },
    );
  }

  const { accessToken, user } = body as { accessToken: string; user: unknown };
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return NextResponse.json({ user });
}
