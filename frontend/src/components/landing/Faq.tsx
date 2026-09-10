"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Do I have to finish everything in one sitting?",
    a: "No. The assessment saves step by step, and your dashboard keeps profile, roadmap, and leads together so you can return anytime.",
  },
  {
    q: "What happens after I submit the assessment?",
    a: "LITMUS saves your answers, uploads your resume if provided, builds skill-gap and roadmap analysis, then hands you to the dashboard via a short transition.",
  },
  {
    q: "Is GitHub required?",
    a: "No. Connecting GitHub adds repository and 30-day activity evidence plus reviewable leads, but skills, gaps, and roadmap work without it.",
  },
  {
    q: "Do leads post automatically?",
    a: "Never. Drafts are manual-only: copy, edit, keep, or delete each one. Nothing publishes without you.",
  },
  {
    q: "Where do I go if I'm lost?",
    a: "Use the top nav: Home explains the flow, Assessment captures input, Dashboard shows everything LITMUS knows. All internal moves stay in the same tab.",
  },
] as const;

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      aria-label="Frequently asked questions"
      className="litmus-panel scroll-mt-28 rounded-xl p-6 sm:p-7"
    >
      <p className="text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
        FAQ
      </p>
      <h2 className="mt-3 max-w-2xl text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[0.96] tracking-[-0.06em] text-[var(--foreground)]">
        Answers before you start.
      </h2>
      <div className="mt-5 space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={faq.q}
              className="rounded-lg border border-[var(--border)] bg-[rgba(8,10,16,0.72)]"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
              >
                <span className="text-sm font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                  {faq.q}
                </span>
                <span className="text-xs text-[var(--muted)]" aria-hidden="true">
                  {isOpen ? "▾" : "▸"}
                </span>
              </button>
              {isOpen ? (
                <p className="px-4 pb-4 text-sm leading-6 text-[var(--muted)]">
                  {faq.a}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
