"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface ActionLog {
  id: string;
  actorEmail: string | null;
  actorRole: string | null;
  targetType: string;
  action: string;
  detail: string | null;
  createdAt: string;
}

const ACTION_ICONS: Record<string, string> = {
  "invite.sent": "📨",
  "invite.accepted": "🎉",
  "provider.setup_complete": "✅",
  "booking.confirmed": "📅",
  "booking.cancelled": "❌",
  "booking.completed": "✓",
};

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");

  async function load(after?: string) {
    setLoading(true);
    try {
      const url = after ? `/admin/activity?cursor=${after}&limit=50` : "/admin/activity?limit=50";
      const res = await api.get<{ data: { data: ActionLog[]; meta: { cursor: string | null; hasMore: boolean } } }>(url);
      const { data, meta } = res.data;
      setLogs((prev) => (after ? [...prev, ...data] : data));
      setCursor(meta.cursor);
      setHasMore(meta.hasMore);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(date).toLocaleDateString();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark dark:text-white">Activity Log</h1>
        <p className="text-sm text-gray-400">All platform actions — invites, joins, bookings, and more.</p>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <div className="rounded-2xl bg-white shadow-sm dark:bg-gray-dark">
        {loading && logs.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-gray-400">Loading…</p>
        ) : (
          <div className="divide-y divide-stroke dark:divide-dark-3">
            {logs.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-gray-400">No activity yet.</p>
            )}
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-2 dark:hover:bg-[#1a2535]">
                <span className="mt-0.5 text-2xl">{ACTION_ICONS[log.action] ?? "📋"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark dark:text-white">
                    {log.detail ?? log.action}
                  </p>
                  <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-gray-400">
                    {log.actorEmail && <span>{log.actorEmail}</span>}
                    {log.actorRole && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-[#1a2535]">
                        {log.actorRole.replace("_", " ")}
                      </span>
                    )}
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-[#1a2535]">
                      {log.targetType}
                    </span>
                  </div>
                </div>
                <time className="shrink-0 text-xs text-gray-400">{timeAgo(log.createdAt)}</time>
              </div>
            ))}
          </div>
        )}
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
