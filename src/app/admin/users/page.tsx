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
    if (!user || user.role !== "admin") return;
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
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  return (
    <div className="min-h-screen bg-[#f1f3f5] pb-20 pt-10 font-sans">
      <div className="mx-auto max-w-[1300px] px-8">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-black tracking-tight text-zinc-900">User Management</h1>
            <p className="mt-2 text-lg text-zinc-500 font-medium tracking-tight">Manage member accounts, subscriptions, and roles.</p>
          </div>
          <button className="rounded-2xl bg-[#4c49ed] px-8 py-4 text-xs font-black text-white hover:bg-indigo-700 transition-all uppercase tracking-widest shadow-lg shadow-indigo-100">
            Add New User
          </button>
        </div>

        {/* User Table */}
        <div className="rounded-[32px] bg-white p-10 shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-zinc-50">
           <div className="overflow-hidden">
             <table className="w-full text-left">
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-md p-6">
                <div className="relative w-full max-w-[960px] overflow-hidden rounded-[48px] bg-white shadow-2xl flex min-h-[640px]">
                    {/* Sidebar */}
                    <div className="w-[340px] bg-[#f8f9fa] p-12 flex flex-col items-center border-r border-zinc-50">
                        <div className="h-28 w-28 rounded-[36px] bg-[#4c49ed] flex items-center justify-center text-4xl text-white font-black shadow-2xl shadow-indigo-100 mb-8">
                            {selectedProfile.userId.slice(0, 1).toUpperCase()}
                        </div>
                        <h3 className="text-2xl font-black text-zinc-900 text-center tracking-tighter leading-none mb-2">Member {selectedProfile.userId.slice(0, 8)}</h3>
                        <p className="text-sm font-bold text-zinc-400 mb-12">golf-pro-{selectedProfile.userId.slice(0, 4)}@fairway.com</p>
                        
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
                    <div className="flex-1 p-14 relative">
                        <button 
                            onClick={() => {
                                setSelectedProfile(null);
                                setSelectedHistory(null);
                            }}
                            className="absolute right-12 top-12 text-zinc-300 hover:text-zinc-600 transition-colors"
                        >
                            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </button>

                        <div className="grid grid-cols-2 gap-8 mb-14">
                            <div className="rounded-[32px] bg-[#f8f9fa] p-10 border border-zinc-100">
                                <p className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">Total Impact Won</p>
                                <h4 className="mt-5 text-4xl font-black text-[#5d5bf6] tracking-tighter leading-none transition-all">
                                    {loadingHistory ? "..." : formatCurrency(selectedHistory?.winnings.reduce((acc, w) => acc + w.payoutCents, 0) ?? 0)}
                                </h4>
                            </div>
                            <div className="rounded-[32px] bg-[#f8f9fa] p-10 border border-zinc-100">
                                <p className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">Points Balance</p>
                                <h4 className="mt-5 text-4xl font-black text-zinc-900 tracking-tighter leading-none transition-all">
                                    {loadingHistory ? "..." : (selectedHistory?.scores.reduce((acc, s) => acc + s.stableford, 0) ?? 0).toLocaleString()}
                                </h4>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-8">
                            <h4 className="text-xl font-black text-zinc-900 tracking-tight">Recent Scoring History</h4>
                            <span className="text-[10px] font-black tracking-widest text-[#4c49ed] uppercase border-b-2 border-indigo-600 pb-1">Verified data</span>
                        </div>

                        <div className="space-y-4 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar mb-10">
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

                        <div className="flex gap-6 mt-auto">
                            <div className="flex-1 space-y-2">
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
                            <div className="flex-1 flex gap-4 items-end">
                                <button 
                                    disabled={isSaving}
                                    onClick={handleUpdateProfile}
                                    className="flex-1 rounded-2xl bg-[#5d5bf6] py-4 text-[10px] font-black text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest disabled:opacity-50"
                                >
                                    {isSaving ? 'Processing...' : 'Update Member'}
                                </button>
                                <button 
                                    onClick={() => setSelectedProfile(null)}
                                    className="h-[52px] w-[52px] rounded-2xl bg-zinc-50 text-zinc-400 flex items-center justify-center hover:bg-zinc-100 transition-colors"
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
        <div className={`flex items-center justify-between rounded-2xl bg-white border border-zinc-50 p-6 transition-all hover:border-zinc-200 hover:shadow-sm ${faint ? 'opacity-40' : ''}`}>
            <div className="flex items-center gap-5">
                <div className={`h-12 w-12 rounded-[14px] flex items-center justify-center font-black text-white shadow-lg ${score > 36 ? 'bg-emerald-500' : 'bg-indigo-500'}`}>
                    {score}
                </div>
                <div>
                   <p className="text-base font-bold text-zinc-900 tracking-tight">{title}</p>
                   <p className="text-[10px] font-black text-zinc-300 mt-1 uppercase tracking-[0.15em]">Verified Date: {date}</p>
                </div>
            </div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${score > 36 ? 'text-emerald-500' : 'text-zinc-400'}`}>
                {result}
            </p>
        </div>
    );
}
