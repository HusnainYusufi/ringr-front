"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Schedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DEFAULT_HOURS = [1, 2, 3, 4, 5].map((d) => ({
  dayOfWeek: d,
  startTime: "09:00",
  endTime: "17:00",
  enabled: true,
}));

export default function SchedulePage() {
  const [providerId, setProviderId] = useState<string | null>(null);
  const [rows, setRows] = useState(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<{ data: { provider: { id: string } } }>("/providers/me").then((r) => {
      const id = r.data.provider.id;
      setProviderId(id);
      return api.get<{ data: Schedule[] }>(`/providers/${id}/schedules`);
    }).then((r) => {
      const existing = r.data;
      if (existing.length > 0) {
        const mapped = DAYS.map((_, d) => {
          const found = existing.find((s) => s.dayOfWeek === d);
          return {
            dayOfWeek: d,
            startTime: found?.startTime ?? "09:00",
            endTime: found?.endTime ?? "17:00",
            enabled: !!found,
          };
        });
        setRows(mapped);
      }
    }).catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function update(dayOfWeek: number, key: "startTime" | "endTime" | "enabled", value: string | boolean) {
    setRows((prev) => prev.map((r) => r.dayOfWeek === dayOfWeek ? { ...r, [key]: value } : r));
  }

  async function handleSave() {
    if (!providerId) return;
    setSaving(true);
    setSuccess(false);
    setError("");
    try {
      const schedules = rows
        .filter((r) => r.enabled)
        .map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime }));
      await api.post(`/providers/${providerId}/schedules/replace-week`, { schedules });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-400">Loading schedule…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Opening Hours</h1>
          <p className="text-sm text-gray-400">Set your weekly schedule. Slots are generated from these hours.</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.dayOfWeek} className="flex items-center gap-4 rounded-lg px-4 py-3 transition hover:bg-gray-2 dark:hover:bg-[#1a2535]">
              <label className="flex cursor-pointer items-center gap-2 w-32">
                <input
                  type="checkbox"
                  checked={row.enabled}
                  onChange={(e) => update(row.dayOfWeek, "enabled", e.target.checked)}
                  className="h-4 w-4 rounded accent-primary"
                />
                <span className={`text-sm font-medium ${row.enabled ? "text-dark dark:text-white" : "text-gray-400"}`}>
                  {DAYS[row.dayOfWeek]}
                </span>
              </label>

              {row.enabled ? (
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={row.startTime}
                    onChange={(e) => update(row.dayOfWeek, "startTime", e.target.value)}
                    className="rounded-lg border border-stroke bg-transparent px-3 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                  />
                  <span className="text-sm text-gray-400">to</span>
                  <input
                    type="time"
                    value={row.endTime}
                    onChange={(e) => update(row.dayOfWeek, "endTime", e.target.value)}
                    className="rounded-lg border border-stroke bg-transparent px-3 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                  />
                </div>
              ) : (
                <span className="text-sm text-gray-400">Closed</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>}
      {success && <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">Schedule saved! Go to Slots to generate appointments.</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save Schedule"}
      </button>
    </div>
  );
}
