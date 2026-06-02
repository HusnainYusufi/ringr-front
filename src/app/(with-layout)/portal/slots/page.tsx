"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Slot {
  id: string;
  startsAt: string;
  endsAt: string;
  status: "AVAILABLE" | "HELD" | "BOOKED";
}

export default function SlotsPage() {
  const [providerId, setProviderId] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [genSuccess, setGenSuccess] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [genForm, setGenForm] = useState({
    startDate: today,
    endDate: nextMonth,
    slotDurationMinutes: 30,
  });

  useEffect(() => {
    api.get<{ data: { provider: { id: string } } }>("/providers/me").then((r) => {
      const id = r.data.provider.id;
      setProviderId(id);
      return api.get<{ data: Slot[] }>(`/providers/${id}/slots?from=${today}`);
    }).then((r) => setSlots(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [today]);

  async function generateSlots(e: React.FormEvent) {
    e.preventDefault();
    if (!providerId) return;
    setGenerating(true);
    setGenSuccess("");
    setError("");
    try {
      const res = await api.post<{ data: { created: number } }>(
        `/providers/${providerId}/slots/generate`,
        genForm,
      );
      setGenSuccess(`Generated ${res.data.created} new slots.`);
      // Reload slots
      const updated = await api.get<{ data: Slot[] }>(`/providers/${providerId}/slots?from=${today}`);
      setSlots(updated.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate slots");
    } finally {
      setGenerating(false);
    }
  }

  const STATUS_COLORS = {
    AVAILABLE: "bg-green-100 text-green-700",
    HELD: "bg-yellow-100 text-yellow-700",
    BOOKED: "bg-blue-100 text-blue-700",
  };

  const counts = {
    AVAILABLE: slots.filter((s) => s.status === "AVAILABLE").length,
    HELD: slots.filter((s) => s.status === "HELD").length,
    BOOKED: slots.filter((s) => s.status === "BOOKED").length,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark dark:text-white">Appointment Slots</h1>

      {/* Generate form */}
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
        <h2 className="mb-4 font-semibold text-dark dark:text-white">Generate Slots from Schedule</h2>
        <p className="mb-4 text-sm text-gray-400">
          Make sure you have set your <a href="/portal/schedule" className="text-primary hover:underline">opening hours</a> first.
        </p>
        <form onSubmit={generateSlots} className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="startDate" className="mb-1 block text-sm font-medium text-dark dark:text-white">From</label>
            <input id="startDate" type="date" value={genForm.startDate}
              onChange={(e) => setGenForm({ ...genForm, startDate: e.target.value })}
              className="rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
          </div>
          <div>
            <label htmlFor="endDate" className="mb-1 block text-sm font-medium text-dark dark:text-white">To</label>
            <input id="endDate" type="date" value={genForm.endDate}
              onChange={(e) => setGenForm({ ...genForm, endDate: e.target.value })}
              className="rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
          </div>
          <div>
            <label htmlFor="duration" className="mb-1 block text-sm font-medium text-dark dark:text-white">Slot Duration</label>
            <select id="duration" value={genForm.slotDurationMinutes}
              onChange={(e) => setGenForm({ ...genForm, slotDurationMinutes: parseInt(e.target.value) })}
              className="rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white">
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>60 min</option>
            </select>
          </div>
          <button type="submit" disabled={generating}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {generating ? "Generating…" : "Generate Slots"}
          </button>
        </form>
        {genSuccess && <p className="mt-3 text-sm text-green-600">{genSuccess}</p>}
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(Object.entries(counts) as [string, number][]).map(([status, count]) => (
          <div key={status} className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-dark">
            <p className="text-sm text-gray-400">{status.charAt(0) + status.slice(1).toLowerCase()}</p>
            <p className="mt-1 text-2xl font-bold text-dark dark:text-white">{count}</p>
          </div>
        ))}
      </div>

      {/* Slots list */}
      <div className="rounded-2xl bg-white shadow-sm dark:bg-gray-dark overflow-hidden">
        {loading ? (
          <p className="px-6 py-8 text-center text-sm text-gray-400">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stroke dark:border-dark-3">
                <th className="px-6 py-4 text-left font-semibold text-dark dark:text-white">Date & Time</th>
                <th className="px-6 py-4 text-left font-semibold text-dark dark:text-white">Duration</th>
                <th className="px-6 py-4 text-left font-semibold text-dark dark:text-white">Status</th>
              </tr>
            </thead>
            <tbody>
              {slots.slice(0, 50).map((s) => {
                const start = new Date(s.startsAt);
                const end = new Date(s.endsAt);
                const mins = Math.round((end.getTime() - start.getTime()) / 60000);
                return (
                  <tr key={s.id} className="border-b border-stroke last:border-0 dark:border-dark-3 hover:bg-gray-2 dark:hover:bg-[#1a2535]">
                    <td className="px-6 py-4 text-dark dark:text-white">{start.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-500">{mins} min</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status]}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && slots.length === 0 && (
          <p className="px-6 py-8 text-center text-sm text-gray-400">
            No slots yet. Set your schedule and generate slots above.
          </p>
        )}
        {slots.length > 50 && (
          <p className="px-6 py-3 text-center text-xs text-gray-400">Showing first 50 of {slots.length} slots.</p>
        )}
      </div>
    </div>
  );
}
