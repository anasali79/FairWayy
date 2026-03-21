"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Navbar() {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const closeMenu = () => setMenuOpen(false);

  const linkClass = (href: string) =>
    cx(
      "px-3.5 py-2 text-[10px] font-black tracking-[0.2em] transition-all uppercase rounded-xl whitespace-nowrap",
      isActive(href)
        ? "text-indigo-600 bg-indigo-50/50 shadow-sm"
        : scrolled
          ? "text-zinc-500 hover:text-zinc-900"
          : "text-zinc-400 hover:text-white"
    );

  const isHome = pathname === "/";

  return (
    <header className={cx(
      "fixed top-0 left-0 right-0 z-[100] transition-all duration-500",
      scrolled
        ? "py-4 px-6 md:px-10"
        : "py-8 px-8 md:px-12"
    )}>
      <div className={cx(
        "mx-auto flex w-full max-w-7xl items-center justify-between rounded-[32px] px-8 py-5 transition-all duration-500",
        scrolled
          ? "bg-white/80 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-white/50"
          : "bg-transparent"
      )}>
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-3 group"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-200 group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <span className={cx(
              "text-2xl font-black tracking-tighter leading-none transition-colors",
              scrolled || !isHome ? "text-zinc-900" : "text-white"
            )}>
              Fairway <span className="text-indigo-600">Impact</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {!user && (
              <>
                <Link href="/" className={linkClass("/")} onClick={closeMenu}>Home</Link>
                <Link href="/charities" className={linkClass("/charities")} onClick={closeMenu}>Charities</Link>
                <Link href="/draw-mechanics" className={linkClass("/draw-mechanics")} onClick={closeMenu}>Draw Mechanics</Link>
                <Link href="/auth/signup" className={linkClass("/auth/signup")} onClick={closeMenu}>Subscription</Link>
              </>
            )}

            {user?.role === "subscriber" && (
              <>
                <Link href="/" className={linkClass("/")} onClick={closeMenu}>Home</Link>
                <Link href="/charities" className={linkClass("/charities")} onClick={closeMenu}>Charities</Link>
                <Link href="/my-scores" className={linkClass("/my-scores")} onClick={closeMenu}>My Scores</Link>
                <Link href="/winnings" className={linkClass("/winnings")} onClick={closeMenu}>Winnings</Link>
                <Link href="/draw-results" className={linkClass("/draw-results")} onClick={closeMenu}>Draw Results</Link>
                <Link href="/dashboard" className={linkClass("/dashboard")} onClick={closeMenu}>Dashboard</Link>
              </>
            )}

            {user?.role === "admin" && (
              <>
                <Link href="/" className={linkClass("/")} onClick={closeMenu}>Home</Link>
                <Link href="/admin/charities" className={linkClass("/admin/charities")} onClick={closeMenu}>Charities</Link>
                <Link href="/admin/users" className={linkClass("/admin/users")} onClick={closeMenu}>Users</Link>
                <Link href="/draw-mechanics" className={linkClass("/draw-mechanics")} onClick={closeMenu}>Draw Mechanics</Link>
                <Link href="/admin/verifications" className={linkClass("/admin/verifications")} onClick={closeMenu}>Verify</Link>
                <Link href="/admin" className={linkClass("/admin")} onClick={closeMenu}>Dashboard</Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={cx(
              "inline-flex h-10 w-10 items-center justify-center rounded-xl md:hidden",
              scrolled || !isHome ? "bg-zinc-100 text-zinc-700" : "bg-white/15 text-white",
            )}
            aria-label="Toggle menu"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d={menuOpen ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} />
            </svg>
          </button>
          {!loading && user ? (
            <div className="flex items-center gap-3 scale-95 origin-right">
              <div className={cx(
                "flex flex-col items-end transition-colors",
                scrolled || !isHome ? "text-zinc-900" : "text-zinc-400"
              )}>
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">
                  {user.role === "admin" ? "Admin" : "Member"} Active
                </p>
                <p className="text-[9px] font-bold mt-1 opacity-60 uppercase">{user.id.slice(0, 8)}</p>
              </div>
              <button
                onClick={signOut}
                className="h-12 w-12 flex items-center justify-center rounded-2xl bg-zinc-100 hover:bg-rose-50 hover:text-rose-500 transition-all text-zinc-500"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10 5H6.8A1.8 1.8 0 0 0 5 6.8v10.4A1.8 1.8 0 0 0 6.8 19H10" />
                  <path d="M14 16l4-4-4-4" />
                  <path d="M18 12H9" />
                </svg>
              </button>
            </div>
          ) : !loading && (
            <Link
              href="/auth/signup"
              className={cx(
                "flex h-12 items-center justify-center rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest transition-all",
                scrolled || !isHome
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
                  : "bg-white text-zinc-900 shadow-xl"
              )}
            >
              Start Subscription
            </Link>
          )}
        </div>
      </div>

      {menuOpen ? (
        <div
          className={cx(
            "mx-auto mt-3 w-full max-w-7xl rounded-2xl border p-3 md:hidden",
            scrolled || !isHome ? "border-zinc-200 bg-white shadow-lg" : "border-zinc-700 bg-zinc-900/95",
          )}
        >
          <nav className="flex flex-col gap-1">
            {!user && (
              <>
                <Link href="/" className={linkClass("/")}>Home</Link>
                <Link href="/charities" className={linkClass("/charities")}>Charities</Link>
                <Link href="/draw-mechanics" className={linkClass("/draw-mechanics")}>Draw Mechanics</Link>
                <Link href="/auth/signup" className={linkClass("/auth/signup")}>Subscription</Link>
              </>
            )}

            {user?.role === "subscriber" && (
              <>
                <Link href="/" className={linkClass("/")}>Home</Link>
                <Link href="/charities" className={linkClass("/charities")}>Charities</Link>
                <Link href="/my-scores" className={linkClass("/my-scores")}>My Scores</Link>
                <Link href="/winnings" className={linkClass("/winnings")}>Winnings</Link>
                <Link href="/draw-results" className={linkClass("/draw-results")}>Draw Results</Link>
                <Link href="/dashboard" className={linkClass("/dashboard")}>Dashboard</Link>
              </>
            )}

            {user?.role === "admin" && (
              <>
                <Link href="/" className={linkClass("/")}>Home</Link>
                <Link href="/admin/charities" className={linkClass("/admin/charities")}>Charities</Link>
                <Link href="/admin/users" className={linkClass("/admin/users")}>Users</Link>
                <Link href="/draw-mechanics" className={linkClass("/draw-mechanics")}>Draw Mechanics</Link>
                <Link href="/admin/verifications" className={linkClass("/admin/verifications")}>Verify</Link>
                <Link href="/admin" className={linkClass("/admin")}>Dashboard</Link>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
