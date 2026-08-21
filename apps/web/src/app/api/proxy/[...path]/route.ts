import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  const targetUrl = `${process.env.API_URL}/${path.join("/")}${req.nextUrl.search}`;
  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  const res = await fetch(targetUrl, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: hasBody ? await req.text() : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}

export {
  handler as DELETE,
  handler as GET,
  handler as PATCH,
  handler as POST,
  handler as PUT,
};
