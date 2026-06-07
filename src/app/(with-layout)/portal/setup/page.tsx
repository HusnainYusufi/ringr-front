"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

type Step = "profile" | "hours" | "slots" | "done";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DEFAULT_HOURS = [1, 2, 3, 4, 5].map((d) => ({
  dayOfWeek: d,
  startTime: "09:00",
  endTime: "17:00",
  enabled: true,
}));

export default function SetupWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("profile");
  const [providerId, setProviderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Profile form
  const [profile, setProfile] = useState({
    name: "",
    address: "",
    city: "",
    province: "ON",
    postalCode: "",
    phone: "",
    email: "",
    bio: "",
    lat: "",
    lng: "",
  });

  // Hours
  const [hours, setHours] = useState(DEFAULT_HOURS);

  // Slots
  const today = new Date().toISOString().split("T")[0];
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [slotForm, setSlotForm] = useState({ startDate: today, endDate: nextMonth, slotDurationMinutes: 30 });
  const [slotsCreated, setSlotsCreated] = useState(0);

  const setP = (k: string, v: string) => setProfile((p) => ({ ...p, [k]: v }));
  const setH = (dayOfWeek: number, k: string, v: string | boolean) =>
    setHours((prev) => prev.map((h) => h.dayOfWeek === dayOfWeek ? { ...h, [k]: v } : h));

  // ── Step 1: Profile ───────────────────────────────────────────────────────
  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.get<{ data: { id: string } }>("/providers/me");
      const id = res.data.id;
      setProviderId(id);
      await api.patch("/providers/me", {
        ...profile,
        lat: parseFloat(profile.lat) || 0,
        lng: parseFloat(profile.lng) || 0,
      });
      setStep("hours");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Hours ─────────────────────────────────────────────────────────
  async function saveHours(e: React.FormEvent) {
    e.preventDefault();
    if (!providerId) return;
    setError("");
    setLoading(true);
    try {
      const schedules = hours.filter((h) => h.enabled).map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime }));
      await api.post(`/providers/${providerId}/schedules/replace-week`, { schedules });
      setStep("slots");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save hours");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: Slots + Go Live ───────────────────────────────────────────────
  async function generateAndGoLive(e: React.FormEvent) {
    e.preventDefault();
    if (!providerId) return;
    setError("");
    setLoading(true);
    try {
      const slotRes = await api.post<{ data: { created: number } }>(`/providers/${providerId}/slots/generate`, slotForm);
      setSlotsCreated(slotRes.data.created ?? 0);
      // Mark provider as live
      await api.post("/providers/me/complete-setup", {});
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate slots");
    } finally {
      setLoading(false);
    }
  }

  const STEPS: Step[] = ["profile", "hours", "slots", "done"];
  const stepIdx = STEPS.indexOf(step);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Progress */}
      <div>
        <h1 className="text-2xl font-bold text-dark dark:text-white">Set Up Your Clinic</h1>
        <p className="mt-1 text-sm text-gray-400">Complete these steps to go live and start receiving bookings.</p>
        <div className="mt-4 flex gap-2">
          {["Clinic Details", "Opening Hours", "Generate Slots"].map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                i < stepIdx ? "bg-green-500 text-white" :
                i === stepIdx ? "bg-primary text-white" :
                "bg-gray-200 text-gray-500 dark:bg-dark-3 dark:text-gray-400"
              }`}>
                {i < stepIdx ? "✓" : i + 1}
              </div>
              <span className={`text-sm ${i === stepIdx ? "font-semibold text-dark dark:text-white" : "text-gray-400"}`}>{label}</span>
              {i < 2 && <div className="flex-1 border-t border-stroke dark:border-dark-3" />}
            </div>
          ))}
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>}

      {/* ── Step 1: Profile ── */}
      {step === "profile" && (
        <form onSubmit={saveProfile} className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
            <h2 className="mb-4 font-semibold text-dark dark:text-white">Clinic Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { id: "name", label: "Clinic Name", placeholder: "Downtown Animal Hospital" },
                { id: "email", label: "Clinic Email", placeholder: "clinic@example.com", type: "email" },
                { id: "phone", label: "Phone", placeholder: "+14165550100", type: "tel" },
              ].map(({ id, label, placeholder, type = "text" }) => (
                <div key={id} className={id === "name" ? "sm:col-span-2" : ""}>
                  <label htmlFor={id} className="mb-1 block text-sm font-medium text-dark dark:text-white">{label}</label>
                  <input id={id} type={type} required value={(profile as Record<string, string>)[id]}
                    onChange={(e) => setP(id, e.target.value)} placeholder={placeholder}
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label htmlFor="bio" className="mb-1 block text-sm font-medium text-dark dark:text-white">Bio</label>
                <textarea id="bio" rows={2} value={profile.bio} onChange={(e) => setP("bio", e.target.value)}
                  placeholder="Tell customers about your clinic…"
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
            <h2 className="mb-1 font-semibold text-dark dark:text-white">Location</h2>
            <p className="mb-4 text-xs text-gray-400">Exact coordinates help the AI voice agent find you when customers call asking for nearby clinics.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { id: "address", label: "Street Address", span: true },
                { id: "city", label: "City" },
                { id: "province", label: "Province" },
                { id: "postalCode", label: "Postal Code" },
              ].map(({ id, label, span }) => (
                <div key={id} className={span ? "sm:col-span-2" : ""}>
                  <label htmlFor={id} className="mb-1 block text-sm font-medium text-dark dark:text-white">{label}</label>
                  <input id={id} type="text" required value={(profile as Record<string, string>)[id]}
                    onChange={(e) => setP(id, e.target.value)}
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
                </div>
              ))}
              <div>
                <label htmlFor="lat" className="mb-1 block text-sm font-medium text-dark dark:text-white">Latitude</label>
                <input id="lat" type="number" step="any" required value={profile.lat} onChange={(e) => setP("lat", e.target.value)}
                  placeholder="43.6532"
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
              </div>
              <div>
                <label htmlFor="lng" className="mb-1 block text-sm font-medium text-dark dark:text-white">Longitude</label>
                <input id="lng" type="number" step="any" required value={profile.lng} onChange={(e) => setP("lng", e.target.value)}
                  placeholder="-79.3832"
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
              </div>
              <p className="sm:col-span-2 text-xs text-gray-400">
                To find coordinates: open Google Maps → right-click your clinic → the first number is latitude, second is longitude.
              </p>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white disabled:opacity-60">
            {loading ? "Saving…" : "Save & Continue →"}
          </button>
        </form>
      )}

      {/* ── Step 2: Hours ── */}
      {step === "hours" && (
        <form onSubmit={saveHours} className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
            <h2 className="mb-1 font-semibold text-dark dark:text-white">Opening Hours</h2>
            <p className="mb-4 text-sm text-gray-400">Set which days and times you accept appointments.</p>
            <div className="space-y-3">
              {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                const row = hours.find((h) => h.dayOfWeek === day);
                const enabled = row?.enabled ?? false;
                return (
                  <div key={day} className="flex items-center gap-4 rounded-lg px-2 py-2">
                    <label className="flex w-32 cursor-pointer items-center gap-2">
                      <input type="checkbox" checked={enabled}
                        onChange={(e) => {
                          if (row) {
                            setH(day, "enabled", e.target.checked);
                          } else {
                            setHours((prev) => [...prev, { dayOfWeek: day, startTime: "09:00", endTime: "17:00", enabled: e.target.checked }]);
                          }
                        }}
                        className="h-4 w-4 accent-primary" />
                      <span className={`text-sm font-medium ${enabled ? "text-dark dark:text-white" : "text-gray-400"}`}>{DAYS[day]}</span>
                    </label>
                    {enabled && row ? (
                      <div className="flex items-center gap-2">
                        <input type="time" value={row.startTime} onChange={(e) => setH(day, "startTime", e.target.value)}
                          className="rounded-lg border border-stroke bg-transparent px-3 py-1.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
                        <span className="text-sm text-gray-400">to</span>
                        <input type="time" value={row.endTime} onChange={(e) => setH(day, "endTime", e.target.value)}
                          className="rounded-lg border border-stroke bg-transparent px-3 py-1.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Closed</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep("profile")}
              className="rounded-lg border border-stroke px-6 py-3 text-sm text-dark dark:border-dark-3 dark:text-white">
              ← Back
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 rounded-lg bg-primary py-3 text-sm font-semibold text-white disabled:opacity-60">
              {loading ? "Saving…" : "Save & Continue →"}
            </button>
          </div>
        </form>
      )}

      {/* ── Step 3: Slots ── */}
      {step === "slots" && (
        <form onSubmit={generateAndGoLive} className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
            <h2 className="mb-1 font-semibold text-dark dark:text-white">Generate Appointment Slots</h2>
            <p className="mb-4 text-sm text-gray-400">
              We&apos;ll generate available appointment slots from your opening hours. Customers will be able to book these through the AI voice agent.
            </p>
            <div className="flex flex-wrap gap-4">
              <div>
                <label htmlFor="startDate" className="mb-1 block text-sm font-medium text-dark dark:text-white">From</label>
                <input id="startDate" type="date" value={slotForm.startDate}
                  onChange={(e) => setSlotForm({ ...slotForm, startDate: e.target.value })}
                  className="rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
              </div>
              <div>
                <label htmlFor="endDate" className="mb-1 block text-sm font-medium text-dark dark:text-white">To</label>
                <input id="endDate" type="date" value={slotForm.endDate}
                  onChange={(e) => setSlotForm({ ...slotForm, endDate: e.target.value })}
                  className="rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
              </div>
              <div>
                <label htmlFor="duration" className="mb-1 block text-sm font-medium text-dark dark:text-white">Slot Duration</label>
                <select id="duration" value={slotForm.slotDurationMinutes}
                  onChange={(e) => setSlotForm({ ...slotForm, slotDurationMinutes: +e.target.value })}
                  className="rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white">
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep("hours")}
              className="rounded-lg border border-stroke px-6 py-3 text-sm text-dark dark:border-dark-3 dark:text-white">
              ← Back
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 rounded-lg bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
              {loading ? "Setting up…" : "🚀 Generate Slots & Go Live!"}
            </button>
          </div>
        </form>
      )}

      {/* ── Done ── */}
      {step === "done" && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center dark:border-green-800 dark:bg-green-900/20">
          <p className="text-4xl">🎉</p>
          <h2 className="mt-3 text-xl font-bold text-green-800 dark:text-green-300">You&apos;re live!</h2>
          <p className="mt-2 text-sm text-green-700 dark:text-green-400">
            {slotsCreated} appointment slots created. Customers can now book with you through the AI voice agent.
          </p>
          <button onClick={() => router.push("/portal")}
            className="mt-6 rounded-lg bg-green-600 px-8 py-3 text-sm font-semibold text-white hover:bg-green-700">
            Go to My Dashboard →
          </button>
        </div>
      )}
    </div>
  );
}
