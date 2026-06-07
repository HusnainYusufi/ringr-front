"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

interface Client {
  id: string;
  name: string;
  city: string;
  email: string;
  isActive: boolean;
  isSetupComplete: boolean;
  createdAt: string;
  vertical: { name: string; slug: string } | null;
  tenant: { name: string; subdomain: string };
  subscription: { tier: string; status: string } | null;
  _count: { bookings: number; staff: number };
  bookingStats: {
    total: number;
    confirmed: number;
    completed: number;
    thisMonth: number;
    upcoming: number;
    revenueCents: number;
  };
}

function StatusBadge({ isSetupComplete, isActive }: { isSetupComplete: boolean; isActive: boolean }) {
  if (!isSetupComplete) return <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">Setup Pending</span>;
  if (isActive) return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Live</span>;
  return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">Inactive</span>;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function load(q?: string) {
    setLoading(true);
    api.get<{ data: Client[] }>(`/admin/clients${q ? `?q=${encodeURIComponent(q)}` : ""}`)
      .then((r) => setClients(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    setDeleting(id);
    setConfirmId(null);
    try {
      await api.delete(`/admin/providers/${id}`);
      setClients((prev) => prev.filter((c) => c.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Clients</h1>
          <p className="text-sm text-gray-400">All onboarded clinics and their performance.</p>
        </div>
        <Link href="/admin/providers/onboard"
          className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
          + Invite New Clinic
        </Link>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); load(search); }} className="flex gap-3">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, city, or email…"
          className="flex-1 rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:bg-gray-dark dark:text-white" />
        <button type="submit" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white">Search</button>
      </form>

      {error && <p className="text-red-500">{error}</p>}

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : (
        <div className="space-y-4">
          {clients.length === 0 && <p className="rounded-2xl bg-white p-8 text-center text-sm text-gray-400 dark:bg-gray-dark">No clients yet. Invite your first clinic!</p>}

          {clients.map((c) => (
            <div key={c.id} className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-dark dark:text-white">{c.name}</h2>
                    <StatusBadge isSetupComplete={c.isSetupComplete} isActive={c.isActive} />
                    {c.subscription && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {c.subscription.tier}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-gray-400">
                    {c.city || "No city set"} · {c.vertical?.name ?? "No vertical"} · {c.tenant.name}
                  </p>
                  <p className="text-xs text-gray-400">{c.email}</p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="text-right text-sm">
                    <p className="text-2xl font-bold text-dark dark:text-white">
                      ${(c.bookingStats.revenueCents / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">total revenue</p>
                  </div>
                  <button
                    onClick={() => setConfirmId(c.id)}
                    disabled={deleting === c.id}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-40 dark:border-red-800 dark:hover:bg-red-900/20"
                  >
                    {deleting === c.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-stroke pt-4 dark:border-dark-3 sm:grid-cols-5">
                {[
                  { label: "Total Bookings", value: c.bookingStats.total },
                  { label: "Confirmed", value: c.bookingStats.confirmed },
                  { label: "Completed", value: c.bookingStats.completed },
                  { label: "Upcoming", value: c.bookingStats.upcoming },
                  { label: "This Month", value: c.bookingStats.thisMonth },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-xl font-bold text-dark dark:text-white">{s.value}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {!c.isSetupComplete && (
                <div className="mt-3 rounded-lg bg-yellow-50 px-4 py-2 text-xs text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                  ⚠ Owner hasn&apos;t completed clinic setup yet.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-dark">
            <h3 className="text-lg font-semibold text-dark dark:text-white">Delete clinic?</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              This will deactivate the clinic and all its staff accounts. Existing bookings are preserved. This cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleDelete(confirmId)}
                className="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
              >
                Yes, delete
              </button>
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 rounded-lg border border-stroke py-2.5 text-sm font-semibold text-dark dark:border-dark-3 dark:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
