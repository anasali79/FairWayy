"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCharities } from "@/lib/supabase/db";
import { seedCharities } from "@/lib/mock/seedCharities";
import type { Charity } from "@/types/domain";

export default function CharityProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [charity, setCharity] = useState<Charity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCharities()
      .then((items) => {
        const list = items.length ? items : seedCharities;
        const found = list.find(c => c.id === id) || null;
        setCharity(found);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-20 text-center text-zinc-400 font-bold uppercase tracking-widest animate-pulse">Scanning Impact Profile...</div>;
  if (!charity) return <div className="p-20 text-center">Charity not found.</div>;

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Hero Section */}
      <div className="relative h-[600px] w-full overflow-hidden bg-zinc-900">
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/20 via-black/40 to-white" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-60 mix-blend-overlay grayscale-[0.3]" />
        
        <div className="relative z-20 mx-auto max-w-[1200px] px-8 pt-44">
           <button 
                onClick={() => router.back()}
                className="mb-12 flex items-center gap-3 text-white/60 hover:text-white transition-all group"
            >
                <div className="h-8 w-8 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white/10">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg>
                </div>
                <span className="text-xs font-black uppercase tracking-[0.2em]">Return to Directory</span>
           </button>

           <div className="max-w-3xl">
              <div className="flex items-center gap-4 mb-8">
                 <span className="rounded-full bg-white/10 px-4 py-1.5 text-[10px] font-black text-white uppercase tracking-widest backdrop-blur-md border border-white/10">Official Partner</span>
                 {charity.featured && <span className="rounded-full bg-indigo-500 px-4 py-1.5 text-[10px] font-black text-white uppercase tracking-widest">★ Featured Impact</span>}
              </div>
              <h1 className="text-8xl font-black tracking-tighter text-white leading-[0.9] drop-shadow-2xl">{charity.name}</h1>
              <p className="mt-8 text-2xl font-medium text-white/80 leading-relaxed max-w-2xl">{charity.description}</p>
           </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="mx-auto max-w-[1200px] px-8 pt-20 pb-40 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-20">
         {/* Left: About & Gallery */}
         <div className="space-y-24">
            <div>
                <h2 className="text-[12px] font-black tracking-[0.3em] text-zinc-300 uppercase mb-8">About the Mission</h2>
                <p className="text-xl text-zinc-700 leading-loose font-medium">
                    {charity.longDescription || "Mission details are currently being verified by the Fairway Impact Team. Expect a comprehensive brief shortly."}
                </p>
                <div className="mt-12 h-px w-full bg-zinc-100" />
            </div>

            {/* Gallery Section */}
            <div>
                <h2 className="text-[12px] font-black tracking-[0.3em] text-zinc-300 uppercase mb-8">Impact Footprint</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="aspect-[4/3] rounded-[40px] bg-zinc-100 overflow-hidden relative group">
                        <div className="absolute inset-0 bg-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                        <img src="https://images.unsplash.com/photo-1542601906970-3499f5a54f7a?q=80&w=2600&auto=format&fit=crop" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <div className="aspect-[4/3] rounded-[40px] bg-zinc-100 overflow-hidden relative group">
                        <div className="absolute inset-0 bg-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                        <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2670&auto=format&fit=crop" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                </div>
            </div>
         </div>

         {/* Right: Upcoming Events & CTA */}
         <div className="space-y-12">
            <div className="rounded-[40px] bg-[#f8f9fa] p-10 border border-zinc-50">
               <h3 className="text-base font-black tracking-[0.1em] text-zinc-900 uppercase mb-8 text-center">Upcoming Events</h3>
               <div className="space-y-6">
                  {charity.upcomingEvents && charity.upcomingEvents.length > 0 ? (
                      charity.upcomingEvents.map(ev => (
                        <div key={ev.id} className="group cursor-pointer">
                            <div className="flex gap-6 items-start">
                                <div className="bg-white rounded-2xl p-3 shadow-sm border border-zinc-100 text-center min-w-[70px] group-hover:border-indigo-200 transition-colors">
                                    <p className="text-[10px] font-black text-zinc-400 uppercase leading-none">{new Date(ev.dateISO).toLocaleString('default', { month: 'short' })}</p>
                                    <p className="text-2xl font-black text-indigo-600 mt-1">{new Date(ev.dateISO).getDate()}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-zinc-900 leading-tight group-hover:text-indigo-600 transition-colors">{ev.name}</p>
                                    <p className="text-[11px] font-bold text-zinc-400 mt-1 leading-snug">{ev.location}</p>
                                </div>
                            </div>
                        </div>
                      ))
                  ) : (
                      <p className="text-xs text-center text-zinc-400 italic">No events scheduled this month.</p>
                  )}
               </div>

               <div className="mt-12 h-px w-full bg-zinc-200/50" />
               <button className="mt-8 w-full rounded-2xl bg-zinc-900 py-4 text-xs font-black text-white uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200">
                    Donate Directly
               </button>
            </div>

            <div className="rounded-[40px] bg-indigo-600 p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-100">
                <h4 className="text-2xl font-black tracking-tight relative z-10 leading-tight mb-4">Make persistent, monthly impact.</h4>
                <p className="text-sm font-medium text-white/80 relative z-10 leading-relaxed mb-10">Select this charity in your dashboard to automate your support through your Fairway subscription.</p>
                <div className="absolute right-[-20%] bottom-[-20%] h-48 w-48 rounded-full bg-white opacity-10 blur-3xl" />
                <button 
                    onClick={() => router.push("/charities")}
                    className="relative z-10 w-full rounded-2xl bg-white py-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 transition-all"
                >
                    Update Dashboard
                </button>
            </div>
         </div>
      </div>
    </div>
  );
}
