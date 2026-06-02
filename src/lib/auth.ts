import { api, clearSession, setTokenCookie } from "./api";

export type UserRole =
  | "SUPER_ADMIN"
  | "TENANT_ADMIN"
  | "PROVIDER_OWNER"
  | "PROVIDER_STAFF";

export interface RingrUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
  providerId: string;
}

interface LoginResponse {
  data: { accessToken: string };
}

// Decode JWT payload without verification (verification is on the server)
function decodeJwt(token: string): Record<string, unknown> {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return {};
  }
}

function persistSession(accessToken: string, apiKey?: string) {
  setTokenCookie(accessToken);
  const payload = decodeJwt(accessToken);
  const role = payload.role as UserRole;
  document.cookie = `ringr_role=${role}; path=/; max-age=86400; SameSite=Lax`;
  if (apiKey) localStorage.setItem("ringr_api_key", apiKey);
}

// ─── Admin login (SUPER_ADMIN) ────────────────────────────────────────────────
export async function adminLogin(email: string, password: string) {
  const res = await api.post<LoginResponse>("/admin/auth/login", { email, password }, { skipAuth: true } as any);
  persistSession(res.data.accessToken);
  return res.data.accessToken;
}

// ─── Staff login (PROVIDER_OWNER / PROVIDER_STAFF) ───────────────────────────
export async function staffLogin(email: string, password: string, apiKey: string) {
  const res = await api.post<LoginResponse>("/auth/staff/login", { email, password }, { apiKey });
  persistSession(res.data.accessToken, apiKey);
  return res.data.accessToken;
}

// ─── Accept magic-link invite (first-time password set) ──────────────────────
export async function acceptInvite(token: string, password: string, apiKey?: string) {
  const res = await api.post<LoginResponse>("/auth/accept-invite", { token, password });
  persistSession(res.data.accessToken, apiKey);
  return res.data.accessToken;
}

// ─── Get current user info ────────────────────────────────────────────────────
export async function getMe(): Promise<RingrUser> {
  const res = await api.get<{ data: RingrUser }>("/auth/me");
  return res.data;
}

// ─── Logout ──────────────────────────────────────────────────────────────────
export async function logout() {
  try {
    await api.post("/auth/logout", {});
  } catch {
    // ignore — clear client side regardless
  }
  clearSession();
  window.location.href = "/auth/sign-in";
}

// ─── Read role from cookie (available in middleware too) ──────────────────────
export function getRoleFromCookie(): UserRole | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)ringr_role=([^;]+)/);
  return (match?.[1] as UserRole) ?? null;
}

export function isAdmin(role: UserRole | null) {
  return role === "SUPER_ADMIN" || role === "TENANT_ADMIN";
}

export function isProvider(role: UserRole | null) {
  return role === "PROVIDER_OWNER" || role === "PROVIDER_STAFF";
}
