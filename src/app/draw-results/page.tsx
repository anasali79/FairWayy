"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getLatestPublishedDrawDetails, getScoresByUserId, getCharities } from "@/lib/supabase/db";
import type { ScoreEntry, Charity } from "@/types/domain";
import Link from "next/link";

export default function DrawResultsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [drawData, setDrawData] = useState<any>(null);
  const [userScores, setUserScores] = useState<ScoreEntry[]>([]);
  const [charity, setCharity] = useState<Charity | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }
    if (user) {
      fetchEverything();
    }
  }, [user, loading]);

  const fetchEverything = async () => {
    try {
      const details = await getLatestPublishedDrawDetails();
      setDrawData(details);

      if (user) {
        const scores = await getScoresByUserId(user.id);
        setUserScores(scores);
        
        const charities = await getCharities();
        const myCharity = charities.find(c => c.id === user.charityId) || charities[0];
        setCharity(myCharity);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEverything();
    setRefreshing(false);
  };

  if (isLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!drawData) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f9fa] p-6 text-center sm:p-10">
            <h1 className="mb-3 text-2xl font-black text-zinc-900 sm:mb-4 sm:text-3xl md:text-4xl">No Published Results.</h1>
            <p className="mb-8 max-w-md text-sm font-medium text-zinc-500 sm:mb-10 sm:text-base">Waiting for the next official draw transmission.</p>
            <div className="flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:gap-4">
                <Link href="/dashboard" className="rounded-2xl bg-[#4c49ed] px-6 py-3.5 text-center text-xs font-black uppercase tracking-widest text-white sm:px-8 sm:py-4">Return Home</Link>
                <button type="button" onClick={handleRefresh} className="rounded-2xl border border-zinc-200 bg-white px-6 py-3.5 text-center text-xs font-black uppercase tracking-widest text-zinc-900 sm:px-8 sm:py-4">Check Again</button>
            </div>
        </div>
    );
  }

  const winningNumbersFromDb = drawData.draw.winningNumbers || [];
  
  // Find current user's entry in the winners list if any
  const myWinnerRecord = drawData.winners.find((w: any) => w.userId === user?.id);
  
  // For the UI, we still want to show the user's latest 5 scores for comparison
  const userNumbers = userScores.slice(0, 5).map(s => s.stableford);
  const matchedCount = myWinnerRecord ? myWinnerRecord.matchNumbers.length : userNumbers.filter(n => winningNumbersFromDb.includes(n)).length;

  const getWinnersByTier = (tier: string) => drawData.winners.filter((w: any) => w.tier === tier);
  const tier5Winners = getWinnersByTier("5-match");
  const tier4Winners = getWinnersByTier("4-match");
  const tier3Winners = getWinnersByTier("3-match");

  const tier4Prize = tier4Winners.length > 0 ? (tier4Winners[0].prizeAmountCents || 0) : 0;
  const tier3Prize = tier3Winners.length > 0 ? (tier3Winners[0].prizeAmountCents || 0) : 0;

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-900 font-sans pb-32 overflow-x-hidden pt-24">
      
      {/* HEADER SECTION */}
      <section className="bg-white border-b border-zinc-100 py-24 relative overflow-hidden rounded-b-[80px] shadow-sm">
          <div className="mx-auto max-w-7xl px-8 text-center relative z-10">
                <div className="flex items-center justify-center gap-4 mb-6">
                    <p className="text-[10px] font-black tracking-[0.4em] text-[#4c49ed] uppercase">Latest Draw Results</p>
                    <button 
                        type="button"
                        onClick={handleRefresh} 
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition-all ${refreshing ? 'animate-spin' : 'hover:scale-110'}`}
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                </div>
                <h1 className="mb-8 text-3xl font-black leading-[1.05] tracking-tighter text-zinc-900 sm:mb-10 sm:text-4xl md:mb-12 md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl">The Winning Sequence</h1>
                
                <div className="mb-10 flex flex-wrap justify-center gap-3 px-1 sm:mb-14 sm:gap-4 md:mb-16 md:gap-6">
                    {winningNumbersFromDb.length > 0 ? winningNumbersFromDb.map((num: number, i: number) => (
                        <div key={i} className={`flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-full text-lg font-black text-white shadow-xl transition-transform cursor-default sm:h-20 sm:w-20 sm:text-2xl sm:shadow-2xl md:h-24 md:w-24 md:text-3xl md:hover:scale-110 lg:h-28 lg:w-28 lg:text-4xl ${i === 4 ? 'bg-emerald-500 shadow-emerald-200' : 'bg-indigo-600 shadow-indigo-100'}`}>
                            {num.toString().padStart(2, '0')}
                        </div>
                    )) : (
                        <div className="py-8 text-sm font-bold italic text-zinc-300 sm:py-10 sm:text-base">Sequence pending verification...</div>
                    )}
                </div>

                <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                    <div className="flex items-center justify-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 sm:px-6 sm:py-4">
                        <svg className="h-5 w-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-xs font-bold text-zinc-600 sm:text-sm">
                          {new Date(drawData.draw.monthISO).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                    <div className="flex items-center justify-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 sm:px-6 sm:py-4">
                         <svg className="h-5 w-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                         <span className="whitespace-nowrap text-xs font-bold uppercase tracking-widest text-zinc-600 sm:text-sm">Draw #{drawData.draw.id.slice(0, 4).toUpperCase()}</span>
                    </div>
                </div>
          </div>
          {/* Background Gradient Blur */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(76,73,237,0.03),transparent)]" />
      </section>

      <div className="mx-auto mt-10 max-w-7xl px-4 sm:mt-14 sm:px-6 md:mt-20 md:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
              
              <section className="space-y-6 sm:space-y-8">
                  <div className="relative overflow-hidden rounded-[28px] border border-zinc-50 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.02)] sm:rounded-[36px] sm:p-8 md:rounded-[48px] md:p-12">
                      <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-start sm:justify-between md:mb-12">
                          <h2 className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl md:text-4xl">Your Selection</h2>
                          <div className={`w-fit rounded-full border px-4 py-2 text-[9px] font-black uppercase tracking-widest sm:px-5 sm:text-[10px] ${myWinnerRecord ? 'border-emerald-100 bg-emerald-100/50 text-emerald-600' : 'border-rose-100 bg-rose-50 text-rose-400'}`}>
                             {matchedCount} Matches Found
                          </div>
                      </div>

                      <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-zinc-300 sm:mb-6">Entry ID: {user?.id.slice(0, 8).toUpperCase()}</p>
                      
                      <div className="mb-10 flex flex-wrap gap-2 sm:mb-12 sm:gap-3 md:mb-16 md:gap-4">
                          {userNumbers.length > 0 ? userNumbers.map((num, i) => {
                              const isMatch = winningNumbersFromDb.includes(num);
                              return (
                                <div key={i} className={`relative flex h-[3.25rem] min-w-[3.25rem] items-center justify-center rounded-2xl border-2 transition-all sm:h-20 sm:min-w-[5.5rem] sm:rounded-3xl ${isMatch ? 'border-emerald-500 bg-emerald-50/20' : 'border-zinc-100 bg-zinc-50/30'}`}>
                                    <span className={`text-lg font-black sm:text-2xl ${isMatch ? 'text-emerald-500' : 'text-zinc-200'}`}>{num.toString().padStart(2, '0')}</span>
                                    {isMatch && (
                                        <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-lg sm:-right-3 sm:-top-3 sm:h-8 sm:w-8 sm:border-4">
                                            <svg className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                    )}
                                </div>
                              );
                          }) : (
                             <div className="py-4 text-zinc-400 font-bold">No recent scores found for this period.</div>
                          )}
                      </div>

                      <div className="flex flex-col gap-8 border-t border-zinc-50 pt-8 sm:flex-row sm:items-start sm:justify-between sm:pt-10">
                          <div className="min-w-0 flex-1">
                              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-indigo-600">Impact Generated</p>
                              <p className="max-w-sm text-sm font-medium leading-relaxed text-zinc-500">
                                Your contribution funded <span className="font-bold text-zinc-900">${100.00}</span> in projects for <span className="font-bold text-indigo-600">{charity?.name || "Green Initiatives"}</span>.
                              </p>
                          </div>
                          {myWinnerRecord && (
                            <div className="w-full shrink-0 text-left sm:w-auto sm:text-right">
                                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">Unclaimed Reward</p>
                                <p className="mb-3 text-xl font-black tabular-nums text-emerald-600 sm:mb-4 sm:text-2xl">{formatCurrency(myWinnerRecord.prizeAmountCents || 0)}</p>
                                <button type="button" className="w-full rounded-2xl bg-[#4c49ed] px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95 sm:w-auto sm:px-8 sm:py-5">
                                  Claim Reward
                                </button>
                            </div>
                          )}
                      </div>
                      
                      {myWinnerRecord && (
                          <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-indigo-600 sm:absolute sm:right-8 sm:top-24 sm:mt-0 sm:text-[11px] md:right-12 md:top-28">{myWinnerRecord.tier.toUpperCase()} WINNER</div>
                      )}
                  </div>

                  {/* BOTTOM IMPACT INFO CARD */}
                  <div className="group relative overflow-hidden rounded-[28px] border border-zinc-50 bg-white p-6 shadow-sm sm:rounded-[36px] sm:p-10 md:rounded-[48px] md:p-16">
                      <div className="relative z-10 max-w-full sm:max-w-md">
                        <div className="mb-6 flex items-center gap-3 sm:mb-8">
                            <svg className="h-5 w-5 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">Where the impact goes</p>
                        </div>
                        <h2 className="mb-6 text-2xl font-black leading-tight tracking-tighter text-zinc-900 sm:mb-8 sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">This draw alone raised $142,000 for local charities.</h2>
                        <p className="mb-8 text-sm font-medium leading-relaxed text-zinc-500 sm:mb-10 sm:text-base">
                            By participating in the Fairway Impact Draw, you&apos;re not just playing for yourself. You&apos;re part of a collective lens focused on community uplift. Each ticket fuels our partner foundations&apos; missions across health, education, and environmental sustainability.
                        </p>
                        <Link href="/charities" className="flex items-center gap-3 text-indigo-600 font-black text-xs uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                            View Impact Partners <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </Link>
                      </div>
                      {/* Image Placeholder — hidden on small screens to avoid overlap */}
                      <div className="pointer-events-none absolute bottom-0 right-0 top-0 hidden w-[38%] items-center justify-center rounded-l-[48px] bg-zinc-100 lg:flex xl:w-[40%] xl:rounded-l-[80px]">
                            <svg className="h-16 w-16 text-zinc-200 xl:h-20 xl:w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      
                      {/* Impact tag — static on mobile, absolute on xl+ */}
                      <div className="relative z-20 mt-8 rounded-2xl border border-zinc-50 bg-white p-5 shadow-xl sm:mt-10 sm:rounded-3xl sm:p-6 md:p-8 xl:absolute xl:bottom-10 xl:right-10 xl:mt-0 xl:max-w-[240px] xl:rounded-[32px] 2xl:right-24 2xl:bottom-12">
                          <p className="text-3xl font-black tracking-tighter text-indigo-600 sm:text-4xl">12k+</p>
                          <p className="mt-2 text-[10px] font-bold leading-relaxed text-zinc-400 sm:mt-3">Students supported with educational kits this month.</p>
                      </div>
                  </div>
              </section>

              <aside className="space-y-4 sm:space-y-6">
                   <div className="group relative overflow-hidden rounded-[28px] border border-zinc-100 bg-white p-6 shadow-sm sm:rounded-[36px] sm:p-8 md:rounded-[40px] md:p-10">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-10">
                                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none">Jackpot</p>
                                <div className="h-10 w-10 bg-rose-50 rounded-2xl flex items-center justify-center">
                                    <svg className="h-6 w-6 text-rose-500" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
                                </div>
                            </div>
                            <h3 className="text-2xl font-black leading-none tracking-tight text-zinc-900 sm:text-3xl">5 Matches</h3>
                            <p className="mt-4 text-3xl font-black leading-none tracking-tighter text-zinc-900 sm:mt-6 sm:text-4xl md:text-5xl">
                                {tier5Winners.length > 0 ? formatCurrency(tier5Winners[0].prizeAmountCents || 0) : formatCurrency(drawData.draw.jackpotRolloverCents || 0)}
                                {tier5Winners.length === 0 && <span className="ml-2 align-middle text-sm font-bold text-zinc-400 sm:ml-4 sm:text-base">Rollover</span>}
                            </p>
                            <div className="mt-10 rounded-full bg-zinc-50 px-5 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">
                               {tier5Winners.length} Winners This Draw
                            </div>
                        </div>
                   </div>

                   <div className="relative overflow-hidden rounded-[28px] border border-zinc-100 bg-white p-6 shadow-sm sm:rounded-[36px] sm:p-8 md:rounded-[40px] md:p-10">
                        <div className="mb-6 flex items-center justify-between sm:mb-10">
                            <h3 className="text-xl font-black tracking-tight text-zinc-900 sm:text-2xl">4 Matches</h3>
                            <span className="rounded-full bg-indigo-50 px-4 py-1.5 text-[9px] font-black text-indigo-600 uppercase tracking-widest">Tier 2</span>
                        </div>
                        <p className="text-3xl font-black leading-none tracking-tighter text-zinc-900 sm:text-4xl md:text-5xl">{formatCurrency(tier4Prize)}</p>
                        <p className="mt-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Split among {tier4Winners.length} winners</p>
                   </div>

                   <div className="relative overflow-hidden rounded-[28px] border border-zinc-100 bg-white p-6 shadow-sm sm:rounded-[36px] sm:p-8 md:rounded-[40px] md:p-10">
                        <div className="mb-6 flex items-center justify-between sm:mb-10">
                            <h3 className="text-xl font-black tracking-tight text-zinc-900 sm:text-2xl">3 Matches</h3>
                            <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest">Tier 3</span>
                        </div>
                        <p className="text-3xl font-black leading-none tracking-tighter text-zinc-900 sm:text-4xl md:text-5xl">{formatCurrency(tier3Prize)}</p>
                        <p className="mt-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Won by {tier3Winners.length} participants</p>
                   </div>
              </aside>
          </div>
      </div>
    </div>
  );
}
