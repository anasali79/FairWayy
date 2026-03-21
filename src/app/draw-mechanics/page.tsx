"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getDraws, runDrawSupabase } from "@/lib/supabase/db";
import type { Draw, DrawMode, DrawType } from "@/types/domain";
import { PLAN_PRICES_CENTS } from "@/lib/pricing";

const currentMonthISO = () => new Date().toISOString().slice(0, 7) + "-01";

export default function DrawMechanicsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [draws, setDraws] = useState<Draw[]>([]);
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);
  const [drawType, setDrawType] = useState<DrawType>(5);
  const [mode, setMode] = useState<DrawMode>("algorithmic");
  const [winnersCount, setWinnersCount] = useState(0);
  const [simId, setSimId] = useState("");
  const [simWinners, setSimWinners] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [winningNumbers, setWinningNumbers] = useState<number[]>([]);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/auth/login");
      return;
    }
    getDraws().then((d) => setDraws(d.sort((a,b) => b.monthISO.localeCompare(a.monthISO))));
  }, [user, loading]);

  const generateAlgorithmNumbers = () => {
    const nums: number[] = [];
    while(nums.length < drawType) {
        const n = Math.floor(Math.random() * 45) + 1;
        if(!nums.includes(n)) nums.push(n);
    }
    return nums.sort((a,b) => a - b);
  };

  if (loading || !user) return <div className="p-20 text-center font-black animate-pulse text-[#4c49ed] tracking-widest uppercase text-xs">Initializing Secure Engine...</div>;

  return (
    <div className="min-h-screen bg-[#f8f9fa] pt-12 pb-32">
      <div className="mx-auto max-w-7xl px-8">
        <header className="mb-12 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black tracking-[0.4em] text-[#4c49ed] uppercase mb-4">Core Algorithm v4.2</p>
            <h1 className="text-6xl font-black tracking-tighter text-zinc-900 leading-none">Simulation Engine</h1>
            <p className="mt-4 text-zinc-500 font-medium">Configure and execute high-fidelity reward simulations.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-3 border border-zinc-100 shadow-sm">
             <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Node: Standby</span>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_400px]">
          <div className="space-y-10">
            
            {/* SIMULATION CONTROL */}
            <div className="rounded-[40px] bg-white p-10 shadow-[0_24px_80px_rgba(0,0,0,0.02)] border border-zinc-100 grid grid-cols-1 md:grid-cols-[1fr_auto_280px] items-center gap-10">
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <label className="text-[10px] font-black tracking-widest text-zinc-300 uppercase mb-3 block">Architecture</label>
                        <select
                            value={drawType}
                            onChange={(e) => {
                                setDrawType(Number(e.target.value) as DrawType);
                                setReady(false);
                            }}
                            className="bg-zinc-50 border-none rounded-xl p-4 w-full text-xs font-bold transition-all focus:ring-2 ring-indigo-100 outline-none"
                        >
                            <option value={5}>5-Match Standard</option>
                            <option value={4}>4-Match Rapid</option>
                            <option value={3}>3-Match Lite</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black tracking-widest text-zinc-300 uppercase mb-3 block">Selection Mode</label>
                        <select
                            value={mode}
                            onChange={(e) => {
                                setMode(e.target.value as DrawMode);
                                setReady(false);
                            }}
                            className="bg-zinc-50 border-none rounded-xl p-4 w-full text-xs font-bold transition-all focus:ring-2 ring-indigo-100 outline-none"
                        >
                            <option value="algorithmic">Algorithmic Weighted</option>
                            <option value="random">Pure Randomize</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-4">
                  <button
                    disabled={running}
                    onClick={async () => {
                      setRunning(true);
                      setError(null);
                      setReady(false);
                      try {
                        const res = await runDrawSupabase({
                          createdByUserId: user.id,
                          monthISODate: currentMonthISO(),
                          drawType,
                          mode,
                          publish: false,
                          winningNumbers: [], // Let backend generate
                          priceCentsForPoolCalculation: PLAN_PRICES_CENTS.monthly,
                        });
                        setWinningNumbers(res.draw.winningNumbers || []);
                        setSimWinners(res.winners);
                        setWinnersCount(res.winners.length);
                        setSimId(`SIM-${Math.floor(Math.random() * 90000) + 10000}-X`);
                        setReady(true);
                        const d = await getDraws();
                        setDraws(d.sort((a, b) => b.monthISO.localeCompare(a.monthISO)));
                      } catch (e) {
                        setError(e instanceof Error ? e.message : "Simulation failed.");
                      } finally {
                        setRunning(false);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-3 rounded-xl bg-[#4c49ed] py-4 text-[10px] font-black tracking-widest text-white shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 disabled:opacity-50 uppercase"
                  >
                    {running ? "EXECUTING..." : "RUN SIMULATION"}
                  </button>
                  <button className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 text-zinc-400 hover:bg-zinc-100 transition-all">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </button>
                </div>
              </div>

              <div className="hidden md:block w-px h-32 bg-zinc-100" />

              <div className="flex flex-col items-center">
                  <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-4">Instance ID</p>
                  <div className="text-xl font-black text-zinc-900 tracking-tighter tabular-nums mb-3">{ready ? simId : "-- -- --"}</div>
                  <div className="flex gap-1.5">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 w-4 rounded-full transition-all duration-500 ${ready ? 'bg-emerald-500' : 'bg-zinc-100'}`} />
                      ))}
                  </div>
              </div>
            </div>

            {/* RESULTS MONITOR */}
            <div className="rounded-[40px] bg-[#09090b] p-12 text-white shadow-2xl border border-zinc-800 relative overflow-hidden group">
               <div className="relative z-10">
                  <div className="flex justify-between items-start mb-12">
                      <div className="space-y-3">
                        <h2 className="text-4xl font-black tracking-tight">Real-time Metrics</h2>
                        <p className="text-zinc-500 font-medium text-sm">Outcome generated from dynamic subscriber weighted variables.</p>
                      </div>
                      <div className="px-5 py-2 rounded-xl border border-zinc-800 text-[9px] font-black tracking-widest uppercase text-zinc-500 bg-zinc-900/50">Engine: {running ? 'Active' : 'Standby'}</div>
                  </div>
 
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10 border-b border-zinc-800 pb-12 mb-12">
                      <div className="space-y-4">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] border-b border-indigo-900/50 pb-3">Sequence</p>
                          <div className="flex gap-2.5 pt-2">
                             {ready ? winningNumbers.map((n, i) => (
                               <div key={i} className="h-10 w-10 rounded-lg bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-sm font-black text-indigo-200">{n.toString().padStart(2, '0')}</div>
                             )) : <div className="text-zinc-700 font-bold italic py-2 text-xs">Waiting for key...</div>}
                          </div>
                      </div>
                      <div className="space-y-4">
                           <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] border-b border-emerald-900/50 pb-3">Pool Density</p>
                           <p className="text-4xl font-black mt-2 leading-none">{ready ? winnersCount : '0'}</p>
                           <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Subscriber Hits</p>
                      </div>
                      <div className="space-y-4">
                           <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] border-b border-rose-900/50 pb-3">Liquidity Estimate</p>
                           <p className="text-4xl font-black mt-2 text-rose-500 leading-none">₹{ready ? (simWinners.reduce((acc, w) => acc + (w.prizeAmountCents || 0), 0) / 100).toLocaleString() : '0'}</p>
                           <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Total Distribution</p>
                      </div>
                  </div>

                  {ready && simWinners.length > 0 && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                          <div className="flex justify-between items-end">
                             <h3 className="text-sm font-black text-zinc-300 uppercase tracking-widest">Winners Manifest</h3>
                             <div className="text-[10px] font-bold text-zinc-500 italic">Preview Mode — Non Persistent</div>
                          </div>
                          <div className="space-y-3">
                              {simWinners.slice(0, 5).map((w, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-all">
                                      <div className="flex items-center gap-4">
                                          <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-400 border border-indigo-500/30">ID</div>
                                          <div>
                                              <p className="text-xs font-black text-zinc-100">{w.userId.slice(0, 8)}...{w.userId.slice(-4)}</p>
                                              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{w.tier}</p>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <p className="text-sm font-black text-emerald-400 tabular-nums">₹{((w.prizeAmountCents || 0) / 100).toLocaleString()}</p>
                                          <p className="text-[9px] font-bold text-zinc-600 uppercase mt-1">Calculated Share</p>
                                      </div>
                                  </div>
                              ))}
                              {simWinners.length > 5 && (
                                  <div className="text-center pt-4">
                                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">+ {simWinners.length - 5} more recipients in manifest</p>
                                  </div>
                              )}
                          </div>
                      </div>
                  )}

                  {!ready && (
                      <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-zinc-900 rounded-[32px]">
                          <div className="h-12 w-12 rounded-2xl bg-zinc-900 flex items-center justify-center mb-6">
                              <svg className="h-6 w-6 text-zinc-700 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                          </div>
                          <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em]">Initialize Simulation</p>
                      </div>
                  )}
               </div>
               <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600 opacity-[0.05] blur-[100px] rounded-full" />
            </div>

          </div>

          <aside className="space-y-8">
            <div className="rounded-[40px] bg-[#e3fdf5] p-10 shadow-[0_12px_40px_rgba(0,109,92,0.05)] border border-emerald-100 overflow-hidden relative group">
              <div className="relative z-10">
                <div className="flex items-center gap-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                    </div>
                    <h3 className="text-2xl font-black text-emerald-900 tracking-tight">Official Action</h3>
                </div>
                <p className="mt-5 text-sm font-medium text-emerald-800 leading-relaxed">
                  Submit simulation outcome for official chain verification and public distribution.
                </p>
                <button
                  onClick={async () => {
                    if (!ready) return;
                    setRunning(true);
                    try {
                        await runDrawSupabase({
                            createdByUserId: user.id,
                            monthISODate: currentMonthISO(),
                            drawType,
                            mode,
                            publish: true,
                            winningNumbers,
                            priceCentsForPoolCalculation: PLAN_PRICES_CENTS.monthly,
                        });
                        router.push("/dashboard");
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Publish failed.");
                    } finally {
                      setRunning(false);
                    }
                  }}
                  disabled={running || !ready}
                  className="mt-10 w-full rounded-2xl bg-[#006d5c] py-6 text-xs font-black text-white hover:bg-emerald-900 transition-all shadow-xl shadow-emerald-200/50 uppercase tracking-[0.2em] disabled:bg-emerald-200 disabled:shadow-none"
                >
                  Official Publish
                </button>
              </div>
              <div className="absolute right-[-15%] bottom-[-15%] h-56 w-56 bg-emerald-400/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
            </div>

            <div>
              <div className="flex justify-between items-end mb-6">
                <h3 className="text-xl font-black tracking-tight text-zinc-900">Chain History</h3>
                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Draw Logs</span>
              </div>
              <div className="space-y-4">
                {draws.slice(0, 4).map((d) => (
                  <div key={d.id} className="rounded-3xl bg-white p-6 border border-zinc-50 shadow-sm flex items-center justify-between group cursor-pointer hover:border-indigo-100 transition-all">
                    <div>
                        <p className="text-[10px] font-black text-[#4c49ed] uppercase tracking-widest leading-none mb-2">{d.status}</p>
                        <h4 className="font-black text-zinc-900 tracking-tight">{new Date(d.monthISO).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</h4>
                    </div>
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-50 group-hover:bg-indigo-50 transition-colors">
                        <svg className="h-4 w-4 text-zinc-300 group-hover:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {error && (
            <div className="mt-12 rounded-3xl bg-rose-50 p-8 border border-rose-100 text-rose-500 font-bold text-center">
                <span className="block text-[10px] uppercase tracking-widest text-rose-300 mb-2">Engine Alert</span>
                {error}
            </div>
        )}
      </div>
    </div>
  );
}
