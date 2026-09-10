"use client";

import { useState } from "react";

const tabs = [
  {
    id: "profile",
    label: "Profile",
    title: "profile.json",
    lines: [
      "target_role: Software Engineer",
      "career_goal: Internship",
      "interests: [web, ai-ml, data]",
      "skills: 8 declared + confidence",
    ],
  },
  {
    id: "skill-gap",
    label: "Skill gap",
    title: "skill-gap.json",
    lines: [
      "missing: 3 high-priority skills",
      "weak: 2 skills need practice",
      "strengths: 4 proven signals",
    ],
  },
  {
    id: "roadmap",
    label: "Roadmap",
    title: "roadmap.json",
    lines: [
      "step 01: high-priority skill",
      "topics → project → mastery proof",
      "progress: 2 / 7 complete",
    ],
  },
  {
    id: "leads",
    label: "Leads",
    title: "leads.json",
    lines: [
      "source: repo push detected",
      "draft: manual LinkedIn post",
      "actions: keep · edit · delete",
    ],
  },
] as const;

export default function HeroPreviewTabs() {
  const [activeId, setActiveId] = useState<(typeof tabs)[number]["id"]>("profile");
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  return (
    <div className="litmus-panel-strong rounded-xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
            Live preview
          </p>
          <h2 className="font-ui mt-2 text-xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
            Your console, before you start.
          </h2>
        </div>
        <span className="hidden rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.74)] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted)] md:inline-flex">
          LITMUS data
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Console preview">
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

      <div className="mt-4 rounded-lg border border-[var(--border)] bg-[rgba(8,10,16,0.82)] p-4">
        <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[var(--muted)]">
          {active.title}
        </p>
        <ul className="mt-3 space-y-2">
          {active.lines.map((line) => (
            <li
              key={line}
              className="flex items-start gap-2 font-mono text-xs leading-5 text-[var(--muted-strong)]"
            >
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
              {line}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 rounded-lg border border-dashed border-[var(--border)] bg-[rgba(8,10,16,0.74)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
        Real data from your assessment, resume, GitHub sync, and generated
        leads — no mock career advice.
      </p>
    </div>
  );
}
