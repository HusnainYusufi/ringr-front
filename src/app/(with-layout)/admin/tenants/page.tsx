"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  isActive: boolean;
  createdAt: string;
  vertical: { name: string; slug: string } | null;
  _count: { providers: number; customers: number; bookings: number };
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [verticals, setVerticals] = useState<Array<{ id: string; name: string }>>([]);
  const [form, setForm] = useState({ name: "", slug: "", subdomain: "", verticalId: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<{ data: Tenant[] }>("/admin/tenants"),
      api.get<{ data: Array<{ id: string; name: string }> }>("/admin/verticals"),
    ])
      .then(([t, v]) => { setTenants(t.data); setVerticals(v.data); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function createTenant(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const res = await api.post<{ data: Tenant }>("/admin/tenants", form);
      setTenants((prev) => [res.data, ...prev]);
      setShowForm(false);
      setForm({ name: "", slug: "", subdomain: "", verticalId: "" });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create tenant");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-400">Loading tenants…</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark dark:text-white">Tenants</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
        >
          + New Tenant
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
          <h2 className="mb-4 font-semibold text-dark dark:text-white">Create New Tenant</h2>
          <form onSubmit={createTenant} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="t-name" className="mb-1 block text-sm font-medium text-dark dark:text-white">Company Name</label>
              <input id="t-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
            </div>
            <div>
              <label htmlFor="t-slug" className="mb-1 block text-sm font-medium text-dark dark:text-white">Slug</label>
              <input id="t-slug" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
                placeholder="pawcare"
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
            </div>
            <div>
              <label htmlFor="t-subdomain" className="mb-1 block text-sm font-medium text-dark dark:text-white">Subdomain</label>
              <input id="t-subdomain" required value={form.subdomain} onChange={(e) => setForm({ ...form, subdomain: e.target.value.toLowerCase() })}
                placeholder="pawcare"
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
            </div>
            <div>
              <label htmlFor="t-vertical" className="mb-1 block text-sm font-medium text-dark dark:text-white">Vertical</label>
              <select id="t-vertical" required value={form.verticalId} onChange={(e) => setForm({ ...form, verticalId: e.target.value })}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white">
                <option value="">Select vertical…</option>
                {verticals.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            {formError && <p className="col-span-2 text-sm text-red-500">{formError}</p>}
            <div className="col-span-2 flex gap-3">
              <button type="submit" disabled={saving}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? "Creating…" : "Create Tenant"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-lg border border-stroke px-5 py-2 text-sm text-dark dark:border-dark-3 dark:text-white">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-2xl bg-white shadow-sm dark:bg-gray-dark overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stroke dark:border-dark-3">
              <th className="px-6 py-4 text-left font-semibold text-dark dark:text-white">Name</th>
              <th className="px-6 py-4 text-left font-semibold text-dark dark:text-white">Vertical</th>
              <th className="px-6 py-4 text-left font-semibold text-dark dark:text-white">Providers</th>
              <th className="px-6 py-4 text-left font-semibold text-dark dark:text-white">Customers</th>
              <th className="px-6 py-4 text-left font-semibold text-dark dark:text-white">Bookings</th>
              <th className="px-6 py-4 text-left font-semibold text-dark dark:text-white">Status</th>
              <th className="px-6 py-4 text-left font-semibold text-dark dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} className="border-b border-stroke last:border-0 dark:border-dark-3 hover:bg-gray-2 dark:hover:bg-[#1a2535]">
                <td className="px-6 py-4">
                  <p className="font-medium text-dark dark:text-white">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.subdomain}</p>
                </td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{t.vertical?.name ?? "—"}</td>
                <td className="px-6 py-4 text-dark dark:text-white">{t._count.providers}</td>
                <td className="px-6 py-4 text-dark dark:text-white">{t._count.customers}</td>
                <td className="px-6 py-4 text-dark dark:text-white">{t._count.bookings}</td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {t.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Link href={`/admin/providers/onboard?tenantId=${t.id}`}
                    className="text-xs text-primary hover:underline">
                    Onboard Provider
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tenants.length === 0 && <p className="px-6 py-8 text-center text-sm text-gray-400">No tenants yet.</p>}
      </div>
    </div>
  );
}
