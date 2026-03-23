"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLivePrizePoolEstimation, getCharities } from "@/lib/supabase/db";
import type { Charity } from "@/types/domain";

export default function Home() {
  const [prizePool, setPrizePool] = useState<number>(0);
  const [featuredCharity, setFeaturedCharity] = useState<Charity | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pool = await getLivePrizePoolEstimation();
        setPrizePool(pool);
        const charities = await getCharities();
        const featured = charities.find(c => c.featured) || charities[0];
        setFeaturedCharity(featured);
      } catch (e) {
        setPrizePool(prev => prev || 124800000); // fallback
      }
    };

    fetchData();
    const interval = setInterval(() => {
      getLivePrizePoolEstimation().then(setPrizePool).catch(() => {});
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-900 font-sans overflow-x-hidden">
      <div className="mx-auto max-w-[1400px] px-4 pt-24 pb-8 sm:px-6 sm:pt-28 md:px-8 md:pt-32 md:pb-10">

        {/* HERO SECTION */}
        <section className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center min-h-[60vh]">
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-1000">
            <div className="flex">
              <span className="rounded-full bg-indigo-50 px-4 py-1.5 text-[10px] font-black tracking-[0.2em] text-[#4c49ed] uppercase border border-indigo-100/50">
                Open Impact Network
              </span>
            </div>
            <h1 className="text-[2.75rem] font-black leading-[0.95] tracking-tighter text-zinc-900 sm:text-6xl md:text-7xl lg:text-8xl">
              GOLF FOR<br />
              <span className="text-[#4c49ed]">SOCIAL</span><br />
              <span className="text-[#4c49ed]">GOOD.</span>
            </h1>
            <p className="max-w-xl text-base font-medium leading-relaxed text-zinc-500 sm:text-lg">
              We reinvent charitable golf with transparent draws, verified score trails, and real-time donor trust.
              Every round can create measurable change.
            </p>
            <div className="mt-8 flex w-full flex-col gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:items-center sm:gap-5">
              <Link href="/subscription" className="w-full rounded-2xl bg-[#4c49ed] px-8 py-4 text-center text-xs font-black text-white shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-[0.98] sm:w-auto sm:px-10 sm:py-5 sm:text-sm uppercase tracking-widest">
                Launch Movement
              </Link>
              <Link href="/charities" className="w-full rounded-2xl border border-zinc-200 bg-white px-8 py-4 text-center text-xs font-black text-zinc-900 transition-all hover:bg-zinc-50 sm:w-auto sm:px-10 sm:py-5 sm:text-sm uppercase tracking-widest">
                View Impact
              </Link>
            </div>
          </div>

          {/* HERO IMAGE */}
          <div className="relative group perspective-1000 animate-in fade-in slide-in-from-right duration-1000">
            <div className="overflow-hidden rounded-[28px] border border-white bg-white p-3 shadow-[0_20px_60px_rgba(0,0,0,0.06)] transition-transform duration-700 sm:rounded-[40px] sm:p-4 md:rounded-[48px] md:hover:rotate-2">
              <img
                src="/herooo.png"
                alt="Premium Golf Course"
                className="rounded-[40px] w-full object-cover aspect-[4/3] grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
              />
            </div>
            {/* Decorative elements */}
            <div className="absolute -bottom-10 -right-10 h-64 w-64 bg-indigo-400/10 rounded-full blur-3xl -z-10" />
          </div>
        </section>

        {/* METRICS & SPOTLIGHT */}
        <section className="mt-12 grid grid-cols-1 gap-6 sm:mt-16 sm:gap-8 md:mt-20 md:grid-cols-[1.6fr_1fr]">
          <article className="rounded-[28px] border border-zinc-100 bg-white p-6 shadow-[0_4px_30px_rgba(0,0,0,0.02)] transition-all group hover:border-indigo-100 sm:rounded-[32px] sm:p-8 md:rounded-[40px] md:p-12">
            <div className="flex items-center justify-between mb-8">
              <p className="text-[10px] font-black tracking-[0.3em] text-zinc-300 uppercase">Live Pot Value</p>
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            </div>
            <p className="text-4xl font-black leading-none tracking-tighter text-zinc-900 transition-colors group-hover:text-[#4c49ed] sm:text-5xl md:text-6xl lg:text-7xl">
              {formatCurrency(prizePool)}
            </p>
            <p className="mt-6 max-w-xl text-sm font-medium leading-relaxed text-zinc-500 sm:mt-8 sm:text-base">
              This quarter pool is locked with blockchain verification and audit-ready winner metadata.
              Transparent distribution ensured by open-source algorithms.
            </p>
            <div className="mt-10 h-2 rounded-full bg-zinc-50 relative overflow-hidden">
              <div className="h-full w-[58%] rounded-full bg-[#4c49ed] shadow-[0_0_15px_rgba(76,73,237,0.3)] transition-all duration-1000" />
            </div>
          </article>

          <article className="flex flex-col justify-between overflow-hidden rounded-[28px] bg-indigo-600 p-6 text-white shadow-[0_20px_50px_rgba(76,73,237,0.15)] sm:rounded-[32px] sm:p-8 md:rounded-[40px] md:p-12">
            <div className="relative z-10">
              <p className="text-[10px] font-black tracking-[0.3em] text-indigo-200 uppercase">Current Spotlight</p>
              <h3 className="mt-4 text-2xl font-black leading-none tracking-tight sm:mt-6 sm:text-3xl md:text-4xl">{featuredCharity?.name || "The Water Protocol"}</h3>
              <p className="mt-4 text-xs font-medium leading-relaxed text-indigo-100 sm:mt-5 sm:text-sm">
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
        <section className="mt-20 sm:mt-28 md:mt-40">
          <div className="mb-10 text-center sm:mb-16">
            <h2 className="text-3xl font-black tracking-tighter text-zinc-900 sm:text-4xl md:text-5xl lg:text-6xl">The Architect&apos;s Journey</h2>
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 sm:mt-4 sm:text-base sm:tracking-[0.3em]">Engineered steps. Legacy impact.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3 md:gap-10">
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
              <article key={i} className="flex min-h-0 flex-col justify-between rounded-[28px] border border-zinc-50 bg-white p-6 shadow-[0_4px_30px_rgba(0,0,0,0.02)] transition-all group hover:shadow-indigo-100/30 sm:rounded-[36px] sm:p-8 md:min-h-[380px] md:rounded-[40px] md:p-10 lg:min-h-[440px]">
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
        <section className="mt-20 pb-12 sm:mt-28 sm:pb-16 md:mt-40 md:pb-20">
          <div className="mb-10 flex max-w-full flex-col gap-4 sm:mb-16 sm:flex-row sm:items-center sm:gap-6 md:gap-10">
            <h2 className="shrink-0 text-3xl font-black tracking-tighter text-zinc-900 sm:text-4xl md:text-5xl lg:text-7xl">Voices of Change.</h2>
            <div className="hidden h-px flex-1 bg-zinc-100 sm:block" />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            <article className="relative rounded-[24px] border border-zinc-50 bg-white p-6 text-sm font-medium italic leading-relaxed text-zinc-500 shadow-sm sm:rounded-[28px] sm:p-8 md:rounded-[32px] md:p-12 md:text-base">
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
            <article className="relative rounded-[24px] border border-zinc-50 bg-white p-6 text-sm font-medium italic leading-relaxed text-zinc-500 shadow-sm sm:rounded-[28px] sm:p-8 md:rounded-[32px] md:p-12 md:text-base">
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

        {/* CTA SECTION — mobile: readable line breaks + sizing; desktop: big headline */}
        <section className="relative overflow-hidden rounded-3xl bg-[#4c49ed] px-4 py-12 text-center text-white shadow-2xl shadow-indigo-200 sm:rounded-[40px] sm:px-6 sm:py-16 md:px-10 md:py-20 lg:rounded-[56px] lg:py-24 xl:rounded-[64px] xl:py-28">
          <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center">
            <h2 className="w-full max-w-[20.5rem] text-balance text-[1.5625rem] font-black uppercase leading-[1.12] tracking-[0.04em] text-white sm:max-w-2xl sm:text-3xl sm:leading-[1.08] sm:tracking-[0.06em] md:max-w-3xl md:text-4xl md:tracking-tighter lg:text-5xl lg:leading-[0.95] xl:text-6xl 2xl:text-7xl">
              <span className="block sm:hidden">
                Ready to
                <br />
                architect
                <br />
                change?
              </span>
              <span className="hidden sm:block md:hidden">
                Ready to architect
                <br />
                change?
              </span>
              <span className="hidden md:block">Ready to architect change?</span>
            </h2>
            <p className="mt-5 max-w-xl px-1 text-sm font-medium leading-relaxed text-indigo-100/95 sm:mt-6 sm:text-base md:mt-8 md:text-lg lg:text-xl">
              Join a scalable movement designed for measurable purpose. Start your subscriptions today.
            </p>
            <Link
              href="/subscription"
              className="mt-8 w-full max-w-[min(100%,20rem)] rounded-2xl bg-white px-6 py-4 text-center text-xs font-black uppercase tracking-widest text-[#4c49ed] shadow-2xl transition-transform hover:scale-[1.02] active:scale-[0.98] sm:mt-10 sm:w-auto sm:max-w-none sm:rounded-3xl sm:px-10 sm:py-5 sm:text-sm md:mt-12 md:px-12 md:py-6"
            >
              Start Your Subscription
            </Link>
          </div>
          {/* Decorative Pattern */}
          <div className="pointer-events-none absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[length:40px_40px]" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/20 blur-3xl sm:h-96 sm:w-96" />
        </section>

        {/* FOOTER */}
        <footer className="mt-16 grid grid-cols-1 gap-10 border-t border-zinc-100 py-12 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 sm:mt-24 sm:gap-12 sm:py-16 sm:text-xs sm:tracking-[0.2em] md:mt-32 md:grid-cols-2 md:py-20 lg:grid-cols-4">
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
