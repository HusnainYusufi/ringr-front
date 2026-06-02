"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

interface Provider {
  id: string;
  name: string;
  city: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  vertical: { name: string } | null;
  billing: { freeQuota: number; freeBookingsUsed: number; totalChargedCents: number } | null;
  _count: { bookings: number; staff: number };
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  function load(q?: string) {
    setLoading(true);
    api.get<{ data: Provider[] }>(`/admin/providers/list${q ? `?q=${encodeURIComponent(q)}` : ""}`)
      .then((r) => setProviders(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(search);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-dark dark:text-white">All Providers</h1>
        <Link href="/admin/providers/onboard"
          className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
          + Onboard Provider
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, city, or email…"
          className="flex-1 rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:bg-gray-dark dark:text-white"
        />
        <button type="submit" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white">
          Search
        </button>
      </form>

      {error && <p className="text-red-500">{error}</p>}

      <div className="rounded-2xl bg-white shadow-sm dark:bg-gray-dark overflow-hidden">
        {loading ? (
          <p className="px-6 py-8 text-center text-sm text-gray-400">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stroke dark:border-dark-3">
                <th className="px-6 py-4 text-left font-semibold text-dark dark:text-white">Clinic</th>
                <th className="px-6 py-4 text-left font-semibold text-dark dark:text-white">Vertical</th>
                <th className="px-6 py-4 text-left font-semibold text-dark dark:text-white">Staff</th>
                <th className="px-6 py-4 text-left font-semibold text-dark dark:text-white">Bookings</th>
                <th className="px-6 py-4 text-left font-semibold text-dark dark:text-white">Revenue</th>
                <th className="px-6 py-4 text-left font-semibold text-dark dark:text-white">Status</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.id} className="border-b border-stroke last:border-0 dark:border-dark-3 hover:bg-gray-2 dark:hover:bg-[#1a2535]">
                  <td className="px-6 py-4">
                    <p className="font-medium text-dark dark:text-white">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.city} · {p.email}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{p.vertical?.name ?? "—"}</td>
                  <td className="px-6 py-4 text-dark dark:text-white">{p._count.staff}</td>
                  <td className="px-6 py-4 text-dark dark:text-white">{p._count.bookings}</td>
                  <td className="px-6 py-4 text-dark dark:text-white">
                    ${((p.billing?.totalChargedCents ?? 0) / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && providers.length === 0 && (
          <p className="px-6 py-8 text-center text-sm text-gray-400">No providers found.</p>
        )}
      </div>
    </div>
  );
}
