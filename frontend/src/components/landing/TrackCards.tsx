import Link from "next/link";

const tracks = [
  {
    title: "Internship",
    description: "Get experience and break into your field with proof you can point to.",
    href: "/assessment",
    cta: "Prepare for internships",
  },
  {
    title: "Full-time",
    description: "Prepare for a first full-time role by closing high-priority gaps first.",
    href: "/assessment",
    cta: "Prepare for full-time",
  },
  {
    title: "Exploring",
    description: "Keep options open while LITMUS maps interests to roles and next steps.",
    href: "/dashboard",
    cta: "Explore your console",
  },
] as const;

export default function TrackCards() {
  return (
    <section id="tracks" aria-label="Where LITMUS fits" className="scroll-mt-28 space-y-5">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
          Tracks
        </p>
        <h2 className="max-w-3xl text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[0.96] tracking-[-0.06em] text-[var(--foreground)]">
          One console, three starting points.
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {tracks.map((track) => (
          <article
            key={track.title}
            className="flex min-h-56 flex-col justify-between rounded-xl border border-[var(--border)] bg-[rgba(8,10,16,0.8)] p-5 shadow-[0_14px_32px_rgba(0,0,0,0.24)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
          >
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[var(--muted)]">
                Track
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
                {track.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {track.description}
              </p>
            </div>
            <Link
              href={track.href}
              className="mt-5 inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.78)] px-4 py-2.5 text-xs uppercase tracking-[0.22em] text-[var(--muted)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
            >
              {track.cta}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
