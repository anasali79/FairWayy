"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Charity, Draw, DrawWinner as DW, ScoreEntry, Subscription, WinnerSubmission } from "@/types/domain";
import {
  createSubscriptionInactiveForStripe,
  getCharities,
  getDraws,
  getDrawWinners,
  purchaseSubscriptionMock,
  getScoresByUserId,
  getSubscriptionByUserId,
  getWinnerSubmissions,
} from "@/lib/supabase/db";
import { DEFAULT_CURRENCY, PLAN_PRICES_CENTS } from "@/lib/pricing";

function fmtISODate(isoDate: string) {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function firstNameFromEmail(email: string) {
  const base = email.split("@")[0]?.trim();
  if (!base) return "Alex";
  const first = base.split(/[._-]/)[0];
  return first ? first[0].toUpperCase() + first.slice(1) : "Alex";
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-3xl px-4 py-10"><div className="text-sm text-zinc-600">Loading...</div></div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();

  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [charities, setCharities] = useState<Charity[]>([]);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [drawWinners, setDrawWinners] = useState<DW[]>([]);
  const [winnerSubmissions, setWinnerSubmissions] = useState<WinnerSubmission[]>([]);
  const [activatingPlan, setActivatingPlan] = useState<"monthly" | "yearly" | null>(null);
  const [activationError, setActivationError] = useState<string | null>(null);
  const stripeMode = process.env.NEXT_PUBLIC_STRIPE_MODE ?? "mock";

  const totalCharityPct = useMemo(() => {
    if (!user) return 0;
    return user.charityPct + user.donationPctExtra;
  }, [user]);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async (userId: string) => {
    const [sub, userScores, userDraws, userWinners, verifications] = await Promise.all([
      getSubscriptionByUserId(userId),
      getScoresByUserId(userId),
      getDraws(),
      getDrawWinners(),
      getWinnerSubmissions(),
    ]);
    setSubscription(sub);
    setScores(userScores.sort((a, b) => b.scoreDateISO.localeCompare(a.scoreDateISO)));
    setDraws(userDraws);
    setDrawWinners(userWinners);
    setWinnerSubmissions(verifications);
    return sub;
  }, []);

  useEffect(() => {
    getCharities()
      .then(setCharities)
      .catch(() => {
        setCharities([]);
      });
  }, []);

  useEffect(() => {
    refresh();
  }, []);

  // Verify and activate subscription after Stripe checkout success
  useEffect(() => {
    if (searchParams.get("checkout") !== "success" || !user) return;
    let cancelled = false;

    const verifyCheckout = async () => {
      try {
        const resp = await fetch("/api/stripe/verify-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });
        const data = await resp.json();
        if (!cancelled && data.subscription && data.status === "active") {
          setSubscription(data.subscription);
        } else if (!cancelled) {
          // Refetch from DB as fallback
          const sub = await getSubscriptionByUserId(user.id);
          setSubscription(sub);
        }
      } catch {
        // Fallback: just refetch
        if (!cancelled) {
          const sub = await getSubscriptionByUserId(user.id);
          setSubscription(sub);
        }
      }
      if (!cancelled) {
        router.replace("/dashboard", { scroll: false });
      }
    };

    verifyCheckout();
    return () => { cancelled = true; };
  }, [searchParams, user, router]);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setScores([]);
      setDraws([]);
      setDrawWinners([]);
      setWinnerSubmissions([]);
      return;
    }
    fetchDashboardData(user.id).catch(() => {});
  }, [user, fetchDashboardData]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="text-sm text-zinc-600 dark:text-zinc-300">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Sign in required</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Please login to manage your subscription and scores.
        </p>
        <button
          onClick={() => router.push("/auth/login")}
          className="mt-5 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-black/90 dark:bg-white dark:text-black"
        >
          Go to login
        </button>
      </div>
    );
  }

  const selectedCharity = charities.find((c) => c.id === user.charityId) ?? null;
  const publishedDraws = draws.filter((d) => d.status === "published").sort((a, b) => b.monthISO.localeCompare(a.monthISO));

  const drawHistoryRows = publishedDraws.slice(0, 5).map((d, idx) => {
    const isWinner = drawWinners.some(w => w.drawId === d.id && w.userId === user.id);
    return {
      id: d.id,
      name: `Monthly ${d.drawType}-Match`,
      date: fmtISODate(d.monthISO),
      pot: `$${(d.jackpotRolloverCents ? Math.round(d.jackpotRolloverCents / 100) : 5000 + idx * 1500).toLocaleString()}`,
      status: isWinner ? "Winner" : "Ended",
    };
  });
  const myWinners = drawWinners.filter((w) => w.userId === user.id);
  const myWinnerRows = myWinners.length;

  const totalWonCents = myWinners.reduce((sum, w) => sum + (w.prizeAmountCents ?? 0), 0);
  const wonDrawIds = new Set(myWinners.map((w) => w.drawId));
  const myWonDraws = draws.filter((d) => wonDrawIds.has(d.id)).sort((a, b) => b.monthISO.localeCompare(a.monthISO));
  const lastWinDate = myWonDraws[0]?.monthISO;

  const recentScores = scores.slice(0, 5);
  const monthlyGoal = 100;
  const donatedAmount = Math.round((subscription?.priceCents ?? 0) * (totalCharityPct / 100)) / 100;
  const impactPct = Math.min(100, Math.round((donatedAmount / monthlyGoal) * 100));
  const displayName = firstNameFromEmail(user.email);
  const isSubscriptionActive = subscription?.status === "active";
  const activatePlan = async (plan: "monthly" | "yearly") => {
    setActivatingPlan(plan);
    setActivationError(null);
    const now = new Date();
    const renewal = new Date(now);
    renewal.setMonth(now.getMonth() + (plan === "monthly" ? 1 : 12));
    const renewalISO = renewal.toISOString().slice(0, 10);

    try {
      if (stripeMode === "real") {
        await createSubscriptionInactiveForStripe({
          userId: user.id,
          plan,
          priceCents: PLAN_PRICES_CENTS[plan],
          currency: DEFAULT_CURRENCY,
          renewalISODate: renewalISO,
        });

        const resp = await fetch("/api/stripe/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan,
            userId: user.id,
            email: user.email,
          }),
        });

        const data = (await resp.json()) as { url?: string; error?: string };
        if (!resp.ok || !data.url) {
          throw new Error(data.error ?? "Failed to create checkout session.");
        }
        window.location.href = data.url;
        return;
      }

      await purchaseSubscriptionMock({
        userId: user.id,
        plan,
        priceCents: PLAN_PRICES_CENTS[plan],
        currency: DEFAULT_CURRENCY,
        renewalISODate: renewalISO,
      });
      const updatedSub = await getSubscriptionByUserId(user.id);
      setSubscription(updatedSub);
      await refresh();
    } catch (err) {
      console.error("Subscription activation failed:", err);
      setActivationError(err instanceof Error ? err.message : "Failed to activate subscription. Please try again.");
    } finally {
      setActivatingPlan(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-6xl font-semibold tracking-tight text-zinc-900">Welcome back, {displayName}.</h1>
      <p className="mt-3 max-w-3xl text-lg text-zinc-600">
        Your Impact today is supporting the {selectedCharity?.name ?? "Green Fields Initiative"}. Thank you for your continued contribution.
      </p>

      <section className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-4">
        <article className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-zinc-500">SUBSCRIPTION</p>
          {isSubscriptionActive ? (
            <>
              <p className="mt-2 text-4xl font-semibold text-zinc-900">• Active</p>
              <p className="mt-2 text-sm text-zinc-500">Renews {fmtISODate(subscription!.renewalISODate)}</p>
            </>
          ) : (
            <>
              <p className="mt-2 text-lg font-medium text-zinc-800">Not Subscribed</p>
              <p className="mt-2 text-sm text-zinc-500">Choose a plan to activate</p>
              {activationError && (
                <p className="mt-2 rounded-md bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 border border-rose-100">{activationError}</p>
              )}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  disabled={activatingPlan !== null}
                  onClick={() => activatePlan("monthly")}
                  className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {activatingPlan === "monthly" ? "Activating..." : "Activate Monthly"}
                </button>
                <button
                  disabled={activatingPlan !== null}
                  onClick={() => activatePlan("yearly")}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 disabled:opacity-60"
                >
                  {activatingPlan === "yearly" ? "Activating..." : "Activate Yearly"}
                </button>
              </div>
            </>
          )}
        </article>
        <article className="rounded-lg border border-zinc-200 bg-white p-6 hover:scale-105 transition-transform duration-300 cursor-pointer" onClick={() => router.push("/draw-results")}>
          <p className="text-[11px] font-semibold tracking-[0.22em] text-zinc-500">ACTIVE ENTRIES</p>
          <p className="mt-2 text-6xl font-semibold leading-none text-indigo-600">{isSubscriptionActive ? 1 : 0}</p>
          <p className="mt-2 text-sm text-zinc-500">Current cycle</p>
        </article>
        <article className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-zinc-500">TOTAL WINNINGS</p>
          <p className="mt-2 text-6xl font-semibold leading-none text-zinc-900">${Math.round(totalWonCents / 100).toLocaleString()}</p>
          <p className="mt-2 text-sm text-zinc-500">Last win: {lastWinDate ? fmtISODate(lastWinDate) : "N/A"}</p>
        </article>
        <article className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-zinc-500">TOTAL DONATED</p>
          <p className="mt-2 text-6xl font-semibold leading-none text-teal-700">${Math.round(donatedAmount)}</p>
          <p className="mt-2 text-sm text-zinc-500">{myWinnerRows} wins verified</p>
        </article>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <article className="rounded-lg border border-zinc-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-5xl font-semibold tracking-tight text-zinc-900">Score Performance</h2>
              <p className="mt-2 text-lg text-zinc-600">Your last 5 rounds at Pebble Beach</p>
            </div>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700">
              Handicap: {recentScores.length ? (recentScores.reduce((sum, s) => sum + s.stableford, 0) / recentScores.length / 4).toFixed(1) : "N/A"}
            </span>
          </div>
          <div className="mt-20 grid grid-cols-5 px-10 text-center text-lg text-zinc-700">
            {recentScores.length > 0 ? (
              recentScores.map((s) => s.stableford).reverse().map((score, idx) => (
                <div key={`${score}-${idx}`}>{score}</div>
              ))
            ) : (
              <div className="col-span-5 text-sm text-zinc-400">No score history available yet.</div>
            )}
          </div>
        </article>

        <article className="rounded-lg border border-zinc-200 bg-white p-6">
          <h3 className="text-5xl font-semibold tracking-tight text-zinc-900">Monthly Impact</h3>
          <p className="mt-3 text-lg text-zinc-700">You are raising funds for {selectedCharity?.name ?? "your selected charity"}.</p>
          <p className="mt-8 text-[11px] font-semibold tracking-[0.2em] text-zinc-500">MONTHLY GOAL</p>
          <p className="mt-2 text-right text-4xl font-semibold text-zinc-900">${Math.round(donatedAmount)} / ${monthlyGoal}</p>
          <div className="mt-3 h-3 rounded-full bg-zinc-100">
            <div className="h-3 rounded-full bg-teal-700" style={{ width: `${impactPct}%` }} />
          </div>
          <p className="mt-2 text-sm text-zinc-500">{impactPct}% goal reached this cycle</p>
        </article>
      </section>

      <section className="mt-8 rounded-lg border border-zinc-200 bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl">Draw History</h2>
          <button
            type="button"
            onClick={() => router.push("/winnings")}
            className="shrink-0 text-left text-sm font-semibold text-indigo-600 sm:text-base"
          >
            View All Records
          </button>
        </div>

        {/* Mobile: cards — status always visible */}
        <div className="mt-4 space-y-3 md:hidden">
          {drawHistoryRows.length === 0 ? (
            <p className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-4 py-6 text-center text-sm text-zinc-600">
              No published draw records yet.
            </p>
          ) : (
            drawHistoryRows.map((row) => (
              <div
                key={row.id}
                className="rounded-xl border border-zinc-200 bg-zinc-50/30 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-zinc-900">{row.name}</p>
                    <p className="mt-1 text-sm text-zinc-600">{row.date}</p>
                    <p className="mt-2 text-sm font-medium text-zinc-800">Pot {row.pot}</p>
                  </div>
                  <span
                    className={
                      row.status === "Winner"
                        ? "shrink-0 rounded-full bg-teal-100 px-3 py-1.5 text-xs font-semibold text-teal-700"
                        : row.status === "Entered"
                          ? "shrink-0 rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-700"
                          : "shrink-0 rounded-full bg-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700"
                    }
                  >
                    {row.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* md+: table — horizontal scroll so STATUS column is never clipped */}
        <div className="mt-6 hidden md:block">
          <div className="overflow-x-auto rounded-lg border border-zinc-200 [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[640px] text-left text-base">
              <thead className="bg-zinc-50 text-[11px] font-semibold tracking-[0.2em] text-zinc-500">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 lg:px-5">DRAW EVENT</th>
                  <th className="whitespace-nowrap px-4 py-3 lg:px-5">ENTRY DATE</th>
                  <th className="whitespace-nowrap px-4 py-3 lg:px-5">POT VALUE</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right lg:px-5">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {drawHistoryRows.map((row) => (
                  <tr key={row.id} className="border-t border-zinc-200">
                    <td className="px-4 py-4 font-medium text-zinc-800 lg:px-5">{row.name}</td>
                    <td className="px-4 py-4 text-zinc-600 lg:px-5">{row.date}</td>
                    <td className="px-4 py-4 font-medium text-zinc-800 lg:px-5">{row.pot}</td>
                    <td className="px-4 py-4 text-right lg:px-5">
                      <span
                        className={
                          row.status === "Winner"
                            ? "inline-block rounded-full bg-teal-100 px-3 py-1 text-sm font-semibold text-teal-700"
                            : row.status === "Entered"
                              ? "inline-block rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700"
                              : "inline-block rounded-full bg-zinc-200 px-3 py-1 text-sm font-semibold text-zinc-700"
                        }
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {drawHistoryRows.length === 0 ? (
                  <tr className="border-t border-zinc-200">
                    <td className="px-4 py-4 text-zinc-600 lg:px-5" colSpan={4}>
                      No published draw records yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

