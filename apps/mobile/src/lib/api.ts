import { ApiError, extractErrorMessage } from "./api-error";
import { tokenStorage } from "./storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

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
    throw new ApiError(res.status, extractErrorMessage(body, "Request failed"));
  }

  return body as T;
}
