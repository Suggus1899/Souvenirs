import { ApiError, extractErrorMessage, parseJsonBody } from "./api-error";
import { SESSION_EXPIRED_PATH } from "./session";

/** Calls the Nest API from a Client Component via the same-origin proxy (the JWT never reaches the browser). */
export async function apiClientFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/proxy${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (res.status === 401) {
    window.location.assign(SESSION_EXPIRED_PATH);
    throw new ApiError(401, "Tu sesión expiró");
  }

  const body = await parseJsonBody(res);

  if (!res.ok) {
    throw new ApiError(res.status, extractErrorMessage(body, "Request failed"));
  }

  return body as T;
}
