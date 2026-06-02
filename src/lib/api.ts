const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3087/api/v1";

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)ringr_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function getApiKey(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem("ringr_api_key");
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  opts: { apiKey?: string; skipAuth?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  const token = getToken();
  if (token && !opts.skipAuth) headers["Authorization"] = `Bearer ${token}`;

  const apiKey = opts.apiKey ?? getApiKey();
  if (apiKey) headers["X-API-Key"] = apiKey;

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  // Try token refresh once on 401
  if (res.status === 401 && !opts.skipAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${refreshed}`;
      const retry = await fetch(`${BASE}${path}`, {
        ...init,
        credentials: "include",
        headers,
      });
      if (!retry.ok) throw await buildError(retry);
      return retry.json();
    }
    // Refresh failed — clear session and redirect
    clearSession();
    if (typeof window !== "undefined") window.location.href = "/auth/sign-in";
    throw new Error("Session expired");
  }

  if (!res.ok) throw await buildError(res);
  return res.json();
}

async function buildError(res: Response): Promise<Error> {
  try {
    const body = await res.json();
    return new Error(body?.error?.message ?? body?.message ?? `HTTP ${res.status}`);
  } catch {
    return new Error(`HTTP ${res.status}`);
  }
}

async function tryRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const body = await res.json();
    const token = body?.data?.accessToken;
    if (token) setTokenCookie(token);
    return token ?? null;
  } catch {
    return null;
  }
}

export function setTokenCookie(token: string) {
  // 15 min — matches backend access token TTL
  document.cookie = `ringr_token=${encodeURIComponent(token)}; path=/; max-age=900; SameSite=Lax`;
}

export function clearSession() {
  document.cookie = "ringr_token=; path=/; max-age=0";
  document.cookie = "ringr_role=; path=/; max-age=0";
  document.cookie = "ringr_user=; path=/; max-age=0";
  if (typeof localStorage !== "undefined") localStorage.removeItem("ringr_api_key");
}

export const api = {
  get: <T>(path: string, opts?: { apiKey?: string }) =>
    request<T>(path, { method: "GET" }, opts),

  post: <T>(path: string, body?: unknown, opts?: { apiKey?: string }) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }, opts),

  patch: <T>(path: string, body?: unknown, opts?: { apiKey?: string }) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }, opts),

  delete: <T>(path: string, opts?: { apiKey?: string }) =>
    request<T>(path, { method: "DELETE" }, opts),
};
