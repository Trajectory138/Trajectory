"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

export function AccountSettings() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      return;
    }

    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
  }

  if (!supabase) {
    return (
      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold">Account</h2>
        <p className="mt-1 text-sm text-ink/60">Supabase is not configured for account access yet.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Account</h2>
          {isLoading ? (
            <p className="mt-1 text-sm text-ink/60">Checking account status...</p>
          ) : user ? (
            <p className="mt-1 text-sm text-ink/60">
              Signed in as <span className="font-medium text-ink">{user.email}</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink/60">Sign in to save goals permanently to your account.</p>
          )}
        </div>

        {user ? (
          <button
            type="button"
            onClick={signOut}
            className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-leaf hover:text-leaf"
          >
            Sign out
          </button>
        ) : (
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-md bg-leaf px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink"
          >
            Sign up
          </Link>
        )}
      </div>
    </section>
  );
}
