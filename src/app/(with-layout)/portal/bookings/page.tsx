"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Booking {
  id: string;
  status: string;
  notes: string | null;
  createdAt: string;
  customer: { name: string | null; phone: string };
  slot: { startsAt: string; endsAt: string };
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
  COMPLETED: "bg-blue-100 text-blue-700",
  NO_SHOW: "bg-yellow-100 text-yellow-700",
};

export default function PortalBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function load(after?: string) {
    setLoading(true);
    try {
      const url = after ? `/bookings?cursor=${after}` : "/bookings";
      const res = await api.get<{ data: { data: Booking[]; meta: { cursor: string | null; hasMore: boolean } } }>(url);
      const { data, meta } = res.data;
      setBookings((prev) => (after ? [...prev, ...data] : data));
      setCursor(meta.cursor);
      setHasMore(meta.hasMore);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, action: "cancel" | "complete" | "no-show") {
    setActionLoading(id);
    try {
      await api.patch(`/bookings/${id}/${action}`, {});
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id
            ? { ...b, status: action === "cancel" ? "CANCELLED" : action === "complete" ? "COMPLETED" : "NO_SHOW" }
            : b,
        ),
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark dark:text-white">Bookings</h1>
      {error && <p className="text-red-500">{error}</p>}

      <div className="rounded-2xl bg-white shadow-sm dark:bg-gray-dark overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stroke dark:border-dark-3">
              <th className="px-6 py-4 text-left font-semibold text-dark dark:text-white">Customer</th>
              <th className="px-6 py-4 text-left font-semibold text-dark dark:text-white">Appointment</th>
              <th className="px-6 py-4 text-left font-semibold text-dark dark:text-white">Status</th>
              <th className="px-6 py-4 text-left font-semibold text-dark dark:text-white">Notes</th>
              <th className="px-6 py-4 text-left font-semibold text-dark dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-b border-stroke last:border-0 dark:border-dark-3 hover:bg-gray-2 dark:hover:bg-[#1a2535]">
                <td className="px-6 py-4">
                  <p className="font-medium text-dark dark:text-white">{b.customer.name ?? "—"}</p>
                  <p className="text-xs text-gray-400">{b.customer.phone}</p>
                </td>
                <td className="px-6 py-4 text-dark dark:text-white">
                  {new Date(b.slot.startsAt).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[b.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <p className="truncate text-xs text-gray-400">{b.notes ?? "—"}</p>
                </td>
                <td className="px-6 py-4">
                  {b.status === "CONFIRMED" && (
                    <div className="flex gap-2">
                      <button
                        disabled={actionLoading === b.id}
                        onClick={() => updateStatus(b.id, "complete")}
                        className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                      >
                        Complete
                      </button>
                      <button
                        disabled={actionLoading === b.id}
                        onClick={() => updateStatus(b.id, "cancel")}
                        className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={actionLoading === b.id}
                        onClick={() => updateStatus(b.id, "no-show")}
                        className="rounded px-2 py-1 text-xs font-medium text-yellow-600 hover:bg-yellow-50 disabled:opacity-50"
                      >
                        No-show
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="px-6 py-8 text-center text-sm text-gray-400">Loading…</p>}
        {!loading && bookings.length === 0 && <p className="px-6 py-8 text-center text-sm text-gray-400">No bookings yet.</p>}
      </div>

      {hasMore && !loading && (
        <div className="text-center">
          <button onClick={() => load(cursor ?? undefined)}
            className="rounded-lg border border-stroke px-6 py-2 text-sm text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white">
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
