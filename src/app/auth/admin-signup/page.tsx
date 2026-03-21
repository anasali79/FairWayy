"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function AdminSignupPage() {
  const router = useRouter();
  const { signUp, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.length >= 6 && password === confirm;
  }, [email, password, confirm]);

  if (success) {
      return (
          <div className="min-h-screen bg-[#fefafe] px-6 py-20 flex flex-col items-center justify-center">
              <div className="w-full max-w-[580px] text-center rounded-[48px] bg-white p-16 shadow-2xl border border-rose-50">
                  <div className="h-24 w-24 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-10 border border-rose-100 shadow-sm animate-pulse">
                      <svg className="h-12 w-12 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <h1 className="text-5xl font-black text-zinc-900 tracking-tighter mb-4">Admin Provisioned!</h1>
                  <p className="text-lg font-medium text-zinc-500 leading-relaxed mb-10">
                    Administrative access for <span className="text-zinc-900 font-bold">{email}</span> requires email verification.
                    Please check your inbox to activate the node.
                  </p>
                  <Link href="/auth/login" className="inline-block w-full rounded-3xl bg-rose-600 py-6 text-xs font-black text-white hover:bg-rose-700 transition-all uppercase tracking-[0.2em] shadow-xl shadow-rose-100">
                    Back to Secure Login
                  </Link>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#fefafe] px-6 py-20 flex flex-col items-center justify-center">
      <div className="w-full max-w-[580px]">
        <div className="text-center mb-12">
            <p className="text-[10px] font-black tracking-[0.3em] text-rose-500 uppercase">System Administration</p>
            <h1 className="mt-4 text-6xl font-black tracking-tighter text-zinc-900 leading-none">Admin Registration</h1>
            <p className="mt-4 text-base font-medium text-zinc-400">Initialize a new administrative node for the Fairway network.</p>
        </div>

        <form
          className="rounded-[40px] bg-white p-12 shadow-[0_24px_60px_rgba(244,63,94,0.05)] border border-rose-50"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!canSubmit || submitting) return;
            setError(null);
            setSubmitting(true);
            try {
              const res = await signUp({
                email: email.trim(),
                password,
                charityId: null,
                charityPct: 0,
                donationPctExtra: 0,
                role: "admin",
              });

              if (!res.ok) {
                setError(res.error);
                return;
              }

              if (res.userId === "") {
                setSuccess(true);
                return;
              }

              router.push("/admin");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Signup failed. Please try again.");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black tracking-widest text-zinc-300 uppercase mb-3 block">Email Address</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                className="w-full rounded-2xl border border-zinc-100 bg-[#fffcfc] p-5 text-sm font-bold text-zinc-900 outline-none focus:border-rose-400 transition-all"
                placeholder="admin@fairway.com"
              />
            </div>

            <div>
              <label className="text-[10px] font-black tracking-widest text-zinc-300 uppercase mb-3 block">Security Key (Password)</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                className="w-full rounded-2xl border border-zinc-100 bg-[#fffcfc] p-5 text-sm font-bold text-zinc-900 outline-none focus:border-rose-400 transition-all"
                placeholder="Min 6 characters"
              />
            </div>

            <div>
              <label className="text-[10px] font-black tracking-widest text-zinc-300 uppercase mb-3 block">Confirm Key</label>
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                type="password"
                autoComplete="new-password"
                className="w-full rounded-2xl border border-zinc-100 bg-[#fffcfc] p-5 text-sm font-bold text-zinc-900 outline-none focus:border-rose-400 transition-all"
              />
            </div>
          </div>

          {error ? <div className="mt-8 rounded-2xl bg-rose-50 p-5 text-xs font-bold text-rose-500 border border-rose-100 shadow-sm">{error}</div> : null}

          <button
            disabled={!canSubmit || loading || submitting}
            type="submit"
            className="mt-12 w-full rounded-3xl bg-rose-600 py-7 text-xs font-black text-white hover:bg-rose-700 transition-all shadow-xl shadow-rose-100 disabled:opacity-50 uppercase tracking-[0.25em]"
          >
            {submitting ? "Provisioning..." : "Enable Administrative Access"}
          </button>

          <p className="mt-10 text-center text-xs font-bold text-zinc-400">
            Already registered?{" "}
            <Link className="text-rose-500 hover:underline underline-offset-4 font-black" href="/auth/login">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
