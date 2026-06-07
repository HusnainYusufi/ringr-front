"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { acceptInvite } from "@/lib/auth";

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") ?? "";

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await acceptInvite(token, password);
      router.push("/portal/setup");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to accept invite");
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
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="white" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-dark dark:text-white">Ringr</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-dark dark:text-white">Welcome to Ringr</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Set a password to activate your account and get your clinic ready.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!tokenFromUrl && (
              <div>
                <label htmlFor="token" className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Invite Token
                </label>
                <input
                  id="token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  placeholder="Paste the token from your invite email"
                  className="w-full rounded-xl border border-stroke bg-transparent px-4 py-3.5 font-mono text-sm text-dark outline-none placeholder:text-gray-400 focus:border-primary dark:border-dark-3 dark:text-white"
                />
              </div>
            )}

            <div>
              <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-dark dark:text-white">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Min. 8 characters"
                className="w-full rounded-xl border border-stroke bg-transparent px-4 py-3.5 text-sm text-dark outline-none placeholder:text-gray-400 focus:border-primary dark:border-dark-3 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-dark dark:text-white">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="Re-enter password"
                className="w-full rounded-xl border border-stroke bg-transparent px-4 py-3.5 text-sm text-dark outline-none placeholder:text-gray-400 focus:border-primary dark:border-dark-3 dark:text-white"
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
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Activating account…
                </span>
              ) : (
                "Activate Account"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            Already have an account?{" "}
            <a href="/auth/sign-in" className="text-primary hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>

      {/* Right — branding panel */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between bg-gradient-to-br from-primary via-blue-600 to-indigo-700 px-16 py-16">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="white" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-white">Ringr</span>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-4xl font-bold leading-tight text-white">
              Your clinic is one step away from going live
            </h2>
            <p className="mt-4 text-lg text-blue-100">
              Set your password, fill in your clinic details, and Ringr&apos;s AI will start routing bookings to you automatically.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { n: "1", title: "Set your password", desc: "Activate your account right here" },
              { n: "2", title: "Complete your clinic profile", desc: "Address, opening hours, and available slots" },
              { n: "3", title: "Go live", desc: "AI starts routing calls to your clinic instantly" },
            ].map((s) => (
              <div key={s.n} className="flex items-start gap-4 rounded-2xl bg-white/10 px-5 py-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                  {s.n}
                </span>
                <div>
                  <p className="font-semibold text-white">{s.title}</p>
                  <p className="text-sm text-blue-100">{s.desc}</p>
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

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading…</div>}>
      <AcceptInviteForm />
    </Suspense>
  );
}
