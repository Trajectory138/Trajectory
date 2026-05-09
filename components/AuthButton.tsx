"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

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
      setMessage("");
    });

    return () => subscription.unsubscribe();
  }, []);

  async function sendSignInLink() {
    if (!supabase || !email.trim()) {
      return;
    }

    setIsSending(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: typeof window === "undefined" ? undefined : window.location.origin
      }
    });

    setIsSending(false);
    setMessage(error ? "Could not send sign-in link." : "Check your email for the sign-in link.");
  }

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
    <div className="flex flex-col gap-1">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor="auth-email">
          Email
        </label>
        <input
          id="auth-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf sm:w-44"
        />
        <button
          type="button"
          onClick={sendSignInLink}
          disabled={!email.trim() || isSending}
          className="rounded-md bg-leaf px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-line disabled:text-ink/50"
        >
          {isSending ? "Sending" : "Sign in"}
        </button>
      </div>
      {message ? <p className="text-xs text-ink/60">{message}</p> : null}
    </div>
  );
}
