"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { API_URL } from "@/lib/api";

type SkillGapItem = {
  skill: string;
  priority: "high" | "medium" | "low";
  reason: string;
};

type Strength = {
  skill: string;
  evidence: string;
};

type SkillGapAnalysis = {
  role: string;
  required_skills: {
    skill: string;
    importance: "core" | "common" | "optional";
  }[];
  strengths: Strength[];
  weak_skills: SkillGapItem[];
  missing_skills: SkillGapItem[];
};

type Skill = {
  skill: string;
  confidence: string;
};

type Interest = {
  interest: string;
};

type RoadmapItem = {
  skill: string;
  priority: "high" | "medium" | "low";
  reason: string;
  learning_topics: string[];
  project: string;
  evidence_of_mastery: string;
};

type Profile = {
  id: string;
  career_goal: string | null;
  target_role: string | null;
  resume_path: string | null;
};

type Roadmap = {
  id: string;
  profile_id: string;
  target_role: string;
  roadmap: RoadmapItem[];
};

type GithubSyncState =
  | "never_synced"
  | "syncing"
  | "synced"
  | "failed"
  | "revoked"
  | "rate_limited";

type GithubRepo = {
  name: string;
  description: string | null;
  languages: string[];
  topics: string[];
  stars: number;
  forks: number;
  created_at: string | null;
  updated_at: string | null;
  is_fork: boolean;
};

type GithubActivity = {
  commits_30d: number;
  prs_30d: number;
  issues_30d: number;
  active_days_30d: number;
};

type GithubEvidence = {
  username: string | null;
  profile_bio: string | null;
  repos: GithubRepo[];
  recent_activity: GithubActivity;
  language_distribution: Record<string, number>;
};

type LeadDraft = {
  id: string;
  lead_id: string;
  channel: string;
  subject: string | null;
  body: string;
  preview: string;
  citations: { label: string; url: string }[];
  prompt_version: string;
  model: string | null;
  status: string;
  created_at: string;
};

type LeadRecord = {
  id: string;
  profile_id: string;
  github_profile_id: string;
  detected_event_id: string | null;
  dedup_key: string;
  title: string;
  angle: string;
  relevant_skills: string[];
  confidence: number | null;
  status: string;
  generated_at: string;
  expires_at: string | null;
  source_event: {
    id: string | null;
    event_type: string | null;
    event_id: string | null;
    event_timestamp: string | null;
    observed_at: string | null;
    dedup_key: string | null;
  } | null;
  source_repository: {
    github_repo_id: number | null;
    name: string | null;
    url: string | null;
  } | null;
  draft: LeadDraft | null;
};

const getAccessToken = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
};

const confidenceLegend = [
  {
    id: "getting_started",
    label: "Getting started",
    hint: "Learning the basics",
  },
  {
    id: "can_build",
    label: "Can build with it",
    hint: "Needs some reference",
  },
  {
    id: "comfortable",
    label: "Comfortable",
    hint: "Can work independently",
  },
  {
    id: "very_confident",
    label: "Very confident",
    hint: "Can move quickly",
  },
] as const;

