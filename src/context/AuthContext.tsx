"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User, Role } from "@/types/domain";
import { supabase } from "@/lib/supabase/browserClient";
import { updateUserCharityMock } from "@/lib/supabase/db";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: true; role: Role } | { ok: false; error: string }>;
  signUp: (params: {
    email: string;
    password: string;
    charityId: string | null;
    charityPct: number;
    donationPctExtra: number;
    role?: Role;
  }) => Promise<{ ok: true; userId: string } | { ok: false; error: string }>;
  signOut: () => void;
  refresh: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const { data: sessionData, error } = await supabase.auth.getSession();
    if (error) {
      setUser(null);
      return;
    }
    const u = sessionData.session?.user ?? null;
    if (!u) {
      setUser(null);
      return;
    }

    // Fetch profile to get role + charity settings.
    const { data: profile, error: profileError } = await supabase
      .from("golf_profiles")
      .select("user_id,role,charity_id,charity_pct,donation_pct_extra")
      .eq("user_id", u.id)
      .maybeSingle();

    if (profileError || !profile) {
      setUser({
        id: u.id,
        email: u.email ?? "",
        password: "",
        role: "subscriber",
        charityId: null,
        charityPct: 10,
        donationPctExtra: 0,
      });
      return;
    }

    setUser({
      id: profile.user_id,
      email: u.email ?? "",
      password: "",
      role: profile.role,
      charityId: profile.charity_id ?? null,
      charityPct: profile.charity_pct ?? 10,
      donationPctExtra: profile.donation_pct_extra ?? 0,
    });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refresh();
      if (!cancelled) setLoading(false);
    })();

    const { data } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { ok: false as const, error: error.message };
        await refresh();
        
        // Fetch role again to return it directly
        const { data: sessionData } = await supabase.auth.getSession();
        const { data: profile } = await supabase
          .from("golf_profiles")
          .select("role")
          .eq("user_id", sessionData.session?.user?.id)
          .maybeSingle();

        return { ok: true as const, role: profile?.role ?? "subscriber" };
      },
      signUp: async (params) => {
        const { data, error } = await supabase.auth.signUp({
          email: params.email,
          password: params.password,
        });
        if (error) return { ok: false as const, error: error.message };

        const userId = data.user?.id;
        if (!userId) {
          // If email confirmation is enabled, user may be null here.
          await refresh();
          return { ok: true as const, userId: "" };
        }

        try {
          await updateUserCharityMock({
            userId,
            charityId: params.charityId,
            charityPct: params.charityPct,
            donationPctExtra: params.donationPctExtra,
            role: params.role,
          });
        } catch {
          // Do not block account creation when DB tables are not migrated yet.
        }
        await refresh();
        return { ok: true as const, userId };
      },
      signOut: () => {
        supabase.auth.signOut();
        refresh();
      },
      refresh,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
