import { ApiError, extractErrorMessage } from "./api-error";
import { tokenStorage } from "./storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

let onUnauthorized: (() => void) | null = null;

/** The auth context registers this so an expired/revoked session sends the user back to login. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await tokenStorage.get();

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  const text = await res.text();
  const body: unknown = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    // A 401 on /auth/* is just wrong credentials, not an expired session.
    if (res.status === 401 && token && !path.startsWith("/auth/")) {
      onUnauthorized?.();
    }
    throw new ApiError(res.status, extractErrorMessage(body, "Request failed"));
  }

  return body as T;
}
