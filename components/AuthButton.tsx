"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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
    return null;
  }

  if (user) {
    return (
      <div className="flex flex-col gap-1 sm:items-end">
        <button
          type="button"
          onClick={signOut}
          className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink/70 transition hover:border-leaf hover:text-leaf"
        >
          Sign out
        </button>
        <span className="max-w-40 truncate text-xs text-ink/50">{user.email}</span>
      </div>
    );
  }

  return (
    <Link
      href="/signup"
      className="rounded-md bg-leaf px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink"
    >
      Sign up
    </Link>
  );
}
