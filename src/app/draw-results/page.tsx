"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getLatestPublishedDrawDetails, getScoresByUserId, getCharities, getSubscriptionByUserId } from "@/lib/supabase/db";
import type { ScoreEntry, Charity } from "@/types/domain";
import Link from "next/link";

export default function DrawResultsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [drawData, setDrawData] = useState<any>(null);
  const [userScores, setUserScores] = useState<ScoreEntry[]>([]);
  const [charity, setCharity] = useState<Charity | null>(null);
  const [activeSubsCount, setActiveSubsCount] = useState(0);

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
        <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-10 text-center">
            <h1 className="text-4xl font-black text-zinc-900 mb-4">No Published Results.</h1>
            <p className="text-zinc-500 font-medium mb-10">Waiting for the next official draw transmission.</p>
            <div className="flex gap-4">
                <Link href="/dashboard" className="px-8 py-4 bg-[#4c49ed] text-white rounded-2xl font-black text-xs uppercase tracking-widest">Return Home</Link>
                <button onClick={handleRefresh} className="px-8 py-4 bg-white border border-zinc-200 text-zinc-900 rounded-2xl font-black text-xs uppercase tracking-widest">Check Again</button>
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
                        onClick={handleRefresh} 
                        className={`h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 transition-all ${refreshing ? 'animate-spin' : 'hover:scale-110'}`}
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                </div>
                <h1 className="text-9xl font-black tracking-tighter text-zinc-900 leading-none mb-12">The Winning Sequence</h1>
                
                <div className="flex justify-center gap-6 mb-16">
                    {winningNumbersFromDb.length > 0 ? winningNumbersFromDb.map((num: number, i: number) => (
                        <div key={i} className={`h-28 w-28 rounded-full flex items-center justify-center text-4xl font-black text-white shadow-2xl transition-transform hover:scale-110 cursor-default ${i === 4 ? 'bg-emerald-500 shadow-emerald-200' : 'bg-indigo-600 shadow-indigo-100'}`}>
                            {num.toString().padStart(2, '0')}
                        </div>
                    )) : (
                        <div className="py-10 text-zinc-300 font-bold italic">Sequence pending verification...</div>
                    )}
                </div>

                <div className="flex justify-center gap-4">
                    <div className="rounded-2xl bg-zinc-50 border border-zinc-100 px-6 py-4 flex items-center gap-3">
                        <svg className="h-5 w-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-sm font-bold text-zinc-600">
                          {new Date(drawData.draw.monthISO).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                    <div className="rounded-2xl bg-zinc-50 border border-zinc-100 px-6 py-4 flex items-center gap-3">
                         <svg className="h-5 w-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                         <span className="text-sm font-bold text-zinc-600 whitespace-nowrap uppercase tracking-widest">Draw #{drawData.draw.id.slice(0, 4).toUpperCase()}</span>
                    </div>
                </div>
          </div>
          {/* Background Gradient Blur */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(76,73,237,0.03),transparent)]" />
      </section>

      <div className="mx-auto max-w-7xl px-8 mt-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr]">
              
              <section className="space-y-8">
                  <div className="bg-white rounded-[48px] p-12 border border-zinc-50 shadow-[0_10px_40px_rgba(0,0,0,0.02)] relative overflow-hidden">
                      <div className="flex justify-between items-start mb-12">
                          <h2 className="text-4xl font-black tracking-tight text-zinc-900">Your Selection</h2>
                          <div className={`rounded-full border px-5 py-2 text-[10px] font-black uppercase tracking-widest ${myWinnerRecord ? 'bg-emerald-100/50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-400'}`}>
                             {matchedCount} Matches Found
                          </div>
                      </div>

                      <p className="text-[10px] font-black tracking-widest text-zinc-300 uppercase mb-6">Entry ID: {user?.id.slice(0, 8).toUpperCase()}</p>
                      
                      <div className="flex gap-4 mb-16">
                          {userNumbers.length > 0 ? userNumbers.map((num, i) => {
                              const isMatch = winningNumbersFromDb.includes(num);
                              return (
                                <div key={i} className={`h-20 w-24 rounded-3xl border-2 flex items-center justify-center relative transition-all ${isMatch ? 'border-emerald-500 bg-emerald-50/20' : 'border-zinc-100 bg-zinc-50/30'}`}>
                                    <span className={`text-2xl font-black ${isMatch ? 'text-emerald-500' : 'text-zinc-200'}`}>{num.toString().padStart(2, '0')}</span>
                                    {isMatch && (
                                        <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center shadow-lg">
                                            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                    )}
                                </div>
                              );
                          }) : (
                             <div className="py-4 text-zinc-400 font-bold">No recent scores found for this period.</div>
                          )}
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-50 pt-10">
                          <div>
                              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Impact Generated</p>
                              <p className="text-sm font-medium text-zinc-500 leading-relaxed max-w-sm">
                                Your contribution funded <span className="text-zinc-900 font-bold">₹100.00</span> in projects for <span className="text-indigo-600 font-bold">{charity?.name || "Green Initiatives"}</span>.
                              </p>
                          </div>
                          {myWinnerRecord && (
                            <div className="text-right">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Unclaimed Reward</p>
                                <p className="text-2xl font-black text-emerald-600 tabular-nums mb-4">{formatCurrency(myWinnerRecord.prizeAmountCents || 0)}</p>
                                <button className="bg-[#4c49ed] text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
                                  Claim Reward
                                </button>
                            </div>
                          )}
                      </div>
                      
                      {myWinnerRecord && (
                          <div className="absolute right-12 top-28 text-[11px] font-black text-indigo-600 uppercase tracking-widest">{myWinnerRecord.tier.toUpperCase()} WINNER</div>
                      )}
                  </div>

                  {/* BOTTOM IMPACT INFO CARD */}
                  <div className="bg-white rounded-[48px] p-16 border border-zinc-50 relative overflow-hidden shadow-sm group">
                      <div className="max-w-md relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <svg className="h-5 w-5 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">Where the impact goes</p>
                        </div>
                        <h2 className="text-6xl font-black tracking-tighter leading-none text-zinc-900 mb-8">This draw alone raised $142,000 for local charities.</h2>
                        <p className="text-base font-medium text-zinc-500 leading-relaxed mb-10">
                            By participating in the Fairway Impact Draw, you&apos;re not just playing for yourself. You&apos;re part of a collective lens focused on community uplift. Each ticket fuels our partner foundations&apos; missions across health, education, and environmental sustainability.
                        </p>
                        <Link href="/charities" className="flex items-center gap-3 text-indigo-600 font-black text-xs uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                            View Impact Partners <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </Link>
                      </div>
                      {/* Image Placeholder side */}
                      <div className="absolute right-[-10%] top-[-5%] bottom-[-5%] w-[40%] bg-zinc-100 rounded-l-[80px] flex items-center justify-center">
                            <svg className="h-20 w-20 text-zinc-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      
                      {/* Impact Tag overlay */}
                      <div className="absolute right-24 bottom-12 bg-white rounded-[32px] p-8 shadow-2xl border border-zinc-50 max-w-[240px] z-20">
                          <p className="text-4xl font-black text-indigo-600 tracking-tighter">12k+</p>
                          <p className="text-[10px] font-bold text-zinc-400 mt-3 leading-relaxed">Students supported with educational kits this month.</p>
                      </div>
                  </div>
              </section>

              <aside className="space-y-6">
                   <div className="bg-white rounded-[40px] p-10 border border-zinc-100 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-10">
                                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none">Jackpot</p>
                                <div className="h-10 w-10 bg-rose-50 rounded-2xl flex items-center justify-center">
                                    <svg className="h-6 w-6 text-rose-500" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
                                </div>
                            </div>
                            <h3 className="text-3xl font-black tracking-tight text-zinc-900 leading-none">5 Matches</h3>
                            <p className="text-5xl font-black tracking-tighter text-zinc-900 mt-6 leading-none">
                                {tier5Winners.length > 0 ? formatCurrency(tier5Winners[0].prizeAmountCents || 0) : formatCurrency(drawData.draw.jackpotRolloverCents || 0)}
                                {tier5Winners.length === 0 && <span className="text-base font-bold text-zinc-400 align-middle ml-4">Rollover</span>}
                            </p>
                            <div className="mt-10 rounded-full bg-zinc-50 px-5 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">
                               {tier5Winners.length} Winners This Draw
                            </div>
                        </div>
                   </div>

                   <div className="bg-white rounded-[40px] p-10 border border-zinc-100 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-2xl font-black tracking-tight text-zinc-900">4 Matches</h3>
                            <span className="rounded-full bg-indigo-50 px-4 py-1.5 text-[9px] font-black text-indigo-600 uppercase tracking-widest">Tier 2</span>
                        </div>
                        <p className="text-5xl font-black tracking-tighter text-zinc-900 leading-none">{formatCurrency(tier4Prize)}</p>
                        <p className="mt-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Split among {tier4Winners.length} winners</p>
                   </div>

                   <div className="bg-white rounded-[40px] p-10 border border-zinc-100 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-2xl font-black tracking-tight text-zinc-900">3 Matches</h3>
                            <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest">Tier 3</span>
                        </div>
                        <p className="text-5xl font-black tracking-tighter text-zinc-900 leading-none">{formatCurrency(tier3Prize)}</p>
                        <p className="mt-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Won by {tier3Winners.length} participants</p>
                   </div>
              </aside>
          </div>
      </div>
    </div>
  );
}
