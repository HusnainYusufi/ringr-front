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
  const [apiKey, setApiKey] = useState("");
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
      await acceptInvite(token, password, apiKey.trim() || undefined);
      router.push("/portal");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to accept invite");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-2 p-4 dark:bg-[#020d1a]">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-dark dark:text-white">Ringr</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            You have been invited to join the platform. Set your password to get started.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-dark">
          <h2 className="mb-6 text-xl font-semibold text-dark dark:text-white">
            Accept Invite
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!tokenFromUrl && (
              <div>
                <label htmlFor="token" className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                  Invite Token
                </label>
                <input
                  id="token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  placeholder="Paste the token from your invite email"
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-mono text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                />
              </div>
            )}

            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Min. 8 characters"
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="Re-enter password"
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="workspace-key" className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                Workspace API Key{" "}
                <span className="text-xs text-gray-400">(optional — save for future logins)</span>
              </label>
              <input
                id="workspace-key"
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="vc-api-key-... (from your admin)"
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-mono text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
              />
            </div>

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
              {loading ? "Setting up your account…" : "Set Password & Enter Portal"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-400">
            Already have an account?{" "}
            <a href="/auth/sign-in" className="text-primary hover:underline">
              Sign in
            </a>
          </p>
        </div>
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
