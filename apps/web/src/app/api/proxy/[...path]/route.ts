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

  const headers = new Headers({
    "Content-Type": res.headers.get("Content-Type") ?? "application/json",
  });
  const disposition = res.headers.get("Content-Disposition");
  if (disposition) headers.set("Content-Disposition", disposition); // CSV downloads

  // A 204/304 response must not carry a body, or the Response constructor throws.
  const body = res.status === 204 || res.status === 304 ? null : await res.arrayBuffer();
  return new NextResponse(body, { status: res.status, headers });
}

export {
  handler as DELETE,
  handler as GET,
  handler as PATCH,
  handler as POST,
  handler as PUT,
};
