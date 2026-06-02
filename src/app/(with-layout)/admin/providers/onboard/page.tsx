"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface OnboardResult {
  provider: { id: string; name: string };
  owner: { email: string; firstName: string; lastName: string };
  invite: { token: string; expiresAt: string };
  apiKey: { plaintext: string };
}

export default function OnboardPage() {
  const router = useRouter();
  const [verticals, setVerticals] = useState<Array<{ id: string; name: string }>>([]);
  const [tenants, setTenants] = useState<Array<{ id: string; name: string }>>([]);
  const [result, setResult] = useState<OnboardResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    tenantId: "",
    verticalId: "",
    ownerEmail: "",
    ownerFirstName: "",
    ownerLastName: "",
    clinicName: "",
    tier: "STARTER",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    Promise.all([
      api.get<{ data: Array<{ id: string; name: string }> }>("/admin/verticals"),
      api.get<{ data: Array<{ id: string; name: string }> }>("/admin/tenants"),
    ]).then(([v, t]) => {
      setVerticals(v.data);
      setTenants(t.data);
    });
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
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invite?token=${result.invite.token}`;
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
          <h2 className="mb-1 text-lg font-semibold text-green-800 dark:text-green-300">
            ✓ Invite sent to {result.owner.email}
          </h2>
          <p className="text-sm text-green-700 dark:text-green-400">
            {result.owner.firstName} will receive an email to set their password and fill in their clinic details.
          </p>
        </div>

        <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
          <h3 className="font-semibold text-dark dark:text-white">Share with the clinic owner</h3>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">Workspace API Key (shown once)</p>
            <code className="block break-all rounded-lg bg-gray-2 px-4 py-3 font-mono text-sm text-dark dark:bg-[#1a2535] dark:text-white">
              {result.apiKey.plaintext}
            </code>
            <p className="mt-1 text-xs text-gray-400">They need this to log into the staff portal.</p>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">Invite Link (backup if email fails)</p>
            <code className="block break-all rounded-lg bg-gray-2 px-4 py-3 font-mono text-sm text-dark dark:bg-[#1a2535] dark:text-white">
              {inviteUrl}
            </code>
            <p className="mt-1 text-xs text-gray-400">Expires: {new Date(result.invite.expiresAt).toLocaleString()}</p>
          </div>

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
          Enter the owner&apos;s details. They&apos;ll receive an email to set their password and fill in their clinic profile themselves.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
          <h2 className="mb-4 font-semibold text-dark dark:text-white">Assignment</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="tenantId" className="mb-1 block text-sm font-medium text-dark dark:text-white">Network / Tenant</label>
              <select id="tenantId" required value={form.tenantId} onChange={(e) => set("tenantId", e.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white">
                <option value="">Select tenant…</option>
                {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="verticalId" className="mb-1 block text-sm font-medium text-dark dark:text-white">Vertical</label>
              <select id="verticalId" required value={form.verticalId} onChange={(e) => set("verticalId", e.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white">
                <option value="">Select vertical…</option>
                {verticals.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="tier" className="mb-1 block text-sm font-medium text-dark dark:text-white">Plan</label>
              <select id="tier" value={form.tier} onChange={(e) => set("tier", e.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white">
                <option value="STARTER">Starter</option>
                <option value="PRO">Pro</option>
              </select>
            </div>
            <div>
              <label htmlFor="clinicName" className="mb-1 block text-sm font-medium text-dark dark:text-white">
                Clinic Name <span className="text-xs text-gray-400">(optional)</span>
              </label>
              <input id="clinicName" type="text" value={form.clinicName} onChange={(e) => set("clinicName", e.target.value)}
                placeholder="Downtown Animal Hospital"
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
          <h2 className="mb-1 font-semibold text-dark dark:text-white">Clinic Owner</h2>
          <p className="mb-4 text-sm text-gray-400">They will receive an invite email to join the platform.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="ownerFirstName" className="mb-1 block text-sm font-medium text-dark dark:text-white">First Name</label>
              <input id="ownerFirstName" required type="text" value={form.ownerFirstName} onChange={(e) => set("ownerFirstName", e.target.value)}
                placeholder="James"
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
            </div>
            <div>
              <label htmlFor="ownerLastName" className="mb-1 block text-sm font-medium text-dark dark:text-white">Last Name</label>
              <input id="ownerLastName" required type="text" value={form.ownerLastName} onChange={(e) => set("ownerLastName", e.target.value)}
                placeholder="Smith"
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
            </div>
            <div>
              <label htmlFor="ownerEmail" className="mb-1 block text-sm font-medium text-dark dark:text-white">Email</label>
              <input id="ownerEmail" required type="email" value={form.ownerEmail} onChange={(e) => set("ownerEmail", e.target.value)}
                placeholder="dr.smith@clinic.com"
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
            </div>
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto sm:px-8">
          {loading ? "Sending invite…" : "Send Invite Email"}
        </button>
      </form>
    </div>
  );
}
