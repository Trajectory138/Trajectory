"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";

import { supabase } from "@/lib/supabase";

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !email.trim()) {
      return;
    }

    setIsSending(true);
    setMessage("");
    setError("");

    const { error: signUpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: typeof window === "undefined" ? undefined : window.location.origin
      }
    });

    setIsSending(false);

    if (signUpError) {
      setError("We could not send the sign-up link. Please check the email and try again.");
      return;
    }

    setMessage("Check your email for a secure sign-in link.");
  }

  if (!supabase) {
    return (
      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase text-leaf">Sign up</p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Supabase is not configured yet</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">
          Add your Supabase URL and anon key to continue with account sign-up.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase text-leaf">Account</p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Create your account</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">
          Use your email to create a secure account. Supabase will send you a sign-in link.
        </p>
      </section>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <form onSubmit={handleSubmit} className="grid max-w-md gap-4">
          <label className="block">
            <span className="text-sm font-medium">Email address</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
              placeholder="you@example.com"
            />
          </label>

          <button
            type="submit"
            disabled={!email.trim() || isSending}
            className="rounded-md bg-leaf px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-line disabled:text-ink/50"
          >
            {isSending ? "Sending link" : "Send sign-up link"}
          </button>

          {message ? (
            <p className="rounded-md border border-success/30 bg-successSoft px-3 py-2 text-sm text-success">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-md border border-danger/30 bg-dangerSoft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}
        </form>

        <p className="mt-5 text-sm text-ink/60">
          Already have an account? Enter the same email and Supabase will send a new sign-in link.
        </p>
        <Link href="/" className="mt-3 inline-flex text-sm font-semibold text-leaf transition hover:text-ink">
          Back to today
        </Link>
      </section>
    </div>
  );
}
