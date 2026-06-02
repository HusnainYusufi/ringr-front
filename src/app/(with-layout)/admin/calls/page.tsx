"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface CallSession {
  id: string;
  callId: string;
  fromPhone: string;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
  bookingId: string | null;
  summary: string | null;
}

export default function AdminCallsPage() {
  const [calls, setCalls] = useState<CallSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");

  async function load(after?: string) {
    setLoading(true);
    try {
      const url = after ? `/admin/calls?cursor=${after}` : "/admin/calls";
      const res = await api.get<{ data: { data: CallSession[]; meta: { cursor: string | null; hasMore: boolean } } }>(url);
      const { data, meta } = res.data;
      setCalls((prev) => (after ? [...prev, ...data] : data));
      setCursor(meta.cursor);
      setHasMore(meta.hasMore);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function fmt(ms: number | null) {
    if (!ms) return "—";
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark dark:text-white">Call Sessions</h1>
      {error && <p className="text-red-500">{error}</p>}

      <div className="rounded-2xl bg-white shadow-sm dark:bg-gray-dark overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stroke dark:border-dark-3">
              <th className="px-6 py-4 text-left font-semibold text-dark dark:text-white">Caller</th>
              <th className="px-6 py-4 text-left font-semibold text-dark dark:text-white">Started</th>
              <th className="px-6 py-4 text-left font-semibold text-dark dark:text-white">Duration</th>
              <th className="px-6 py-4 text-left font-semibold text-dark dark:text-white">Booked?</th>
              <th className="px-6 py-4 text-left font-semibold text-dark dark:text-white">Summary</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((c) => (
              <tr key={c.id} className="border-b border-stroke last:border-0 dark:border-dark-3 hover:bg-gray-2 dark:hover:bg-[#1a2535]">
                <td className="px-6 py-4">
                  <p className="font-medium text-dark dark:text-white">{c.fromPhone}</p>
                  <p className="font-mono text-xs text-gray-400">{c.callId.slice(0, 20)}…</p>
                </td>
                <td className="px-6 py-4 text-dark dark:text-white">
                  {new Date(c.startedAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-dark dark:text-white">{fmt(c.durationMs)}</td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.bookingId ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {c.bookingId ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <p className="truncate text-xs text-gray-400">{c.summary ?? "—"}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="px-6 py-8 text-center text-sm text-gray-400">Loading…</p>}
        {!loading && calls.length === 0 && <p className="px-6 py-8 text-center text-sm text-gray-400">No calls yet.</p>}
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
