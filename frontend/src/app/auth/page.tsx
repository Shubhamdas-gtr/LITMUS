"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage(
          "Account created. Check your email if confirmation is required."
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Signed in successfully.");
      }
    }

    setLoading(false);
  }

async function testProfileApi() {
  setMessage("");
  setLoading(true);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    setMessage("No active Supabase session.");
    setLoading(false);
    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/api/profile/assessment", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
  career_goal: "Build a career in technology",
  target_role: "Software Engineer",
  interests: ["Technology", "Problem Solving"],
  skills: ["Python", "React"],
  skill_confidence: {
    
    Python: "comfortable",
    React: "getting_started",

  },
  assessment_answers: {
    q1: 1,
    q2: 2,
  },
}),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(
  typeof data.detail === "string"
    ? data.detail
    : JSON.stringify(data.detail)
);
    } else {
      setMessage("Profile API success: " + JSON.stringify(data));
    }
  } catch (error) {
    setMessage("Could not reach the backend.");
  } finally {
    setLoading(false);
  }
}

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[0_24px_60px_rgba(17,17,17,0.08)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
          LITMUS
        </p>

        <h1 className="font-ui mt-3 text-3xl font-semibold tracking-[-0.05em]">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>

        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          {isSignUp
            ? "Create an account to save your career assessment."
            : "Sign in to continue your LITMUS journey."}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : isSignUp
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <button
          type="button"
          onClick={testProfileApi}
          disabled={loading}
          className="mt-4 w-full rounded-full border border-[var(--border)] px-6 py-3.5 text-sm font-semibold text-[var(--foreground)] disabled:opacity-60"
        >
          Test Profile API
        </button>

        {message && (
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setMessage("");
          }}
          className="mt-6 text-sm font-medium text-[var(--accent)]"
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "Need an account? Create one"}
        </button>
      </div>
    </main>
  );
}