"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getScoresByUserId, upsertScoreMock } from "@/lib/supabase/db";
import type { ScoreEntry } from "@/types/domain";

export default function MyScoresPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [points, setPoints] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [course, setCourse] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }
    if (user) {
      fetchScores();
    }
  }, [user, loading]);

  const fetchScores = async () => {
    if (!user) return;
    try {
      const data = await getScoresByUserId(user.id);
      setScores(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !points || !date) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await upsertScoreMock({
        userId: user.id,
        stableford: parseInt(points),
        scoreDateISO: date,
        courseName: course,
      });
      setPoints("");
      setCourse("");
      await fetchScores();
    } catch (err: any) {
      setError(err.message || "Failed to add score");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-900 font-sans pb-20">
      <div className="mx-auto max-w-7xl px-8 pt-12">
        
        {/* HEADER */}
        <div className="mb-16">
            <p className="text-[10px] font-black tracking-[0.3em] text-[#4c49ed] uppercase mb-4">Performance Tracking</p>
            <h1 className="text-8xl font-black tracking-tighter leading-none text-zinc-900">
                Refine Your <span className="text-[#4c49ed]">Impact.</span>
            </h1>
            <p className="mt-6 text-xl font-medium text-zinc-500 max-w-2xl leading-relaxed">
                Log your latest Stableford points to update your handicap and influence the community leaderboard.
            </p>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_400px]">
            
            {/* NEW SCORE ENTRY */}
            <section>
                <div className="rounded-[40px] bg-white p-12 shadow-[0_4px_40px_rgba(0,0,0,0.02)] border border-zinc-50">
                    <h2 className="text-4xl font-black tracking-tight text-zinc-900 mb-2">New Score Entry</h2>
                    <p className="text-base font-medium text-zinc-400 mb-10">Input your latest round details below.</p>
                    
                    <form onSubmit={handleAddScore} className="space-y-10">
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                            <div>
                                <label className="text-[10px] font-black tracking-widest text-zinc-300 uppercase mb-4 block">Stableford Points</label>
                                <input 
                                    type="number" 
                                    value={points}
                                    onChange={(e) => setPoints(e.target.value)}
                                    placeholder="36"
                                    min="1"
                                    max="45"
                                    required
                                    className="w-full text-5xl font-black tracking-tighter border-b-2 border-zinc-100 py-4 focus:border-indigo-600 outline-none transition-colors placeholder:text-zinc-100"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black tracking-widest text-zinc-300 uppercase mb-4 block">Round Date</label>
                                <input 
                                    type="date" 
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                    className="w-full text-xl font-bold tracking-tight border-b-2 border-zinc-100 py-7 focus:border-indigo-600 outline-none transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black tracking-widest text-zinc-300 uppercase mb-4 block">Course Name (Optional)</label>
                            <input 
                                type="text" 
                                value={course}
                                onChange={(e) => setCourse(e.target.value)}
                                placeholder="Royal Lytham & St Annes"
                                className="w-full text-xl font-bold tracking-tight border-b-2 border-zinc-100 py-6 focus:border-indigo-600 outline-none transition-colors placeholder:text-zinc-100"
                            />
                        </div>

                        {error && (
                            <div className="rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-500 border border-rose-100">
                                {error}
                            </div>
                        )}

                        <button 
                            disabled={isSubmitting}
                            type="submit"
                            className="bg-[#4c49ed] text-white px-10 py-6 rounded-2xl flex items-center gap-3 font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 active:scale-95"
                        >
                            {isSubmitting ? "Processing..." : "Add Score"}
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M12 4v16m8-8H4" /></svg>
                        </button>
                    </form>
                </div>
            </section>

            {/* RECENT SCORES */}
            <aside>
                <div className="flex justify-between items-end mb-8">
                    <h3 className="text-xl font-black tracking-tight text-zinc-900">Recent Scores</h3>
                    <span className="text-[9px] font-black bg-zinc-100 px-3 py-1 rounded-full uppercase tracking-widest text-zinc-500">Last 5 Rounds</span>
                </div>

                <div className="space-y-4">
                    {scores.map((score, i) => (
                        <article key={score.id} className="rounded-3xl bg-white p-6 border border-zinc-50 shadow-sm flex items-center gap-6 group hover:translate-x-2 transition-transform cursor-default">
                            <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-xl font-black text-[#4c49ed] shadow-sm">
                                {score.stableford}
                            </div>
                            <div>
                                <h4 className="font-black text-zinc-900 tracking-tight text-lg leading-none">{score.courseName || "Unknown Course"}</h4>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase mt-2 tracking-widest">
                                    {new Date(score.scoreDateISO).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                            </div>
                        </article>
                    ))}

                    {scores.length === 0 && (
                        <div className="rounded-[40px] border-2 border-dashed border-zinc-100 p-12 text-center">
                            <p className="text-xs font-black text-zinc-300 uppercase tracking-[0.2em]">No rounds logged</p>
                        </div>
                    )}
                    
                    {/* Placeholder for "Will be replaced" logic if list is long */}
                    {scores.length === 5 && (
                        <div className="rounded-3xl border border-zinc-100 border-dashed p-6 flex items-center justify-between opacity-50 grayscale">
                             <div className="flex items-center gap-4">
                                <div className="h-10 w-10 border border-zinc-100 rounded-xl" />
                                <div className="h-3 w-32 bg-zinc-100 rounded-full" />
                             </div>
                             <span className="text-[8px] font-black text-zinc-300 uppercase">Oldest entry</span>
                        </div>
                    )}
                </div>

                {/* INFO BOX */}
                <div className="mt-12 rounded-[32px] bg-emerald-50/50 border border-emerald-100 p-8 flex gap-5">
                    <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Rolling Handicap Logic</h5>
                        <p className="text-xs font-semibold text-emerald-800/70 leading-relaxed">
                            Only your 5 most recent rounds contribute to your Fairway Impact score. Adding a new round will archive your oldest entry.
                        </p>
                    </div>
                </div>
            </aside>

        </div>
      </div>
    </div>
  );
}
