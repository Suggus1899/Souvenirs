import { ApiError, extractErrorMessage, parseJsonBody } from "./api-error";

/** Calls the Nest API from a Client Component via the same-origin proxy (the JWT never reaches the browser). */
export async function apiClientFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/proxy${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const body = await parseJsonBody(res);

  if (!res.ok) {
    throw new ApiError(res.status, extractErrorMessage(body, "Request failed"));
  }

  return body as T;
}
