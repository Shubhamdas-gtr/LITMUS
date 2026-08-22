"use client";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  getAssessmentQuestionSet,
  type AssessmentQuestion,
} from "./questionSets";

const careerGoals = [
  {
    id: "internship",
    title: "INTERNSHIP",
    description: "Get experience and break into your field.",
  },
  {
    id: "full-time",
    title: "FULL-TIME",
    description: "Prepare for your first full-time role.",
  },
  {
    id: "both",
    title: "BOTH",
    description: "Keep both paths open.",
  },
] as const;

const roleOptions = [
  {
    id: "software-engineer",
    title: "Software Engineer",
    description: "Build products, systems, and features across the stack.",
    keywords: ["software", "engineering", "coding", "swe"],
  },
  {
    id: "frontend-developer",
    title: "Frontend Developer",
    description: "Design and ship the interfaces people use every day.",
    keywords: ["frontend", "front end", "web", "ui", "react"],
  },
  {
    id: "backend-developer",
    title: "Backend Developer",
    description: "Work on APIs, services, and the logic behind products.",
    keywords: ["backend", "back end", "api", "server"],
  },
  {
    id: "fullstack-developer",
    title: "Full Stack Developer",
    description: "Move between frontend polish and backend reliability.",
    keywords: ["full stack", "fullstack", "web app"],
  },
  {
    id: "data-analyst",
    title: "Data Analyst",
    description: "Turn data into insights, dashboards, and decisions.",
    keywords: ["data", "analytics", "sql", "dashboard", "bi"],
  },
  {
    id: "data-scientist",
    title: "Data Scientist",
    description: "Use statistics and experiments to uncover patterns.",
    keywords: ["data science", "statistics", "python", "machine learning"],
  },
  {
    id: "ai-ml-engineer",
    title: "AI / ML Engineer",
    description: "Build intelligent systems and model-powered features.",
    keywords: ["ai", "ml", "machine learning", "artificial intelligence"],
  },
  {
    id: "cloud-devops-engineer",
    title: "Cloud / DevOps Engineer",
    description: "Keep systems deployable, scalable, and reliable.",
    keywords: ["cloud", "devops", "aws", "infrastructure", "cicd"],
  },
  {
    id: "cybersecurity-analyst",
    title: "Cybersecurity Analyst",
    description: "Protect products, systems, and users from threats.",
    keywords: ["security", "cyber", "soc", "threat"],
  },
  {
    id: "ui-ux-designer",
    title: "UI/UX Designer",
    description: "Shape product experiences that feel clear and usable.",
    keywords: ["design", "ux", "ui", "product design", "prototype"],
  },
  {
    id: "product-manager",
    title: "Product Manager",
    description: "Guide priorities, strategy, and product execution.",
    keywords: ["product", "pm", "strategy", "roadmap"],
  },
] as const;

const unsureRole = {
  id: "not-sure-yet",
  title: "I'm not sure yet",
  description: "Show me a range of options before I decide.",
  keywords: ["not sure", "unsure", "exploring", "help me decide"],
} as const;

const interestOptions = [
  {
    id: "web-development",
    title: "Web Development",
    description: "Build modern websites and web apps.",
  },
  {
    id: "ai-ml",
    title: "AI / Machine Learning",
    description: "Experiment with models, agents, and intelligent systems.",
  },
  {
    id: "data",
    title: "Data",
    description: "Explore patterns, insights, and analytical thinking.",
  },
  {
    id: "cybersecurity",
    title: "Cybersecurity",
    description: "Protect products, systems, and users from threats.",
  },
  {
    id: "cloud-devops",
    title: "Cloud / DevOps",
    description: "Deploy, scale, and keep systems reliable.",
  },
  {
    id: "mobile-development",
    title: "Mobile Development",
    description: "Create apps for phones and tablets.",
  },
  {
    id: "ui-ux",
    title: "UI / UX",
    description: "Shape interfaces and product experiences.",
  },
  {
    id: "product",
    title: "Product",
    description: "Think about strategy, priorities, and user needs.",
  },
  {
    id: "blockchain-web3",
    title: "Blockchain / Web3",
    description: "Work with decentralized systems and apps.",
  },
  {
    id: "game-development",
    title: "Game Development",
    description: "Build interactive games and playful experiences.",
  },
] as const;

const exploringInterest = {
  id: "still-exploring",
  title: "I'm still exploring",
  description: "I want to keep my options open while I figure it out.",
} as const;

type CatalogSkill = {
  id: string;
  label: string;
  keywords: string[];
};

type SkillCategory = {
  title: string;
  skills: CatalogSkill[];
};

const skillCategories: SkillCategory[] = [
  {
    title: "Development",
    skills: [
      {
        id: "javascript",
        label: "JavaScript",
        keywords: ["javascript", "js"],
      },
      {
        id: "typescript",
        label: "TypeScript",
        keywords: ["typescript", "ts"],
      },
      { id: "python", label: "Python", keywords: ["python"] },
      { id: "java", label: "Java", keywords: ["java"] },
      { id: "cpp", label: "C++", keywords: ["cpp", "c++"] },
      { id: "react", label: "React", keywords: ["react"] },
      { id: "nextjs", label: "Next.js", keywords: ["next", "nextjs"] },
      { id: "nodejs", label: "Node.js", keywords: ["node", "nodejs"] },
    ],
  },
  {
    title: "Data / AI",
    skills: [
      { id: "sql", label: "SQL", keywords: ["sql", "database"] },
      { id: "pandas", label: "Pandas", keywords: ["pandas"] },
      { id: "numpy", label: "NumPy", keywords: ["numpy"] },
      {
        id: "machine-learning",
        label: "Machine Learning",
        keywords: ["machine learning", "ml"],
      },
      {
        id: "tensorflow",
        label: "TensorFlow",
        keywords: ["tensorflow"],
      },
      { id: "pytorch", label: "PyTorch", keywords: ["pytorch"] },
    ],
  },
  {
    title: "Cloud / DevOps",
    skills: [
      { id: "git", label: "Git", keywords: ["git", "version control"] },
      { id: "docker", label: "Docker", keywords: ["docker", "containers"] },
      { id: "aws", label: "AWS", keywords: ["aws", "amazon web services"] },
      { id: "azure", label: "Azure", keywords: ["azure", "microsoft azure"] },
      {
        id: "kubernetes",
        label: "Kubernetes",
        keywords: ["kubernetes", "k8s"],
      },
    ],
  },
];

type AssessmentStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type CareerGoal = (typeof careerGoals)[number]["id"];
type TargetRole = (typeof roleOptions)[number]["id"] | typeof unsureRole.id;
type InterestId =
  (typeof interestOptions)[number]["id"] | typeof exploringInterest.id;
type ResumeChoice = "upload" | "no_resume" | null;
type SelectedSkill = {
  id: string;
  label: string;
  source: "catalog" | "custom";
};
type ConfidenceLevel = "getting_started" | "can_build" | "comfortable" | "very_confident";

