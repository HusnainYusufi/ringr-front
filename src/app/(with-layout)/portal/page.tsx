"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";

interface ProviderMe {
  id: string;
  name: string;
  city: string;
  isSetupComplete: boolean;
  isActive: boolean;
}

interface DashboardData {
  provider: { id: string; name: string; city: string; isActive: boolean };
  today: {
    count: number;
    appointments: Array<{
      id: string;
      status: string;
      slot: { startsAt: string };
      customer: { name: string | null; phone: string };
      subject?: { name: string; type: string } | null;
    }>;
  };
  upcoming: { next7Days: number };
  thisWeek: { confirmed: number; completed: number; cancelled: number; noShow: number };
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-dark">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent ?? "text-dark dark:text-white"}`}>{value}</p>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
  COMPLETED: "bg-blue-100 text-blue-700",
  NO_SHOW: "bg-yellow-100 text-yellow-700",
};

export default function PortalDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<{ data: ProviderMe }>("/providers/me")
      .then((r) => {
        if (!r.data.isSetupComplete) {
          router.replace("/portal/setup");
          return;
        }
        return api.get<{ data: DashboardData }>("/providers/me/dashboard")
          .then((d) => setData(d.data));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <p className="text-gray-400">Loading dashboard…</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">{data.provider.name}</h1>
          <p className="text-sm text-gray-400">{data.provider.city}</p>
        </div>
        <Link href="/portal/slots"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
          Manage Availability
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Today's Appointments" value={data.today.count} accent="text-primary" />
        <StatCard label="Upcoming (7 days)" value={data.upcoming.next7Days} />
        <StatCard label="Completed This Week" value={data.thisWeek.completed} accent="text-green-600" />
        <StatCard label="Cancelled This Week" value={data.thisWeek.cancelled} accent="text-red-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
          <h2 className="mb-4 font-semibold text-dark dark:text-white">Today&apos;s Schedule</h2>
          <div className="space-y-3">
            {data.today.appointments.length === 0 && (
              <p className="text-sm text-gray-400">No appointments today.</p>
            )}
            {data.today.appointments.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg bg-gray-2 px-4 py-3 dark:bg-[#1a2535]">
                <div>
                  <p className="text-sm font-medium text-dark dark:text-white">
                    {b.customer.name ?? b.customer.phone}
                    {b.subject ? ` · ${b.subject.name}` : ""}
                  </p>
                  <p className="text-xs text-gray-400">{new Date(b.slot.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
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
              { href: "/portal/schedule", label: "Opening Hours", desc: "Set your weekly schedule" },
              { href: "/portal/slots", label: "Availability", desc: "View and manage appointment slots" },
              { href: "/portal/bookings", label: "All Bookings", desc: "Filter by status and date" },
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
