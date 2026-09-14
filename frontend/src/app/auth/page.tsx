"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const PASSWORD_MIN_LENGTH = 6;

type PasswordRule = {
  id: string;
  label: string;
  valid: boolean;
};

function getPasswordRules(password: string): PasswordRule[] {
  return [
    {
      id: "length",
      label: `At least ${PASSWORD_MIN_LENGTH} characters`,
      valid: password.length >= PASSWORD_MIN_LENGTH,
    },
    {
      id: "uppercase",
      label: "1 uppercase letter (A–Z)",
      valid: /[A-Z]/.test(password),
    },
    {
      id: "numeric",
      label: "1 number (0–9)",
      valid: /\d/.test(password),
    },
    {
      id: "special",
      label: "1 special character (e.g. ! @ # $)",
      valid: /[^A-Za-z0-9]/.test(password),
    },
  ];
}

function getMissingRules(password: string): string[] {
  return getPasswordRules(password)
    .filter((rule) => !rule.valid)
    .map((rule) => rule.label);
}

function isSecretKeyError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("secret") ||
    normalized.includes("publishable") ||
    normalized.includes("user-agent") ||
    normalized.includes("forbidden use")
  );
}

function isEmailNotConfirmedError(message: string): boolean {
  return message.toLowerCase().includes("email not confirmed");
}

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [message, setMessage] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordRules = getPasswordRules(password);

  useEffect(() => {
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const existingName = String(
          session.user.user_metadata?.display_name ?? "",
        ).trim();
        router.replace(existingName ? "/dashboard" : "/welcome");
      }
    })();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setShowResend(false);

    // Password protocol enforced on both sign-up and sign-in (per request):
    // min 6 chars + 1 uppercase + 1 numeric + 1 special character.
    const missing = getMissingRules(password);
    if (missing.length > 0) {
      setMessage(
        isSignUp
          ? `Password must include: ${missing.join(", ")}.`
          : "Password does not meet current requirements. If this is an older account, reset your password to update it."
      );
      setLoading(false);
      return;
    }

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(
          isSecretKeyError(error.message)
            ? "App is misconfigured (secret API key used in browser). Please check the Vercel env vars: NEXT_PUBLIC_SUPABASE_ANON_KEY must be the publishable key."
            : error.message
        );
        setShowResend(isEmailNotConfirmedError(error.message));
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
        setMessage(
          isSecretKeyError(error.message)
            ? "App is misconfigured (secret API key used in browser). Please check the Vercel env vars: NEXT_PUBLIC_SUPABASE_ANON_KEY must be the publishable key."
            : error.message
        );
        setShowResend(isEmailNotConfirmedError(error.message));
      } else {
        const {
          data: { session: freshSession },
        } = await supabase.auth.getSession();
        const existingName = String(
          freshSession?.user.user_metadata?.display_name ?? "",
        ).trim();
        if (!freshSession) {
          setMessage(
            "Signed in successfully. Taking you to the next step...",
          );
          router.replace("/welcome");
        } else {
          setMessage("Signed in successfully. Taking you to the next step...");
          router.replace(existingName ? "/dashboard" : "/welcome");
        }
      }
    }

    setLoading(false);
  }

  async function handleResendConfirmation() {
    if (!email) {
      setMessage("Enter your email above, then resend confirmation.");
      return;
    }
    setResendLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    setMessage(
      error
        ? error.message
        : "Confirmation email resent. Check your inbox, then sign in."
    );
    setResendLoading(false);
  }

  return (
    <main className="litmus-shell flex min-h-screen items-center justify-center px-4 litmus-grid-lines">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.44)]">
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

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={PASSWORD_MIN_LENGTH}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 pr-24 text-sm outline-none focus:border-[var(--accent)]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {showPassword ? (
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  <line x1="2" y1="2" x2="22" y2="22" />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <ul
            aria-label="Password requirements"
            className="grid grid-cols-1 gap-1.5 text-xs leading-5"
          >
            {passwordRules.map((rule) => (
              <li
                key={rule.id}
                className={
                  rule.valid
                    ? "text-[var(--accent)]"
                    : "text-[var(--muted)]"
                }
              >
                {rule.valid ? "✓ " : "○ "}
                {rule.label}
              </li>
            ))}
          </ul>

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

        {message && (
          <div>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              {message}
            </p>
            {showResend && (
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resendLoading}
                className="mt-2 text-sm font-medium text-[var(--accent)] disabled:opacity-60"
              >
                {resendLoading ? "Resending..." : "Resend confirmation email"}
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setMessage("");
            setShowResend(false);
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