const confidenceLevels: Array<{
  id: ConfidenceLevel;
  label: string;
  hint: string;
}> = [
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
    hint: "Can use it on my own",
  },
  {
    id: "very_confident",
    label: "Very confident",
    hint: "Can move quickly",
  },
] as const;

const allCatalogSkills: CatalogSkill[] = skillCategories.flatMap((category) => category.skills);

const MAX_RESUME_FILE_SIZE = 10 * 1024 * 1024;
const RESUME_ACCEPT =
  ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function matchesQuery(title: string, keywords: readonly string[], query: string) {
  if (!query) {
    return true;
  }

  const normalized = query.toLowerCase();

  return (
    title.toLowerCase().includes(normalized) ||
    keywords.some((keyword) => keyword.includes(normalized))
  );
}

function isAllowedResumeFile(file: File) {
  const lowerName = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || lowerName.endsWith(".pdf");
  const isDocx =
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerName.endsWith(".docx");

  return isPdf || isDocx;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  return `${(kilobytes / 1024).toFixed(1)} MB`;
}

function getProgressLabel(step: AssessmentStep) {
  switch (step) {
    case 1:
      return "01 / 08";
    case 2:
      return "02 / 08";
    case 3:
      return "03 / 08";
    case 4:
      return "04 / 08";
    case 5:
      return "05 / 08";
    case 6:
      return "06 / 08";
    case 7:
      return "07 / 08";
    case 8:
      return "08 / 08";
  }
}

function getResumeKind(file: File) {
  const lowerName = file.name.toLowerCase();
  return file.type === "application/pdf" || lowerName.endsWith(".pdf")
    ? "PDF"
    : "DOCX";
}

function getConfidenceLabel(level: ConfidenceLevel) {
  return confidenceLevels.find((item) => item.id === level)?.label ?? level;
}

function findCatalogSkillByLabel(label: string) {
  const normalized = normalizeText(label);
  return allCatalogSkills.find(
    (skill) => normalizeText(skill.label) === normalized,
  );
}

type QuestionCardProps = {
  question: AssessmentQuestion;
  selectedOptionIndex: number | null;
  onSelect: (optionIndex: number) => void;
};