const githubSyncStateLabel: Record<GithubSyncState, string> = {
  never_synced: "Never synced",
  syncing: "Syncing…",
  synced: "Synced",
  failed: "Sync failed",
  revoked: "Authorization revoked",
  rate_limited: "Rate limited",
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [skillGap, setSkillGap] = useState<SkillGapAnalysis | null>(null);
  const [skillGapLoading, setSkillGapLoading] = useState(true);
  const [skillGapError, setSkillGapError] = useState("");

  const [loading, setLoading] = useState(true);
  const [roadmapLoading, setRoadmapLoading] = useState(true);
  const [error, setError] = useState("");
  const [roadmapError, setRoadmapError] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [completedSkills, setCompletedSkills] = useState<Set<string>>(new Set());
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubSyncState, setGithubSyncState] =
    useState<GithubSyncState>("never_synced");
  const [githubEvidence, setGithubEvidence] = useState<GithubEvidence | null>(
    null
  );
  const [githubLastSyncedAt, setGithubLastSyncedAt] = useState<string | null>(
    null
  );
  const [githubMessage, setGithubMessage] = useState("");
  const [generatedLeads, setGeneratedLeads] = useState<LeadRecord[]>([]);
  const [generatedLeadsLoading, setGeneratedLeadsLoading] = useState(true);
  const [generatedLeadsError, setGeneratedLeadsError] = useState("");
  const [generatedLeadsMessage, setGeneratedLeadsMessage] = useState("");
  const [leadActionBusyId, setLeadActionBusyId] = useState<string | null>(null);
  const [leadGenerateLoading, setLeadGenerateLoading] = useState(false);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editingDraftBody, setEditingDraftBody] = useState("");

  const detectGithub = useCallback(async () => {
    // Canonical provider field in @supabase/supabase-js 2.112.4 is `provider`
    // with lowercase value "github" (see UserIdentity interface in auth-js).
    // Prefer server-fetched identities via getUserIdentities() to avoid stale
    // cached session; fall back to session.user.identities and getUser().
    try {
      const { data, error } = await supabase.auth.getUserIdentities();
      if (!error && data?.identities) {
        setGithubConnected(
          data.identities.some((id) => id.provider === "github")
        );
        return;
      }
    } catch {
      // fall through to session fallback
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const identities = session?.user?.identities;
      if (identities && identities.length > 0) {
        setGithubConnected(
          identities.some((id) => id.provider === "github")
        );
        return;
      }
    } catch {
      // fall through
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.identities) {
        setGithubConnected(
          user.identities.some((id) => id.provider === "github")
        );
        return;
      }
    } catch {
      // keep previous state
    }
  }, []);

  const loadGithubEvidence = useCallback(async () => {
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) return;
      const response = await fetch(`${API_URL}/api/profile/github`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) return;
      const data = await response.json();
      // Do NOT overwrite githubConnected here — that is the authoritative
      // OAuth identity state derived from getUserIdentities()/session.
      // Backend `connected` only reflects whether github_profiles has been
      // synced, not whether the Supabase user has a linked GitHub identity.
      setGithubEvidence(data.evidence ?? null);
      setGithubLastSyncedAt(data.last_synced_at ?? null);
      if (!data.connected || !data.synced || !data.last_synced_at) {
        setGithubSyncState("never_synced");
      } else {
        setGithubSyncState("synced");
      }
    } catch {
      // Non-critical; keep previous state
    }
  }, []);

  const loadGeneratedLeads = useCallback(async () => {
    try {
      setGeneratedLeadsLoading(true);
      setGeneratedLeadsError("");

      const accessToken = await getAccessToken();
      if (!accessToken) {
        setGeneratedLeadsError("Please sign in to view generated leads.");
        return;
      }

      const response = await fetch(`${API_URL}/api/profile/leads`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? "Could not load generated leads.");
      }

      setGeneratedLeads(data.leads ?? []);
    } catch (err) {
      setGeneratedLeadsError(
        err instanceof Error ? err.message : "Could not load generated leads.",
      );
    } finally {
      setGeneratedLeadsLoading(false);
    }
  }, []);

  const handleConnectGitHub = async () => {
    if (githubConnected) return;
    // Re-verify against server to avoid race where React state is still
    // false but the user is actually already linked (e.g. immediate click
    // after dashboard mount before detectGithub resolves).
    try {
      const { data } = await supabase.auth.getUserIdentities();
      if (data?.identities?.some((id) => id.provider === "github")) {
        setGithubConnected(true);
        return;
      }
    } catch {
      // fall through to link
    }
    await supabase.auth.linkIdentity({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  const handleSyncGitHub = async () => {
    setGithubMessage("");
    setGeneratedLeadsMessage("");
    setGithubSyncState("syncing");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token ?? null;
      const providerToken = (session as unknown as { provider_token?: string })
        ?.provider_token;

      if (!session || !accessToken) {
        setError("Please sign in to view your dashboard.");
        setGithubSyncState("failed");
        setGithubMessage("Authentication required. Please sign in again.");
        return;
      }

      if (!providerToken) {
        setGithubSyncState("revoked");
        setGithubMessage(
          "GitHub authorization is missing or expired. Please reconnect GitHub to refresh access, then try syncing again."
        );
        return;
      }

      const response = await fetch(`${API_URL}/api/profile/github/sync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider_token: providerToken }),
      });

      if (response.ok) {
        setGithubSyncState("synced");
        setGithubMessage("GitHub data synchronized successfully.");
        await Promise.all([loadGithubEvidence(), loadGeneratedLeads()]);
        return;
      }

      let detail = "";
      try {
        const data = await response.json();
        detail = data.detail ?? "";
      } catch {
        detail = "";
      }

      if (response.status === 401) {
        setGithubSyncState("revoked");
        setGithubMessage(
          detail ||
            "GitHub authorization revoked or expired. Please reconnect GitHub and try again."
        );
      } else if (response.status === 403) {
        setGithubSyncState("failed");
        setGithubMessage(
          detail ||
            "Insufficient GitHub permissions. Please check your GitHub authorization and reconnect."
        );
      } else if (response.status === 429) {
        setGithubSyncState("rate_limited");
        setGithubMessage(
          detail ||
            "GitHub sync is rate limited. Please wait a few minutes before trying again."
        );
      } else if (response.status >= 500) {
        setGithubSyncState("failed");
        setGithubMessage(
          detail || "GitHub sync failed due to a server error. Please try again later."
        );
      } else {
        setGithubSyncState("failed");
        setGithubMessage(detail || "GitHub sync failed. Please try again.");
      }
    } catch {
      setGithubSyncState("failed");
      setGithubMessage("Network error while syncing GitHub. Please check your connection and try again.");
    }
  };

  const handleGenerateLeads = async () => {
    try {
      setLeadGenerateLoading(true);
      setGeneratedLeadsMessage("");

      const accessToken = await getAccessToken();
      if (!accessToken) {
        setGeneratedLeadsError("Please sign in to generate leads.");
        return;
      }

      const response = await fetch(`${API_URL}/api/profile/leads/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? "Could not generate leads.");
      }

      await loadGeneratedLeads();
      setGeneratedLeadsMessage(
        data.count ? `Generated ${data.count} lead${data.count === 1 ? "" : "s"}.` : "No new leads were generated.",
      );
    } catch (err) {
      setGeneratedLeadsError(
        err instanceof Error ? err.message : "Could not generate leads.",
      );
    } finally {
      setLeadGenerateLoading(false);
    }
  };

  const handleLeadReview = async (
    lead: LeadRecord,
    action: "approve" | "dismiss" | "converted" | "edit",
  ) => {
    try {
      setLeadActionBusyId(lead.id);
      setGeneratedLeadsMessage("");

      const accessToken = await getAccessToken();
      if (!accessToken) {
        setGeneratedLeadsError("Please sign in to update leads.");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/profile/leads/${lead.id}/review`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            action === "edit"
              ? {
                  action,
                  draft_body: editingDraftBody,
                }
              : {
                  action,
                },
          ),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail ?? "Could not update lead.");
      }

      setExpandedLeadId(lead.id);
      setEditingLeadId(null);
      setEditingDraftBody("");
      await loadGeneratedLeads();
      setGeneratedLeadsMessage(
        action === "edit"
          ? "Draft updated."
          : action === "approve"
            ? "Lead approved."
            : action === "converted"
              ? "Lead marked as used."
              : "Lead dismissed.",
      );
    } catch (err) {
      setGeneratedLeadsError(
        err instanceof Error ? err.message : "Could not update lead.",
      );
    } finally {
      setLeadActionBusyId(null);
    }
  };

  const handleDeleteLead = async (lead: LeadRecord) => {
    try {
      setLeadActionBusyId(lead.id);
      setGeneratedLeadsMessage("");

      const accessToken = await getAccessToken();
      if (!accessToken) {
        setGeneratedLeadsError("Please sign in to delete leads.");
        return;
      }

      const response = await fetch(`${API_URL}/api/profile/leads/${lead.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail ?? "Could not delete lead.");
      }

      if (editingLeadId === lead.id) {
        setEditingLeadId(null);
        setEditingDraftBody("");
      }
      if (expandedLeadId === lead.id) {
        setExpandedLeadId(null);
      }

      await loadGeneratedLeads();
      setGeneratedLeadsMessage("Lead removed.");
    } catch (err) {
      setGeneratedLeadsError(
        err instanceof Error ? err.message : "Could not delete lead.",
      );
    } finally {
      setLeadActionBusyId(null);
    }
  };

  const handleCopyDraft = async (lead: LeadRecord) => {
    const draftBody = lead.draft?.body?.trim();
    if (!draftBody) {
      setGeneratedLeadsError("No draft body is available to copy.");
      return;
    }

    try {
      await navigator.clipboard.writeText(draftBody);
      setGeneratedLeadsMessage("Draft copied to clipboard.");
    } catch {
      setGeneratedLeadsError("Could not copy the draft to clipboard.");
    }
  };

  const beginLeadEdit = (lead: LeadRecord) => {
    setEditingLeadId(lead.id);
    setEditingDraftBody(lead.draft?.body ?? "");
    setExpandedLeadId(lead.id);
  };

  const cancelLeadEdit = () => {
    setEditingLeadId(null);
    setEditingDraftBody("");
  };

  const handleUnlinkGitHub = async () => {
    const { data, error } = await supabase.auth.getUserIdentities();

    if (error) {
      console.error("Could not read identities:", error);
      setGithubMessage("Could not read GitHub identities.");
      return;
    }

    const githubIdentity = data.identities?.find(
      (identity) => identity.provider === "github"
    );

    if (!githubIdentity) {
      setGithubMessage("No GitHub identity found.");
      return;
    }

    const { error: unlinkError } =
      await supabase.auth.unlinkIdentity(githubIdentity);

    if (unlinkError) {
      console.error("GitHub unlink failed:", unlinkError);
      setGithubMessage("GitHub unlink failed. Please try again.");
      return;
    }

    setGithubConnected(false);
    setGithubEvidence(null);
    setGithubLastSyncedAt(null);
    setGithubSyncState("never_synced");
    setGithubMessage("GitHub identity unlinked.");
  };

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const accessToken = await getAccessToken();

      if (!accessToken) {
        setError("Please sign in to view your dashboard.");
        return;
      }

      const response = await fetch(`${API_URL}/api/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? "Could not load your profile.");
      }

      setProfile(data.profile);
      setInterests(data.interests?.map((item: Interest) => item.interest) ?? []);
      setSkills(data.skills ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRoadmap = useCallback(async () => {
    try {
      setRoadmapLoading(true);
      setRoadmapError("");

      const accessToken = await getAccessToken();

      if (!accessToken) {
        setRoadmapError("Please sign in to view your roadmap.");
        return;
      }

      const response = await fetch(`${API_URL}/api/profile/roadmap`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? "Could not load your career roadmap.");
      }

      setRoadmap(data.roadmap);
    } catch (err) {
      console.error(err);
      setRoadmapError(
        err instanceof Error
          ? err.message
          : "Could not load your career roadmap.",
      );
    } finally {
      setRoadmapLoading(false);
    }
  }, []);

  const loadSkillGap = useCallback(async () => {
    try {
      setSkillGapLoading(true);
      setSkillGapError("");

      const accessToken = await getAccessToken();

      if (!accessToken) {
        setSkillGapError("Please sign in to view your skill gap.");
        return;
      }

      const response = await fetch(`${API_URL}/api/profile/skill-gap`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ?? "Could not load your skill gap analysis.",
        );
      }

      setSkillGap(data.analysis);
    } catch (err) {
      console.error(err);
      setSkillGapError(
        err instanceof Error
          ? err.message
          : "Could not load your skill gap analysis.",
      );
    } finally {
      setSkillGapLoading(false);
    }
  }, []);

  const handleViewResume = async () => {
    try {
      setError("");

      const accessToken = await getAccessToken();

      if (!accessToken) {
        setError("Please sign in to view your resume.");
        return;
      }

      const response = await fetch(`${API_URL}/api/profile/resume`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail ?? "Could not open your resume.");
        return;
      }

      window.open(data.signed_url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error(err);
      setError("Could not reach the backend.");
    }
  };

  const toggleRoadmapItem = (index: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const loadProgress = useCallback(async () => {
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) return;

      const response = await fetch(`${API_URL}/api/profile/roadmap/progress`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      const completed = new Set<string>();
      for (const item of data.skills ?? []) {
        if (item.completed) completed.add(item.skill);
      }
      setCompletedSkills(completed);
    } catch {
      // Progress loading is non-critical
    }
  }, []);

  const toggleComplete = async (skill: string) => {
    const isCompleted = completedSkills.has(skill);

    setCompletedSkills((prev) => {
      const next = new Set(prev);
      if (isCompleted) {
        next.delete(skill);
      } else {
        next.add(skill);
      }
      return next;
    });

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) return;

      await fetch(`${API_URL}/api/profile/roadmap/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ skill }),
      });
    } catch {
      setCompletedSkills((prev) => {
        const next = new Set(prev);
        if (isCompleted) {
          next.add(skill);
        } else {
          next.delete(skill);
        }
        return next;
      });
    }
  };

  useEffect(() => {
    void (async () => {
      await Promise.all([
        loadDashboard(),
        loadRoadmap(),
        loadSkillGap(),
        loadProgress(),
        detectGithub(),
        loadGithubEvidence(),
        loadGeneratedLeads(),
      ]);
    })();
  }, [loadDashboard, loadProgress, loadRoadmap, loadSkillGap, detectGithub, loadGithubEvidence, loadGeneratedLeads]);

  // Keep OAuth-linked state fresh after the callback redirect (which does
  // exchangeCodeForSession server-side and sets new cookies). Without this,
  // a stale `githubConnected=false` could persist for the lifetime of the
  // dashboard mount if the initial getSession was cached.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void detectGithub();
    });
    return () => subscription.unsubscribe();
  }, [detectGithub]);

  const completedRoadmapCount =
    roadmap?.roadmap?.filter((item) => completedSkills.has(item.skill)).length ??
    0;
  const availableResume = Boolean(profile?.resume_path);
  const generatedLeadCount = generatedLeads.length;

  return (
    <main className="litmus-shell relative isolate overflow-hidden litmus-grid-lines">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-[var(--border)] py-3 pb-4 sm:flex-row sm:items-center sm:justify-between sm:py-5">
          <div className="inline-flex items-center gap-3">
            <div className="litmus-brand-mark">
              <span>L</span>
            </div>

            <div className="flex flex-col">
              <span className="litmus-brand-wordmark text-sm font-semibold text-[var(--foreground)]">
                LITMUS
              </span>
              <span className="litmus-brand-tagline text-[0.68rem] text-[var(--muted)]">
                career intelligence console
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/assessment"
              className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.78)] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[var(--muted)] shadow-[0_12px_26px_rgba(0,0,0,0.28)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
            >
              Review assessment
            </Link>

            {availableResume ? (
              <button
                type="button"
                onClick={handleViewResume}
                className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[var(--ink)] shadow-[0_12px_26px_rgba(141,220,16,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
              >
                Open resume
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleConnectGitHub}
              disabled={githubConnected}
              className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-xs uppercase tracking-[0.24em] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] ${
                githubConnected
                  ? "border border-[var(--border)] bg-[rgba(8,10,16,0.78)] text-[var(--muted)]"
                  : "border border-[var(--border)] bg-[rgba(8,10,16,0.78)] text-[var(--muted)] shadow-[0_12px_26px_rgba(0,0,0,0.28)] hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
              }`}
            >
              {githubConnected ? (
                <>
                  <svg className="mr-1.5 inline-block h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  Connected
                </>
              ) : (
                <>
                  <svg className="mr-1.5 inline-block h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  Connect GitHub
                </>
              )}
            </button>
            {githubConnected ? (
              <button
                type="button"
                onClick={handleSyncGitHub}
                disabled={githubSyncState === "syncing"}
                className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-xs uppercase tracking-[0.24em] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] ${
                  githubSyncState === "syncing"
                    ? "cursor-wait border border-[var(--border)] bg-[rgba(8,10,16,0.78)] text-[var(--muted)] opacity-80"
                    : "border border-[var(--accent)] bg-[var(--accent)] text-[var(--ink)] shadow-[0_12px_26px_rgba(141,220,16,0.18)] hover:-translate-y-0.5 hover:bg-[var(--accent-strong)]"
                }`}
              >
                {githubSyncState === "syncing" ? "Syncing…" : "Sync GitHub"}
              </button>
            ) : null}
            {githubConnected ? (
              <button
                type="button"
                onClick={handleUnlinkGitHub}
                className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.78)] px-3 py-2 text-[0.62rem] uppercase tracking-[0.2em] text-[var(--muted)] hover:border-[rgba(255,107,107,0.3)] hover:text-[var(--danger)] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
                title="Unlink GitHub identity (debug)"
              >
                Unlink
              </button>
            ) : null}
          </div>
        </header>

        {githubConnected ? (
          <section className="litmus-panel mt-6 rounded-xl p-6 sm:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
                  GitHub intelligence
                </p>
                <h2 className="text-[clamp(1.6rem,3.4vw,2.4rem)] font-display font-bold leading-[0.96] tracking-[-0.06em] text-[var(--foreground)]">
                  Repository &amp; activity evidence
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
                  {githubSyncState === "never_synced"
                    ? "GitHub is connected. Sync to ingest your public repositories and recent activity."
                    : githubSyncState === "synced" && githubEvidence?.username
                      ? `Synced as @${githubEvidence.username} — evidence is cached until your next sync.`
                      : "Sync fetches your GitHub data on demand — OAuth connection and sync are separate actions."}
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 md:items-end">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.2em] ${
                    githubSyncState === "synced"
                      ? "border-[rgba(141,220,16,0.24)] bg-[rgba(141,220,16,0.08)] text-[var(--accent)]"
                      : githubSyncState === "never_synced"
                        ? "border-[var(--border)] bg-[rgba(8,10,16,0.6)] text-[var(--muted)]"
                        : githubSyncState === "syncing"
                          ? "border-[rgba(141,99,255,0.24)] bg-[rgba(141,99,255,0.08)] text-[var(--muted-strong)]"
                          : githubSyncState === "revoked"
                            ? "border-[rgba(255,107,107,0.24)] bg-[rgba(255,107,107,0.08)] text-[var(--danger)]"
                            : githubSyncState === "rate_limited"
                              ? "border-[rgba(241,184,77,0.24)] bg-[rgba(241,184,77,0.08)] text-[var(--warning)]"
                              : "border-[rgba(255,107,107,0.2)] bg-[rgba(255,107,107,0.06)] text-[var(--danger)]"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      githubSyncState === "synced"
                        ? "bg-[var(--accent)]"
                        : githubSyncState === "syncing"
                          ? "bg-[var(--accent)] animate-pulse"
                          : githubSyncState === "never_synced"
                            ? "bg-[var(--muted)]"
                            : githubSyncState === "revoked"
                              ? "bg-[var(--danger)]"
                              : githubSyncState === "rate_limited"
                                ? "bg-[var(--warning)]"
                                : "bg-[var(--danger)]"
                    }`}
                  />
                  {githubSyncStateLabel[githubSyncState]}
                </span>
                {githubLastSyncedAt ? (
                  <p className="text-xs text-[var(--muted)]">
                    Last synced{" "}
                    {new Date(githubLastSyncedAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                ) : null}
              </div>
            </div>

            {githubMessage ? (
              <div
                className={`mt-4 rounded-lg border p-3 text-sm leading-6 ${
                  githubSyncState === "synced"
                    ? "border-[rgba(141,220,16,0.2)] bg-[rgba(141,220,16,0.06)] text-[var(--foreground)]"
                    : githubSyncState === "revoked" ||
                        githubSyncState === "rate_limited" ||
                        githubSyncState === "failed"
                      ? "border-[rgba(255,107,107,0.2)] bg-[rgba(255,107,107,0.06)] text-[var(--foreground)]"
                      : "border-[var(--border)] bg-[rgba(8,10,16,0.6)] text-[var(--muted)]"
                }`}
              >
                {githubMessage}
              </div>
            ) : null}

            {githubEvidence ? (
              <div className="mt-6 space-y-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-[var(--border)] bg-[rgba(8,10,16,0.72)] p-4">
                    <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                      GitHub user
                    </p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                      {githubEvidence.username ? `@${githubEvidence.username}` : "—"}
                    </p>
                    {githubEvidence.profile_bio ? (
                      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                        {githubEvidence.profile_bio}
                      </p>
                    ) : null}
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[rgba(8,10,16,0.72)] p-4">
                    <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                      Repositories
                    </p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                      {githubEvidence.repos.length}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {githubEvidence.repos.filter((r) => !r.is_fork).length} owned ·{" "}
                      {githubEvidence.repos.filter((r) => r.is_fork).length} forks
                    </p>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[rgba(8,10,16,0.72)] p-4">
                    <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                      Last 30 days
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                      {githubEvidence.recent_activity.commits_30d} commits ·{" "}
                      {githubEvidence.recent_activity.prs_30d} PRs ·{" "}
                      {githubEvidence.recent_activity.issues_30d} issues
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {githubEvidence.recent_activity.active_days_30d} active days
                    </p>
                  </div>
                </div>

                {Object.keys(githubEvidence.language_distribution).length > 0 ? (
                  <div className="rounded-lg border border-[var(--border)] bg-[rgba(8,10,16,0.72)] p-4">
                    <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                      Language distribution
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(githubEvidence.language_distribution)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 12)
                        .map(([lang, bytes]) => (
                          <span
                            key={lang}
                            className="rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.82)] px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.16em] text-[var(--muted-strong)]"
                          >
                            {lang}
                            <span className="ml-1.5 text-[var(--muted)]">
                              {bytes.toLocaleString()} bytes
                            </span>
                          </span>
                        ))}
                    </div>
                  </div>
                ) : null}

                {githubEvidence.repos.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                      Top repositories
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {githubEvidence.repos.slice(0, 6).map((repo) => (
                        <div
                          key={repo.name}
                          className="rounded-lg border border-[var(--border)] bg-[rgba(8,10,16,0.72)] p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold tracking-[-0.03em] text-[var(--foreground)]">
                              {repo.name}
                            </p>
                            <span className="shrink-0 rounded border border-[var(--border)] bg-[rgba(8,10,16,0.82)] px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                              ★ {repo.stars} · ⑂ {repo.forks}
                              {repo.is_fork ? " · fork" : ""}
                            </span>
                          </div>
                          {repo.description ? (
                            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                              {repo.description}
                            </p>
                          ) : null}
                          {repo.languages.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {repo.languages.slice(0, 6).map((lang) => (
                                <span
                                  key={lang}
                                  className="rounded-full border border-[var(--border)] bg-[rgba(141,99,255,0.08)] px-2 py-1 text-[0.62rem] uppercase tracking-[0.14em] text-[var(--muted)]"
                                >
                                  {lang}
                                </span>
                              ))}
                            </div>
                          ) : null}
                          {repo.topics.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {repo.topics.slice(0, 6).map((topic) => (
                                <span
                                  key={topic}
                                  className="rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.82)] px-2 py-1 text-[0.62rem] tracking-[-0.01em] text-[var(--muted)]"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    {githubEvidence.repos.length > 6 ? (
                      <p className="text-xs text-[var(--muted)]">
                        Showing 6 of {githubEvidence.repos.length} repositories.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--muted)]">
                    No public repositories found for this GitHub account.
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-6 text-sm text-[var(--muted)]">
                No GitHub evidence cached yet. {githubConnected ? "Sync to fetch your repositories." : "Connect GitHub first."}
              </p>
            )}
          </section>
        ) : null}

        <section className="mt-6 litmus-panel rounded-xl p-6 sm:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
                Generated Leads
              </p>
              <h2 className="text-[clamp(1.9rem,4vw,3rem)] font-display font-bold leading-[0.96] tracking-[-0.06em] text-[var(--foreground)]">
                GitHub changes turned into reviewable opportunities
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
                LITMUS watches for meaningful repo pushes, turns them into
                conservative leads, and drafts a manual LinkedIn post you can
                copy, edit, approve, or delete.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 md:items-end">
              <div className="rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.78)] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                {generatedLeadCount} lead{generatedLeadCount === 1 ? "" : "s"}
              </div>

              {githubConnected ? (
                <button
                  type="button"
                  onClick={handleGenerateLeads}
                  disabled={leadGenerateLoading}
                  className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-xs uppercase tracking-[0.24em] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] ${
                    leadGenerateLoading
                      ? "cursor-wait border border-[var(--border)] bg-[rgba(8,10,16,0.78)] text-[var(--muted)] opacity-80"
                      : "border border-[var(--accent)] bg-[var(--accent)] text-[var(--ink)] shadow-[0_12px_26px_rgba(141,220,16,0.18)] hover:-translate-y-0.5 hover:bg-[var(--accent-strong)]"
                  }`}
                >
                  {leadGenerateLoading ? "Generating..." : "Generate leads"}
                </button>
              ) : null}
            </div>
          </div>

          {generatedLeadsMessage ? (
            <div className="mt-4 rounded-lg border border-[rgba(141,220,16,0.2)] bg-[rgba(141,220,16,0.06)] p-3 text-sm leading-6 text-[var(--foreground)]">
              {generatedLeadsMessage}
            </div>
          ) : null}

          {generatedLeadsError ? (
            <div className="mt-4 rounded-lg border border-[rgba(255,107,107,0.2)] bg-[rgba(255,107,107,0.06)] p-3 text-sm leading-6 text-[var(--foreground)]">
              {generatedLeadsError}
            </div>
          ) : null}

          {generatedLeadsLoading ? (
            <p className="mt-6 text-sm text-[var(--muted)]">
              Loading generated leads...
            </p>
          ) : generatedLeads.length > 0 ? (
            <div className="mt-6 space-y-4">
              {generatedLeads.map((lead) => {
                const confidence = Math.max(
                  0,
                  Math.min(100, Math.round((lead.confidence ?? 0) * 100)),
                );
                const sourceRepoName = lead.source_repository?.name ?? "Unknown repository";
                const sourceRepoUrl = lead.source_repository?.url;
                const sourceEventType = lead.source_event?.event_type ?? "repo_pushed";
                const generatedTime = lead.generated_at
                  ? new Date(lead.generated_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "Just now";
                const isExpanded = expandedLeadId === lead.id;
                const isEditing = editingLeadId === lead.id;
                const draftBody = lead.draft?.body ?? "";
                const draftPreview = lead.draft?.preview || draftBody.slice(0, 280);

                return (
                  <article
                    key={lead.id}
                    className="rounded-lg border border-[var(--border)] bg-[rgba(8,10,16,0.72)] p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[0.62rem] uppercase tracking-[0.24em] text-[var(--muted)]">
                            Lead
                          </span>
                          <span className="rounded-full border border-[rgba(141,220,16,0.2)] bg-[rgba(141,220,16,0.08)] px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.18em] text-[var(--accent)]">
                            {lead.status}
                          </span>
                        </div>

                        <h3 className="text-xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
                          {lead.title}
                        </h3>

                        <p className="max-w-3xl text-sm leading-6 text-[var(--muted)]">
                          {lead.angle}
                        </p>
                      </div>

                      <div className="flex flex-row flex-wrap items-start gap-3 lg:justify-end">
                        <div className="rounded-lg border border-[var(--border)] bg-[rgba(8,10,16,0.82)] px-3 py-2">
                          <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                            Confidence
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                            {confidence}%
                          </p>
                        </div>

                        <div className="rounded-lg border border-[var(--border)] bg-[rgba(8,10,16,0.82)] px-3 py-2">
                          <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                            Generated
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                            {generatedTime}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {lead.relevant_skills.length > 0 ? (
                        lead.relevant_skills.map((skill) => (
                          <span
                            key={skill}
                            className="litmus-chip rounded-full px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.22em] text-[var(--muted-strong)]"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.78)] px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                          No skill tags
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
                      <div className="rounded-lg border border-[var(--border)] bg-[rgba(8,10,16,0.66)] p-4">
                        <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                          Source repository
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold tracking-[-0.03em] text-[var(--foreground)]">
                            {sourceRepoName}
                          </span>
                          <span className="rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.82)] px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                            {sourceEventType}
                          </span>
                        </div>
                        {sourceRepoUrl ? (
                          <a
                            href={sourceRepoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex text-xs uppercase tracking-[0.2em] text-[var(--accent)] underline-offset-4 hover:underline"
                          >
                            Open repository
                          </a>
                        ) : null}
                      </div>

                      <div className="rounded-lg border border-[var(--border)] bg-[rgba(8,10,16,0.66)] p-4">
                        <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                          Draft preview
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                          {draftPreview || "No draft available."}
                        </p>
                      </div>
                    </div>

                    {isExpanded ? (
                      <div className="mt-4 space-y-4 rounded-lg border border-[var(--border)] bg-[rgba(8,10,16,0.58)] p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                              LinkedIn draft
                            </p>
                            <span className="rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.82)] px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                              Manual use only
                            </span>
                          </div>

                          {lead.draft?.subject ? (
                            <p className="text-sm font-semibold tracking-[-0.03em] text-[var(--foreground)]">
                              {lead.draft.subject}
                            </p>
                          ) : null}

                          {isEditing ? (
                            <div className="space-y-3">
                              <textarea
                                value={editingDraftBody}
                                onChange={(event) =>
                                  setEditingDraftBody(event.target.value)
                                }
                                rows={8}
                                className="w-full rounded-lg border border-[var(--border)] bg-[rgba(8,10,16,0.9)] px-4 py-3 text-sm leading-6 text-[var(--foreground)] outline-none transition focus:border-[var(--border-strong)]"
                              />
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleLeadReview(lead, "edit")}
                                  disabled={leadActionBusyId === lead.id}
                                  className="inline-flex items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[var(--ink)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] disabled:cursor-wait disabled:opacity-60"
                                >
                                  Save draft
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelLeadEdit}
                                  className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.78)] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[var(--muted)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm leading-6 text-[var(--muted)]">
                              {draftBody || "No draft body is available yet."}
                            </p>
                          )}
                        </div>

                        {lead.draft?.citations?.length ? (
                          <div className="space-y-2">
                            <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                              Citations
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {lead.draft.citations.map((citation) => (
                                <a
                                  key={`${lead.id}-${citation.url}`}
                                  href={citation.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.82)] px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-[var(--muted-strong)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
                                >
                                  {citation.label}
                                </a>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedLeadId(isExpanded ? null : lead.id)
                        }
                        className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.78)] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[var(--muted)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
                      >
                        {isExpanded ? "Hide review" : "Review"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLeadReview(lead, "approve")}
                        disabled={leadActionBusyId === lead.id}
                        className="inline-flex items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[var(--ink)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] disabled:cursor-wait disabled:opacity-60"
                      >
                        Keep
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyDraft(lead)}
                        className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.78)] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[var(--muted)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
                      >
                        Copy draft
                      </button>

                      <button
                        type="button"
                        onClick={() => beginLeadEdit(lead)}
                        className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.78)] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[var(--muted)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
                      >
                        Edit draft
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteLead(lead)}
                        disabled={leadActionBusyId === lead.id}
                        className="inline-flex items-center justify-center rounded-full border border-[rgba(255,107,107,0.2)] bg-[rgba(255,107,107,0.08)] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[var(--danger)] transition duration-200 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-[var(--border)] bg-[rgba(8,10,16,0.66)] p-5">
              <p className="text-sm leading-6 text-[var(--muted)]">
                No generated leads yet. Sync GitHub to detect repo pushes, then
                ask LITMUS to turn them into reviewable drafts.
              </p>
              {githubConnected ? (
                <button
                  type="button"
                  onClick={handleGenerateLeads}
                  disabled={leadGenerateLoading}
                  className={`mt-4 inline-flex items-center justify-center rounded-full px-4 py-2 text-xs uppercase tracking-[0.24em] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] ${
                    leadGenerateLoading
                      ? "cursor-wait border border-[var(--border)] bg-[rgba(8,10,16,0.78)] text-[var(--muted)] opacity-80"
                      : "border border-[var(--accent)] bg-[var(--accent)] text-[var(--ink)] shadow-[0_12px_26px_rgba(141,220,16,0.18)] hover:-translate-y-0.5 hover:bg-[var(--accent-strong)]"
                  }`}
                >
                  {leadGenerateLoading ? "Generating..." : "Generate leads"}
                </button>
              ) : null}
            </div>
          )}
        </section>

        <section className="grid gap-6 py-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-start lg:py-8">
          <article className="litmus-panel-strong rounded-xl p-6 sm:p-8">
            {loading ? (
              <div className="space-y-4">
                <div className="h-3 w-36 rounded-full bg-white/10" />
                <div className="h-16 w-full rounded-lg bg-[rgba(255,255,255,0.08)]" />
                <div className="h-6 w-72 rounded-full bg-[rgba(255,255,255,0.08)]" />
                <div className="grid gap-2 pt-4 sm:grid-cols-3">
                  <div className="h-20 rounded-md bg-[rgba(255,255,255,0.08)]" />
                  <div className="h-20 rounded-md bg-[rgba(255,255,255,0.08)]" />
                  <div className="h-20 rounded-md bg-[rgba(255,255,255,0.08)]" />
                </div>
              </div>
            ) : error ? (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
                  Profile unavailable
                </p>
                <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-display font-bold leading-[0.94] tracking-[-0.07em] text-[var(--foreground)]">
                  We could not load your dashboard.
                </h1>
                <p className="max-w-xl text-sm leading-6 text-[var(--muted)]">
                  {error}
                </p>
              </div>
            ) : profile ? (
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.8)] px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.28em] text-[var(--muted)]">
                  Preliminary profile
                </div>

                <div className="space-y-4">
                  <h1 className="max-w-3xl text-[clamp(2.8rem,7vw,5.8rem)] font-display font-bold leading-[0.9] tracking-[-0.07em] text-[var(--foreground)]">
                    {profile.target_role || "Your career map"}
                  </h1>

                  <p className="max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                    {profile.career_goal ||
                      "Your career goal will appear here once the assessment is saved."}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="litmus-panel rounded-lg p-4">
                    <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[var(--muted)]">
                      Role
                    </p>
                    <p className="mt-3 text-lg font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                      {profile.target_role || "Not set"}
                    </p>
                  </div>

                  <div className="litmus-panel rounded-lg p-4">
                    <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[var(--muted)]">
                      Goal
                    </p>
                    <p className="mt-3 text-lg font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                      {profile.career_goal || "Not set"}
                    </p>
                  </div>

                  <div className="litmus-panel rounded-lg p-4">
                    <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[var(--muted)]">
                      Interests
                    </p>
                    <p className="mt-3 text-lg font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                      {interests.length} selected
                    </p>
                  </div>

                  <div className="litmus-panel rounded-lg p-4">
                    <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[var(--muted)]">
                      Skills
                    </p>
                    <p className="mt-3 text-lg font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                      {skills.length} declared
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {interests.length > 0 ? (
                    interests.map((interest) => (
                      <span
                        key={interest}
                        className="litmus-chip rounded-full px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.22em] text-[var(--muted-strong)]"
                      >
                        {interest}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.78)] px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                      Interests not yet captured
                    </span>
                  )}

                  <span className="rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.78)] px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                    {skills.length} skill{skills.length === 1 ? "" : "s"} declared
                  </span>

                  <span className="rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.78)] px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                    {availableResume ? "Resume linked" : "No resume uploaded"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
                  Profile unavailable
                </p>
                <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-display font-bold leading-[0.94] tracking-[-0.07em] text-[var(--foreground)]">
                  Your dashboard is waiting for a profile.
                </h1>
              </div>
            )}
          </article>

          <aside className="space-y-4">
            <div className="litmus-panel rounded-lg p-5">
              <p className="text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
                What LITMUS knows
              </p>

              <div className="mt-4 space-y-3">
                {[
                  {
                    label: "Interests",
                    value:
                      interests.length > 0
                        ? `${interests.length} selected`
                        : "Not yet captured",
                    note:
                      interests.length > 0
                        ? "Shaping what LITMUS explores next"
                        : "Captured during onboarding",
                  },
                  {
                    label: "Declared skills",
                    value: skills.length > 0 ? `${skills.length}` : "None yet",
                    note: "Student-reported skills only",
                  },
                  {
                    label: "Roadmap",
                    value:
                      roadmap?.roadmap?.length != null
                        ? `${roadmap.roadmap.length} items`
                        : "Not generated",
                    note: "Turns gaps into a practical path",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-md border border-[var(--border)] bg-[rgba(8,10,16,0.75)] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[0.65rem] uppercase tracking-[0.24em] text-[var(--muted)]">
                          {item.label}
                        </p>
                        <p className="mt-2 text-lg font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                          {item.value}
                        </p>
                      </div>

                      <span className="rounded-full border border-[var(--border)] bg-[rgba(141,99,255,0.08)] px-3 py-1 text-[0.62rem] uppercase tracking-[0.2em] text-[var(--muted)]">
                        Live
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {item.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="litmus-panel rounded-lg p-5">
              <p className="text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
                Confidence mix
              </p>

              <div className="mt-4 space-y-3">
                {confidenceLegend.map((level) => {
                  const count = skills.filter(
                    (skill) => skill.confidence === level.id,
                  ).length;
                  const width = skills.length ? (count / skills.length) * 100 : 0;

                  return (
                    <div key={level.id} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium tracking-[-0.02em] text-[var(--foreground)]">
                            {level.label}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {level.hint}
                          </p>
                        </div>

                        <span className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                          {count}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.7)]">
                        <div
                          className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-6 py-2 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="litmus-panel rounded-xl p-6 sm:p-7">
            <p className="text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
              Evidence shift
            </p>
            <h2 className="mt-3 text-[clamp(1.9rem,4vw,3rem)] font-display font-bold leading-[0.96] tracking-[-0.06em] text-[var(--foreground)]">
              What LITMUS will uncover next
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "Resume evidence",
                  description:
                    "We’ll analyze what your resume actually demonstrates.",
                },
                {
                  title: "GitHub evidence",
                  description:
                    "We’ll look at your projects and contributions.",
                },
                {
                  title: "Real job requirements",
                  description:
                    "We’ll compare your profile against the roles you’re targeting.",
                },
                {
                  title: "Skill gaps",
                  description:
                    "We’ll identify what you should strengthen next.",
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="rounded-lg border border-[var(--border)] bg-[rgba(8,10,16,0.8)] p-4 shadow-[0_14px_32px_rgba(0,0,0,0.24)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
                >
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[var(--muted)]">
                    Evidence
                  </p>
                  <h3 className="mt-3 text-xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </article>

          <article className="litmus-panel rounded-xl p-6 sm:p-7">
            <p className="text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
              Declared profile
            </p>
            <h2 className="mt-3 text-[clamp(1.9rem,4vw,3rem)] font-display font-bold leading-[0.96] tracking-[-0.06em] text-[var(--foreground)]">
              Interests, skills, and signals
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[var(--muted)]">
                  Interests
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {interests.length > 0 ? (
                    interests.map((interest) => (
                      <span
                        key={interest}
                        className="rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.82)] px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.22em] text-[var(--muted-strong)]"
                      >
                        {interest}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm leading-6 text-[var(--muted)]">
                      No interests captured yet.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[var(--muted)]">
                  Skills
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {skills.length > 0 ? (
                    skills.map((skill) => (
                      <span
                        key={skill.skill}
                        className="rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.82)] px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.22em] text-[var(--muted-strong)]"
                      >
                        {skill.skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm leading-6 text-[var(--muted)]">
                      No skills declared yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-[var(--border)] bg-[rgba(8,10,16,0.72)] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[var(--muted)]">
                      Resume
                    </p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                      {availableResume ? "Linked and ready" : "Not uploaded yet"}
                    </p>
                  </div>

                  {availableResume ? (
                    <button
                      type="button"
                      onClick={handleViewResume}
                      className="rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.78)] px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.22em] text-[var(--muted)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
                    >
                      View
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="litmus-panel rounded-xl p-6 sm:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
                Skill gap analysis
              </p>
              <h2 className="text-[clamp(1.9rem,4vw,3rem)] font-display font-bold leading-[0.96] tracking-[-0.06em] text-[var(--foreground)]">
                Where LITMUS sees room to grow
              </h2>
            </div>

            <p className="max-w-xl text-sm leading-6 text-[var(--muted)]">
              This is still a working signal, not a final judgment. It combines
              the current profile with backend analysis and will sharpen as the
              product gathers more evidence.
            </p>
          </div>

          {skillGapLoading ? (
            <p className="mt-6 text-sm text-[var(--muted)]">
              Analyzing your skill gap...
            </p>
          ) : skillGapError ? (
            <p className="mt-6 text-sm text-[var(--danger)]">{skillGapError}</p>
          ) : skillGap ? (
            <div className="mt-6 space-y-3">
              {skillGap.missing_skills.length > 0 ? (
                <div className="litmus-signal-danger rounded-lg border border-[rgba(255,107,107,0.2)] bg-[rgba(255,107,107,0.04)] p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="litmus-dot litmus-dot-danger" />
                    <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--danger)]">
                      Missing
                    </span>
                    <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      {skillGap.missing_skills.length} skill{skillGap.missing_skills.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {skillGap.missing_skills.map((item) => (
                      <div
                        key={item.skill}
                        className="flex items-start gap-3 rounded-md border border-[rgba(255,107,107,0.1)] bg-[rgba(8,10,16,0.5)] px-3 py-2.5"
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--danger)]" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                              {item.skill}
                            </p>
                            <span className="rounded border border-[rgba(255,107,107,0.2)] px-1.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-[var(--danger)]">
                              {item.priority}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                            {item.reason}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {skillGap.weak_skills.length > 0 ? (
                <div className="litmus-signal-warning rounded-lg border border-[rgba(241,184,77,0.2)] bg-[rgba(241,184,77,0.04)] p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="litmus-dot litmus-dot-warning" />
                    <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--warning)]">
                      Weak
                    </span>
                    <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      {skillGap.weak_skills.length} skill{skillGap.weak_skills.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {skillGap.weak_skills.map((item) => (
                      <div
                        key={item.skill}
                        className="flex items-start gap-3 rounded-md border border-[rgba(241,184,77,0.1)] bg-[rgba(8,10,16,0.5)] px-3 py-2.5"
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--warning)]" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                              {item.skill}
                            </p>
                            <span className="rounded border border-[rgba(241,184,77,0.2)] px-1.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-[var(--warning)]">
                              {item.priority}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                            {item.reason}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {skillGap.strengths.length > 0 ? (
                <div className="litmus-signal-success rounded-lg border border-[rgba(141,220,16,0.2)] bg-[rgba(141,220,16,0.04)] p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="litmus-dot litmus-dot-success" />
                    <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--success)]">
                      Strengths
                    </span>
                    <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      {skillGap.strengths.length} skill{skillGap.strengths.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {skillGap.strengths.map((item) => (
                      <div
                        key={item.skill}
                        className="flex items-start gap-3 rounded-md border border-[rgba(141,220,16,0.1)] bg-[rgba(8,10,16,0.5)] px-3 py-2.5"
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--success)]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                            {item.skill}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                            {item.evidence}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {skillGap.missing_skills.length === 0 && skillGap.weak_skills.length === 0 && skillGap.strengths.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">
                  No skill gap analysis available yet.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-6 text-sm text-[var(--muted)]">
              No skill gap analysis available yet.
            </p>
          )}
        </section>

        <section className="mt-6 rounded-xl border border-[var(--border-strong)] bg-[linear-gradient(180deg,rgba(141,99,255,0.08),transparent_16%),var(--surface-strong)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.44)] sm:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
                Career roadmap
              </p>
              <h2 className="text-[clamp(2rem,4vw,3.4rem)] font-display font-bold leading-[0.95] tracking-[-0.06em] text-[var(--foreground)]">
                What to learn next
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
                A practical path toward your target role, built from the current
                profile and the evidence LITMUS still needs.
              </p>
            </div>

            {roadmap?.roadmap?.length ? (
              <div className="rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.78)] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                {completedRoadmapCount} / {roadmap.roadmap.length} complete
              </div>
            ) : null}
          </div>

          {roadmapLoading ? (
            <p className="mt-6 text-sm text-[var(--muted)]">
              Loading your roadmap...
            </p>
          ) : roadmapError ? (
            <p className="mt-6 text-sm text-[var(--danger)]">{roadmapError}</p>
          ) : roadmap?.roadmap?.length ? (
            <div className="mt-6 litmus-timeline space-y-4">
              {roadmap.roadmap.map((item, index) => {
                const isHigh = item.priority === "high";
                const isMedium = item.priority === "medium";
                const isCompleted = completedSkills.has(item.skill);

                return (
                  <div
                    key={`${item.skill}-${index}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleRoadmapItem(index)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleRoadmapItem(index);
                      }
                    }}
                    className="relative"
                  >
                    <div className="absolute -left-[2.25rem] top-4 flex items-center justify-center">
                      <div className="relative z-10 flex h-[1.35rem] w-[1.35rem] items-center justify-center rounded-full border bg-[var(--background)] text-[0.55rem] font-bold tracking-[-0.06em]">
                        <span className={isCompleted ? "text-[var(--accent)]" : isHigh ? "text-[var(--foreground)]" : "text-[var(--muted)]"}>
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className={`absolute inset-0 rounded-full ${isCompleted ? "border-[var(--accent)]" : isHigh ? "border-[var(--border-strong)]" : "border-[var(--border)]"}`} />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-1.5 ml-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleComplete(item.skill);
                        }}
                        className={[
                          "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition duration-200",
                          isCompleted
                            ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--ink)]"
                            : "border-[var(--border-strong)] bg-[rgba(8,10,16,0.85)] hover:border-[var(--foreground)]",
                        ].join(" ")}
                      >
                        {isCompleted ? (
                          <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 6l3 3 5-5" />
                          </svg>
                        ) : null}
                      </button>

                      <span
                        className={`rounded px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] ${
                          isCompleted
                            ? "bg-[var(--accent)] text-[var(--ink)]"
                            : isHigh
                              ? "bg-[rgba(187,255,68,0.12)] text-[var(--accent)]"
                              : isMedium
                                ? "border border-[var(--border)] text-[var(--muted)]"
                                : "text-[var(--muted-strong)]"
                        }`}
                      >
                        {item.priority}
                      </span>

                      <h3
                        className={`text-sm font-semibold tracking-[-0.03em] transition duration-200 ${
                          isCompleted
                            ? "text-[var(--muted)] line-through"
                            : "text-[var(--foreground)]"
                        }`}
                      >
                        {item.skill}
                      </h3>

                      <span className="text-[0.6rem] text-[var(--muted)] transition-transform duration-200">
                        {expandedItems.has(index) ? "▾" : "▸"}
                      </span>
                    </div>

                    <p className="ml-2 text-xs leading-5 text-[var(--muted)]">
                      {item.reason}
                    </p>

                    {expandedItems.has(index) ? (
                      <div className="mt-3 ml-2 rounded-md border border-[var(--border)] bg-[rgba(8,10,16,0.4)] p-3.5 space-y-3">
                        <div>
                          <p className="text-[0.6rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                            Learning topics
                          </p>
                          <ul className="mt-1.5 space-y-1">
                            {item.learning_topics.map((topic) => (
                              <li
                                key={topic}
                                className="flex items-start gap-2 text-xs text-[var(--foreground)]"
                              >
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
                                {topic}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <hr className="litmus-separator" />

                        <div>
                          <p className="text-[0.6rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                            Project
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[var(--foreground)]">
                            {item.project}
                          </p>
                        </div>

                        <div>
                          <p className="text-[0.6rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                            Evidence of mastery
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                            {item.evidence_of_mastery}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-6 text-sm text-[var(--muted)]">
              No career roadmap has been generated yet.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
