"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [careerGoal, setCareerGoal] = useState("");
const [targetRole, setTargetRole] = useState("");
const [interests, setInterests] = useState<string[]>([]);
const [skills, setSkills] = useState<
  { skill: string; confidence: string }[]
>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [resumePath, setResumePath] = useState<string | null>(null);

useEffect(() => {
  async function loadDashboard() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setError("Please sign in to view your dashboard.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, career_goal, target_role, resume_path")
        .eq("auth_user_id", session.user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      setCareerGoal(profile.career_goal ?? "");
      setTargetRole(profile.target_role ?? "");
      setResumePath(profile.resume_path ?? null);

      const { data: interestRows, error: interestsError } = await supabase
        .from("profile_interests")
        .select("interest")
        .eq("profile_id", profile.id);

      if (interestsError) {
        throw interestsError;
      }

      setInterests(interestRows?.map((row) => row.interest) ?? []);

      const { data: skillRows, error: skillsError } = await supabase
        .from("profile_skills")
        .select("skill, confidence")
        .eq("profile_id", profile.id);

      if (skillsError) {
        throw skillsError;
      }

      setSkills(skillRows ?? []);
    } catch (err) {
      console.error(err);
      setError("Could not load your profile.");
    } finally {
      setLoading(false);
    }
  }

  loadDashboard();
}, []);
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
    {loading ? (
      <p className="font-ui text-sm text-[var(--muted)]">
        Loading your profile...
      </p>
    ) : error ? (
      <p className="font-ui text-sm text-red-600">
        {error}
      </p>
    ) : (
      <>
        <p className="font-ui text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
          Your career profile
        </p>

        <h1 className="font-ui mt-4 text-[clamp(2.4rem,5.5vw,4.4rem)] font-bold tracking-[-0.07em] text-[var(--foreground)] leading-[0.94]">
          {targetRole || "Your career map"}
        </h1>

        <p className="font-ui mt-4 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
          {careerGoal || "Your career goal will appear here."}
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="font-ui text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
              Interests
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {interests.length > 0 ? (
                interests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
                  >
                    {interest}
                  </span>
                ))
              ) : (
                <span className="text-sm text-[var(--muted)]">
                  No interests saved.
                </span>
              )}
            </div>
          </div>

          <div>
            <p className="font-ui text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
              Skills
            </p>

            <div className="mt-3 space-y-2">
              {skills.length > 0 ? (
                skills.map((item) => (
                  <div
                    key={item.skill}
                    className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3"
                  >
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {item.skill}
                    </span>

                    <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                      {item.confidence.replaceAll("_", " ")}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-sm text-[var(--muted)]">
                  No skills saved.
                </span>
              )}
            </div>
          </div>
        </div>
      </>
    )}
  </div>
</section>
      </div>
    </main>
  );
}
