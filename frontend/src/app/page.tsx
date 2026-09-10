import Link from "next/link";
import EvidenceTabs from "@/components/landing/EvidenceTabs";
import Faq from "@/components/landing/Faq";
import FeatureGrid from "@/components/landing/FeatureGrid";
import HeroPreviewTabs from "@/components/landing/HeroPreviewTabs";
import StatsStrip from "@/components/landing/StatsStrip";
import TrackCards from "@/components/landing/TrackCards";

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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
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

              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.74)] px-6 py-3.5 text-sm text-[var(--muted)] shadow-[0_12px_28px_rgba(0,0,0,0.28)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
              >
                Open your console
              </Link>
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

          <HeroPreviewTabs />
        </section>

        <StatsStrip />

        <section
          id="journey"
          className="litmus-panel-strong scroll-mt-28 rounded-xl p-4 sm:p-5"
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
              8 step flow
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
        </section>

        <FeatureGrid />

        <EvidenceTabs />

        <TrackCards />

        <Faq />

        <section className="rounded-xl border border-[var(--border-strong)] bg-[linear-gradient(180deg,rgba(141,99,255,0.08),transparent_16%),var(--surface-strong)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.44)] sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
                Ready when you are
              </p>
              <h2 className="text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[0.96] tracking-[-0.06em] text-[var(--foreground)]">
                Start with assessment, continue in console.
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/assessment"
                className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-[var(--ink)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--accent-strong)]"
              >
                Start your assessment
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.78)] px-6 py-3.5 text-sm text-[var(--muted)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
              >
                Open dashboard
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
