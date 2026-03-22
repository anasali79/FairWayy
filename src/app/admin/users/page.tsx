"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllProfiles, getUserDetailedHistory, updateUserCharityMock, deleteScore } from "@/lib/supabase/db";

type UserProfile = Awaited<ReturnType<typeof getAllProfiles>>[number];
type UserHistory = Awaited<ReturnType<typeof getUserDetailedHistory>>;

export default function UserManagementPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<UserHistory | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const refresh = async () => {
    setFetching(true);
    try {
        const data = await getAllProfiles();
        setProfiles(data);
    } finally {
        setFetching(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== "admin") {
      setFetching(false);
      return;
    }
    refresh();
  }, [user]);

  const handleSelectUser = async (p: UserProfile) => {
    setSelectedProfile(p);
    setLoadingHistory(true);
    try {
        const hist = await getUserDetailedHistory(p.userId);
        setSelectedHistory(hist);
    } catch (e) {
        console.error("Error loading history", e);
    } finally {
        setLoadingHistory(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!selectedProfile) return;
    setIsSaving(true);
    try {
        await updateUserCharityMock({
            userId: selectedProfile.userId,
            charityId: selectedProfile.charityId,
            charityPct: selectedProfile.charityPct,
            donationPctExtra: selectedProfile.donationPctExtra,
            role: selectedProfile.role,
        });
        await refresh();
        // alert("Member updated successfully");
    } catch (e) {
        alert("Error updating member");
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteScore = async (scoreId: string) => {
    if (!confirm("Are you sure you want to delete this score?")) return;
    try {
        await deleteScore(scoreId);
        if (selectedProfile) {
            handleSelectUser(selectedProfile);
        }
    } catch (e) {
        alert("Error deleting score");
    }
  };

  if (loading || fetching) return <div className="p-10 text-zinc-500">Loading Users...</div>;

  if (!user || user.role !== "admin") {
    return <div className="p-10 text-zinc-900 font-bold">Access Denied</div>;
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  return (
    <div className="min-h-screen bg-[#f1f3f5] pb-20 pt-6 font-sans sm:pt-10">
      <div className="mx-auto max-w-[1300px] px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl md:text-5xl">User Management</h1>
            <p className="mt-2 text-sm font-medium tracking-tight text-zinc-500 sm:text-base md:text-lg">Manage member accounts, subscriptions, and roles.</p>
          </div>
          <button type="button" className="w-full shrink-0 rounded-2xl bg-[#4c49ed] px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 sm:w-auto sm:px-8 sm:py-4">
            Add New User
          </button>
        </div>

        {/* Mobile: card list — full member + Details always visible */}
        <div className="space-y-3 md:hidden">
          {profiles.map((p) => (
            <div
              key={p.userId}
              className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-black text-indigo-600">
                  {p.userId.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-zinc-900">{p.userId.slice(0, 12)}…</p>
                  <p className="mt-0.5 text-[11px] font-medium text-zinc-400">Joined {new Date(p.createdAtISO).toLocaleDateString()}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-wider ${
                        p.subscription?.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
                      }`}
                    >
                      {p.subscription?.status ?? "Inactive"}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{p.role}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSelectUser(p)}
                className="mt-4 w-full rounded-xl bg-[#f1f3f5] py-3 text-[10px] font-black uppercase tracking-widest text-zinc-600 transition-all hover:bg-zinc-200"
              >
                View details
              </button>
            </div>
          ))}
        </div>

        {/* Desktop: User Table */}
        <div className="hidden rounded-[32px] border border-zinc-50 bg-white p-6 shadow-[0_4px_30px_rgba(0,0,0,0.03)] md:block md:p-10">
           <div className="overflow-x-auto">
             <table className="w-full min-w-[640px] text-left">
               <thead className="text-[10px] font-black tracking-[0.2em] text-zinc-300 uppercase border-b border-zinc-50">
                 <tr>
                    <th className="pb-6">Member</th>
                    <th className="pb-6">Status</th>
                    <th className="pb-6">Role</th>
                    <th className="pb-6 text-right">Action</th>
                 </tr>
               </thead>
               <tbody>
                  {profiles.map(p => (
                    <tr key={p.userId} className="group border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors">
                       <td className="py-6">
                          <div className="flex items-center gap-4">
                             <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center font-black text-indigo-600">
                                {p.userId.slice(0, 1).toUpperCase()}
                             </div>
                             <div>
                                <p className="text-base font-bold text-zinc-900">{p.userId.slice(0, 12)}...</p>
                                <p className="text-xs text-zinc-400 font-medium">Joined {new Date(p.createdAtISO).toLocaleDateString()}</p>
                             </div>
                          </div>
                       </td>
                       <td className="py-6">
                            <span className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider ${
                                p.subscription?.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                            }`}>
                                {p.subscription?.status ?? 'Inactive'}
                            </span>
                       </td>
                       <td className="py-6">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{p.role}</span>
                       </td>
                       <td className="py-6 text-right">
                          <button 
                            onClick={() => handleSelectUser(p)}
                            className="rounded-xl bg-[#f1f3f5] px-6 py-3 text-[10px] font-black text-zinc-600 hover:bg-zinc-200 transition-all uppercase tracking-widest"
                          >
                            Details
                          </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
             </table>
           </div>
        </div>

        {/* User Details Modal */}
        {selectedProfile && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/40 p-0 backdrop-blur-md sm:items-center sm:p-4 md:p-6">
                <div className="relative flex max-h-[min(92vh,900px)] w-full max-w-[960px] flex-col overflow-y-auto overflow-x-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[36px] lg:max-h-[min(88vh,920px)] lg:flex-row lg:overflow-hidden lg:rounded-[48px]">
                    {/* Sidebar */}
                    <div className="flex w-full shrink-0 flex-col items-center border-b border-zinc-50 bg-[#f8f9fa] p-6 sm:p-8 lg:w-[300px] lg:border-b-0 lg:border-r lg:p-10 xl:w-[340px]">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#4c49ed] text-3xl font-black text-white shadow-2xl shadow-indigo-100 sm:mb-8 sm:h-24 sm:w-24 sm:text-4xl lg:h-28 lg:w-28 lg:rounded-[36px]">
                            {selectedProfile.userId.slice(0, 1).toUpperCase()}
                        </div>
                        <h3 className="mb-1 text-center text-xl font-black leading-none tracking-tighter text-zinc-900 sm:text-2xl">Member {selectedProfile.userId.slice(0, 8)}</h3>
                        <p className="mb-8 text-center text-xs font-bold text-zinc-400 sm:mb-10 sm:text-sm lg:mb-12">golf-pro-{selectedProfile.userId.slice(0, 4)}@fairway.com</p>
                        
                        <div className="w-full space-y-10">
                            <div>
                                <p className="text-[10px] font-black tracking-[0.2em] text-zinc-300 uppercase mb-3">Account Status</p>
                                <span className={`rounded-xl px-4 py-1.5 text-[11px] font-black uppercase tracking-wider ${
                                    selectedProfile.subscription?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                }`}>
                                    {selectedProfile.subscription?.status === 'active' ? 'Active Premium' : 'Inactive Plan'}
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black tracking-[0.2em] text-zinc-300 uppercase mb-3">Member Since</p>
                                <p className="text-sm font-black text-zinc-900">{new Date(selectedProfile.createdAtISO).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black tracking-[0.2em] text-zinc-300 uppercase mb-3">Impact Category</p>
                                <p className="text-sm font-black text-zinc-900">Education & Youth</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="relative flex-1 p-5 sm:p-8 lg:p-12 xl:p-14">
                        <button 
                            type="button"
                            onClick={() => {
                                setSelectedProfile(null);
                                setSelectedHistory(null);
                            }}
                            className="absolute right-4 top-4 text-zinc-300 transition-colors hover:text-zinc-600 sm:right-6 sm:top-6 lg:right-10 lg:top-10 xl:right-12 xl:top-12"
                            aria-label="Close"
                        >
                            <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </button>

                        <div className="mb-8 grid grid-cols-1 gap-4 sm:mb-10 sm:grid-cols-2 sm:gap-6 lg:mb-14 lg:gap-8">
                            <div className="rounded-2xl border border-zinc-100 bg-[#f8f9fa] p-6 sm:rounded-[28px] sm:p-8 lg:rounded-[32px] lg:p-10">
                                <p className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">Total Impact Won</p>
                                <h4 className="mt-3 text-2xl font-black leading-none tracking-tighter text-[#5d5bf6] transition-all sm:mt-5 sm:text-3xl lg:text-4xl">
                                    {loadingHistory ? "..." : formatCurrency(selectedHistory?.winnings.reduce((acc, w) => acc + w.payoutCents, 0) ?? 0)}
                                </h4>
                            </div>
                            <div className="rounded-2xl border border-zinc-100 bg-[#f8f9fa] p-6 sm:rounded-[28px] sm:p-8 lg:rounded-[32px] lg:p-10">
                                <p className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">Points Balance</p>
                                <h4 className="mt-3 text-2xl font-black leading-none tracking-tighter text-zinc-900 transition-all sm:mt-5 sm:text-3xl lg:text-4xl">
                                    {loadingHistory ? "..." : (selectedHistory?.scores.reduce((acc, s) => acc + s.stableford, 0) ?? 0).toLocaleString()}
                                </h4>
                            </div>
                        </div>

                        <div className="mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                            <h4 className="text-lg font-black tracking-tight text-zinc-900 sm:text-xl">Recent Scoring History</h4>
                            <span className="w-fit text-[10px] font-black uppercase tracking-widest text-[#4c49ed] border-b-2 border-indigo-600 pb-1">Verified data</span>
                        </div>

                        <div className="custom-scrollbar mb-8 max-h-[220px] space-y-3 overflow-y-auto pr-2 sm:mb-10 sm:max-h-[260px] sm:space-y-4">
                           {loadingHistory ? (
                               <div className="flex flex-col gap-4">
                                   {[1,2,3].map(i => <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-zinc-50" />)}
                               </div>
                           ) : selectedHistory?.scores.length === 0 ? (
                               <div className="py-20 text-center text-sm font-bold text-zinc-300 italic uppercase tracking-widest">No local scores recorded</div>
                           ) : (
                               selectedHistory?.scores.map((s, i) => (
                                   <div key={s.id} className="group relative">
                                       <ScoreHistoryItem 
                                           title={`Stableford Round`} 
                                           date={new Date(s.scoreDateISO).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} 
                                           score={s.stableford} 
                                           result={s.stableford > 36 ? `Excellent` : `Good`}
                                           faint={i > 5}
                                       />
                                       <button 
                                            onClick={() => handleDeleteScore(s.id)}
                                            className="absolute -top-1 -right-1 h-6 w-6 rounded-lg bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                       >
                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
                                       </button>
                                   </div>
                               ))
                           )}
                        </div>

                        <div className="mt-auto flex flex-col gap-4 sm:flex-row sm:gap-6">
                            <div className="min-w-0 flex-1 space-y-2">
                                <label className="text-[9px] font-black tracking-widest text-zinc-300 uppercase">System Role</label>
                                <select 
                                    className="w-full bg-[#f8f9fa] border-none rounded-2xl p-4 text-xs font-bold text-zinc-900 outline-none"
                                    value={selectedProfile.role}
                                    onChange={(e) => {
                                        setSelectedProfile({ ...selectedProfile, role: e.target.value as any });
                                    }}
                                >
                                    <option value="subscriber">Subscriber</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>
                            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                                <button 
                                    type="button"
                                    disabled={isSaving}
                                    onClick={handleUpdateProfile}
                                    className="w-full flex-1 rounded-2xl bg-[#5d5bf6] py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {isSaving ? 'Processing...' : 'Update Member'}
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setSelectedProfile(null)}
                                    className="flex h-12 w-full items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400 transition-colors hover:bg-zinc-100 sm:h-[52px] sm:w-[52px]"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e9ecef; border-radius: 10px; }
      `}</style>
    </div>
  );
}

function ScoreHistoryItem({ title, date, score, result, faint = false }: { title: string; date: string; score: number; result: string; faint?: boolean }) {
    return (
        <div className={`flex flex-col gap-3 rounded-2xl border border-zinc-50 bg-white p-4 transition-all hover:border-zinc-200 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6 ${faint ? 'opacity-40' : ''}`}>
            <div className="flex min-w-0 items-center gap-3 sm:gap-5">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black text-white shadow-lg sm:h-12 sm:w-12 sm:rounded-[14px] ${score > 36 ? 'bg-emerald-500' : 'bg-indigo-500'}`}>
                    {score}
                </div>
                <div className="min-w-0">
                   <p className="truncate text-sm font-bold tracking-tight text-zinc-900 sm:text-base">{title}</p>
                   <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-zinc-300 sm:mt-1 sm:text-[10px] sm:tracking-[0.15em]">Verified Date: {date}</p>
                </div>
            </div>
            <p className={`shrink-0 text-[10px] font-black uppercase tracking-widest sm:text-right ${score > 36 ? 'text-emerald-500' : 'text-zinc-400'}`}>
                {result}
            </p>
        </div>
    );
}
