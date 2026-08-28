"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const phases = [
  "ANALYZING PROFILE",
  "MAPPING SKILLS",
  "IDENTIFYING GAPS",
  "BUILDING ROADMAP",
] as const;

export default function TransitionPage() {
  const router = useRouter();
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    const phaseTimer = window.setInterval(() => {
      setPhaseIndex((current) => (current + 1) % phases.length);
    }, 550);

    const redirectTimer = window.setTimeout(() => {
      router.replace("/dashboard");
    }, 2400);

    return () => {
      window.clearInterval(phaseTimer);
      window.clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <main className="litmus-shell relative isolate overflow-hidden litmus-grid-lines">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3">
              <div className="litmus-brand-mark">
                <span>L</span>
              </div>

              <div className="flex flex-col">
                <span className="litmus-brand-wordmark text-sm font-semibold text-[var(--foreground)]">
                  LITMUS
                </span>
                <span className="litmus-brand-tagline text-[0.68rem] text-[var(--muted)]">
                  career intelligence console
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
                Preparing your dashboard
              </p>
              <h1 className="max-w-2xl text-[clamp(2.8rem,7vw,5.8rem)] font-display font-bold leading-[0.9] tracking-[-0.07em] text-[var(--foreground)]">
                Building your LITMUS profile
              </h1>
              <p className="max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                We are moving from self-reported answers to a working career
                map. This brief handoff keeps the transition clear and focused.
              </p>
              <p className="text-[0.68rem] uppercase tracking-[0.32em] text-[var(--accent)]">
                LITMUS INTELLIGENCE
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {phases.map((phase, index) => {
                const isActive = index === phaseIndex;

                return (
                  <span
                    key={phase}
                    className={[
                      "rounded-full border px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.22em] transition duration-200",
                      isActive
                        ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--ink)]"
                        : "border-[var(--border)] bg-[rgba(8,10,16,0.76)] text-[var(--muted)]",
                    ].join(" ")}
                  >
                    {phase}
                  </span>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.replace("/dashboard")}
                className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--ink)] shadow-[0_14px_32px_rgba(141,220,16,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
              >
                Enter dashboard
              </button>

              <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.76)] px-4 py-3 text-sm text-[var(--muted)]">
                This only takes a moment
              </span>
            </div>
          </div>

          <div className="litmus-panel-strong rounded-xl p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
                  Intelligence core
                </p>
                <h2 className="mt-2 text-2xl font-display font-bold tracking-[-0.05em] text-[var(--foreground)]">
                  LITMUS INTELLIGENCE
                </h2>
              </div>

              <div className="rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.76)] px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                Live
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <div className="litmus-core litmus-scan-line flex items-center justify-center">
                <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.7)] text-center shadow-[0_0_0_1px_rgba(187,255,68,0.08)_inset]">
                  <span className="text-[0.62rem] uppercase tracking-[0.28em] text-[var(--muted)]">
                    Step
                  </span>
                  <span className="mt-1 text-3xl font-bold tracking-[-0.06em] text-[var(--foreground)]">
                    08
                  </span>
                  <span className="mt-1 text-[0.62rem] uppercase tracking-[0.22em] text-[var(--accent)]">
                    / 08
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                "Resume evidence",
                "Skill evidence",
                "Role fit",
                "Next steps",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-[var(--border)] bg-[rgba(8,10,16,0.72)] p-4"
                >
                  <p className="text-[0.65rem] uppercase tracking-[0.24em] text-[var(--muted)]">
                    Signal
                  </p>
                  <p className="mt-2 text-lg font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
