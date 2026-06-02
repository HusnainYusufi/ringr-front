"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

interface OnboardResult {
  provider: { id: string; name: string };
  owner: { email: string; firstName: string; lastName: string };
  invite: { token: string; expiresAt: string };
  apiKey: { plaintext: string; keyPrefix: string };
  subscription: { tier: string; status: string };
}

function OnboardForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillTenantId = searchParams.get("tenantId") ?? "";

  const [verticals, setVerticals] = useState<Array<{ id: string; name: string }>>([]);
  const [tenants, setTenants] = useState<Array<{ id: string; name: string }>>([]);
  const [result, setResult] = useState<OnboardResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    tenantId: prefillTenantId,
    verticalId: "",
    name: "",
    address: "",
    city: "",
    province: "ON",
    postalCode: "",
    phone: "",
    email: "",
    bio: "",
    ownerEmail: "",
    ownerFirstName: "",
    ownerLastName: "",
    tier: "STARTER",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    Promise.all([
      api.get<{ data: Array<{ id: string; name: string }> }>("/admin/verticals"),
      api.get<{ data: Array<{ id: string; name: string }> }>("/admin/tenants"),
    ]).then(([v, t]) => { setVerticals(v.data); setTenants(t.data); });
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
      <div className="space-y-6">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
          <h2 className="mb-2 text-lg font-semibold text-green-800 dark:text-green-300">
            ✓ Provider Onboarded Successfully
          </h2>
          <p className="text-sm text-green-700 dark:text-green-400">
            <strong>{result.provider.name}</strong> has been created. An invite email has been sent to{" "}
            <strong>{result.owner.email}</strong>.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark space-y-4">
          <h3 className="font-semibold text-dark dark:text-white">Share with the clinic owner:</h3>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">Workspace API Key (shown once)</p>
            <code className="block rounded-lg bg-gray-2 px-4 py-3 text-sm font-mono text-dark dark:bg-[#1a2535] dark:text-white break-all">
              {result.apiKey.plaintext}
            </code>
            <p className="mt-1 text-xs text-gray-400">Give this to the clinic owner — they need it to log in.</p>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">Magic Link Token (backup)</p>
            <code className="block rounded-lg bg-gray-2 px-4 py-3 text-sm font-mono text-dark dark:bg-[#1a2535] dark:text-white break-all">
              {`/auth/accept-invite?token=${result.invite.token}`}
            </code>
            <p className="mt-1 text-xs text-gray-400">Expires: {new Date(result.invite.expiresAt).toLocaleString()}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setResult(null)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
              Onboard Another
            </button>
            <button onClick={() => router.push("/admin/providers")}
              className="rounded-lg border border-stroke px-4 py-2 text-sm text-dark dark:border-dark-3 dark:text-white">
              View All Providers
            </button>
          </div>
        </div>
      </div>
    );
  }

  const field = (id: string, label: string, placeholder?: string, type = "text", required = true) => (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-dark dark:text-white">{label}</label>
      <input id={id} type={type} required={required} placeholder={placeholder}
        value={(form as Record<string, string>)[id]} onChange={(e) => set(id, e.target.value)}
        className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark dark:text-white">Onboard New Provider</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Assignment */}
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
          <h2 className="mb-4 font-semibold text-dark dark:text-white">Assignment</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="tenantId" className="mb-1 block text-sm font-medium text-dark dark:text-white">Tenant</label>
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
              <label htmlFor="tier" className="mb-1 block text-sm font-medium text-dark dark:text-white">Subscription Tier</label>
              <select id="tier" value={form.tier} onChange={(e) => set("tier", e.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white">
                <option value="STARTER">Starter</option>
                <option value="PRO">Pro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Clinic details */}
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
          <h2 className="mb-4 font-semibold text-dark dark:text-white">Clinic Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("name", "Clinic Name", "Downtown Animal Hospital")}
            {field("email", "Clinic Email", "clinic@example.com", "email")}
            {field("phone", "Clinic Phone", "+14165550100", "tel")}
            {field("address", "Street Address", "123 King St W")}
            {field("city", "City", "Toronto")}
            {field("province", "Province", "ON")}
            {field("postalCode", "Postal Code", "M5H 1J9")}
            <div className="sm:col-span-2">
              <label htmlFor="bio" className="mb-1 block text-sm font-medium text-dark dark:text-white">Bio (optional)</label>
              <textarea id="bio" rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)}
                placeholder="Brief description of the clinic…"
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
            </div>
          </div>
        </div>

        {/* Owner */}
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
          <h2 className="mb-4 font-semibold text-dark dark:text-white">Clinic Owner (receives invite email)</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {field("ownerFirstName", "First Name", "James")}
            {field("ownerLastName", "Last Name", "Smith")}
            {field("ownerEmail", "Owner Email", "dr.smith@clinic.com", "email")}
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>}

        <button type="submit" disabled={loading}
          className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {loading ? "Onboarding…" : "Onboard Provider & Send Invite"}
        </button>
      </form>
    </div>
  );
}

export default function OnboardPage() {
  return (
    <Suspense fallback={<p className="text-gray-400">Loading…</p>}>
      <OnboardForm />
    </Suspense>
  );
}
