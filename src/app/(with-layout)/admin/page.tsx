"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Overview {
  totals: {
    tenants: number;
    activeProviders: number;
    customers: number;
    bookings: number;
    calls: number;
    pendingInvites: number;
  };
  thisWeek: {
    calls: number;
    bookings: number;
    completed: number;
    callsConverted: number;
    conversionRate: number;
  };
  revenue: { monthChargedCents: number };
  recentBookings: Array<{
    id: string;
    status: string;
    createdAt: string;
    customer: { name: string | null; phone: string };
    provider: { name: string };
    slot: { startsAt: string };
  }>;
  topProviders: Array<{ id: string; name: string; city: string; bookingCount: number }>;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-3xl font-bold text-dark dark:text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ data: Overview }>("/admin/overview")
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400">Loading overview…</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!data) return null;

  const rate = (data.thisWeek.conversionRate * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark dark:text-white">Platform Overview</h1>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Tenants" value={data.totals.tenants} />
        <StatCard label="Providers" value={data.totals.activeProviders} />
        <StatCard label="Customers" value={data.totals.customers} />
        <StatCard label="Bookings" value={data.totals.bookings} />
        <StatCard label="Calls" value={data.totals.calls} />
        <StatCard label="Pending Invites" value={data.totals.pendingInvites} />
      </div>

      {/* This week */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Calls This Week" value={data.thisWeek.calls} />
        <StatCard label="Bookings This Week" value={data.thisWeek.bookings} />
        <StatCard label="Completed This Week" value={data.thisWeek.completed} />
        <StatCard label="AI Conversion Rate" value={`${rate}%`} sub="calls → bookings" />
      </div>

      {/* Revenue */}
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
        <p className="text-sm text-gray-500">Revenue This Month</p>
        <p className="mt-1 text-3xl font-bold text-dark dark:text-white">
          ${((data.revenue.monthChargedCents ?? 0) / 100).toFixed(2)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Bookings */}
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
          <h2 className="mb-4 font-semibold text-dark dark:text-white">Recent Bookings</h2>
          <div className="space-y-3">
            {data.recentBookings.length === 0 && (
              <p className="text-sm text-gray-400">No bookings yet.</p>
            )}
            {data.recentBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg bg-gray-2 px-4 py-3 dark:bg-[#1a2535]">
                <div>
                  <p className="text-sm font-medium text-dark dark:text-white">
                    {b.customer.name ?? b.customer.phone}
                  </p>
                  <p className="text-xs text-gray-400">{b.provider.name}</p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    b.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                    b.status === "CANCELLED" ? "bg-red-100 text-red-600" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {b.status}
                  </span>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {new Date(b.slot.startsAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Providers */}
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
          <h2 className="mb-4 font-semibold text-dark dark:text-white">Top Providers This Month</h2>
          <div className="space-y-3">
            {data.topProviders.length === 0 && (
              <p className="text-sm text-gray-400">No data yet.</p>
            )}
            {data.topProviders.map((p, i) => (
              <div key={p.id} className="flex items-center gap-4 rounded-lg bg-gray-2 px-4 py-3 dark:bg-[#1a2535]">
                <span className="text-lg font-bold text-gray-300">#{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-dark dark:text-white">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.city}</p>
                </div>
                <span className="text-sm font-semibold text-primary">{p.bookingCount} bookings</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
