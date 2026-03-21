"use client";

import Link from "next/link";

const footerLinks = [
  { href: "/about", label: "ABOUT US" },
  { href: "/contact", label: "CONTACT" },
  { href: "/privacy", label: "PRIVACY" },
  { href: "/terms", label: "TERMS" },
  { href: "/charities", label: "CHARITY PARTNERS" },
];

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-zinc-200 bg-[#f6f4f4]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-6 py-8 md:flex-row md:items-center md:justify-between">
        <div className="text-2xl font-semibold tracking-tight text-zinc-900">Fairway Impact.</div>
        <nav className="flex flex-wrap items-center gap-x-7 gap-y-2">
          {footerLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-[11px] font-semibold tracking-[0.24em] text-zinc-500 transition hover:text-zinc-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="text-[11px] font-semibold tracking-[0.22em] text-zinc-500">
          © 2024 FAIRWAY IMPACT. THE ALTRUISTIC LENS.
        </div>
      </div>
    </footer>
  );
}
