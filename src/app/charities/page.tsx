"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { Charity } from "@/types/domain";
import { getCharities, updateUserCharityMock } from "@/lib/supabase/db";
import { seedCharities } from "@/lib/mock/seedCharities";

export default function CharitiesPage() {
  const { user, loading, refresh } = useAuth();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [query, setQuery] = useState("");
  const [selectedCharity, setSelectedCharity] = useState<Charity | null>(null);
  const [charityPct, setCharityPct] = useState<number>(10);
  const [donationPctExtra, setDonationPctExtra] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCharities()
      .then((items) => setCharities(items.length ? items : seedCharities))
      .catch(() => setCharities(seedCharities));
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!charities.length) return;
    const existing = charities.find((c) => c.id === user.charityId) ?? null;
    if (existing && !selectedCharity) setSelectedCharity(existing);
    setCharityPct(user.charityPct);
    setDonationPctExtra(user.donationPctExtra);
  }, [user, charities, selectedCharity]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return charities;
    return charities.filter((c) => `${c.name} ${c.description}`.toLowerCase().includes(q));
  }, [charities, query]);

  const featured = useMemo(() => filtered.filter((c) => c.featured), [filtered]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="text-sm text-zinc-700">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Charities</h1>
          <p className="mt-2 text-sm text-zinc-700">
            Choose where your subscription impact goes.
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search charities..."
          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 focus:border-zinc-500 md:w-72"
        />
      </div>

      {featured.length ? (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-zinc-900">Featured</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {featured.map((c) => (
              <div
                key={c.id}
                className="rounded-3xl border border-zinc-300 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-base font-semibold text-zinc-900">{c.name}</div>
                    <div className="mt-1 text-sm leading-6 text-zinc-700">{c.description}</div>
                  </div>
                  {user ? (
                    <button
                      onClick={() => setSelectedCharity(c)}
                      className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                    >
                      {user.charityId === c.id ? "Selected" : "Select"}
                    </button>
                  ) : (
                    <div className="text-xs font-medium text-zinc-500">Sign in to choose</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {filtered.map((c) => (
          <div key={c.id} className="rounded-3xl border border-zinc-300 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-base font-semibold text-zinc-900">
                  {c.featured ? "★ " : ""}
                  {c.name}
                </div>
                <div className="mt-1 text-sm leading-6 text-zinc-700">{c.description}</div>
              </div>
              {user ? (
                <button
                  onClick={() => setSelectedCharity(c)}
                  className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
                >
                  {user.charityId === c.id ? "Selected" : "Choose"}
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {selectedCharity && user ? (
        <div className="mt-8 rounded-3xl border border-zinc-300 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900">Update your charity settings</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-zinc-900">
              Selected charity
              <div className="mt-1 rounded-xl bg-zinc-100 px-3 py-2 text-sm text-zinc-900">
                {selectedCharity.name}
              </div>
            </label>
            <label className="block text-sm font-medium text-zinc-900">
              Charity %
              <input
                type="number"
                min={10}
                value={charityPct}
                onChange={(e) => setCharityPct(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
              />
            </label>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-zinc-900">
              Extra donation % (optional)
              <input
                type="number"
                min={0}
                value={donationPctExtra}
                onChange={(e) => setDonationPctExtra(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
              />
            </label>
          </div>

          {error ? <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              disabled={saving}
              onClick={async () => {
                setError(null);
                setSaving(true);
                try {
                  await updateUserCharityMock({
                    userId: user.id,
                    charityId: selectedCharity.id,
                    charityPct,
                    donationPctExtra,
                  });
                  refresh();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Failed to update settings.");
                } finally {
                  setSaving(false);
                }
              }}
              className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setSelectedCharity(null)}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

