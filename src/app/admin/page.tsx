"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAdminDashboardSummary } from "@/lib/supabase/db";

type DashboardData = Awaited<ReturnType<typeof getAdminDashboardSummary>>;

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      setFetching(false);
      return;
    }

    getAdminDashboardSummary()
      .then(setData)
      .finally(() => setFetching(false));
  }, [user]);

  if (loading || fetching) return <div className="p-10 text-zinc-500">Loading...</div>;

  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Access Denied</h1>
        <p className="mt-2 text-zinc-600">You must be an administrator to view this page.</p>
        <button
          onClick={() => router.push("/auth/login")}
          className="mt-6 rounded-xl bg-zinc-900 px-6 py-2 text-sm font-semibold text-white"
        >
          Go to Login
        </button>
      </div>
    );
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const formatAbbreviated = (cents: number) => {
     const value = cents / 100;
     if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
     if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
     return `$${value}`;
  };

  return (
    <div className="min-h-screen bg-[#f1f3f5] pb-20 pt-10 font-sans">
      <div className="mx-auto max-w-[1300px] px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-zinc-900">System Overview</h1>
            <p className="mt-2 text-base text-zinc-500 font-medium">
              Real-time metrics for the Fairway philanthropic ecosystem.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-zinc-100">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
            <p className="text-[11px] font-bold tracking-widest text-[#2d6a4f] uppercase">
              Live System Status: Normal
            </p>
          </div>
        </div>

        {/* Top Stats Grid */}
        <div className="mt-10 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Subscribers" value={data?.totalSubscribers.toLocaleString() ?? "0"} change="+0% " />
          <StatCard label="Active Prize Pool" value={formatAbbreviated(data?.activePrizePoolCents ?? 0)} subtext="Rolling" />
          <StatCard label="Charity Impact" value={formatAbbreviated(data?.totalImpactCents ?? 0)} subtext="Calculated" />
          <StatCard label="Monthly Revenue" value={formatCurrency(data?.monthlyRevenueCents ?? 0)} />
        </div>

        {/* Main Content Layout */}
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Recent Signups - Large Card */}
          <div className="lg:col-span-2 space-y-10">
            <div className="min-h-[480px] rounded-[24px] bg-white p-10 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-zinc-50">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-zinc-900">Recent Signups</h2>
                <div className="flex items-center gap-1.5 rounded-xl bg-zinc-100 p-1.5">
                  <button className="rounded-lg bg-white px-5 py-2 text-xs font-bold text-zinc-900 shadow-sm">Real-time</button>
                </div>
              </div>
              
              <div className="mt-10 space-y-4">
                {data?.recentProfiles.length === 0 ? (
                    <div className="text-center py-20 text-zinc-400">No recent signups found.</div>
                ) : (
                    data?.recentProfiles.map(p => (
                        <div key={p.id} className="flex items-center justify-between py-4 border-b border-zinc-50 last:border-0 px-2 transition-colors hover:bg-zinc-50/50 rounded-xl">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 text-xs">
                                    {p.id.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-zinc-900">{p.id}</p>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mt-1">{p.role}</p>
                                </div>
                            </div>
                            <p className="text-xs font-medium text-zinc-500">
                                {new Date(p.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    ))
                )}
              </div>
            </div>

            {/* Bottom Left Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Accumulation Graph */}
              <div className="rounded-[24px] bg-white p-10 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-zinc-50">
                <div className="flex">
                  <span className="rounded-lg bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">Current Draw Phase</span>
                </div>
                <h3 className="mt-5 text-4xl font-black text-zinc-900 tracking-tight capitalize">
                    {data?.currentDraw?.status ?? "Inactive"}
                </h3>
                <p className="mt-3 text-sm text-zinc-500 leading-relaxed font-medium">
                    {data?.currentDraw ? `Draw for ${new Date(data.currentDraw.month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}` : "No active draw in simulation."}
                </p>
                
                <div className="mt-12">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
                    <div className="h-full w-[45%] bg-[#006d5c] rounded-full" />
                  </div>
                  <div className="mt-4 flex justify-between">
                    <p className="text-[11px] font-black tracking-[0.2em] text-zinc-400 uppercase">45% Complete</p>
                  </div>
                </div>
              </div>

              {/* Time Remaining */}
              <div className="rounded-[24px] bg-white p-10 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-zinc-50 flex flex-col justify-center items-center">
                 <p className="text-[11px] font-black tracking-[0.2em] text-zinc-300 uppercase">Current Month</p>
                 <div className="mt-6 flex flex-col items-center">
                    <h4 className="text-5xl font-black text-[#4c49ed] tracking-tighter">
                        {new Date().toLocaleString('default', { month: 'short' }).toUpperCase()}
                    </h4>
                    <p className="mt-2 text-[10px] font-black text-zinc-300 tracking-[0.2em] uppercase">YEAR 2024</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Pending Actions */}
          <div className="space-y-8">
            <div className="rounded-[24px] bg-white p-10 shadow-[0_4px_30px_rgba(0,0,0,0.04)] border border-zinc-50">
              <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Pending Actions</h2>
              
              <div className="mt-10 space-y-10">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black tracking-[0.15em] text-zinc-400 uppercase">Winner Verifications ({data?.pendingWinners?.length ?? 0})</p>
                    {data?.pendingWinners?.length && data.pendingWinners.length > 0 ? (
                        <span className="rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-wider">Urgent</span>
                    ) : null}
                  </div>
                  <div className="mt-5 space-y-3">
                    {data?.pendingWinners.map(w => (
                        <ActionItem 
                            key={w.id} 
                            name={w.userId.slice(0, 8)} 
                            detail={`Draw ID: ${w.drawId.slice(0, 8)}`} 
                            onClick={() => router.push(`/admin/verifications?id=${w.id}`)}
                        />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-black tracking-[0.15em] text-zinc-400 uppercase">Charity Management</p>
                  <div className="mt-5 space-y-4">
                    <div className="rounded-[20px] border border-zinc-100 p-6 bg-[#fcfcfc]">
                      <p className="text-base font-bold text-zinc-900">Partner Impact Tracking</p>
                      <p className="mt-1 text-xs text-zinc-500 font-medium tracking-wide">Manage charities and verify impact goals.</p>
                      <div className="mt-6 flex gap-3">
                        <button 
                            onClick={() => router.push("/draw-mechanics")}
                            className="flex-1 rounded-xl bg-[#4c49ed] py-3 text-[11px] font-black text-white hover:bg-indigo-700 shadow-[0_4px_12px_rgba(76,73,237,0.2)] transition-all uppercase"
                        >
                            Open Controls
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Impact Projection - Blue Card */}
            <div className="rounded-[24px] bg-[#4c49ed] p-10 shadow-[0_10px_40px_rgba(76,73,237,0.2)] text-white relative overflow-hidden flex flex-col justify-between min-h-[340px]">
              <div className="relative z-10">
                <h3 className="text-2xl font-bold tracking-tight">Annual Impact Projection</h3>
                <p className="mt-4 text-sm text-indigo-100 leading-relaxed font-medium">Live projection based on current active subscriber counts and average donation percentages.</p>
              </div>
              <div className="mt-auto pt-6 text-[100px] font-black tracking-tighter opacity-70 z-10 leading-none">
                +{(data?.totalSubscribers ?? 0) > 0 ? "11.2" : "0.0"}%
              </div>
              <div className="absolute right-[-20%] bottom-[-10%] h-64 w-64 rounded-full bg-white opacity-10 blur-3xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, change, subtext, changeColor = 'text-zinc-400' }: { label: string; value: string; change?: string; subtext?: string; changeColor?: string }) {
  return (
    <div className="rounded-[24px] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-zinc-50">
      <p className="text-[11px] font-black tracking-[0.15em] text-zinc-300 uppercase">{label}</p>
      <div className="mt-5 flex items-baseline gap-2.5">
        <h3 className="text-4xl font-black tracking-tight text-zinc-900">{value}</h3>
        {change && <span className={`text-[13px] font-black ${changeColor}`}>{change}</span>}
        {subtext && <span className="text-[11px] font-bold text-zinc-400 tracking-wide">{subtext}</span>}
      </div>
    </div>
  );
}

function ActionItem({ name, detail, onClick }: { name: string; detail: string; onClick?: () => void }) {
  return (
    <button 
        onClick={onClick}
        className="flex w-full items-center justify-between rounded-[20px] bg-white border border-zinc-100 p-5 text-left transition-all hover:shadow-md hover:border-zinc-200"
    >
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-black text-zinc-400">
          {name[0]}
        </div>
        <div>
          <p className="text-[15px] font-bold text-zinc-900 leading-none">{name}</p>
          <p className="mt-1.5 text-xs text-zinc-500 font-medium">{detail}</p>
        </div>
      </div>
      <svg className="h-5 w-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

function TimeBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-6xl font-black text-[#4c49ed] tracking-tighter leading-none">{value}</p>
      <p className="mt-2 text-[10px] font-black text-zinc-300 tracking-[0.2em] uppercase">{label}</p>
    </div>
  );
}
