"use client";

import { useState } from "react";

const tabs = [
  {
    id: "resume",
    label: "Resume",
    heading: "What your resume demonstrates",
    body: "Linked resume evidence stays attached to your profile and opens as a signed document when you need it.",
  },
  {
    id: "skills",
    label: "Skills",
    heading: "Declared skills plus confidence",
    body: "Self-reported skills are stored with getting-started → very-confident levels so gaps stay honest, not inflated.",
  },
  {
    id: "role-fit",
    label: "Role fit",
    heading: "Target role shapes the gaps",
    body: "Missing and weak skills are scored against the role you picked, with priority and reason attached to each item.",
  },
  {
    id: "next",
    label: "Next steps",
    heading: "Gaps become a buildable path",
    body: "Roadmap items pair learning topics with a project and mastery proof, with completion tracked per skill.",
  },
] as const;

export default function EvidenceTabs() {
  const [activeId, setActiveId] = useState<(typeof tabs)[number]["id"]>("resume");
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  return (
    <section
      id="evidence"
      aria-label="Evidence LITMUS uses"
      className="litmus-panel scroll-mt-28 rounded-xl p-6 sm:p-7"
    >
      <p className="text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
        Evidence shift
      </p>
      <h2 className="mt-3 max-w-2xl text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[0.96] tracking-[-0.06em] text-[var(--foreground)]">
        From self-report to working proof.
      </h2>
      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Evidence types">
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveId(tab.id)}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] transition duration-200 ${
                isActive
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--ink)]"
                  : "border-[var(--border)] bg-[rgba(8,10,16,0.74)] text-[var(--muted)] hover:border-[var(--border-strong)]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="mt-5 rounded-lg border border-[var(--border)] bg-[rgba(8,10,16,0.72)] p-5">
        <h3 className="text-xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
          {active.heading}
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          {active.body}
        </p>
      </div>
    </section>
  );
}
