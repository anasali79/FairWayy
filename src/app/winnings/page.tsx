"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getDrawWinners, getDraws, getScoresByUserId, getWinnerSubmissionsByUser, upsertWinnerSubmission } from "@/lib/supabase/db";
import type { WinnerSubmission } from "@/types/domain";

export default function WinningsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [submissions, setSubmissions] = useState<WinnerSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }
    if (user) {
      fetchWinnings();
    }
  }, [user, loading]);

  const fetchWinnings = async () => {
    if (!user) return;
    try {
      const [userSubs, winners] = await Promise.all([
        getWinnerSubmissionsByUser(user.id),
        getDrawWinners(),
      ]);

      const myWinners = winners.filter((w) => w.userId === user.id);

      // If a user is a winner but submission row isn't created yet,
      // synthesize a pending claim so winnings page always shows claimable rows.
      const merged = myWinners.map((w) => {
        const existing = userSubs.find((s) => s.drawId === w.drawId && s.userId === user.id);
        if (existing) return existing;
        return {
          id: `pending-${w.drawId}-${user.id}`,
          drawId: w.drawId,
          userId: user.id,
          status: "pending" as const,
          payoutCents: w.prizeAmountCents,
          paymentStatus: "pending" as const,
          createdAtISO: new Date().toISOString(),
        };
      });

      // Fallback safety:
      // If winner rows/submissions are missing, infer claim from latest published draw numbers
      // against user's latest scores so claim still appears.
      if (merged.length === 0) {
        const [draws, scores] = await Promise.all([getDraws(), getScoresByUserId(user.id)]);
        const latestPublished = draws
          .filter((d) => d.status === "published" && Array.isArray(d.winningNumbers) && d.winningNumbers.length > 0)
          .sort((a, b) => b.monthISO.localeCompare(a.monthISO))[0];

        if (latestPublished) {
          const scoreSet = new Set(scores.map((s) => s.stableford));
          const matched = (latestPublished.winningNumbers ?? []).filter((n) => scoreSet.has(n));
          if (matched.length >= 3) {
            const tier = matched.length >= 5 ? "5-match" : matched.length === 4 ? "4-match" : "3-match";
            merged.push({
              id: `derived-${latestPublished.id}-${user.id}`,
              drawId: latestPublished.id,
              userId: user.id,
              status: "pending",
              payoutCents: tier === "5-match" ? 4000 : tier === "4-match" ? 2500 : 1200,
              paymentStatus: "pending",
              adminNotes: `Auto-detected from published draw (${tier}). Submit proof to verify payout.`,
              createdAtISO: new Date().toISOString(),
            });
          }
        }
      }

      setSubmissions(merged.sort((a, b) => b.createdAtISO.localeCompare(a.createdAtISO)));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadProof = async (sub: WinnerSubmission) => {
    if (!proofUrl) return;
    setUploadingId(sub.id);
    try {
        await upsertWinnerSubmission({
            drawId: sub.drawId,
            userId: user!.id,
            status: "pending",
            proofDataUrl: proofUrl,
        });
        setProofUrl("");
        setUploadingId(null);
        await fetchWinnings();
    } catch (e) {
        console.error(e);
        setUploadingId(null);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-20 sm:pb-32">
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-10 md:px-8 md:pt-12">
            
            {/* HEADER */}
            <div className="mb-10 sm:mb-14 md:mb-16">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-[#4c49ed] sm:mb-4 sm:tracking-[0.3em]">Official Verification</p>
                <h1 className="text-3xl font-black leading-[1.05] tracking-tighter text-zinc-900 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl">
                    Winnings & <span className="text-[#4c49ed]">Verification</span>
                </h1>
                <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-zinc-500 sm:mt-6 sm:text-lg md:text-xl">
                    Upload proof for any pending winner submissions to initiate the payout process.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:gap-8 md:gap-10">
                {submissions.map((sub) => (
                    <article key={sub.id} className="flex flex-col items-stretch gap-8 rounded-[24px] border border-zinc-100 bg-white p-5 shadow-[0_10px_40px_rgba(0,0,0,0.02)] sm:rounded-[32px] sm:p-8 md:gap-10 md:rounded-[40px] md:p-10 lg:flex-row lg:items-center">
                        
                        <div className="min-w-0 flex-1 space-y-4 sm:space-y-6">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                                <div className="rounded-full border border-zinc-100 bg-zinc-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-500 sm:px-5 sm:py-2 sm:text-[10px]">Draw: {sub.drawId.slice(0, 8).toUpperCase()}</div>
                                <div className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-widest sm:px-5 sm:py-2 sm:text-[10px] ${
                                    sub.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                    sub.status === 'rejected' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                    'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                }`}>Status: {sub.status}</div>
                            </div>
                            
                            <h2 className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl md:text-4xl">
                                {sub.payoutCents ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(sub.payoutCents / 100) : "Reward Pending Calculation"}
                            </h2>
                            
                            <p className="max-w-sm text-sm font-medium text-zinc-400">
                                {sub.adminNotes || "Submit your winning score card or screenshot to verify this claim."}
                            </p>
                        </div>

                        <div className="w-full space-y-4 lg:max-w-md lg:shrink-0 xl:w-[400px]">
                            {!sub.proofDataUrl && sub.status === 'pending' ? (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black tracking-widest text-zinc-300 uppercase mb-2 block">Proof URL / Data</label>
                                    <input 
                                        type="text"
                                        placeholder="https://imgur.com/your-proof"
                                        value={uploadingId === sub.id ? proofUrl : (uploadingId === null ? proofUrl : '')}
                                        onChange={(e) => setProofUrl(e.target.value)}
                                        className="w-full rounded-2xl bg-zinc-50 border border-zinc-100 p-5 text-sm font-bold focus:ring-2 ring-indigo-100 outline-none transition-all"
                                    />
                                    <button 
                                        onClick={() => handleUploadProof(sub)}
                                        disabled={uploadingId !== null}
                                        className="w-full bg-[#4c49ed] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {uploadingId === sub.id ? "Uploading..." : "Submit Proof"}
                                    </button>
                                </div>
                            ) : sub.proofDataUrl ? (
                                <div className="rounded-3xl bg-indigo-50/50 p-6 border border-indigo-100 flex items-center gap-4">
                                     <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
                                     </div>
                                     <div>
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Proof Submitted</p>
                                        <p className="text-[9px] font-bold text-indigo-400 truncate max-w-[200px] mt-1">{sub.proofDataUrl}</p>
                                     </div>
                                </div>
                            ) : (
                                <div className="rounded-3xl bg-zinc-50 p-6 flex items-center gap-4 opacity-50 grayscale">
                                     <div className="h-10 w-10 bg-zinc-200 rounded-xl" />
                                     <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Verification Required</p>
                                </div>
                            )}
                        </div>
                    </article>
                ))}

                {submissions.length === 0 && (
                    <div className="rounded-[32px] border-4 border-dashed border-zinc-50 p-10 text-center sm:rounded-[40px] sm:p-16 md:rounded-[48px] md:p-24">
                        <svg className="h-20 w-20 text-zinc-100 mx-auto mb-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <h3 className="text-2xl font-black text-zinc-200 tracking-tight uppercase">No active claims found</h3>
                        <p className="text-sm font-bold text-zinc-200 uppercase tracking-widest mt-4">Keep playing to generate impact and win</p>
                    </div>
                )}
            </div>

        </div>
    </div>
  );
}
