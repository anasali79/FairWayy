"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Charity } from "@/types/domain";
import { getCharities } from "@/lib/supabase/db";

export default function CharityDetailPage() {
  const params = useParams<{ id: string }>();
  const [charity, setCharity] = useState<Charity | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await getCharities();
        const found = all.find((c) => c.id === params.id) ?? null;
        if (!cancelled) setCharity(found);
      } catch {
        if (!cancelled) setCharity(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      {charity ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            Charity profile
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-black dark:text-zinc-50">
            {charity.name}
          </h1>
          <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">{charity.description}</p>
          {charity.featured ? (
            <div className="mt-4 inline-flex items-center rounded-full bg-black px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-black">
              Featured
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm text-zinc-600 dark:text-zinc-300">Charity not found.</div>
        </div>
      )}
    </div>
  );
}

