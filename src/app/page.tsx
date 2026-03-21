"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLivePrizePoolEstimation, getCharities } from "@/lib/supabase/db";
import type { Charity } from "@/types/domain";

export default function Home() {
  const [prizePool, setPrizePool] = useState<number>(0);
  const [featuredCharity, setFeaturedCharity] = useState<Charity | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const pool = await getLivePrizePoolEstimation();
        setPrizePool(pool);
        const charities = await getCharities();
        const featured = charities.find(c => c.featured) || charities[0];
        setFeaturedCharity(featured);
      } catch (e) {
        setPrizePool(124800000); // fallback
      }
    })();
  }, []);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-900 font-sans overflow-x-hidden">
      <div className="mx-auto max-w-[1400px] px-8 pt-32 pb-10">
        
        {/* HERO SECTION */}
        <section className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center min-h-[60vh]">
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-1000">
            <div className="flex">
               <span className="rounded-full bg-indigo-50 px-4 py-1.5 text-[10px] font-black tracking-[0.2em] text-[#4c49ed] uppercase border border-indigo-100/50">
                  Open Impact Network
               </span>
            </div>
            <h1 className="text-8xl font-black tracking-tighter leading-[0.9] text-zinc-900">
               GOLF FOR<br />
               <span className="text-[#4c49ed]">SOCIAL</span><br />
               <span className="text-[#4c49ed]">GOOD.</span>
            </h1>
            <p className="max-w-xl text-lg font-medium leading-relaxed text-zinc-500">
               We reinvent charitable golf with transparent draws, verified score trails, and real-time donor trust.
               Every round can create measurable change.
            </p>
            <div className="mt-10 flex items-center gap-5">
              <Link href="/auth/signup" className="rounded-2xl bg-[#4c49ed] px-10 py-5 text-sm font-black text-white hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98] uppercase tracking-widest">
                Launch Movement
              </Link>
              <Link href="/charities" className="rounded-2xl border border-zinc-200 bg-white px-10 py-5 text-sm font-black text-zinc-900 hover:bg-zinc-50 transition-all uppercase tracking-widest">
                View Impact
              </Link>
            </div>
          </div>
          
          {/* HERO IMAGE */}
          <div className="relative group perspective-1000 animate-in fade-in slide-in-from-right duration-1000">
            <div className="overflow-hidden rounded-[48px] bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-white transform hover:rotate-2 transition-transform duration-700">
               <img 
                  src="/hero_golf.png" 
                  alt="Premium Golf Course" 
                  className="rounded-[40px] w-full object-cover aspect-[4/3] group-hover:scale-105 transition-all duration-1000"
               />
               <div className="absolute top-10 left-10 rounded-2xl bg-black/40 backdrop-blur-md px-5 py-2 text-[10px] font-black text-white tracking-[0.3em] uppercase">PL-209-420-LIVE</div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -bottom-10 -right-10 h-64 w-64 bg-indigo-400/10 rounded-full blur-3xl -z-10" />
          </div>
        </section>

        {/* METRICS & SPOTLIGHT */}
        <section className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-[1.6fr_1fr]">
          <article className="rounded-[40px] bg-white p-12 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-zinc-100 group transition-all hover:border-indigo-100">
            <div className="flex items-center justify-between mb-8">
                <p className="text-[10px] font-black tracking-[0.3em] text-zinc-300 uppercase">Live Pot Value</p>
                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            </div>
            <p className="text-7xl font-black tracking-tighter text-zinc-900 leading-none group-hover:text-[#4c49ed] transition-colors">
                {formatCurrency(prizePool)}
            </p>
            <p className="mt-8 max-w-xl text-base font-medium text-zinc-500 leading-relaxed">
                This quarter pool is locked with blockchain verification and audit-ready winner metadata. 
                Transparent distribution ensured by open-source algorithms.
            </p>
            <div className="mt-10 h-2 rounded-full bg-zinc-50 relative overflow-hidden">
                <div className="h-full w-[58%] rounded-full bg-[#4c49ed] shadow-[0_0_15px_rgba(76,73,237,0.3)] transition-all duration-1000" />
            </div>
          </article>

          <article className="rounded-[40px] bg-indigo-600 p-12 shadow-[0_20px_50px_rgba(76,73,237,0.15)] text-white relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10">
                <p className="text-[10px] font-black tracking-[0.3em] text-indigo-200 uppercase">Current Spotlight</p>
                <h3 className="mt-6 text-4xl font-black tracking-tight leading-none">{featuredCharity?.name || "The Water Protocol"}</h3>
                <p className="mt-5 text-sm font-medium text-indigo-100 leading-relaxed">
                   {featuredCharity?.description || "Funding filtration systems in drought-prone regions through golfing community contributions."}
                </p>
            </div>
            <Link href="/charities" className="mt-10 relative z-10 inline-block rounded-2xl bg-white/10 backdrop-blur-md px-6 py-4 text-[10px] font-black text-white border border-white/20 uppercase tracking-[0.2em] hover:bg-white/20 transition-all text-center">
              See Transparency Report
            </Link>
            {/* Background elements */}
            <div className="absolute right-[-20%] bottom-[-10%] h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          </article>
        </section>

        {/* HOW IT WORKS */}
        <section className="mt-40">
           <div className="text-center mb-16">
              <h2 className="text-6xl font-black tracking-tighter text-zinc-900">The Architect&apos;s Journey</h2>
              <p className="mt-4 text-base font-medium text-zinc-400 uppercase tracking-[0.3em]">Engineered steps. Legacy impact.</p>
           </div>
           
           <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {[
              {
                title: "Subscribe & Support",
                text: "Select your impact tier with curated charity options. Your membership funds local missions.",
                img: "/impact.png",
                num: "01"
              },
              {
                title: "Track & Play",
                text: "Monitor rounds and submit scores in one secured stream. Each score entry contributes to draw eligibility.",
                num: "02"
              },
              {
                title: "Monthly Draw",
                text: "Participate in verified prize cycles while funding missions. Every swing creates measurable change.",
                num: "03"
              },
            ].map((step, i) => (
              <article key={i} className="rounded-[40px] bg-white border border-zinc-50 p-10 shadow-[0_4px_30px_rgba(0,0,0,0.02)] group hover:shadow-indigo-100/30 transition-all flex flex-col justify-between min-h-[440px]">
                <div>
                   <div className="flex justify-between items-start mb-10">
                      <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-lg shadow-sm">
                         {step.num}
                      </div>
                      {step.img && <img src={step.img} className="h-16 w-16 rounded-xl object-cover" />}
                   </div>
                   <h3 className="text-2xl font-black text-zinc-900 tracking-tight leading-none group-hover:text-[#4c49ed] transition-colors">{step.title}</h3>
                   <p className="mt-6 text-sm font-medium text-zinc-500 leading-relaxed">{step.text}</p>
                </div>
                <div className="mt-10 h-1 w-20 bg-zinc-100 rounded-full group-hover:w-full group-hover:bg-indigo-600 transition-all duration-700" />
              </article>
            ))}
          </div>
        </section>

        {/* VOICES OF CHANGE */}
        <section className="mt-40 pb-20">
           <div className="flex items-center gap-10 mb-16 overflow-hidden max-w-full">
              <h2 className="text-7xl font-black tracking-tighter text-zinc-900 shrink-0 whitespace-nowrap">Voices of Change.</h2>
              <div className="h-px bg-zinc-100 w-full" />
           </div>
           
           <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <article className="rounded-[32px] bg-white border border-zinc-50 p-12 text-zinc-500 font-medium leading-relaxed italic relative shadow-sm">
              <span className="text-4xl text-indigo-100 absolute left-6 top-6">&quot;</span>
               Before I joined, I didn&apos;t realize how transparent charity could be. This platform sets a new standard for philanthropic golf communities.
               <div className="mt-8 flex items-center gap-4 not-italic">
                  <div className="h-10 w-10 rounded-full bg-zinc-100" />
                  <div>
                    <p className="text-sm font-black text-zinc-900 tracking-tight">James Harrison</p>
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Premium Member</p>
                  </div>
               </div>
            </article>
            <article className="rounded-[32px] bg-white border border-zinc-50 p-12 text-zinc-500 font-medium leading-relaxed italic relative shadow-sm">
              <span className="text-4xl text-indigo-100 absolute left-6 top-6">&quot;</span>
               Watching the draw and audit flow gave me confidence. Every swing matters when you know where the impact gold is going.
               <div className="mt-8 flex items-center gap-4 not-italic">
                  <div className="h-10 w-10 rounded-full bg-zinc-100" />
                  <div>
                    <p className="text-sm font-black text-zinc-900 tracking-tight">Sarah Jenkins</p>
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Subscriber since 2023</p>
                  </div>
               </div>
            </article>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="rounded-[64px] bg-[#4c49ed] px-10 py-32 text-center text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
            <h2 className="text-8xl font-black leading-[0.9] tracking-tighter">READY TO ARCHITECT CHANGE?</h2>
            <p className="mt-8 text-xl font-medium text-indigo-100 max-w-xl">Join a scalable movement designed for measurable purpose. Start your subscriptions today.</p>
            <Link href="/auth/signup" className="mt-12 inline-block rounded-3xl bg-white px-12 py-6 text-sm font-black text-[#4c49ed] shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest">
              Start Your Subscription
            </Link>
          </div>
          {/* Decorative Pattern */}
          <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[length:40px_40px]" />
          <div className="absolute -bottom-20 -left-20 h-96 w-96 bg-white/20 rounded-full blur-3xl" />
        </section>

        {/* FOOTER */}
        <footer className="mt-40 grid grid-cols-1 gap-12 border-t border-zinc-100 py-20 text-xs font-bold text-zinc-400 md:grid-cols-4 uppercase tracking-[0.2em]">
          <div className="space-y-6">
            <p className="text-zinc-900 font-black">Digital Heroes</p>
            <p className="max-w-[150px] leading-relaxed">Secure impact infrastructure for the modern game.</p>
          </div>
          <div className="space-y-6">
            <p className="text-zinc-900 font-black">Platform</p>
            <ul className="space-y-3">
                <li><Link href="/charities" className="hover:text-indigo-600 transition-colors">Impact Ledger</Link></li>
                <li><Link href="/" className="hover:text-indigo-600 transition-colors">Draw Engine</Link></li>
                <li><Link href="/" className="hover:text-indigo-600 transition-colors">Verification</Link></li>
            </ul>
          </div>
          <div className="space-y-6">
            <p className="text-zinc-900 font-black">Legal</p>
            <ul className="space-y-3">
                <li><Link href="/" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/" className="hover:text-indigo-600 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
          <div className="space-y-6">
            <p className="text-zinc-900 font-black">Mailing List</p>
            <div className="relative group">
                <input type="email" placeholder="YOUR@EMAIL.COM" className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-4 pr-12 text-[10px] font-black focus:outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-300" />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500 group-hover:translate-x-1 transition-transform">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" /></svg>
                </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
