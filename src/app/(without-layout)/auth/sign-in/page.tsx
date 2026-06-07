"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setTokenCookie } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3087/api/v1";

async function login(email: string, password: string) {
  // Try universal staff/admin login first (covers all roles, no API key needed)
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (res.ok) {
    const body = await res.json();
    return { accessToken: body.data?.accessToken ?? body.accessToken, role: body.data?.role ?? body.role, isSetupComplete: body.data?.isSetupComplete ?? body.isSetupComplete };
  }

  // Fall back to admin-specific endpoint (SUPER_ADMIN raw SQL path)
  const adminRes = await fetch(`${API}/admin/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (adminRes.ok) {
    const body = await adminRes.json();
    return { accessToken: body.data?.accessToken ?? body.accessToken, role: body.data?.role ?? body.role, isSetupComplete: true };
  }

  const errBody = await res.json().catch(() => ({}));
  throw new Error(errBody?.error?.message ?? errBody?.message ?? "Invalid email or password");
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { accessToken, role, isSetupComplete } = await login(email, password);
      setTokenCookie(accessToken);
      document.cookie = `ringr_role=${role}; path=/; max-age=86400; SameSite=Lax`;

      if (callbackUrl) {
        router.push(callbackUrl);
        return;
      }
      const isAdmin = role === "SUPER_ADMIN" || role === "TENANT_ADMIN";
      if (isAdmin) {
        router.push("/admin");
      } else if (!isSetupComplete) {
        router.push("/portal/setup");
      } else {
        router.push("/portal");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#020d1a]">
      {/* Left — form */}
      <div className="flex w-full flex-col justify-center px-8 py-12 sm:px-12 lg:w-1/2 xl:px-20">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <div className="mb-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="white"/>
                </svg>
              </div>
              <span className="text-2xl font-bold text-dark dark:text-white">Ringr</span>
            </div>
            <p className="mt-2 text-sm text-gray-400">AI-powered voice booking platform</p>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-dark dark:text-white">Welcome back</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-dark dark:text-white">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-stroke bg-transparent px-4 py-3.5 text-sm text-dark transition outline-none placeholder:text-gray-400 focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-dark dark:text-white">
                  Password
                </label>
                <a href="/auth/accept-invite" className="text-xs text-primary hover:underline">
                  First time? Accept invite →
                </a>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-stroke bg-transparent px-4 py-3.5 text-sm text-dark transition outline-none placeholder:text-gray-400 focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary"
              />
            </div>

            {error && (
              <div className="flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3 dark:bg-red-900/20">
                <span className="mt-0.5 text-red-500">⚠</span>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative w-full overflow-hidden rounded-xl bg-primary py-3.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing in…
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            Platform admin?{" "}
            <span className="text-gray-500">Use your admin credentials above — no extra steps needed.</span>
          </p>
          <p className="mt-3 text-center text-xs text-gray-400">
            Want to see it in action?{" "}
            <a href="/demo" className="text-primary hover:underline font-medium">
              Try the live demo →
            </a>
          </p>
        </div>
      </div>

      {/* Right — branding panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between bg-gradient-to-br from-primary via-blue-600 to-indigo-700 px-16 py-16">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="white"/>
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">Ringr</span>
          </div>
        </div>

        <div className="space-y-10">
          <div>
            <h2 className="text-4xl font-bold leading-tight text-white">
              AI that books appointments while you sleep
            </h2>
            <p className="mt-4 text-lg text-blue-100">
              Patients call in. Ringr handles the conversation, finds the right slot, and confirms the booking — automatically.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: "📞", title: "Voice-first", desc: "Callers book naturally by phone — no apps, no forms" },
              { icon: "🏥", title: "Multi-vertical", desc: "Vet clinics, dental offices, auto shops and more" },
              { icon: "📊", title: "Full visibility", desc: "Real-time bookings, calls, and revenue in one dashboard" },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-4 rounded-2xl bg-white/10 px-5 py-4">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="font-semibold text-white">{f.title}</p>
                  <p className="text-sm text-blue-100">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-blue-200">© {new Date().getFullYear()} Ringr. All rights reserved.</p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading…</div>}>
      <SignInForm />
    </Suspense>
  );
}
