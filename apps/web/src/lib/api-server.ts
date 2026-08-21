import { cookies } from "next/headers";
import { ApiError, extractErrorMessage } from "./api-error";
import { SESSION_COOKIE } from "./session";

/** Calls the Nest API directly from a Server Component / Route Handler, attaching the session JWT. */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  const res = await fetch(`${process.env.API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });

  const text = await res.text();
  const body: unknown = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    throw new ApiError(res.status, extractErrorMessage(body, "Request failed"));
  }

  return body as T;
}
