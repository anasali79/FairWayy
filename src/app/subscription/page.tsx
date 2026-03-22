import Link from "next/link";
import { DEFAULT_CURRENCY, PLAN_PRICES_CENTS } from "@/lib/pricing";

export const metadata = {
  title: "Subscription Plans | Fairway Impact",
  description: "Compare monthly and yearly Fairway Impact membership. No login required to view plans.",
};

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: DEFAULT_CURRENCY,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const perks = [
  "Eligible for verified monthly draws",
  "Submit & track Stableford scores",
  "Choose your impact charity",
  "Transparent draw mechanics & results",
  "Winner verification & payout workflow",
];

export default function SubscriptionPage() {
  const monthlyCents = PLAN_PRICES_CENTS.monthly;
  const yearlyCents = PLAN_PRICES_CENTS.yearly;
  const yearIfMonthly = monthlyCents * 12;
  const savePct = Math.max(0, Math.round((1 - yearlyCents / yearIfMonthly) * 100));
  const perMonthYearly = Math.round(yearlyCents / 12);

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-4 pb-24 pt-28 text-zinc-900 sm:px-6 md:px-8 md:pt-32">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4c49ed]">Membership</p>
          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
            Pick your <span className="text-[#4c49ed]">plan</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-zinc-500 sm:text-lg">
            Compare monthly and yearly access. Subscribe when you&apos;re ready — create your account on the next step (no login needed to view pricing).
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:mt-16 lg:grid-cols-2 lg:gap-8">
          {/* Monthly */}
          <article className="flex flex-col rounded-[28px] border border-zinc-100 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.04)] sm:rounded-[36px] sm:p-8 md:p-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black tracking-tight text-zinc-900 sm:text-2xl">Monthly</h2>
                <p className="mt-2 text-sm font-medium text-zinc-500">Flexible — renews every month.</p>
              </div>
              <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-zinc-600">
                Popular
              </span>
            </div>
            <p className="mt-8">
              <span className="text-4xl font-black tracking-tighter text-zinc-900 sm:text-5xl">{formatPrice(monthlyCents)}</span>
              <span className="text-sm font-bold text-zinc-400"> / month</span>
            </p>
            <ul className="mt-8 flex-1 space-y-3 border-t border-zinc-100 pt-8">
              {perks.map((line) => (
                <li key={line} className="flex gap-3 text-sm font-medium text-zinc-600">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {line}
                </li>
              ))}
            </ul>
            <Link
              href="/auth/signup?plan=monthly"
              className="mt-10 block w-full rounded-2xl bg-[#4c49ed] py-4 text-center text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-[0.99] sm:py-5"
            >
              Continue with monthly
            </Link>
          </article>

          {/* Yearly */}
          <article className="relative flex flex-col overflow-hidden rounded-[28px] border-2 border-[#4c49ed] bg-white p-6 shadow-[0_20px_50px_rgba(76,73,237,0.12)] sm:rounded-[36px] sm:p-8 md:p-10">
            <div className="absolute right-4 top-4 rounded-full bg-[#4c49ed] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white">
              Save ~{savePct}%
            </div>
            <div className="pr-24">
              <h2 className="text-xl font-black tracking-tight text-zinc-900 sm:text-2xl">Yearly</h2>
              <p className="mt-2 text-sm font-medium text-zinc-500">Best value — one payment for the full year.</p>
            </div>
            <p className="mt-8">
              <span className="text-4xl font-black tracking-tighter text-zinc-900 sm:text-5xl">{formatPrice(yearlyCents)}</span>
              <span className="text-sm font-bold text-zinc-400"> / year</span>
            </p>
            <p className="mt-2 text-xs font-bold text-[#4c49ed]">
              ≈ {formatPrice(perMonthYearly)} per month billed annually
            </p>
            <ul className="mt-6 flex-1 space-y-3 border-t border-indigo-100 pt-8">
              {perks.map((line) => (
                <li key={`y-${line}`} className="flex gap-3 text-sm font-medium text-zinc-600">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {line}
                </li>
              ))}
            </ul>
            <Link
              href="/auth/signup?plan=yearly"
              className="mt-10 block w-full rounded-2xl bg-zinc-900 py-4 text-center text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all hover:bg-zinc-800 active:scale-[0.99] sm:py-5"
            >
              Continue with yearly
            </Link>
          </article>
        </div>

        <p className="mt-10 text-center text-xs font-medium text-zinc-400">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-black text-[#4c49ed] hover:underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