function QuestionCard({
  question,
  selectedOptionIndex,
  onSelect,
}: QuestionCardProps) {
  return (
    <section className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_12px_28px_rgba(17,17,17,0.05)]">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-ui text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
            Skill focus
          </p>
          <h2 className="font-ui mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
            {question.skill}
          </h2>
        </div>

        <span className="inline-flex w-fit items-center rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Practice only
        </span>
      </div>

      <h3 className="font-ui mt-5 max-w-3xl text-[clamp(1.6rem,3vw,2.2rem)] font-semibold tracking-[-0.05em] text-[var(--foreground)] leading-[1.02]">
        {question.question}
      </h3>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {question.options.map((option, optionIndex) => {
          const isSelected = selectedOptionIndex === optionIndex;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(optionIndex)}
              aria-pressed={isSelected}
              className={[
                "group min-h-[92px] rounded-[1.25rem] border p-4 text-left shadow-[0_10px_24px_rgba(17,17,17,0.04)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(17,17,17,0.08)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                isSelected
                  ? "border-[var(--accent)] bg-[#fff7f2] shadow-[0_14px_30px_rgba(17,17,17,0.08)]"
                  : "border-[var(--border)] bg-[var(--background)]",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-ui text-sm font-medium leading-6 text-[var(--foreground)]">
                  {option}
                </p>

                <span
                  className={[
                    "inline-flex h-8 shrink-0 items-center justify-center rounded-full border px-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em] transition duration-200",
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                      : "border-[var(--border)] bg-[var(--background)] text-[var(--muted)] group-hover:border-[var(--border-strong)]",
                  ].join(" ")}
                >
                  {isSelected ? "Selected" : "Pick"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function AssessmentPage() {
  const [step, setStep] = useState<AssessmentStep>(1);
  const [careerGoal, setCareerGoal] = useState<CareerGoal | null>(null);
  const [targetRole, setTargetRole] = useState<TargetRole | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<InterestId[]>([]);
  const [resumeChoice, setResumeChoice] = useState<ResumeChoice>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [roleQuery, setRoleQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
  const [skillQuery, setSkillQuery] = useState("");
  const [showCustomSkillComposer, setShowCustomSkillComposer] = useState(false);
  const [customSkillValue, setCustomSkillValue] = useState("");
  const [skillError, setSkillError] = useState<string | null>(null);
  const [skillConfidence, setSkillConfidence] = useState<
    Partial<Record<string, ConfidenceLevel>>
  >({});
  const [assessmentQuestionIndex, setAssessmentQuestionIndex] = useState(0);
  const [assessmentAnswers, setAssessmentAnswers] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const customSkillInputRef = useRef<HTMLInputElement | null>(null);

  const selectedGoal = careerGoals.find((goal) => goal.id === careerGoal);
  const selectedRole =
    roleOptions.find((role) => role.id === targetRole) ??
    (targetRole === unsureRole.id ? unsureRole : null);
  const filteredRoles = roleOptions.filter((role) =>
    matchesQuery(role.title, role.keywords, roleQuery.trim()),
  );
  const filteredSkillCategories: Array<{
    title: string;
    skills: CatalogSkill[];
  }> = skillCategories
    .map((category) => {
      const normalizedQuery = skillQuery.trim().toLowerCase();
      const categoryMatches =
        !normalizedQuery || category.title.toLowerCase().includes(normalizedQuery);

      return {
        title: category.title,
        skills: categoryMatches
          ? category.skills
          : category.skills.filter((skill) =>
              matchesQuery(skill.label, skill.keywords, normalizedQuery),
            ),
      };
    })
    .filter((category) => category.skills.length > 0);

  const canContinueFromStepOne = careerGoal !== null;
  const canContinueFromStepTwo = targetRole !== null;
  const canContinueFromStepThree = selectedInterests.length > 0;
  const canContinueFromStepFour =
    resumeChoice === "no_resume" || resumeFile !== null;
  const canContinueFromStepFive = selectedSkills.length > 0;
  const canContinueFromStepSix =
    selectedSkills.length > 0 &&
    selectedSkills.every((skill) => skillConfidence[skill.id]);
  const assessmentQuestionSet = getAssessmentQuestionSet(selectedRole?.id);
  const assessmentQuestions = assessmentQuestionSet.questions;
  const currentAssessmentQuestion =
    assessmentQuestions[assessmentQuestionIndex] ?? assessmentQuestions[0];
  const currentAssessmentAnswer =
    currentAssessmentQuestion !== undefined
      ? assessmentAnswers[currentAssessmentQuestion.id]
      : undefined;
  const canContinueFromStepSeven =
    currentAssessmentAnswer !== undefined && assessmentQuestions.length > 0;
  const isFinalAssessmentQuestion =
    assessmentQuestionIndex === assessmentQuestions.length - 1;
  const answeredAssessmentCount = assessmentQuestions.filter(
    (question) => assessmentAnswers[question.id] !== undefined,
  ).length;
  const selectedInterestLabels = selectedInterests.reduce<string[]>(
    (labels, interestId) => {
      const label =
        interestId === exploringInterest.id
          ? exploringInterest.title
          : interestOptions.find((interest) => interest.id === interestId)?.title;

      if (label) {
        labels.push(label);
      }

      return labels;
    },
    [],
  );

  async function submitAssessment() {
  setLoading(true);

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setMessage("Please sign in before submitting your assessment.");
      return;
    }

    if (resumeChoice === "upload" && resumeFile) {
    const resumeFormData = new FormData();
    resumeFormData.append("file", resumeFile);

    const resumeResponse = await fetch(
      "http://127.0.0.1:8000/api/profile/resume",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: resumeFormData,
      },
    );

    const resumeData = await resumeResponse.json();

    if (!resumeResponse.ok) {
      setMessage(resumeData.detail ?? "Could not upload your resume.");
      return;
    }
  }

    const response = await fetch(
      "http://127.0.0.1:8000/api/profile/assessment",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          career_goal: selectedGoal?.title ?? "",
          target_role: selectedRole?.title ?? "",
          interests: selectedInterestLabels,
          skills: selectedSkills.map((skill) => skill.label),
          skill_confidence: Object.fromEntries(
            selectedSkills.map((skill) => [
              skill.label,
              skillConfidence[skill.id] ?? "",
            ]),
          ),
          assessment_answers: assessmentAnswers,
        }),
      },
    );

    const data = await response.json();

if (!response.ok) {
  setMessage(data.detail ?? "Could not save your assessment.");
  return;
}

if (resumeFile) {
  const formData = new FormData();
  formData.append("file", resumeFile);

  const resumeResponse = await fetch(
    "http://127.0.0.1:8000/api/profile/resume",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: formData,
    },
  );

  const resumeData = await resumeResponse.json();

  if (!resumeResponse.ok) {
    setMessage(
      resumeData.detail ??
        "Assessment saved, but resume upload failed.",
    );
    return;
  }
}

setStep(8);
  } catch {
    setMessage("Could not reach the backend.");
  } finally {
    setLoading(false);
  }
}
  const selectedSkillLabels = selectedSkills.map((skill) => skill.label);
  const confidenceSummary = confidenceLevels.map((level) => {
    const count = selectedSkills.filter(
      (skill) => skillConfidence[skill.id] === level.id,
    ).length;

    return {
      ...level,
      count,
    };
  });
  const maxConfidenceCount = Math.max(
    1,
    ...confidenceSummary.map((item) => item.count),
  );

  const toggleInterest = (id: InterestId) => {
    if (id === exploringInterest.id) {
      setSelectedInterests((current) =>
        current.includes(exploringInterest.id) ? [] : [exploringInterest.id],
      );
      return;
    }

    setSelectedInterests((current) => {
      if (current.includes(exploringInterest.id)) {
        return [id];
      }

      return current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
    });
  };

  const handleResumeSelection = (file: File | null) => {
    if (!file) {
      setResumeFile(null);
      return;
    }

    if (!isAllowedResumeFile(file)) {
      setResumeFile(null);
      setResumeChoice(null);
      setResumeError("Please upload a PDF or DOCX file.");
      return;
    }

    if (file.size > MAX_RESUME_FILE_SIZE) {
      setResumeFile(null);
      setResumeChoice(null);
      setResumeError(
        "That file is a little too large. Please use a file under 10 MB.",
      );
      return;
    }

    setResumeError(null);
    setResumeFile(file);
    setResumeChoice("upload");
  };

  const addSkill = (skill: CatalogSkill) => {
    setSkillError(null);
    setSelectedSkills((current) =>
      current.some((item) => item.id === skill.id)
        ? current
        : [...current, { id: skill.id, label: skill.label, source: "catalog" }],
    );
  };

  const removeSkill = (skillId: string) => {
    setSelectedSkills((current) => current.filter((skill) => skill.id !== skillId));
    setSkillConfidence((current) => {
      if (!(skillId in current)) {
        return current;
      }

      const next = { ...current };
      delete next[skillId];
      return next;
    });
  };

  const addCustomSkill = () => {
    const trimmed = customSkillValue.trim();

    if (!trimmed) {
      setSkillError("Type a skill name first.");
      return;
    }

    const normalized = normalizeText(trimmed);

    if (
      selectedSkills.some(
        (skill) => normalizeText(skill.label) === normalized,
      )
    ) {
      setSkillError("That skill is already selected.");
      return;
    }

    const catalogMatch = findCatalogSkillByLabel(trimmed);
    if (catalogMatch) {
      addSkill(catalogMatch);
      setCustomSkillValue("");
      setShowCustomSkillComposer(false);
      customSkillInputRef.current?.blur();
      return;
    }

    setSelectedSkills((current) => [
      ...current,
      { id: `custom:${normalized}`, label: trimmed, source: "custom" },
    ]);
    setSkillError(null);
    setCustomSkillValue("");
    setShowCustomSkillComposer(false);
    customSkillInputRef.current?.blur();
  };

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
                assessment
              </span>
            </div>
          </div>

          <div className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[var(--muted)] shadow-[0_10px_24px_rgba(17,17,17,0.05)]">
            {getProgressLabel(step)}
          </div>
        </header>

        {step === 1 ? (
          <section className="flex flex-1 flex-col justify-center gap-8 py-10 lg:py-14">
            <div className="space-y-5">
              <p className="font-ui text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
                Career assessment
              </p>

              <h1 className="font-ui max-w-3xl text-[clamp(2.8rem,7vw,5.6rem)] font-bold tracking-[-0.07em] text-[var(--foreground)] leading-[0.94]">
                What are you preparing for?
              </h1>

              <p className="font-ui max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                Tell LITMUS where you&apos;re headed. We&apos;ll use this to
                personalize everything that comes next.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {careerGoals.map((goal) => {
                const isSelected = careerGoal === goal.id;

                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setCareerGoal(goal.id)}
                    aria-pressed={isSelected}
                    className={[
                      "group flex min-h-[210px] flex-col justify-between rounded-[1.75rem] border bg-[var(--surface)] p-5 text-left shadow-[0_12px_28px_rgba(17,17,17,0.05)] transition duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(17,17,17,0.08)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                      isSelected
                        ? "border-[var(--accent)] bg-[#fff7f2] shadow-[0_16px_36px_rgba(17,17,17,0.08)]"
                        : "border-[var(--border)]",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-ui text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                          Option
                        </p>
                        <h2 className="font-ui mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
                          {goal.title}
                        </h2>
                      </div>

                      <span
                        className={[
                          "inline-flex h-10 items-center justify-center rounded-full border px-3 text-xs font-semibold uppercase tracking-[0.2em] transition duration-200",
                          isSelected
                            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                            : "border-[var(--border)] bg-[var(--background)] text-[var(--muted)] group-hover:border-[var(--border-strong)]",
                        ].join(" ")}
                      >
                        {isSelected ? "Selected" : "Choose"}
                      </span>
                    </div>

                    <p className="font-ui max-w-xs text-sm leading-6 text-[var(--muted)]">
                      {goal.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-ui text-sm leading-6 text-[var(--muted)]">
                Choose one path to start. You can change it before continuing.
              </p>

              <button
                type="button"
                onClick={() => {
                  if (canContinueFromStepOne) {
                    setStep(2);
                  }
                }}
                disabled={!canContinueFromStepOne}
                className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(255,90,40,0.28)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#e85224] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:bg-[var(--border-strong)] disabled:text-white/70 disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:bg-[var(--border-strong)]"
              >
                Continue
              </button>
            </div>
          </section>
        ) : step === 2 ? (
          <section className="flex flex-1 flex-col justify-center gap-8 py-10 lg:py-14">
            <div className="space-y-5">
              <p className="font-ui text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
                Target role
              </p>

              <h1 className="font-ui max-w-3xl text-[clamp(2.6rem,6.4vw,5.2rem)] font-bold tracking-[-0.07em] text-[var(--foreground)] leading-[0.94]">
                Where do you want to go?
              </h1>

              <p className="font-ui max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                Choose the role you&apos;re working toward. Don&apos;t worry if
                you&apos;re not fully ready yet-that&apos;s what LITMUS is here
                for.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_12px_28px_rgba(17,17,17,0.05)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <label
                  htmlFor="role-search"
                  className="font-ui text-xs uppercase tracking-[0.28em] text-[var(--muted)]"
                >
                  Search roles
                </label>

                <div className="font-ui text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  {filteredRoles.length} role
                  {filteredRoles.length === 1 ? "" : "s"} shown
                </div>
              </div>

              <input
                id="role-search"
                type="search"
                value={roleQuery}
                onChange={(event) => setRoleQuery(event.target.value)}
                placeholder="Try software, design, data, security..."
                className="font-ui w-full rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] shadow-[0_6px_16px_rgba(17,17,17,0.04)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              />

              {selectedGoal ? (
                <div className="inline-flex w-fit items-center rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  Career goal: {selectedGoal.title}
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredRoles.map((role) => {
                const isSelected = targetRole === role.id;

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setTargetRole(role.id)}
                    aria-pressed={isSelected}
                    className={[
                      "group flex min-h-[160px] flex-col justify-between rounded-[1.5rem] border bg-[var(--surface)] p-4 text-left shadow-[0_12px_28px_rgba(17,17,17,0.05)] transition duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(17,17,17,0.08)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                      isSelected
                        ? "border-[var(--accent)] bg-[#fff7f2] shadow-[0_16px_36px_rgba(17,17,17,0.08)]"
                        : "border-[var(--border)]",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-ui text-xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
                        {role.title}
                      </h2>

                      <span
                        className={[
                          "inline-flex h-9 items-center justify-center rounded-full border px-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] transition duration-200",
                          isSelected
                            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                            : "border-[var(--border)] bg-[var(--background)] text-[var(--muted)] group-hover:border-[var(--border-strong)]",
                        ].join(" ")}
                      >
                        {isSelected ? "Selected" : "Select"}
                      </span>
                    </div>

                    <p className="font-ui mt-4 max-w-md text-sm leading-6 text-[var(--muted)]">
                      {role.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {filteredRoles.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[var(--border)] bg-[var(--background)] px-5 py-4 text-sm leading-6 text-[var(--muted)]">
                No roles match that search yet. Try a broader keyword.
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setTargetRole(unsureRole.id)}
              aria-pressed={targetRole === unsureRole.id}
              className={[
                "group flex w-full flex-col gap-4 rounded-[1.5rem] border bg-[var(--surface)] p-5 text-left shadow-[0_12px_28px_rgba(17,17,17,0.05)] transition duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(17,17,17,0.08)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                targetRole === unsureRole.id
                  ? "border-[var(--accent)] bg-[#fff7f2] shadow-[0_16px_36px_rgba(17,17,17,0.08)]"
                  : "border-[var(--border)]",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-ui text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                    Flexible option
                  </p>
                  <h2 className="font-ui mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
                    {unsureRole.title}
                  </h2>
                </div>

                <span
                  className={[
                    "inline-flex h-10 items-center justify-center rounded-full border px-3 text-xs font-semibold uppercase tracking-[0.2em] transition duration-200",
                    targetRole === unsureRole.id
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                      : "border-[var(--border)] bg-[var(--background)] text-[var(--muted)] group-hover:border-[var(--border-strong)]",
                  ].join(" ")}
                >
                  {targetRole === unsureRole.id ? "Selected" : "Select"}
                </span>
              </div>

              <p className="font-ui max-w-2xl text-sm leading-6 text-[var(--muted)]">
                {unsureRole.description}
              </p>
            </button>

            <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-3.5 text-sm font-semibold text-[var(--foreground)] shadow-[0_10px_24px_rgba(17,17,17,0.05)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[0_14px_28px_rgba(17,17,17,0.08)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => {
                  if (canContinueFromStepTwo) {
                    setStep(3);
                  }
                }}
                disabled={!canContinueFromStepTwo}
                className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(255,90,40,0.28)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#e85224] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:bg-[var(--border-strong)] disabled:text-white/70 disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:bg-[var(--border-strong)]"
              >
                Continue
              </button>
            </div>
          </section>
        ) : step === 3 ? (
          <section className="flex flex-1 flex-col justify-center gap-8 py-10 lg:py-14">
            <div className="space-y-5">
              <p className="font-ui text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
                Area of interest
              </p>

              <h1 className="font-ui max-w-3xl text-[clamp(2.6rem,6.4vw,5.2rem)] font-bold tracking-[-0.07em] text-[var(--foreground)] leading-[0.94]">
                What makes you curious?
              </h1>

              <p className="font-ui max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                Pick the areas you&apos;d actually enjoy spending time learning
                and building in.
              </p>

              <div className="flex flex-wrap gap-2">
                {selectedGoal ? (
                  <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Goal: {selectedGoal.title}
                  </span>
                ) : null}

                {selectedRole ? (
                  <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Role: {selectedRole.title}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {interestOptions.map((interest) => {
                const isSelected = selectedInterests.includes(interest.id);

                return (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => toggleInterest(interest.id)}
                    aria-pressed={isSelected}
                    className={[
                      "group flex min-h-[160px] flex-col justify-between rounded-[1.5rem] border bg-[var(--surface)] p-4 text-left shadow-[0_12px_28px_rgba(17,17,17,0.05)] transition duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(17,17,17,0.08)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                      isSelected
                        ? "border-[var(--accent)] bg-[#fff7f2] shadow-[0_16px_36px_rgba(17,17,17,0.08)]"
                        : "border-[var(--border)]",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-ui text-xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
                        {interest.title}
                      </h2>

                      <span
                        className={[
                          "inline-flex h-9 items-center justify-center rounded-full border px-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] transition duration-200",
                          isSelected
                            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                            : "border-[var(--border)] bg-[var(--background)] text-[var(--muted)] group-hover:border-[var(--border-strong)]",
                        ].join(" ")}
                      >
                        {isSelected ? "Selected" : "Select"}
                      </span>
                    </div>

                    <p className="font-ui mt-4 max-w-md text-sm leading-6 text-[var(--muted)]">
                      {interest.description}
                    </p>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => toggleInterest(exploringInterest.id)}
                aria-pressed={selectedInterests.includes(exploringInterest.id)}
                className={[
                  "group flex min-h-[160px] flex-col justify-between rounded-[1.5rem] border bg-[var(--surface)] p-4 text-left shadow-[0_12px_28px_rgba(17,17,17,0.05)] transition duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(17,17,17,0.08)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] sm:col-span-2 xl:col-span-1",
                  selectedInterests.includes(exploringInterest.id)
                    ? "border-[var(--accent)] bg-[#fff7f2] shadow-[0_16px_36px_rgba(17,17,17,0.08)]"
                    : "border-[var(--border)]",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-ui text-xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
                    {exploringInterest.title}
                  </h2>

                  <span
                    className={[
                      "inline-flex h-9 items-center justify-center rounded-full border px-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] transition duration-200",
                      selectedInterests.includes(exploringInterest.id)
                        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                        : "border-[var(--border)] bg-[var(--background)] text-[var(--muted)] group-hover:border-[var(--border-strong)]",
                    ].join(" ")}
                  >
                    {selectedInterests.includes(exploringInterest.id)
                      ? "Selected"
                      : "Select"}
                  </span>
                </div>

                <p className="font-ui mt-4 max-w-md text-sm leading-6 text-[var(--muted)]">
                  {exploringInterest.description}
                </p>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedInterests.map((interestId) => {
                const label =
                  interestId === exploringInterest.id
                    ? exploringInterest.title
                    : interestOptions.find((interest) => interest.id === interestId)
                        ?.title;

                return label ? (
                  <span
                    key={interestId}
                    className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]"
                  >
                    {label}
                  </span>
                ) : null;
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-3.5 text-sm font-semibold text-[var(--foreground)] shadow-[0_10px_24px_rgba(17,17,17,0.05)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[0_14px_28px_rgba(17,17,17,0.08)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => {
                  if (canContinueFromStepThree) {
                    setStep(4);
                  }
                }}
                disabled={!canContinueFromStepThree}
                className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(255,90,40,0.28)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#e85224] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:bg-[var(--border-strong)] disabled:text-white/70 disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:bg-[var(--border-strong)]"
              >
                Continue
              </button>
            </div>
          </section>
        ) : step === 4 ? (
          <section className="flex flex-1 flex-col justify-center gap-8 py-10 lg:py-14">
            <div className="space-y-5">
              <p className="font-ui text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
                Resume
              </p>

              <h1 className="font-ui max-w-3xl text-[clamp(2.6rem,6.4vw,5.2rem)] font-bold tracking-[-0.07em] text-[var(--foreground)] leading-[0.94]">
                Show us what you&apos;ve built so far.
              </h1>

              <p className="font-ui max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                Your resume helps LITMUS understand the experience and skills
                you already have.
              </p>

              <div className="flex flex-wrap gap-2">
                {selectedGoal ? (
                  <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Goal: {selectedGoal.title}
                  </span>
                ) : null}

                {selectedRole ? (
                  <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Role: {selectedRole.title}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div
                className={[
                  "rounded-[1.75rem] border bg-[var(--surface)] p-5 shadow-[0_12px_28px_rgba(17,17,17,0.05)] transition duration-200",
                  resumeChoice === "upload"
                    ? "border-[var(--accent)] bg-[#fff7f2]"
                    : "border-[var(--border)]",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-ui text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                      Upload resume
                    </p>
                    <h2 className="font-ui mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
                      Drop your resume here
                    </h2>
                  </div>

                  <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    PDF or DOCX
                  </span>
                </div>

                <div
                  className={[
                    "mt-5 rounded-[1.5rem] border border-dashed bg-[var(--background)] p-4 shadow-[0_10px_24px_rgba(17,17,17,0.04)] transition duration-200",
                    resumeChoice === "upload"
                      ? "border-[var(--accent)]"
                      : "border-[var(--border)]",
                  ].join(" ")}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const file = event.dataTransfer.files?.[0] ?? null;
                    handleResumeSelection(file);
                  }}
                >
                  <input
                    id="resume-upload"
                    ref={fileInputRef}
                    type="file"
                    accept={RESUME_ACCEPT}
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      handleResumeSelection(file);
                      event.target.value = "";
                    }}
                  />

                  {!resumeFile ? (
                    <label
                      htmlFor="resume-upload"
                      className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[1.25rem] px-5 py-8 text-center transition duration-200 hover:bg-[rgba(255,255,255,0.45)]"
                    >
                      <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-lg font-semibold text-[var(--accent)]">
                        +
                      </div>
                      <p className="font-ui mt-4 text-xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                        Drop your resume here
                      </p>
                      <p className="font-ui mt-2 text-sm leading-6 text-[var(--muted)]">
                        Or click to browse your files.
                      </p>
                      <p className="font-ui mt-4 text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                        PDF or DOCX
                      </p>
                    </label>
                  ) : (
                    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[1.25rem] px-5 py-8 text-center">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--accent)] text-sm font-semibold text-white shadow-[0_10px_22px_rgba(255,90,40,0.24)]">
                        Uploaded
                      </div>
                      <p className="font-ui mt-4 text-xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                        {resumeFile.name}
                      </p>
                      <p className="font-ui mt-2 text-sm leading-6 text-[var(--muted)]">
                        {getResumeKind(resumeFile)} | {formatFileSize(resumeFile.size)}
                      </p>

                      <div className="mt-5 flex flex-wrap justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setResumeFile(null);
                            setResumeChoice(null);
                            setResumeError(null);
                          }}
                          className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground)] shadow-[0_8px_18px_rgba(17,17,17,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
                        >
                          Remove
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_10px_22px_rgba(255,90,40,0.24)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#e85224]"
                        >
                          Replace
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {resumeError ? (
                  <p className="font-ui mt-4 rounded-[1rem] border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
                    {resumeError}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => {
                  setResumeChoice("no_resume");
                  setResumeFile(null);
                  setResumeError(null);
                }}
                aria-pressed={resumeChoice === "no_resume"}
                className={[
                  "group flex min-h-[220px] flex-col justify-between rounded-[1.75rem] border bg-[var(--surface)] p-5 text-left shadow-[0_12px_28px_rgba(17,17,17,0.05)] transition duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(17,17,17,0.08)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                  resumeChoice === "no_resume"
                    ? "border-[var(--accent)] bg-[#fff7f2] shadow-[0_16px_36px_rgba(17,17,17,0.08)]"
                    : "border-[var(--border)]",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-ui text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                      Secondary path
                    </p>
                    <h2 className="font-ui mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
                      I don&apos;t have a resume yet
                    </h2>
                  </div>

                  <span
                    className={[
                      "inline-flex h-10 items-center justify-center rounded-full border px-3 text-xs font-semibold uppercase tracking-[0.2em] transition duration-200",
                      resumeChoice === "no_resume"
                        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                        : "border-[var(--border)] bg-[var(--background)] text-[var(--muted)] group-hover:border-[var(--border-strong)]",
                    ].join(" ")}
                  >
                    {resumeChoice === "no_resume" ? "Selected" : "Choose"}
                  </span>
                </div>

                <p className="font-ui max-w-md text-sm leading-6 text-[var(--muted)]">
                  That&apos;s okay. LITMUS can still help you figure out what to
                  build and how to present yourself later.
                </p>
              </button>
            </div>

            <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-3.5 text-sm font-semibold text-[var(--foreground)] shadow-[0_10px_24px_rgba(17,17,17,0.05)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[0_14px_28px_rgba(17,17,17,0.08)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => {
                  if (canContinueFromStepFour) {
                    setStep(5);
                  }
                }}
                disabled={!canContinueFromStepFour}
                className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(255,90,40,0.28)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#e85224] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:bg-[var(--border-strong)] disabled:text-white/70 disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:bg-[var(--border-strong)]"
              >
                Continue
              </button>
            </div>
          </section>
        ) : step === 5 ? (
          <section className="flex flex-1 flex-col justify-center gap-8 py-10 lg:py-14">
            <div className="space-y-5">
              <p className="font-ui text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
                Skills
              </p>

              <h1 className="font-ui max-w-3xl text-[clamp(2.6rem,6.4vw,5.2rem)] font-bold tracking-[-0.07em] text-[var(--foreground)] leading-[0.94]">
                What can you actually do?
              </h1>

              <p className="font-ui max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                Tell us what you&apos;re comfortable working with. Be
                honest-we&apos;re not judging you.
              </p>

              <div className="flex flex-wrap gap-2">
                {selectedGoal ? (
                  <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Goal: {selectedGoal.title}
                  </span>
                ) : null}

                {selectedRole ? (
                  <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Role: {selectedRole.title}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_12px_28px_rgba(17,17,17,0.05)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-ui text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                      Selected skills
                    </p>
                    <h2 className="font-ui mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
                      {selectedSkills.length} skill
                      {selectedSkills.length === 1 ? "" : "s"} selected
                    </h2>
                  </div>

                  <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Student-declared
                  </span>
                </div>

                {selectedSkills.length > 0 ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {selectedSkills.map((skill) => (
                      <span
                        key={skill.id}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-[var(--muted)]"
                      >
                        {skill.label}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill.id)}
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border)] text-[0.7rem] leading-none text-[var(--foreground)] transition hover:border-[var(--border-strong)]"
                          aria-label={`Remove ${skill.label}`}
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="font-ui mt-5 max-w-md text-sm leading-6 text-[var(--muted)]">
                    Your selected skills will appear here as you build the
                    declaration.
                  </p>
                )}

                <p className="font-ui mt-5 text-sm leading-6 text-[var(--muted)]">
                  These are student-declared skills only. LITMUS will combine
                  them with evidence later.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_12px_28px_rgba(17,17,17,0.05)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-ui text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                      Search and add
                    </p>
                    <h2 className="font-ui mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
                      Find skills fast
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomSkillComposer((current) => !current);
                      setSkillError(null);
                    }}
                    className="inline-flex items-center rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_10px_22px_rgba(255,90,40,0.24)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#e85224]"
                  >
                    + Add another skill
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  <input
                    type="search"
                    value={skillQuery}
                    onChange={(event) => setSkillQuery(event.target.value)}
                    placeholder="Search skills, e.g. React, SQL, Docker..."
                    className="font-ui w-full rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] shadow-[0_6px_16px_rgba(17,17,17,0.04)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                  />

                  {showCustomSkillComposer ? (
                    <div className="rounded-[1.4rem] border border-[var(--border)] bg-[var(--background)] p-4 shadow-[0_10px_24px_rgba(17,17,17,0.04)]">
                      <label
                        htmlFor="custom-skill"
                        className="font-ui text-xs uppercase tracking-[0.28em] text-[var(--muted)]"
                      >
                        Custom skill
                      </label>

                      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                        <input
                          id="custom-skill"
                          ref={customSkillInputRef}
                          type="text"
                          value={customSkillValue}
                          onChange={(event) => {
                            setCustomSkillValue(event.target.value);
                            setSkillError(null);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              addCustomSkill();
                            }
                          }}
                          placeholder="Add a skill you want to declare"
                          className="font-ui w-full rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] shadow-[0_6px_16px_rgba(17,17,17,0.04)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                        />

                        <button
                          type="button"
                          onClick={addCustomSkill}
                          className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] shadow-[0_10px_24px_rgba(17,17,17,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
                        >
                          Add
                        </button>
                      </div>

                      {skillError ? (
                        <p className="font-ui mt-3 text-sm leading-6 text-[var(--muted)]">
                          {skillError}
                        </p>
                      ) : (
                        <p className="font-ui mt-3 text-sm leading-6 text-[var(--muted)]">
                          Custom skills are added to the same selected list.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {filteredSkillCategories.length > 0 ? (
                filteredSkillCategories.map((category) => (
                  <section
                    key={category.title}
                    className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_12px_28px_rgba(17,17,17,0.05)]"
                  >
                    <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
                      <div>
                        <p className="font-ui text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                          Category
                        </p>
                        <h3 className="font-ui mt-2 text-xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
                          {category.title}
                        </h3>
                      </div>

                      <div className="font-ui text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                        {category.skills.length} shown
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {category.skills.map((skill) => {
                        const isSelected = selectedSkills.some(
                          (item) => item.id === skill.id,
                        );

                        return (
                          <button
                            key={skill.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                removeSkill(skill.id);
                              } else {
                                addSkill(skill);
                              }
                            }}
                            aria-pressed={isSelected}
                            className={[
                              "group flex min-h-[112px] flex-col justify-between rounded-[1.25rem] border bg-[var(--background)] p-4 text-left shadow-[0_10px_24px_rgba(17,17,17,0.04)] transition duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_16px_28px_rgba(17,17,17,0.08)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                              isSelected
                                ? "border-[var(--accent)] bg-[#fff7f2] shadow-[0_14px_30px_rgba(17,17,17,0.08)]"
                                : "border-[var(--border)]",
                            ].join(" ")}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="font-ui text-base font-semibold tracking-[-0.03em] text-[var(--foreground)]">
                                {skill.label}
                              </h4>

                              <span
                                className={[
                                  "inline-flex h-8 items-center justify-center rounded-full border px-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em] transition duration-200",
                                  isSelected
                                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                                    : "border-[var(--border)] bg-[var(--background)] text-[var(--muted)] group-hover:border-[var(--border-strong)]",
                                ].join(" ")}
                              >
                                {isSelected ? "Selected" : "Add"}
                              </span>
                            </div>

                            <p className="font-ui mt-3 text-sm leading-6 text-[var(--muted)]">
                              {skill.id}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))
              ) : (
                <div className="rounded-[1.75rem] border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-6 text-sm leading-6 text-[var(--muted)]">
                  No skills match that search yet. Try a broader keyword.
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-3.5 text-sm font-semibold text-[var(--foreground)] shadow-[0_10px_24px_rgba(17,17,17,0.05)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[0_14px_28px_rgba(17,17,17,0.08)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => {
                  if (canContinueFromStepFive) {
                    setStep(6);
                  }
                }}
                disabled={!canContinueFromStepFive}
                className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(255,90,40,0.28)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#e85224] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:bg-[var(--border-strong)] disabled:text-white/70 disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:bg-[var(--border-strong)]"
              >
                Continue
              </button>
            </div>
          </section>
        ) : step === 6 ? (
          <section className="flex flex-1 flex-col justify-center gap-8 py-10 lg:py-14">
            <div className="space-y-5">
              <p className="font-ui text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
                Skill confidence
              </p>

              <h1 className="font-ui max-w-3xl text-[clamp(2.6rem,6.4vw,5.2rem)] font-bold tracking-[-0.07em] text-[var(--foreground)] leading-[0.94]">
                How confident are you?
              </h1>

              <p className="font-ui max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                Be honest. Confidence helps LITMUS understand where you feel
                strong-and where you might need more practice.
              </p>

              <div className="flex flex-wrap gap-2">
                {selectedGoal ? (
                  <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Goal: {selectedGoal.title}
                  </span>
                ) : null}

                {selectedRole ? (
                  <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Role: {selectedRole.title}
                  </span>
                ) : null}

                <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  {selectedSkills.length} skill
                  {selectedSkills.length === 1 ? "" : "s"} to rate
                </span>
              </div>
            </div>

            {selectedSkills.length > 0 ? (
              <div className="space-y-4">
                {selectedSkills.map((skill) => {
                  const selectedLevel = skillConfidence[skill.id] ?? null;

                  return (
                    <section
                      key={skill.id}
                      className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_12px_28px_rgba(17,17,17,0.05)]"
                    >
                      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-ui text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                            Skill
                          </p>
                          <h2 className="font-ui mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
                            {skill.label}
                          </h2>
                        </div>

                        <div className="inline-flex w-fit items-center rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                          {selectedLevel ? getConfidenceLabel(selectedLevel) : "Not set"}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {confidenceLevels.map((level) => {
                          const isSelected = selectedLevel === level.id;

                          return (
                            <button
                              key={level.id}
                              type="button"
                              onClick={() =>
                                setSkillConfidence((current) => ({
                                  ...current,
                                  [skill.id]: level.id,
                                }))
                              }
                              aria-pressed={isSelected}
                              className={[
                                "group flex min-h-[112px] flex-col justify-between rounded-[1.25rem] border p-4 text-left shadow-[0_10px_24px_rgba(17,17,17,0.04)] transition duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_16px_28px_rgba(17,17,17,0.08)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                                isSelected
                                  ? "border-[var(--accent)] bg-[#fff7f2] shadow-[0_14px_30px_rgba(17,17,17,0.08)]"
                                  : "border-[var(--border)] bg-[var(--background)]",
                              ].join(" ")}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <h3 className="font-ui text-base font-semibold tracking-[-0.03em] text-[var(--foreground)]">
                                  {level.label}
                                </h3>

                                <span
                                  className={[
                                    "inline-flex h-8 items-center justify-center rounded-full border px-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em] transition duration-200",
                                    isSelected
                                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                                      : "border-[var(--border)] bg-[var(--background)] text-[var(--muted)] group-hover:border-[var(--border-strong)]",
                                  ].join(" ")}
                                >
                                  {isSelected ? "Selected" : "Choose"}
                                </span>
                              </div>

                              <p className="font-ui mt-3 text-sm leading-6 text-[var(--muted)]">
                                {level.hint}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[1.75rem] border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-8 text-sm leading-6 text-[var(--muted)] shadow-[0_12px_28px_rgba(17,17,17,0.04)]">
                No skills are selected yet. Go back to choose the skills you want
                to rate.
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setStep(5)}
                className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-3.5 text-sm font-semibold text-[var(--foreground)] shadow-[0_10px_24px_rgba(17,17,17,0.05)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[0_14px_28px_rgba(17,17,17,0.08)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => {
                  if (canContinueFromStepSix) {
                    setAssessmentQuestionIndex(0);
                    setStep(7);
                  }
                }}
                disabled={!canContinueFromStepSix}
                className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(255,90,40,0.28)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#e85224] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:bg-[var(--border-strong)] disabled:text-white/70 disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:bg-[var(--border-strong)]"
              >
                Continue
              </button>
            </div>
          </section>
        ) : step === 7 ? (
          <section className="flex flex-1 flex-col justify-center gap-8 py-10 lg:py-14">
            <div className="space-y-5">
              <p className="font-ui text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
                Role assessment
              </p>

              <h1 className="font-ui max-w-3xl text-[clamp(2.6rem,6.4vw,5.2rem)] font-bold tracking-[-0.07em] text-[var(--foreground)] leading-[0.94]">
                Let&apos;s see how you think.
              </h1>

              <p className="font-ui max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                A few questions tailored to your target role. There are no trick
                questions-we&apos;re learning where you are right now.
              </p>

              <div className="flex flex-wrap gap-2">
                {selectedGoal ? (
                  <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Goal: {selectedGoal.title}
                  </span>
                ) : null}

                {selectedRole ? (
                  <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Role: {selectedRole.title}
                  </span>
                ) : null}

                <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  {assessmentQuestionSet.roleLabel}
                </span>
              </div>
            </div>

            {currentAssessmentQuestion ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[0_12px_28px_rgba(17,17,17,0.05)]">
                  <div className="font-ui text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                    Question {assessmentQuestionIndex + 1} of {assessmentQuestions.length}
                  </div>

                  <div className="font-ui text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                    {answeredAssessmentCount} answered
                  </div>
                </div>

                <QuestionCard
                  question={currentAssessmentQuestion}
                  selectedOptionIndex={currentAssessmentAnswer ?? null}
                  onSelect={(optionIndex) =>
                    setAssessmentAnswers((current) => ({
                      ...current,
                      [currentAssessmentQuestion.id]: optionIndex,
                    }))
                  }
                />
              </div>
            ) : (
              <div className="rounded-[1.75rem] border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-8 text-sm leading-6 text-[var(--muted)] shadow-[0_12px_28px_rgba(17,17,17,0.04)]">
                No role assessment is available for this selection yet.
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  if (assessmentQuestionIndex === 0) {
                    setStep(6);
                    return;
                  }

                  setAssessmentQuestionIndex((current) => current - 1);
                }}
                className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-3.5 text-sm font-semibold text-[var(--foreground)] shadow-[0_10px_24px_rgba(17,17,17,0.05)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[0_14px_28px_rgba(17,17,17,0.08)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!canContinueFromStepSeven) {
                    return;
                  }

                  if (isFinalAssessmentQuestion) {
                    submitAssessment();
                    return;
                  }

                  setAssessmentQuestionIndex((current) => current + 1);
                }}
                disabled={!canContinueFromStepSeven}
                className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(255,90,40,0.28)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#e85224] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:bg-[var(--border-strong)] disabled:text-white/70 disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:bg-[var(--border-strong)]"
              >
                {isFinalAssessmentQuestion ? "Finish assessment" : "Continue"}
              </button>
            </div>
          </section>
        ) : (
          <section className="flex flex-1 flex-col gap-8 py-10 lg:py-14">
            <div className="space-y-5">
              <p className="font-ui text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
                Profile reveal
              </p>

              <h1 className="font-ui max-w-3xl text-[clamp(2.6rem,6.4vw,5.2rem)] font-bold tracking-[-0.07em] text-[var(--foreground)] leading-[0.94]">
                Your LITMUS profile is ready.
              </h1>

              <p className="font-ui max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                We have a starting picture of where you are. Now let&apos;s make
                it more accurate.
              </p>
            </div>

            <section className="rounded-[2rem] border border-[var(--border-strong)] bg-[var(--surface)] p-5 shadow-[0_18px_40px_rgba(17,17,17,0.08)] sm:p-6">
              <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-ui text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                    Profile header
                  </p>
                  <h2 className="font-ui mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
                    {selectedRole?.title ?? "Target role not set"}
                  </h2>
                </div>

                <div className="inline-flex w-fit items-center rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  {selectedGoal?.title ?? "Career goal not set"}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--background)] px-4 py-4">
                  <p className="font-ui text-xs uppercase tracking-[0.26em] text-[var(--muted)]">
                    Target role
                  </p>
                  <p className="font-ui mt-2 text-lg font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                    {selectedRole?.title ?? "Not selected"}
                  </p>
                </div>

                <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--background)] px-4 py-4">
                  <p className="font-ui text-xs uppercase tracking-[0.26em] text-[var(--muted)]">
                    Career goal
                  </p>
                  <p className="font-ui mt-2 text-lg font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                    {selectedGoal?.title ?? "Not selected"}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="space-y-2">
                <p className="font-ui text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
                  Section 1
                </p>
                <h2 className="font-ui text-3xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
                  What we know
                </h2>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_12px_28px_rgba(17,17,17,0.05)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-ui text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                        Interests
                      </p>
                      <h3 className="font-ui mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
                        {selectedInterestLabels.length > 0
                          ? `${selectedInterestLabels.length} selected`
                          : "No interests selected"}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedInterestLabels.length > 0 ? (
                      selectedInterestLabels.map((label) => (
                        <span
                          key={label}
                          className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]"
                        >
                          {label}
                        </span>
                      ))
                    ) : (
                      <p className="font-ui text-sm leading-6 text-[var(--muted)]">
                        We will use your interests to shape the rest of the
                        product.
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_12px_28px_rgba(17,17,17,0.05)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-ui text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                        Skills
                      </p>
                      <h3 className="font-ui mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
                        {selectedSkillLabels.length > 0
                          ? `${selectedSkillLabels.length} declared`
                          : "No skills declared"}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedSkillLabels.length > 0 ? (
                      selectedSkillLabels.map((label) => (
                        <span
                          key={label}
                          className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]"
                        >
                          {label}
                        </span>
                      ))
                    ) : (
                      <p className="font-ui text-sm leading-6 text-[var(--muted)]">
                        We will combine declared skills with evidence later.
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_12px_28px_rgba(17,17,17,0.05)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-ui text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                        Confidence
                      </p>
                      <h3 className="font-ui mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
                        Self-reported only
                      </h3>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {confidenceSummary.map((item) => (
                      <div key={item.id} className="space-y-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-ui text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                            {item.label}
                          </span>
                          <span className="font-ui text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                            {item.count}
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--background)]">
                          <div
                            className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                            style={{
                              width: `${(item.count / maxConfidenceCount) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_12px_28px_rgba(17,17,17,0.05)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-ui text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                        Assessment
                      </p>
                      <h3 className="font-ui mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
                        {assessmentQuestions.length > 0 &&
                        answeredAssessmentCount === assessmentQuestions.length
                          ? "Completed"
                          : "In progress"}
                      </h3>
                    </div>

                    <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      No score yet
                    </span>
                  </div>

                  <p className="font-ui mt-4 max-w-md text-sm leading-6 text-[var(--muted)]">
                    {assessmentQuestions.length > 0
                      ? `${answeredAssessmentCount} of ${assessmentQuestions.length} role questions are saved.`
                      : "We will save your role assessment answers here once they are added."}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="space-y-2">
                <p className="font-ui text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
                  Section 2
                </p>
                <h2 className="font-ui text-3xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
                  What we&apos;ll discover next
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    title: "Resume evidence",
                    description:
                      "We&apos;ll analyze what your resume actually demonstrates.",
                  },
                  {
                    title: "GitHub evidence",
                    description:
                      "We&apos;ll look at your projects and contributions.",
                  },
                  {
                    title: "Real job requirements",
                    description:
                      "We&apos;ll compare your profile against the roles you&apos;re targeting.",
                  },
                  {
                    title: "Skill gaps",
                    description:
                      "We&apos;ll identify what you should strengthen next.",
                  },
                ].map((item) => (
                  <article
                    key={item.title}
                    className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_12px_28px_rgba(17,17,17,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(17,17,17,0.08)]"
                  >
                    <p className="font-ui text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                      Evidence
                    </p>
                    <h3 className="font-ui mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
                      {item.title}
                    </h3>
                    <p className="font-ui mt-3 text-sm leading-6 text-[var(--muted)]">
                      {item.description}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-[var(--border-strong)] bg-[var(--surface)] p-6 shadow-[0_18px_40px_rgba(17,17,17,0.08)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                  <p className="font-ui text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
                    Section 3
                  </p>
                  <h2 className="font-ui text-3xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
                    Next step
                  </h2>
                  <p className="font-ui max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
                    This is the handoff from self-reported information to the
                    deeper product experience.
                  </p>
                </div>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(255,90,40,0.28)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#e85224] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
                >
                  Build my LITMUS profile
                </Link>
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setStep(7)}
                  className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)] px-6 py-3.5 text-sm font-semibold text-[var(--foreground)] shadow-[0_10px_24px_rgba(17,17,17,0.05)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[0_14px_28px_rgba(17,17,17,0.08)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
                >
                  Back to review
                </button>

                <p className="font-ui text-sm leading-6 text-[var(--muted)]">
                  Your assessment is complete. The next step is the product
                  experience.
                </p>
              </div>
            </section>
          </section>
        )}
      </div>
    </main>
  );
}
