export type AssessmentQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  skill: string;
};

export type AssessmentQuestionSet = {
  roleId: string;
  roleLabel: string;
  questions: AssessmentQuestion[];
};

function q(
  id: string,
  question: string,
  options: string[],
  correctAnswer: number,
  skill: string,
): AssessmentQuestion {
  return {
    id,
    question,
    options,
    correctAnswer,
    skill,
  };
}

function set(
  roleId: string,
  roleLabel: string,
  questions: AssessmentQuestion[],
): AssessmentQuestionSet {
  return {
    roleId,
    roleLabel,
    questions,
  };
}

export const assessmentQuestionSets: Record<string, AssessmentQuestionSet> = {
  "software-engineer": set("software-engineer", "Software Engineer", [
    q(
      "se-1",
      "You are adding a feature to an existing codebase. What do you usually do first?",
      [
        "Read the surrounding code and existing tests",
        "Rewrite the whole feature from scratch",
        "Start coding without looking around",
        "Wait until the architecture is perfect",
      ],
      0,
      "Codebase navigation",
    ),
    q(
      "se-2",
      "A bug only appears in production. What is the strongest next step?",
      [
        "Inspect logs, reproduce the issue, and narrow the cause",
        "Assume it will disappear on its own",
        "Delete the feature temporarily",
        "Ship a new feature instead",
      ],
      0,
      "Debugging",
    ),
    q(
      "se-3",
      "What usually makes an API easier to work with?",
      [
        "Clear request and response shapes",
        "Hidden field names that change often",
        "Different behavior for every endpoint",
        "No documentation at all",
      ],
      0,
      "APIs",
    ),
    q(
      "se-4",
      "When you are stuck on a technical problem, what helps most?",
      [
        "Break the problem into smaller steps",
        "Keep trying random changes",
        "Ignore the issue until later",
        "Start a new project",
      ],
      0,
      "Problem solving",
    ),
    q(
      "se-5",
      "What tends to make team collaboration smoother?",
      [
        "Small, reviewable changes with clear context",
        "Large unreviewed changes",
        "No communication until release day",
        "Avoiding code review comments",
      ],
      0,
      "Collaboration",
    ),
  ]),
  "frontend-developer": set("frontend-developer", "Frontend Developer", [
    q(
      "fe-1",
      "A page feels cramped on mobile. What is the best first thing to check?",
      [
        "Layout spacing, breakpoints, and container width",
        "Server logs only",
        "Database indexes",
        "The deployment pipeline",
      ],
      0,
      "Responsive layout",
    ),
    q(
      "fe-2",
      "When building an interactive component in React, what matters most?",
      [
        "State flow and how the UI responds to changes",
        "Hiding the markup entirely",
        "Avoiding all user interaction",
        "Only styling the component name",
      ],
      0,
      "React state",
    ),
    q(
      "fe-3",
      "What makes an interface easier for more people to use?",
      [
        "Good contrast, labels, and keyboard support",
        "Tiny text and hidden controls",
        "Relying on color alone",
        "Removing all focus styles",
      ],
      0,
      "Accessibility",
    ),
    q(
      "fe-4",
      "A button click feels delayed because of a data fetch. What is a useful approach?",
      [
        "Show feedback immediately and handle loading states",
        "Remove the button",
        "Make the page reload on every click",
        "Ignore the delay",
      ],
      0,
      "UX feedback",
    ),
    q(
      "fe-5",
      "What is the cleanest way to structure a reusable UI piece?",
      [
        "Keep the component focused on one job",
        "Put unrelated logic everywhere",
        "Duplicate the same markup across pages",
        "Mix every concern into one file",
      ],
      0,
      "Component design",
    ),
  ]),
  "backend-developer": set("backend-developer", "Backend Developer", [
    q(
      "be-1",
      "A REST endpoint needs to return a created resource. What is a typical choice?",
      [
        "Return a 201 response with the new resource",
        "Return a 500 response",
        "Return nothing and no status code",
        "Always redirect to the homepage",
      ],
      0,
      "APIs",
    ),
    q(
      "be-2",
      "What helps most when protecting a database update from partial writes?",
      [
        "A transaction",
        "A color change in the UI",
        "A bigger font size",
        "Logging only",
      ],
      0,
      "Databases",
    ),
    q(
      "be-3",
      "Why do backend teams often validate inputs carefully?",
      [
        "To protect data and keep behavior predictable",
        "To slow the request down",
        "To avoid writing tests",
        "To hide errors from logs",
      ],
      0,
      "Validation",
    ),
    q(
      "be-4",
      "What is a useful first step when debugging a failing service?",
      [
        "Inspect logs and isolate the failing path",
        "Deploy the service again immediately",
        "Assume the network is always the issue",
        "Remove error handling",
      ],
      0,
      "Debugging",
    ),
    q(
      "be-5",
      "Why are auth boundaries important in backend systems?",
      [
        "They control access to data and actions",
        "They make endpoints slower on purpose",
        "They replace all testing",
        "They remove the need for permissions",
      ],
      0,
      "Authentication",
    ),
  ]),
  "fullstack-developer": set("fullstack-developer", "Full Stack Developer", [
    q(
      "fs-1",
      "What is the strongest way to think about a new feature?",
      [
        "How the UI, API, and data flow fit together",
        "Only the button color",
        "Only the database schema",
        "Only the deployment name",
      ],
      0,
      "System thinking",
    ),
    q(
      "fs-2",
      "When a form submits data to a server, what is most important?",
      [
        "Matching the client payload to what the API expects",
        "Making the button bigger",
        "Removing validation",
        "Reloading the page twice",
      ],
      0,
      "Client-server flow",
    ),
    q(
      "fs-3",
      "If a feature is slow, what is a practical place to look?",
      [
        "Both the frontend experience and backend response time",
        "Only the footer text",
        "Only the logo size",
        "Only the branch name",
      ],
      0,
      "Performance",
    ),
    q(
      "fs-4",
      "What helps when shipping a small app end to end?",
      [
        "Keeping data models, UI, and API changes coordinated",
        "Changing one layer without checking the rest",
        "Ignoring edge cases",
        "Avoiding reviews",
      ],
      0,
      "Coordination",
    ),
    q(
      "fs-5",
      "Why is it useful to understand both frontend and backend concerns?",
      [
        "It helps you make better tradeoffs across the stack",
        "It removes the need to test",
        "It prevents deployment",
        "It makes design unnecessary",
      ],
      0,
      "Tradeoffs",
    ),
  ]),
  "data-analyst": set("data-analyst", "Data Analyst", [
    q(
      "da-1",
      "What is usually the first step when a dashboard looks off?",
      [
        "Check the data source and the query behind it",
        "Change the chart color",
        "Delete the filters",
        "Ignore the numbers",
      ],
      0,
      "Data quality",
    ),
    q(
      "da-2",
      "A team asks for a quick insight from a table. What is the most common tool?",
      [
        "SQL",
        "Photoshop",
        "Docker",
        "Figma only",
      ],
      0,
      "SQL",
    ),
    q(
      "da-3",
      "Why do analysts clean data before sharing results?",
      [
        "To reduce errors and make the insight trustworthy",
        "To make the file bigger",
        "To hide edge cases",
        "To avoid presenting findings",
      ],
      0,
      "Data cleaning",
    ),
    q(
      "da-4",
      "What is a good habit when presenting a chart?",
      [
        "Call out what changed and why it matters",
        "Only read the axis labels",
        "Skip the context entirely",
        "Use the busiest chart possible",
      ],
      0,
      "Data storytelling",
    ),
    q(
      "da-5",
      "When testing a product change, what is helpful to compare?",
      [
        "Before and after metrics or groups",
        "Only the title of the report",
        "The number of tabs open",
        "The font family in the dashboard",
      ],
      0,
      "Analysis",
    ),
  ]),
  "data-scientist": set("data-scientist", "Data Scientist", [
    q(
      "ds-1",
      "Why do model evaluation splits matter?",
      [
        "They help estimate how well a model generalizes",
        "They make the dataset look prettier",
        "They replace feature engineering",
        "They remove the need for labels",
      ],
      0,
      "Evaluation",
    ),
    q(
      "ds-2",
      "What is a common problem if training data leaks into test data?",
      [
        "The model can look better than it really is",
        "The model always becomes slower",
        "The dataset disappears",
        "The loss function stops working",
      ],
      0,
      "Data leakage",
    ),
    q(
      "ds-3",
      "What is often useful before training a model?",
      [
        "Looking at distributions and missing values",
        "Skipping the data entirely",
        "Deleting the target column forever",
        "Using only one row",
      ],
      0,
      "Exploration",
    ),
    q(
      "ds-4",
      "How do you usually tell whether a model improvement is real?",
      [
        "Check metrics on held-out data or in an experiment",
        "Ask the model to guess again",
        "Only compare training accuracy",
        "Ignore the baseline",
      ],
      0,
      "Experimentation",
    ),
    q(
      "ds-5",
      "Why is feature selection sometimes important?",
      [
        "It can reduce noise and improve usefulness",
        "It always increases file size",
        "It removes the need for labels",
        "It guarantees perfect accuracy",
      ],
      0,
      "Features",
    ),
  ]),
  "ai-ml-engineer": set("ai-ml-engineer", "AI / ML Engineer", [
    q(
      "aml-1",
      "When deploying a model to users, what often matters most?",
      [
        "Latency, reliability, and monitoring",
        "Only the training notebook name",
        "Deleting the model files",
        "Ignoring production behavior",
      ],
      0,
      "Deployment",
    ),
    q(
      "aml-2",
      "Why do model teams track drift?",
      [
        "To notice when data or behavior changes over time",
        "To rename columns",
        "To make training slower",
        "To avoid serving predictions",
      ],
      0,
      "Monitoring",
    ),
    q(
      "aml-3",
      "What is a useful way to compare two model candidates?",
      [
        "Evaluate them on the same data and metric",
        "Choose the larger file size",
        "Pick the newest filename",
        "Ignore the baseline",
      ],
      0,
      "Evaluation",
    ),
    q(
      "aml-4",
      "What usually makes an AI feature more dependable?",
      [
        "Clear fallbacks and guardrails",
        "No logging or metrics",
        "Hidden prompts only",
        "No user feedback path",
      ],
      0,
      "Reliability",
    ),
    q(
      "aml-5",
      "What is a helpful next step after a model prediction seems weak?",
      [
        "Inspect the data, prompt, or features behind it",
        "Assume all models are broken",
        "Stop measuring outcomes",
        "Delete the endpoint",
      ],
      0,
      "Iteration",
    ),
  ]),
  "cloud-devops-engineer": set("cloud-devops-engineer", "Cloud / DevOps Engineer", [
    q(
      "cd-1",
      "What is a practical reason to use containers?",
      [
        "To package an app with its runtime consistently",
        "To hide source code forever",
        "To replace monitoring",
        "To avoid deployment",
      ],
      0,
      "Containers",
    ),
    q(
      "cd-2",
      "What is the purpose of a CI/CD pipeline?",
      [
        "To automate testing and deployment steps",
        "To make all code manual",
        "To remove version control",
        "To slow releases down",
      ],
      0,
      "CI/CD",
    ),
    q(
      "cd-3",
      "When production traffic increases, what is a useful concern?",
      [
        "Scaling and reliability",
        "Changing the brand color",
        "Editing README files only",
        "Removing logs",
      ],
      0,
      "Scaling",
    ),
    q(
      "cd-4",
      "Why do teams use infrastructure as code?",
      [
        "To make environments repeatable and reviewable",
        "To avoid configuration",
        "To skip automation",
        "To stop collaboration",
      ],
      0,
      "Infrastructure",
    ),
    q(
      "cd-5",
      "What is a useful action after an incident?",
      [
        "Review the cause and improve alerts or runbooks",
        "Delete all logs",
        "Ignore the root cause",
        "Ship without monitoring",
      ],
      0,
      "Incident response",
    ),
  ]),
  "cybersecurity-analyst": set("cybersecurity-analyst", "Cybersecurity Analyst", [
    q(
      "cy-1",
      "A message asks you to reset your password urgently. What is the safest response?",
      [
        "Verify the request through a trusted channel",
        "Click immediately",
        "Send your old password back",
        "Ignore all account warnings",
      ],
      0,
      "Phishing",
    ),
    q(
      "cy-2",
      "Why is multi-factor authentication useful?",
      [
        "It adds another layer beyond a password",
        "It removes the need for accounts",
        "It makes passwords invisible",
        "It blocks all threats forever",
      ],
      0,
      "Authentication",
    ),
    q(
      "cy-3",
      "What does least privilege mean?",
      [
        "Give people only the access they need",
        "Give everyone admin access",
        "Hide every permission",
        "Skip all role checks",
      ],
      0,
      "Access control",
    ),
    q(
      "cy-4",
      "Why do security teams monitor logs?",
      [
        "To spot unusual behavior and investigate quickly",
        "To make files larger",
        "To replace user training",
        "To avoid patching systems",
      ],
      0,
      "Monitoring",
    ),
    q(
      "cy-5",
      "What is a sensible first step when you find a vulnerable system?",
      [
        "Prioritize patching or mitigation",
        "Announce it publicly without action",
        "Ignore it until next quarter",
        "Remove monitoring",
      ],
      0,
      "Response",
    ),
  ]),
  "ui-ux-designer": set("ui-ux-designer", "UI/UX Designer", [
    q(
      "ux-1",
      "What is a strong first step before redesigning a feature?",
      [
        "Understand the user problem and context",
        "Pick colors immediately",
        "Skip research completely",
        "Start with animations only",
      ],
      0,
      "Research",
    ),
    q(
      "ux-2",
      "Why does information hierarchy matter?",
      [
        "It helps people know what to notice first",
        "It makes every element equal",
        "It removes the need for labels",
        "It always uses more colors",
      ],
      0,
      "Hierarchy",
    ),
    q(
      "ux-3",
      "What is a common reason to test a prototype with users?",
      [
        "To catch usability issues early",
        "To replace all product decisions",
        "To avoid shipping anything",
        "To prove the first draft is perfect",
      ],
      0,
      "Usability testing",
    ),
    q(
      "ux-4",
      "What often improves accessibility?",
      [
        "Clear labels, contrast, and keyboard support",
        "Color-only meaning",
        "Tiny touch targets",
        "Hidden focus states",
      ],
      0,
      "Accessibility",
    ),
    q(
      "ux-5",
      "When collaborating with developers, what helps most?",
      [
        "Clear specs and fast feedback loops",
        "Changing requirements daily without context",
        "Sending only screenshots with no notes",
        "Avoiding questions",
      ],
      0,
      "Collaboration",
    ),
  ]),
  "product-manager": set("product-manager", "Product Manager", [
    q(
      "pm-1",
      "When prioritizing work, what is usually most important?",
      [
        "User impact and business value",
        "The loudest opinion only",
        "The longest title",
        "Whichever task is newest",
      ],
      0,
      "Prioritization",
    ),
    q(
      "pm-2",
      "Why do product teams define metrics early?",
      [
        "To know whether the work is moving the outcome",
        "To remove the need for users",
        "To avoid shipping",
        "To make every project the same",
      ],
      0,
      "Metrics",
    ),
    q(
      "pm-3",
      "What is a good way to think about a roadmap?",
      [
        "A plan that balances goals, constraints, and timing",
        "A fixed list that can never change",
        "A design-only document",
        "A substitute for customer feedback",
      ],
      0,
      "Roadmaps",
    ),
    q(
      "pm-4",
      "What helps when different stakeholders disagree?",
      [
        "Return to the user problem and evidence",
        "Choose the loudest person",
        "Ignore the disagreement",
        "Delete the timeline",
      ],
      0,
      "Stakeholders",
    ),
    q(
      "pm-5",
      "What is useful when shaping a feature?",
      [
        "Clear tradeoffs and scope boundaries",
        "As many extras as possible",
        "No acceptance criteria",
        "No customer input",
      ],
      0,
      "Scope",
    ),
  ]),
  "not-sure-yet": set("not-sure-yet", "Still deciding", [
    q(
      "ns-1",
      "When you learn something new, what tends to help most?",
      [
        "Trying a small hands-on example",
        "Reading every article first",
        "Waiting until you feel expert",
        "Avoiding practice entirely",
      ],
      0,
      "Learning style",
    ),
    q(
      "ns-2",
      "Which kind of work sounds most motivating right now?",
      [
        "Solving problems and building useful things",
        "Only writing long reports",
        "Doing no collaboration at all",
        "Repeating the same task forever",
      ],
      0,
      "Motivation",
    ),
    q(
      "ns-3",
      "If you get stuck, what is a good next move?",
      [
        "Break the problem into a smaller step",
        "Ignore the problem",
        "Assume you cannot learn it",
        "Quit immediately",
      ],
      0,
      "Problem solving",
    ),
    q(
      "ns-4",
      "What kind of feedback do you usually find useful?",
      [
        "Specific feedback with examples",
        "Vague praise only",
        "No feedback at all",
        "Confusing hints",
      ],
      0,
      "Feedback",
    ),
    q(
      "ns-5",
      "What would help you most right now?",
      [
        "A clearer sense of strengths and next steps",
        "More confusion",
        "Less practice",
        "Fewer options forever",
      ],
      0,
      "Direction",
    ),
  ]),
};

export function getAssessmentQuestionSet(roleId?: string | null) {
  if (!roleId) {
    return assessmentQuestionSets["not-sure-yet"];
  }

  return assessmentQuestionSets[roleId] ?? assessmentQuestionSets["not-sure-yet"];
}
