import Link from "next/link";

const journey = [
  {
    step: "01",
    title: "Understand",
    description:
      "Turn your experience, interests, and confidence into a clear baseline.",
  },
  {
    step: "02",
    title: "Build",
    description:
      "Convert gaps into projects, practice, and evidence you can point to.",
  },
  {
    step: "03",
    title: "Demonstrate",
    description:
      "Shape your resume, stories, and portfolio so your strengths show up.",
  },
  {
    step: "04",
    title: "Get Opportunities",
    description:
      "Focus on roles and next steps that fit your current readiness.",
  },
] as const;

export default function Home() {
  return (
    <main className="litmus-shell relative isolate overflow-hidden litmus-grid-lines">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 py-3 sm:py-5">
          <div className="inline-flex items-center gap-3">
            <div className="litmus-brand-mark">
              <span>L</span>
            </div>

            <div className="flex flex-col">
              <span className="litmus-brand-wordmark text-sm font-semibold text-[var(--foreground)]">
                LITMUS
              </span>
              <span className="litmus-brand-tagline text-[0.66rem] text-[var(--muted)]">
                unsure about your value, give yourself a LITMUS test
              </span>
            </div>
          </div>

          <div className="hidden rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.74)] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[var(--muted)] shadow-[0_12px_26px_rgba(0,0,0,0.3)] sm:inline-flex">
            Guided assessment
          </div>
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:py-14">
          <div className="space-y-8">
            <div className="space-y-5">
              <p className="text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
                Career intelligence for college students
              </p>

              <h1 className="font-display max-w-3xl text-[clamp(3.4rem,10vw,6.8rem)] font-bold leading-[0.92] tracking-[-0.07em] text-[var(--foreground)]">
                Your career, figured out.
              </h1>

              <p className="max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                LITMUS helps you understand your skills, spot the gaps, build
                proof, present yourself professionally, and move toward
                opportunities that actually fit where you are right now.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/assessment"
                className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-[var(--ink)] shadow-[0_16px_36px_rgba(141,220,16,0.24)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
              >
                Start your assessment
              </Link>

              <div className="inline-flex items-center rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.74)] px-4 py-3 text-sm text-[var(--muted)] shadow-[0_12px_28px_rgba(0,0,0,0.28)]">
                8 step guided flow, built for clarity
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="litmus-panel rounded-lg p-4 transition duration-200 hover:-translate-y-1 hover:border-[var(--border-strong)]">
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                  Understand
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--foreground)]">
                  See your strengths, confidence, and starting point in one
                  place.
                </p>
              </div>

              <div className="litmus-panel rounded-lg p-4 transition duration-200 hover:-translate-y-1 hover:border-[var(--border-strong)]">
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                  Build
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--foreground)]">
                  Turn gaps into actions, projects, and practice that add proof.
                </p>
              </div>

              <div className="litmus-panel rounded-lg p-4 transition duration-200 hover:-translate-y-1 hover:border-[var(--border-strong)]">
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                  Get opportunities
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--foreground)]">
                  Focus on the roles and next steps that match your readiness.
                </p>
              </div>
            </div>
          </div>

          <div
            id="journey"
            className="litmus-panel-strong rounded-xl p-4 sm:p-5"
          >
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                  LITMUS journey
                </p>
                <h2 className="font-ui mt-2 text-xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                  A guided path from insight to action.
                </h2>
              </div>

              <div className="hidden rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.74)] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted)] md:inline-flex">
                MVP flow
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {journey.map((item, index) => (
                <article
                  key={item.title}
                  className={[
                    "group rounded-lg border border-[var(--border)] bg-[rgba(8,10,16,0.74)] p-5 shadow-[0_12px_28px_rgba(0,0,0,0.24)] transition duration-200 ease-out hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-[0_18px_36px_rgba(0,0,0,0.32)] active:translate-y-0 active:scale-[0.99]",
                    index === 0 ? "sm:col-span-2" : "",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                        Step {item.step}
                      </p>
                      <h3 className="font-ui mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
                        {item.title}
                      </h3>
                    </div>

                    <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(141,99,255,0.1)] text-sm font-semibold text-[var(--accent)] transition duration-200 group-hover:bg-[var(--accent)] group-hover:text-[var(--ink)]">
                      {item.step}
                    </span>
                  </div>

                  <p className="mt-4 max-w-md text-sm leading-6 text-[var(--muted)]">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-dashed border-[var(--border)] bg-[rgba(8,10,16,0.74)] px-5 py-4 text-sm leading-6 text-[var(--muted)]">
              Start with your current reality. LITMUS will use that to reveal
              what matters next.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
