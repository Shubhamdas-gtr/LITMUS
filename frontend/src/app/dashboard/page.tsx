import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="relative isolate overflow-hidden">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 py-3 sm:py-5">
          <div className="inline-flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--foreground)] text-sm font-semibold tracking-[0.24em] text-[var(--background)] shadow-[0_10px_24px_rgba(17,17,17,0.12)]">
              L
            </div>
            <div className="flex flex-col">
              <span className="font-ui text-sm font-semibold tracking-[0.28em] text-[var(--foreground)]">
                LITMUS
              </span>
              <span className="font-ui text-[0.7rem] uppercase tracking-[0.28em] text-[var(--muted)]">
                dashboard
              </span>
            </div>
          </div>

          <Link
            href="/assessment"
            className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[var(--muted)] shadow-[0_10px_24px_rgba(17,17,17,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
          >
            Review assessment
          </Link>
        </header>

        <section className="flex flex-1 items-center justify-center py-10 lg:py-14">
          <div className="w-full max-w-3xl rounded-[2rem] border border-[var(--border-strong)] bg-[var(--surface)] p-6 shadow-[0_24px_60px_rgba(17,17,17,0.08)] sm:p-8">
            <p className="font-ui text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
              Dashboard placeholder
            </p>
            <h1 className="font-ui mt-4 text-[clamp(2.4rem,5.5vw,4.4rem)] font-bold tracking-[-0.07em] text-[var(--foreground)] leading-[0.94]">
              LITMUS is ready to build your career map.
            </h1>
            <p className="font-ui mt-4 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              This is the first landing point for the full product experience.
              We&apos;ll use your assessment to start building your profile,
              evidence, and next steps from here.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
