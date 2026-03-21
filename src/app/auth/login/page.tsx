"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => email.trim().length > 0 && password.length > 0, [email, password]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-6 py-20 flex items-center justify-center">
      <div className="w-full max-w-[540px]">
        <div className="text-center mb-10">
            <p className="text-[10px] font-black tracking-[0.3em] text-[#4c49ed] uppercase">Secure Access</p>
            <h1 className="mt-4 text-6xl font-black tracking-tighter text-zinc-900 leading-none">Welcome Back</h1>
            <p className="mt-4 text-base font-medium text-zinc-400">Enter your credentials to manage your impact.</p>
        </div>

        <form
            className="rounded-[40px] bg-white p-12 shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-zinc-100"
            onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                if (!canSubmit || submitting) return;
                setSubmitting(true);
                try {
                const res = await signIn(email.trim(), password);
                if (!res.ok) {
                    setError(res.error);
                } else {
                    if (res.role === "admin") {
                    router.push("/admin");
                    } else {
                    router.push("/dashboard");
                    }
                }
                } catch (e) {
                setError(e instanceof Error ? e.message : "Sign in failed. Please try again.");
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
                        className="w-full rounded-2xl border border-zinc-100 bg-[#fbfbfb] p-5 text-sm font-bold text-zinc-900 outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-200"
                        placeholder="you@example.com"
                    />
                </div>

                <div>
                    <label className="text-[10px] font-black tracking-widest text-zinc-300 uppercase mb-3 block">Password</label>
                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        autoComplete="current-password"
                        className="w-full rounded-2xl border border-zinc-100 bg-[#fbfbfb] p-5 text-sm font-bold text-zinc-900 outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-200"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            {error ? <div className="mt-6 rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-500 border border-rose-100 shadow-sm animate-in fade-in slide-in-from-top-2">{error}</div> : null}

            <button
                disabled={!canSubmit || loading || submitting}
                type="submit"
                className="mt-10 w-full rounded-2xl bg-[#4c49ed] py-6 text-xs font-black text-white hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 uppercase tracking-[0.2em]"
            >
                {submitting ? "Authenticating..." : "Sign in to Dashboard"}
            </button>

            <div className="mt-10 space-y-4 pt-10 border-t border-zinc-50">
                <p className="text-center text-xs font-bold text-zinc-400">
                    New to Fairway Impact?{" "}
                    <Link className="text-[#4c49ed] hover:underline underline-offset-4 font-black" href="/auth/signup">
                        Create account
                    </Link>
                </p>
                
                <div className="pt-8 mt-4 border-t border-rose-50 flex flex-col items-center">
                    <p className="text-[9px] font-black text-rose-300 uppercase tracking-[0.2em] mb-4 text-center">Architect & Network Control</p>
                    <Link className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest px-6 py-2 rounded-full bg-rose-50 transition-all border border-rose-100" href="/auth/admin-signup">
                        Admin Registration
                    </Link>
                </div>
            </div>
        </form>
      </div>
    </div>
  );
}
