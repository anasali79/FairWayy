"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Charity, Plan } from "@/types/domain";
import { createSubscriptionInactiveForStripe, getCharities, purchaseSubscriptionMock } from "@/lib/supabase/db";
import { DEFAULT_CURRENCY, PLAN_PRICES_CENTS } from "@/lib/pricing";
import { seedCharities } from "@/lib/mock/seedCharities";
import Link from "next/link";

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addMonths(d: Date, months: number) {
  const next = new Date(d);
  next.setMonth(next.getMonth() + months);
  return next;
}

export default function SignupPage() {
  const router = useRouter();
  const { signUp, loading } = useAuth();
  const stripeMode = process.env.NEXT_PUBLIC_STRIPE_MODE ?? "mock";

  const [charities, setCharities] = useState<Charity[]>([]);
  const [plan, setPlan] = useState<Plan>("monthly");
  const [selectedCharityId, setSelectedCharityId] = useState<string | null>(null);
  const [charityPct, setCharityPct] = useState(10);
  const [donationPctExtra, setDonationPctExtra] = useState(0);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getCharities()
      .then((items) => {
        setCharities(items.length ? items : seedCharities);
      })
      .catch(() => setCharities(seedCharities));
  }, []);

  useEffect(() => {
    if (selectedCharityId) return;
    const featured = charities.find((c) => c.featured);
    if (featured) setSelectedCharityId(featured.id);
    else setSelectedCharityId(charities[0]?.id ?? null);
  }, [charities, selectedCharityId]);

  const canSubmit = useMemo(() => {
    return (
      email.trim().length > 0 &&
      password.length >= 6 &&
      password === confirm &&
      selectedCharityId !== null &&
      charityPct >= 10
    );
  }, [email, password, confirm, selectedCharityId, charityPct]);

  if (success) {
      return (
          <div className="min-h-screen bg-[#f8f9fa] px-6 py-20 flex flex-col items-center justify-center">
              <div className="w-full max-w-[580px] text-center rounded-[48px] bg-white p-16 shadow-2xl border border-zinc-50">
                  <div className="h-24 w-24 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-10 border border-emerald-100 shadow-sm animate-bounce">
                      <svg className="h-12 w-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h1 className="text-5xl font-black text-zinc-900 tracking-tighter mb-4">Account Initialized!</h1>
                  <p className="text-lg font-medium text-zinc-500 leading-relaxed mb-10">
                    We&apos;ve sent a verification link to <span className="text-zinc-900 font-bold">{email}</span>. 
                    Please confirm your email to activate your impact account and start your subscription.
                  </p>
                  <Link href="/auth/login" className="inline-block w-full rounded-3xl bg-[#4c49ed] py-6 text-xs font-black text-white hover:bg-indigo-700 transition-all uppercase tracking-[0.2em] shadow-xl shadow-indigo-100">
                    Continue to Login
                  </Link>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-6 py-20 flex flex-col items-center">
      <div className="w-full max-w-[720px]">
        <div className="text-center mb-12">
            <p className="text-[10px] font-black tracking-[0.3em] text-[#4c49ed] uppercase">Join the Movement</p>
            <h1 className="mt-4 text-7xl font-black tracking-tighter text-zinc-900 leading-none">Create Impact</h1>
            <p className="mt-5 text-lg font-medium text-zinc-400">Join our community and architect measurable change.</p>
        </div>

        <form
        className="rounded-[48px] bg-white p-14 shadow-[0_24px_80px_rgba(0,0,0,0.03)] border border-zinc-100"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!canSubmit || submitting) return;
          setError(null);
          setSubmitting(true);
          try {
            const res = await signUp({
              email: email.trim(),
              password,
              charityId: selectedCharityId,
              charityPct: charityPct,
              donationPctExtra,
            });
            if (!res.ok) {
              setError(res.error);
              return;
            }
            
            // If userId is returned, it might mean confirmation is OFF.
            // If userId is empty string, it definitely means confirmation is ON.
            if (res.userId === "") {
                setSuccess(true);
                return;
            }

            const now = new Date();
            const renewalISODate =
              plan === "monthly" ? toISODate(addMonths(now, 1)) : toISODate(addMonths(now, 12));

            if (stripeMode === "real") {
              await createSubscriptionInactiveForStripe({
                userId: res.userId,
                plan,
                priceCents: PLAN_PRICES_CENTS[plan],
                currency: DEFAULT_CURRENCY,
                renewalISODate,
              });

              const resp = await fetch("/api/stripe/create-checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  plan,
                  userId: res.userId,
                  email: email.trim(),
                }),
              });

              const data = (await resp.json()) as { url?: string; error?: string };
              if (!resp.ok || !data.url) {
                setError(data.error ?? "Failed to create Stripe checkout session.");
                return;
              }

              window.location.href = data.url;
              return;
            }

            await purchaseSubscriptionMock({
              userId: res.userId,
              plan,
              priceCents: PLAN_PRICES_CENTS[plan],
              currency: DEFAULT_CURRENCY,
              renewalISODate,
            });

            // Redirect to dashboard if confirm is off
            router.push("/dashboard");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Signup failed. Please try again.");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="md:col-span-2">
             <p className="text-[10px] font-black tracking-widest text-[#4c49ed] uppercase mb-8 border-b border-indigo-50 pb-2">Step 1: Impact Setup</p>
          </div>
          
          <div>
            <label className="text-[10px] font-black tracking-widest text-zinc-300 uppercase mb-3 block">Subscription Plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as Plan)}
              className="w-full rounded-2xl border border-zinc-100 bg-[#fbfbfb] p-5 text-sm font-bold text-zinc-900 outline-none focus:border-indigo-500 appearance-none transition-all"
            >
              <option value="monthly">Monthly Access</option>
              <option value="yearly">Yearly (Save 15%)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black tracking-widest text-zinc-300 uppercase mb-3 block">Choose Charity</label>
            <select
              value={selectedCharityId ?? ""}
              onChange={(e) => setSelectedCharityId(e.target.value)}
              disabled={charities.length === 0}
              className="w-full rounded-2xl border border-zinc-100 bg-[#fbfbfb] p-5 text-sm font-bold text-zinc-900 outline-none focus:border-indigo-500 appearance-none transition-all"
            >
              {charities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.featured ? "★ " : ""}{c.name}
                </option>
              ))}
            </select>
            {charities.length === 0 && <span className="mt-2 block text-[10px] font-bold text-rose-400 uppercase">No organizations found</span>}
          </div>

          <div>
            <label className="text-[10px] font-black tracking-widest text-zinc-300 uppercase mb-3 block">Charity Allotment (%)</label>
            <input
              value={charityPct}
              onChange={(e) => setCharityPct(Number(e.target.value))}
              type="number"
              min={10}
              className="w-full rounded-2xl border border-zinc-100 bg-[#fbfbfb] p-5 text-sm font-bold text-zinc-900 outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-black tracking-widest text-zinc-300 uppercase mb-3 block">Extra Donation (%)</label>
            <input
              value={donationPctExtra}
              onChange={(e) => setDonationPctExtra(Number(e.target.value))}
              type="number"
              min={0}
              className="w-full rounded-2xl border border-zinc-100 bg-[#fbfbfb] p-5 text-sm font-bold text-zinc-900 outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="md:col-span-2 pt-10">
             <p className="text-[10px] font-black tracking-widest text-[#4c49ed] uppercase mb-8 border-b border-indigo-50 pb-2">Step 2: Security Details</p>
          </div>

          <div className="md:col-span-2">
            <label className="text-[10px] font-black tracking-widest text-zinc-300 uppercase mb-3 block">Email Address</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full rounded-2xl border border-zinc-100 bg-[#fbfbfb] p-5 text-sm font-bold text-zinc-900 outline-none focus:border-indigo-500 transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-[10px] font-black tracking-widest text-zinc-300 uppercase mb-3 block">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full rounded-2xl border border-zinc-100 bg-[#fbfbfb] p-5 text-sm font-bold text-zinc-900 outline-none focus:border-indigo-500 transition-all"
              placeholder="Min 6 characters"
            />
          </div>

          <div>
            <label className="text-[10px] font-black tracking-widest text-zinc-300 uppercase mb-3 block">Confirm Password</label>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              type="password"
              className="w-full rounded-2xl border border-zinc-100 bg-[#fbfbfb] p-5 text-sm font-bold text-zinc-900 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {error ? <div className="mt-8 rounded-2xl bg-rose-50 p-5 text-xs font-bold text-rose-500 border border-rose-100 shadow-sm">{error}</div> : null}

        <button
          disabled={!canSubmit || loading || submitting}
          type="submit"
          className="mt-12 w-full rounded-3xl bg-[#4c49ed] py-7 text-xs font-black text-white hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 uppercase tracking-[0.25em]"
        >
          {submitting ? "Processing Account..." : "Confirm & Start Impact"}
        </button>
        
        <p className="mt-10 text-center text-xs font-bold text-zinc-400">
          Already a member?{" "}
          <Link className="text-[#4c49ed] hover:underline underline-offset-4 font-black" href="/auth/login">
            Sign in
          </Link>
        </p>
      </form>
      </div>
    </div>
  );
}
