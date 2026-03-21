"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getWinnerSubmissions, upsertWinnerSubmission } from "@/lib/supabase/db";
import type { WinnerSubmission } from "@/types/domain";

export default function WinnerVerificationPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const [submissions, setSubmissions] = useState<WinnerSubmission[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");

  const selected = submissions.find(s => s.id === selectedId) ?? null;

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    refresh();
  }, [user]);

  const refresh = async () => {
    setFetching(true);
    try {
      const data = await getWinnerSubmissions();
      setSubmissions(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } finally {
      setFetching(false);
    }
  };

  const handleAction = async (status: WinnerSubmission["status"], paymentStatus?: WinnerSubmission["paymentStatus"]) => {
    if (!selected) return;
    setSaving(true);
    try {
      await upsertWinnerSubmission({
        drawId: selected.drawId,
        userId: selected.userId,
        status,
        paymentStatus,
        adminNotes: note || selected.adminNotes,
      });
      await refresh();
      setNote("");
    } catch (e) {
      alert("Error processing action: " + (e instanceof Error ? e.message : "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  if (loading || fetching) return <div className="p-10 text-zinc-500">Loading Verifications...</div>;

  if (!user || user.role !== "admin") {
    return <div className="p-10">Access Denied</div>;
  }

  const totalDisbursed = submissions
    .filter(s => s.paymentStatus === "paid")
    .reduce((acc, s) => acc + (s.payoutCents ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-20 pt-10 font-sans">
      <div className="mx-auto max-w-[1400px] px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900">Winner Verification</h1>
          <p className="mt-2 text-base text-zinc-500 font-medium max-w-2xl leading-relaxed">
            High-precision workflow for score validation and prize disbursement. Ensure transparency across every impact dollar.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr_320px]">
          {/* Left Column: Queue */}
          <div className="space-y-6">
            <div className="rounded-[24px] bg-white p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-zinc-100">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-sm font-black tracking-[0.15em] text-zinc-900 uppercase">Active Queue</h2>
                 <span className="rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] font-black text-white">{submissions.filter(s => s.status === 'pending').length} Pending</span>
               </div>
               
               <div className="space-y-3">
                 {submissions.length === 0 ? (
                    <p className="text-xs text-zinc-400 py-4 text-center">No submissions found</p>
                 ) : (
                    submissions.map(s => (
                        <button 
                            key={s.id}
                            onClick={() => setSelectedId(s.id)}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${
                                selectedId === s.id 
                                ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' 
                                : 'bg-white border-zinc-100 hover:border-zinc-300'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-bold text-zinc-900">User: {s.userId.slice(0, 8)}</p>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                                    s.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                                    s.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                }`}>
                                    {s.status === 'pending' ? 'Review' : s.status}
                                </span>
                            </div>
                            <p className="text-[10px] font-medium text-zinc-500">ID: {s.id.slice(0, 10)}</p>
                        </button>
                    ))
                 )}
               </div>
            </div>

            <div className="rounded-[24px] bg-[#e3fdf5] p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-emerald-100 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <div>
                    <p className="text-[10px] font-black tracking-[0.1em] text-[#006d5c] uppercase">Total Disbursed</p>
                    <p className="text-2xl font-black text-zinc-900">₹{(totalDisbursed / 100).toLocaleString()}</p>
                </div>
            </div>
          </div>

          {/* Center Column: Verification Detail */}
          <div className="space-y-8">
            <div className="rounded-[24px] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-zinc-100 overflow-hidden">
               <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Scorecard Verification</h3>
                  <div className="flex gap-4 text-zinc-400">
                    <button className="hover:text-indigo-600 transition-colors">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                    </button>
                    <button className="hover:text-indigo-600 transition-colors">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                  </div>
               </div>
               
               <div className="aspect-[4/2.5] bg-[#fdfdfd] flex items-center justify-center p-12 overflow-hidden relative group">
                  {selected?.proofDataUrl ? (
                    <img src={selected.proofDataUrl} alt="Scorecard Proof" className="max-h-full max-w-full shadow-2xl rounded" />
                  ) : (
                    <div className="text-center">
                        <div className="h-24 w-24 mx-auto bg-zinc-50 rounded-full flex items-center justify-center border border-dashed border-zinc-200">
                            <svg className="h-10 w-10 text-zinc-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <p className="mt-4 text-sm text-zinc-400 font-medium">No scorecard image uploaded yet.</p>
                    </div>
                  )}
               </div>

               <div className="grid grid-cols-3 p-8 border-t border-zinc-50 bg-[#fafafa]/50">
                  <div>
                    <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Date Played</p>
                    <p className="mt-1 text-sm font-bold text-zinc-900">{selected ? new Date(selected.createdAtISO).toLocaleDateString() : '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Course Rating</p>
                    <p className="mt-1 text-sm font-bold text-zinc-900">72.1 / 131</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Attested By</p>
                    <p className="mt-1 text-sm font-bold text-zinc-900">Pro-Shop Staff</p>
                  </div>
               </div>
            </div>

            <div className="rounded-[24px] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-zinc-100 overflow-hidden">
                <div className="p-6 border-b border-zinc-50 flex items-center justify-between">
                    <h3 className="text-base font-bold text-zinc-900 tracking-tight">Internal Audit Thread</h3>
                    <button className="text-zinc-300 hover:text-zinc-500 transition-colors">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                </div>
                
                <div className="p-6 space-y-6 max-h-[300px] overflow-y-auto min-h-[140px]">
                    {selected?.adminNotes ? (
                        <div className="flex gap-4">
                            <div className="h-8 w-8 rounded-full bg-zinc-900 flex items-center justify-center text-[10px] text-white font-bold">A</div>
                            <div className="flex-1 bg-zinc-50 p-4 rounded-2xl rounded-tl-none">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[11px] font-bold text-zinc-900">Admin</p>
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase">Recent</p>
                                </div>
                                <p className="text-xs text-zinc-600 leading-relaxed font-medium">{selected.adminNotes}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10 opacity-30 italic text-zinc-400 text-xs">Internal collaboration messages...</div>
                    )}
                </div>

                <div className="p-6 border-t border-zinc-50 bg-white">
                    <div className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-2">
                        <input 
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Add an internal note..." 
                            className="flex-1 bg-transparent py-2 text-xs font-medium text-zinc-900 outline-none" 
                        />
                        <button className="text-indigo-600 hover:text-indigo-700 transition-colors">
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </button>
                    </div>
                </div>
            </div>
          </div>

          {/* Right Column: Actons */}
          <div className="space-y-6">
            <div className="rounded-[24px] bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-zinc-100 flex flex-col min-h-[400px]">
                <h3 className="text-xl font-bold text-zinc-900 tracking-tight mb-8">Final Action</h3>

                <div className="space-y-4 mt-auto">
                    <button 
                        disabled={!selected || saving || selected.status === 'approved'}
                        onClick={() => handleAction('approved', 'paid')}
                        className="w-full rounded-xl bg-[#006d5c] py-4 text-xs font-bold text-white shadow-[0_4px_12px_rgba(0,109,92,0.2)] hover:bg-[#005a4d] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
                        Approve & Disburse
                    </button>

                    <button 
                        disabled={!selected || saving || selected.paymentStatus === 'paid'}
                        onClick={() => handleAction('approved', 'paid')}
                        className="w-full rounded-xl bg-white border border-zinc-100 py-4 text-xs font-bold text-zinc-900 shadow-sm hover:bg-zinc-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                        Mark as Paid
                    </button>

                    <div className="pt-4 border-t border-zinc-50 flex items-center gap-3">
                        <button 
                            disabled={!selected || saving || selected.status === 'rejected'}
                            onClick={() => handleAction('rejected')}
                            className="flex-1 rounded-xl bg-rose-600 py-3.5 text-xs font-bold text-white hover:bg-rose-700 transition-all disabled:opacity-50"
                        >
                            Reject
                        </button>
                        <button className="flex items-center justify-center gap-1.5 px-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-zinc-600 transition-colors">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 01-2 2zm9-13.5V9" /></svg>
                             Escalate
                        </button>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
