"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

interface Dashboard {
  provider: { id: string; name: string; city: string; isActive: boolean };
  stats: {
    totalBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    completedBookings: number;
    upcomingBookings: number;
    availableSlots: number;
    heldSlots: number;
  };
  recentBookings: Array<{
    id: string;
    status: string;
    createdAt: string;
    customer: { name: string | null; phone: string };
    slot: { startsAt: string };
  }>;
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-dark">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent ?? "text-dark dark:text-white"}`}>{value}</p>
    </div>
  );
}

export default function PortalDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<{ data: Dashboard }>("/providers/me/dashboard")
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400">Loading dashboard…</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!data) return null;

  const STATUS_COLORS: Record<string, string> = {
    CONFIRMED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-600",
    COMPLETED: "bg-blue-100 text-blue-700",
    NO_SHOW: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">{data.provider.name}</h1>
          <p className="text-sm text-gray-400">{data.provider.city}</p>
        </div>
        <Link href="/portal/slots"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
          Manage Slots
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Bookings" value={data.stats.totalBookings} />
        <StatCard label="Upcoming" value={data.stats.upcomingBookings} accent="text-primary" />
        <StatCard label="Available Slots" value={data.stats.availableSlots} accent="text-green-600" />
        <StatCard label="Completed" value={data.stats.completedBookings} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-dark dark:text-white">Recent Bookings</h2>
            <Link href="/portal/bookings" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {data.recentBookings.length === 0 && <p className="text-sm text-gray-400">No bookings yet.</p>}
            {data.recentBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg bg-gray-2 px-4 py-3 dark:bg-[#1a2535]">
                <div>
                  <p className="text-sm font-medium text-dark dark:text-white">
                    {b.customer.name ?? b.customer.phone}
                  </p>
                  <p className="text-xs text-gray-400">{new Date(b.slot.startsAt).toLocaleString()}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[b.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
          <h2 className="mb-4 font-semibold text-dark dark:text-white">Quick Links</h2>
          <div className="space-y-2">
            {[
              { href: "/portal/profile", label: "Edit Clinic Profile", desc: "Address, bio, contact info" },
              { href: "/portal/schedule", label: "Set Opening Hours", desc: "Mon–Fri, custom days" },
              { href: "/portal/slots", label: "Generate Slots", desc: "Create appointment slots from your schedule" },
              { href: "/portal/bookings", label: "View All Bookings", desc: "Filter by status & date" },
            ].map((l) => (
              <Link key={l.href} href={l.href}
                className="flex items-center justify-between rounded-lg border border-stroke px-4 py-3 hover:bg-gray-2 dark:border-dark-3 dark:hover:bg-[#1a2535]">
                <div>
                  <p className="text-sm font-medium text-dark dark:text-white">{l.label}</p>
                  <p className="text-xs text-gray-400">{l.desc}</p>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
