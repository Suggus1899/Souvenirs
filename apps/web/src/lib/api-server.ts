import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, extractErrorMessage, parseJsonBody } from "./api-error";
import { SESSION_COOKIE, SESSION_EXPIRED_PATH } from "./session";

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

  if (res.status === 401) {
    // Expired or revoked token: clear the cookie and go back to the login screen.
    redirect(SESSION_EXPIRED_PATH);
  }

  const body = await parseJsonBody(res);

  if (!res.ok) {
    throw new ApiError(res.status, extractErrorMessage(body, "Request failed"));
  }

  return body as T;
}
