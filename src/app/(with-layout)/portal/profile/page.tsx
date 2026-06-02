"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Provider {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  bio: string | null;
  lat: number;
  lng: number;
}

export default function PortalProfilePage() {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Partial<Provider>>({});

  useEffect(() => {
    api.get<{ data: { provider: Provider } }>("/providers/me")
      .then((r) => {
        setProvider(r.data.provider);
        setForm(r.data.provider);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const set = (k: keyof Provider, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError("");
    try {
      await api.patch("/providers/me", form);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-400">Loading profile…</p>;
  if (!provider) return <p className="text-red-500">{error}</p>;

  const field = (
    id: keyof Provider,
    label: string,
    type = "text",
    placeholder?: string,
  ) => (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-dark dark:text-white">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={String(form[id] ?? "")}
        onChange={(e) => set(id, type === "number" ? parseFloat(e.target.value) : e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark dark:text-white">Clinic Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
          <h2 className="mb-4 font-semibold text-dark dark:text-white">Basic Info</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("name", "Clinic Name")}
            {field("email", "Clinic Email", "email")}
            {field("phone", "Phone", "tel")}
            <div className="sm:col-span-2">
              <label htmlFor="bio" className="mb-1 block text-sm font-medium text-dark dark:text-white">Bio</label>
              <textarea
                id="bio"
                rows={3}
                value={form.bio ?? ""}
                onChange={(e) => set("bio", e.target.value)}
                placeholder="Describe your clinic…"
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
          <h2 className="mb-4 font-semibold text-dark dark:text-white">Location</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">{field("address", "Street Address")}</div>
            {field("city", "City")}
            {field("province", "Province")}
            {field("postalCode", "Postal Code")}
            <div className="sm:col-span-2 grid grid-cols-2 gap-4">
              {field("lat", "Latitude (exact)", "number", "43.6532")}
              {field("lng", "Longitude (exact)", "number", "-79.3832")}
            </div>
            <p className="sm:col-span-2 text-xs text-gray-400">
              Exact coordinates ensure the AI voice agent finds your clinic when customers search nearby.
              Use Google Maps → right-click your location → copy coordinates.
            </p>
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>}
        {success && <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">Profile saved!</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
