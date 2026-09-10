const stats = [
  { value: "8 steps", label: "Guided assessment", note: "Goal → role → review" },
  { value: "4 signals", label: "Evidence sources", note: "Resume · skills · role · gaps" },
  { value: "30 days", label: "GitHub activity", note: "Commits · PRs · active days" },
  { value: "Manual", label: "Lead review", note: "Copy · edit · keep · delete" },
] as const;

export default function StatsStrip() {
  return (
    <section aria-label="LITMUS at a glance" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="litmus-panel rounded-lg p-4">
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[var(--muted)]">
            {stat.label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
            {stat.value}
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{stat.note}</p>
        </div>
      ))}
    </section>
  );
}
