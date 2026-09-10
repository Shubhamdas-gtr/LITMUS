const features = [
  {
    title: "Assessment",
    description: "Goal, target role, interests, skills, and confidence in one guided flow.",
    snippet: "career_goal → target_role → review",
  },
  {
    title: "Resume evidence",
    description: "Upload a PDF or DOCX once; open the signed copy anytime from your console.",
    snippet: "PDF / DOCX · signed URL",
  },
  {
    title: "GitHub evidence",
    description: "Connect GitHub, sync on demand, and keep cached repos plus 30-day activity.",
    snippet: "repos · languages · active days",
  },
  {
    title: "Skill gap",
    description: "Missing, weak, and strength signals with priority and reason for each skill.",
    snippet: "missing · weak · strengths",
  },
  {
    title: "Roadmap",
    description: "Each gap becomes topics, a project, and mastery proof with progress tracking.",
    snippet: "topics → project → proof",
  },
  {
    title: "Leads",
    description: "Repo pushes become conservative drafts you copy, edit, approve, or delete.",
    snippet: "keep · edit · copy · delete",
  },
] as const;

export default function FeatureGrid() {
  return (
    <section id="how-it-works" aria-label="What LITMUS does" className="scroll-mt-28 space-y-5">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
          What LITMUS does
        </p>
        <h2 className="max-w-3xl text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[0.96] tracking-[-0.06em] text-[var(--foreground)]">
          Six working surfaces, one career map.
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-lg border border-[var(--border)] bg-[rgba(8,10,16,0.8)] p-5 shadow-[0_14px_32px_rgba(0,0,0,0.24)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
          >
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[var(--muted)]">
              Surface
            </p>
            <h3 className="mt-3 text-xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
              {feature.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {feature.description}
            </p>
            <p className="mt-4 rounded-md border border-[var(--border)] bg-[rgba(8,10,16,0.9)] px-3 py-2 font-mono text-[0.7rem] leading-5 text-[var(--muted-strong)]">
              {feature.snippet}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
