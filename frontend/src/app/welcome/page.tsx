"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 40;

function isValidName(value: string) {
  const trimmed = value.trim();
  if (trimmed.length < MIN_NAME_LENGTH || trimmed.length > MAX_NAME_LENGTH) {
    return false;
  }
  return /^[\p{L}\p{M}'’\- .]+$/u.test(trimmed);
}

function WelcomeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("edit") === "1";

  const [name, setName] = useState("");
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!session) {
        router.replace("/auth");
        return;
      }
      const existing = String(
        session.user.user_metadata?.display_name ?? "",
      ).trim();
      if (existing) setName(existing);
      if (existing && !isEditMode) {
        router.replace("/dashboard");
        return;
      }
      setChecking(false);
    })();
    return () => {
      mounted = false;
    };
  }, [router, isEditMode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const trimmed = name.trim();
    if (!isValidName(trimmed)) {
      setError(
        `Please enter a name between ${MIN_NAME_LENGTH} and ${MAX_NAME_LENGTH} characters (letters, spaces, apostrophes, hyphens).`,
      );
      return;
    }

    try {
      setSaving(true);
      const { error: updateError } = await supabase.auth.updateUser({
        data: { display_name: trimmed },
      });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      router.replace("/dashboard");
    } catch {
      setError("Could not save your name. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    router.replace("/dashboard");
  };

  if (checking) {
    return (
      <main className="litmus-shell flex min-h-screen items-center justify-center px-4 litmus-grid-lines">
        <p className="text-sm text-[var(--muted)]">Getting things ready…</p>
      </main>
    );
  }

  return (
    <main className="litmus-shell flex min-h-screen items-center justify-center px-4 litmus-grid-lines">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.44)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
          Welcome to LITMUS
        </p>
        <h1 className="font-ui mt-3 text-3xl font-semibold tracking-[-0.02em] text-[var(--foreground)]">
          What should we call you?
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          {isEditMode
            ? "Update the name shown across your console."
            : "This is shown across your console instead of your email. You can change it anytime."}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label
            htmlFor="display-name"
            className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]"
          >
            Your name
          </label>
          <input
            id="display-name"
            type="text"
            placeholder="e.g. Shubham"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={MIN_NAME_LENGTH}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="nickname"
            autoFocus
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
          />

          {error ? (
            <p className="text-sm leading-6 text-[var(--danger)]">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-[var(--ink)] transition duration-200 hover:bg-[var(--accent-strong)] disabled:cursor-wait disabled:opacity-60"
          >
            {saving ? "Saving…" : "Continue to dashboard"}
          </button>
        </form>

        {!isEditMode ? (
          <button
            type="button"
            onClick={handleSkip}
            disabled={saving}
            className="mt-4 w-full rounded-full border border-[var(--border)] px-6 py-3.5 text-sm font-semibold text-[var(--muted)] transition duration-200 hover:border-[var(--border-strong)] hover:text-[var(--foreground)] disabled:opacity-60"
          >
            Skip for now
          </button>
        ) : null}
      </div>
    </main>
  );
}

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <main className="litmus-shell flex min-h-screen items-center justify-center px-4 litmus-grid-lines">
          <p className="text-sm text-[var(--muted)]">Getting things ready…</p>
        </main>
      }
    >
      <WelcomeForm />
    </Suspense>
  );
}
