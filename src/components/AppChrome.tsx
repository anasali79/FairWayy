"use client";

import { usePathname, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    setAuthorized(false);
    if (loading) return;

    // /draw-mechanics is public (overview for visitors); /admin stays restricted
    const isAdminPath = pathname.startsWith("/admin");
    const isAuthPath = pathname.startsWith("/auth");
    const isUserPath = ["/dashboard", "/my-scores", "/winnings", "/draw-results"].some(p => pathname.startsWith(p));

    // Redirection Logic
    if (user) {
      if (isAuthPath) {
        router.replace(user.role === "admin" ? "/admin" : "/dashboard");
        return;
      }
      if (isAdminPath && user.role !== "admin") {
        router.replace("/dashboard");
        return;
      }
      setAuthorized(true);
    } else {
      if (isAdminPath || isUserPath) {
        router.replace("/auth/login");
        return;
      }
      setAuthorized(true);
    }
  }, [user, loading, pathname, router]);

  const isHome = pathname === "/";

  if (loading || !authorized) {
      return (
        <div className="flex h-screen items-center justify-center bg-white">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      );
  }

  return (
    <>
      <Navbar />
      <main className="flex flex-col flex-1 pt-24">{children}</main>
      {isHome ? null : <SiteFooter />}
    </>
  );
}
