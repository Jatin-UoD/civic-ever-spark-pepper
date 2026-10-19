import { getBearerToken } from "@/lib/auth/client";

export async function analyticsRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await analyticsFetch(url, init);
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

export function analyticsFetch(url: string, init?: RequestInit) {
  const token = getBearerToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init?.body) headers.set("Content-Type", "application/json");
  return fetch(url, { ...init, headers, credentials: "same-origin" });
}

export function activateAnalyticsCanteen(canteenId: string) {
  return analyticsRequest<{ ok: true }>("/api/analytics/context", {
    method: "POST",
    body: JSON.stringify({ canteenId }),
  });
}
