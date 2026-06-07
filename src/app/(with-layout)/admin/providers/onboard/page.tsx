"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface OnboardResult {
  provider: { id: string; name: string };
  owner: { email: string; firstName: string; lastName: string };
  invite: { token: string; expiresAt: string };
}

export default function OnboardPage() {
  const router = useRouter();
  const [verticals, setVerticals] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [result, setResult] = useState<OnboardResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    verticalId: "",
    ownerEmail: "",
    ownerFirstName: "",
    ownerLastName: "",
    clinicName: "",
    tier: "STARTER",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    api.get<{ data: Array<{ id: string; name: string; slug: string }> }>("/admin/verticals")
      .then((res) => setVerticals(res.data));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post<{ data: OnboardResult }>("/admin/providers/onboard", form);
      setResult(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Onboarding failed");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
          <h2 className="mb-1 text-lg font-semibold text-green-800 dark:text-green-300">
            ✓ Invite sent to {result.owner.email}
          </h2>
          <p className="text-sm text-green-700 dark:text-green-400">
            {result.owner.firstName} will receive an email with a magic link to set their password and fill in their clinic details.
          </p>
        </div>

        <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
          <h3 className="font-semibold text-dark dark:text-white">What happens next</h3>
          <ol className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <li className="flex gap-2"><span className="font-bold text-primary">1.</span> {result.owner.firstName} clicks the magic link in their email</li>
            <li className="flex gap-2"><span className="font-bold text-primary">2.</span> They set a password and are logged in automatically</li>
            <li className="flex gap-2"><span className="font-bold text-primary">3.</span> They fill in their clinic address, hours, and generate slots</li>
            <li className="flex gap-2"><span className="font-bold text-primary">4.</span> Their clinic goes live — the AI can now route bookings to them</li>
          </ol>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setResult(null)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
              Invite Another
            </button>
            <button onClick={() => router.push("/admin/clients")} className="rounded-lg border border-stroke px-4 py-2 text-sm text-dark dark:border-dark-3 dark:text-white">
              View All Clients
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark dark:text-white">Invite New Clinic</h1>
        <p className="mt-1 text-sm text-gray-400">
          Enter the owner&apos;s details. They&apos;ll receive an email to set their password and complete their clinic setup.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
          <h2 className="mb-4 font-semibold text-dark dark:text-white">Service Type</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="verticalId" className="mb-1 block text-sm font-medium text-dark dark:text-white">
                Vertical <span className="text-red-500">*</span>
              </label>
              <select
                id="verticalId"
                required
                value={form.verticalId}
                onChange={(e) => set("verticalId", e.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
              >
                <option value="">Select type…</option>
                {verticals.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-400">The AI will route calls of this type to this clinic.</p>
            </div>
            <div>
              <label htmlFor="tier" className="mb-1 block text-sm font-medium text-dark dark:text-white">Plan</label>
              <select
                id="tier"
                value={form.tier}
                onChange={(e) => set("tier", e.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
              >
                <option value="STARTER">Starter</option>
                <option value="PRO">Pro</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="clinicName" className="mb-1 block text-sm font-medium text-dark dark:text-white">
                Clinic Name <span className="text-xs text-gray-400">(optional — owner can update this)</span>
              </label>
              <input
                id="clinicName"
                type="text"
                value={form.clinicName}
                onChange={(e) => set("clinicName", e.target.value)}
                placeholder="Downtown Animal Hospital"
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
          <h2 className="mb-1 font-semibold text-dark dark:text-white">Clinic Owner</h2>
          <p className="mb-4 text-sm text-gray-400">They will receive a magic link by email to join the platform.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="ownerFirstName" className="mb-1 block text-sm font-medium text-dark dark:text-white">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="ownerFirstName"
                required
                type="text"
                value={form.ownerFirstName}
                onChange={(e) => set("ownerFirstName", e.target.value)}
                placeholder="James"
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="ownerLastName" className="mb-1 block text-sm font-medium text-dark dark:text-white">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="ownerLastName"
                required
                type="text"
                value={form.ownerLastName}
                onChange={(e) => set("ownerLastName", e.target.value)}
                placeholder="Smith"
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="ownerEmail" className="mb-1 block text-sm font-medium text-dark dark:text-white">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="ownerEmail"
                required
                type="email"
                value={form.ownerEmail}
                onChange={(e) => set("ownerEmail", e.target.value)}
                placeholder="dr.smith@clinic.com"
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto sm:px-8"
        >
          {loading ? "Sending invite…" : "Send Invite Email"}
        </button>
      </form>
    </div>
  );
}
