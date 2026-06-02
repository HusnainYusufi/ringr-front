"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { adminLogin, staffLogin } from "@/lib/auth";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [tab, setTab] = useState<"admin" | "staff">("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState(
    typeof localStorage !== "undefined" ? (localStorage.getItem("ringr_api_key") ?? "") : "",
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (tab === "admin") {
        await adminLogin(email, password);
        router.push(callbackUrl ?? "/admin");
      } else {
        if (!apiKey.trim()) {
          setError("API Key is required for staff login.");
          setLoading(false);
          return;
        }
        await staffLogin(email, password, apiKey.trim());
        router.push(callbackUrl ?? "/portal");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-2 p-4 dark:bg-[#020d1a]">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-dark dark:text-white">Ringr</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            AI-powered voice booking platform
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-dark">
          {/* Tabs */}
          <div className="mb-6 flex rounded-xl bg-gray-2 p-1 dark:bg-[#1a2535]">
            {(["admin", "staff"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                  tab === t
                    ? "bg-white text-dark shadow-sm dark:bg-gray-dark dark:text-white"
                    : "text-gray-500 hover:text-dark dark:hover:text-white"
                }`}
              >
                {t === "admin" ? "Platform Admin" : "Clinic Staff"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={tab === "admin" ? "admin@ringr.ca" : "dr.smith@pawcare.ca"}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary"
              />
            </div>

            {tab === "staff" && (
              <div>
                <label htmlFor="apiKey" className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                  Workspace API Key{" "}
                  <span className="text-xs text-gray-400">(provided by your admin)</span>
                </label>
                <input
                  id="apiKey"
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="vc-api-key-..."
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-mono text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary"
                />
              </div>
            )}

            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {tab === "staff" && (
            <p className="mt-4 text-center text-xs text-gray-400">
              First time?{" "}
              <a href="/auth/accept-invite" className="text-primary hover:underline">
                Accept your invite
              </a>
            </p>
          )}
        </div>
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
