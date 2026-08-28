[README.md](https://github.com/user-attachments/files/31564488/README.md)
# LITMUS

> **Career Intelligence for College Students**

LITMUS is a full-stack career intelligence platform designed to help college students understand where they currently stand, identify skill gaps, build evidence through projects and practice, present themselves professionally, and move toward opportunities that fit their current stage.

The project combines a guided career assessment, resume/profile intelligence, GitHub evidence collection, activity tracking, and conservative lead generation into one career workflow.

---

## Table of Contents

- [What is LITMUS?](#what-is-litmus)
- [Why I Built It](#why-i-built-it)
- [Core Product Flow](#core-product-flow)
- [Current Features](#current-features)
- [Screenshots](#screenshots)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Authentication](#authentication)
- [GitHub Integration](#github-integration)
- [GitHub Evidence Pipeline](#github-evidence-pipeline)
- [Change Detection and Lead Generation](#change-detection-and-lead-generation)
- [Database Design](#database-design)
- [API Surface](#api-surface)
- [AI Layer](#ai-layer)
- [Data Flow](#data-flow)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Database Migrations](#database-migrations)
- [Project Structure](#project-structure)
- [Important Engineering Decisions](#important-engineering-decisions)
- [Error Handling and Debugging](#error-handling-and-debugging)
- [Security Considerations](#security-considerations)
- [Current Scope and Limitations](#current-scope-and-limitations)
- [What I Learned](#what-i-learned)
- [Future Roadmap](#future-roadmap)
- [Resume Description](#resume-description)
- [Interview Talking Points](#interview-talking-points)
- [License](#license)

---

## What is LITMUS?

LITMUS is built around a simple idea:

**Students often have skills and work, but they do not always know how to measure, prove, and present them.**

Instead of treating a resume as the entire career profile, LITMUS tries to build an evidence-driven picture of the student.

The product is organized around four broad stages:

1. **Understand** — establish a baseline using a guided assessment.
2. **Build** — turn gaps into projects, practice, and measurable evidence.
3. **Demonstrate** — improve the resume, stories, portfolio, and professional presentation.
4. **Get Opportunities** — identify relevant opportunities and convert useful activity into reviewable actions.

The current implementation is an MVP focused on the first, second, and evidence/automation-oriented parts of that journey.

---

## Why I Built It

The project was created as a practical full-stack system rather than as a collection of isolated demo pages.

The main engineering goal was to connect:

- a modern frontend,
- a Python API,
- authentication,
- a relational database,
- an external API,
- an AI service,
- persistent evidence,
- event/change detection,
- and a user-facing dashboard.

That makes LITMUS useful as both a product prototype and a portfolio/interview project because the interesting part is not just the UI — it is the **end-to-end data flow** behind the UI.

---

# Core Product Flow

```text
                 ┌─────────────────────┐
                 │      LITMUS         │
                 │ Career Intelligence │
                 └──────────┬──────────┘
                            │
                ┌───────────▼───────────┐
                │   Guided Assessment   │
                │ skills / goals / base │
                └───────────┬───────────┘
                            │
                ┌───────────▼───────────┐
                │   Evidence Layer      │
                │ resume + GitHub data  │
                └───────────┬───────────┘
                            │
             ┌──────────────┼──────────────┐
             │              │              │
       ┌─────▼─────┐  ┌─────▼─────┐  ┌────▼─────┐
       │ AI/Resume │  │  GitHub    │  │ Database │
       │ Analysis  │  │  Activity  │  │ Supabase │
       └─────┬─────┘  └─────┬─────┘  └────┬─────┘
             │              │              │
             └──────────────┼──────────────┘
                            │
                   ┌────────▼────────┐
                   │ Intelligence /  │
                   │ Change Detection│
                   └────────┬────────┘
                            │
                   ┌────────▼────────┐
                   │ Generated Leads │
                   │ review / edit / │
                   │ approve / delete│
                   └─────────────────┘
```

---

# Current Features

## 1. Guided Career Assessment

The assessment provides a structured starting point rather than immediately asking the student to upload everything.

The UI uses an eight-step guided flow.

The first step establishes the student's current target:

- internship
- full-time
- both

The assessment is designed to collect information that can later be used to personalize the career workflow.

### Why this matters technically

The assessment is not only a UI wizard. It is a stateful multi-step flow where:

- the current step is tracked,
- the selected option is retained,
- navigation is controlled,
- the final state can be persisted,
- and the resulting profile can become input to later intelligence features.

---

## 2. Resume / Profile Intelligence

LITMUS includes a resume-oriented part of the career workflow.

The broader architecture is designed so that AI analysis can transform unstructured career information into structured insights.

The important distinction is:

```text
Raw career information
        ↓
AI analysis
        ↓
Structured representation
        ↓
Dashboard / recommendations
```

This allows the application to reason about the student's profile instead of treating the resume as a static document.

---

## 3. GitHub Connection

A student can connect GitHub through the authentication/provider flow.

The current architecture uses the GitHub OAuth provider through Supabase.

The important security property is that the application does **not** require the user to manually paste a GitHub Personal Access Token into the UI.

The provider token is obtained as part of the OAuth flow and passed to the backend when GitHub synchronization is requested.

High-level flow:

```text
Browser
  ↓
Supabase GitHub OAuth
  ↓
OAuth callback
  ↓
Supabase session
  ↓
provider_token
  ↓
FastAPI GitHub sync endpoint
  ↓
GitHub REST API
```

---

## 4. GitHub Intelligence

After connecting GitHub, LITMUS can collect evidence such as:

- GitHub username
- repository count
- owned/fork information
- repository names
- repository languages
- language byte distribution
- recent commit activity
- pull requests
- issues
- active days
- repository activity snapshots

The dashboard then presents this information as career evidence rather than as raw GitHub API responses.

Example:

```text
GitHub API
     ↓
Raw repositories / commits
     ↓
Evidence collection service
     ↓
Normalized activity snapshot
     ↓
Supabase
     ↓
FastAPI read endpoint
     ↓
Next.js dashboard
```

---

# Screenshots

## LITMUS Landing / Career Journey

The main product experience introduces the career journey around the four stages: Understand, Build, Demonstrate, and Get Opportunities.

![LITMUS career journey](docs/screenshots/assessment-home.png)

---

## Guided Assessment

The assessment begins with a clear question about the student's target and moves through the guided flow.

![LITMUS guided assessment](docs/screenshots/assessment-step.png)

---

## GitHub Intelligence Dashboard

The GitHub intelligence section turns repository and activity data into visible evidence.

![LITMUS GitHub intelligence](docs/screenshots/github-intelligence.png)

---

# System Architecture

LITMUS follows a separated frontend/backend architecture.

```text
┌───────────────────────────────────────────────┐
│                  Browser                      │
│                                               │
│             Next.js / React / TS              │
└──────────────────────┬────────────────────────┘
                       │ HTTP
                       │ JSON
                       ▼
┌───────────────────────────────────────────────┐
│                 FastAPI                       │
│                                               │
│  authentication-aware API endpoints           │
│  profile endpoints                             │
│  GitHub synchronization                        │
│  evidence persistence                          │
│  lead generation                               │
│  AI service integration                        │
└──────────────┬───────────────┬────────────────┘
               │               │
               │               │
               ▼               ▼
      ┌────────────────┐   ┌────────────────┐
      │    Supabase    │   │    GitHub API  │
      │                │   │                │
      │ PostgreSQL     │   │ repos/commits  │
      │ Auth           │   │ user activity  │
      │ RLS            │   │                │
      └────────────────┘   └────────────────┘
               │
               ▼
      ┌────────────────┐
      │ Stored Career  │
      │ Evidence       │
      └────────────────┘
```

---

# Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js | Application framework and routing |
| UI | React | Component-based interface |
| Language | TypeScript | Static typing on frontend |
| Styling | CSS / Tailwind-oriented styling | Visual system and responsive UI |
| Backend | FastAPI | Python REST API |
| Backend language | Python | API/business logic |
| Database | PostgreSQL via Supabase | Persistent application data |
| Authentication | Supabase Auth | User authentication and GitHub OAuth |
| External API | GitHub REST API | Repository and activity evidence |
| AI | AI service abstraction | Resume/profile intelligence |
| Migrations | Supabase SQL migrations | Versioned database schema |
| Dev server | Uvicorn | Running FastAPI locally |

---

# Frontend Architecture

The frontend is a Next.js application.

Important areas include:

```text
frontend/
└── src/
    ├── app/
    │   ├── assessment/
    │   ├── auth/
    │   ├── dashboard/
    │   ├── transition/
    │   ├── api/
    │   │   └── auth/
    │   │       └── callback/
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    │
    └── lib/
        ├── api.ts
        ├── database.types.ts
        └── supabase.ts
```

### `app/`

Next.js App Router pages and route handlers.

### `lib/supabase.ts`

Creates/exports the Supabase client used by the frontend.

### `lib/api.ts`

Centralizes communication with the FastAPI backend.

This separation avoids scattering raw `fetch()` calls throughout the UI.

### `database.types.ts`

Contains TypeScript representations of database structures used by the frontend.

This reduces accidental mismatches between database fields and frontend code.

---

# Backend Architecture

The backend is a FastAPI application.

Relevant structure:

```text
backend/
├── main.py
├── services/
│   ├── ai_service.py
│   ├── github_service.py
│   └── lead_service.py
└── .venv/
```

## `main.py`

Acts as the API entry point.

It contains the HTTP-facing endpoints and coordinates:

- authenticated requests,
- profile operations,
- GitHub synchronization,
- database persistence,
- evidence retrieval,
- lead generation.

## `services/github_service.py`

Contains GitHub-specific logic.

This keeps external API concerns out of the frontend and reduces the amount of GitHub-specific code inside the main API file.

## `services/ai_service.py`

Contains AI-related service logic.

The goal is to isolate model interaction from the rest of the application so that the AI provider/model can be changed without redesigning the entire product.

## `services/lead_service.py`

Contains lead-generation related logic.

This allows the product to keep opportunity-generation rules separate from the GitHub collection layer.

---

# Authentication

LITMUS uses Supabase Auth.

The GitHub connection flow is based on the Supabase identity/provider mechanism.

Conceptually:

```text
User clicks "Connect GitHub"
             ↓
Supabase GitHub OAuth
             ↓
GitHub authorization
             ↓
/api/auth/callback
             ↓
exchangeCodeForSession()
             ↓
authenticated Supabase session
             ↓
provider_token available for GitHub API access
```

The application does not store a manually supplied GitHub PAT.

The GitHub provider token is used by the backend to authenticate GitHub API calls during synchronization.

### Why use OAuth?

OAuth is preferable for this product because:

- the user does not need to create a PAT manually,
- authorization is delegated to GitHub,
- access is connected to the user's identity,
- the application can request provider access through the authentication flow,
- the token is not exposed as a permanent configuration value in the frontend code.

---

# GitHub Integration

LITMUS communicates with GitHub through the REST API.

The synchronization service obtains the authenticated GitHub user and then collects repository/activity evidence.

The implementation currently focuses on public repositories.

## Commit Counting

Recent commits are counted using the GitHub commits endpoint.

The current implementation:

- uses a 30-day UTC window,
- paginates the commit endpoint,
- avoids relying only on the request-side `author=username` filter,
- checks returned commit attribution data,
- persists the resulting recent activity count.

The important reason for the attribution check is that GitHub commit authorship can be represented through different identity information, including email attribution.

### Important scope note

The current product intentionally retains public-repository behavior. Private repository coverage and broader branch coverage can be added later if the product's authorization model requires it.

---

# GitHub Evidence Pipeline

The synchronization pipeline can be represented as:

```text
1. User connects GitHub
        ↓
2. OAuth provider token is obtained
        ↓
3. Frontend sends provider_token to backend
        ↓
4. Backend calls GitHub
        ↓
5. GitHub user is identified
        ↓
6. Repositories are collected
        ↓
7. Repository metadata is analyzed
        ↓
8. Recent commits are collected
        ↓
9. Activity metrics are calculated
        ↓
10. Dates are normalized to ISO strings
        ↓
11. Snapshot is stored in Supabase
        ↓
12. Dashboard reads persisted evidence
```

A key design decision is that the dashboard reads the **stored evidence**, rather than repeatedly rebuilding the entire GitHub analysis during every page load.

This provides a cached evidence model:

```text
GitHub
  ↓
Sync
  ↓
Database snapshot
  ↓
Dashboard
```

rather than:

```text
Every dashboard request
  ↓
GitHub API
  ↓
Recalculate everything
```

---

# Change Detection and Lead Generation

LITMUS has a separate concept for detecting meaningful repository changes.

This is important because:

**recent activity ≠ a lead-generation event**

For example:

```text
Commit count
    ↓
describes activity

Repository push detection
    ↓
describes a potentially meaningful change

Lead generation
    ↓
decides whether that change is useful enough
    to turn into a reviewable opportunity
```

## D1 — Repository Push Detection

The D1 migration introduced the persistence needed for repository activity/change detection.

The service compares repository activity snapshots and can create a `repo_pushed` event when a meaningful repository push is detected.

The event layer is intentionally separate from the raw GitHub activity metrics.

---

## D2 — Lead Generation

The D2 migration introduced lead-related persistence.

The lead-generation flow uses stored `repo_pushed` events as an eligibility signal.

Conceptually:

```text
GitHub sync
     ↓
repository snapshot
     ↓
change detection
     ↓
repo_pushed event
     ↓
lead generation
     ↓
draft lead
     ↓
review
     ↓
approve / edit / delete
```

The product is intentionally conservative.

It does not automatically publish LinkedIn content.

Instead, it produces a draft that the student can review.

This is important because automated professional communication can have reputational consequences.

---

# Database Design

Supabase provides the PostgreSQL database and authentication layer.

The project uses SQL migrations so schema changes are versioned.

Relevant migrations include:

```text
supabase/migrations/
├── 20260827010000_phase_c_github_evidence.sql
├── 20260828010000_phase_d1_change_detection.sql
└── 20260828020000_phase_d2_leads.sql
```

## Phase C — GitHub Evidence

Stores the normalized GitHub evidence/activity snapshot.

One important field is:

```text
commits_count
```

which represents the persisted recent commit count.

The backend maps:

```text
commits_30d
      ↓
github_activity.commits_count
      ↓
GET /api/profile/github
      ↓
recent_activity.commits_30d
      ↓
dashboard
```

---

## Phase D1 — Change Detection

Stores information needed to detect repository changes.

This creates a separation between:

- raw GitHub activity,
- detected events.

That separation makes the system easier to extend later.

---

## Phase D2 — Leads

Stores generated opportunity/lead information.

The lead can move through a review-oriented lifecycle instead of being immediately published.

---

# API Surface

The backend exposes API routes under `/api`.

Important routes in the current implementation include:

| Endpoint | Purpose |
|---|---|
| `GET /api/profile/leads` | Retrieve generated leads |
| `GET /api/profile/github` | Retrieve stored GitHub evidence |
| `POST /api/profile/github/sync` | Synchronize GitHub evidence |
| `POST /api/profile/leads/generate` | Generate leads from eligible events |

The exact request/response structures should be treated as defined by the implementation in `backend/main.py`.

---

# AI Layer

AI is isolated behind an application service rather than being called directly from every frontend component.

The conceptual architecture is:

```text
Frontend
   ↓
FastAPI
   ↓
AI service
   ↓
LLM provider
   ↓
Structured result
   ↓
FastAPI
   ↓
Frontend / database
```

This abstraction is valuable because model providers can change.

For example, the application can keep its business logic stable while changing:

```text
Model A
   ↓
Model B
```

inside the AI service.

---

# Data Flow

## Assessment

```text
User
 ↓
Next.js assessment UI
 ↓
assessment state
 ↓
profile/career data
 ↓
backend/database
```

## GitHub Sync

```text
User
 ↓
GitHub OAuth
 ↓
Supabase session
 ↓
provider_token
 ↓
FastAPI
 ↓
GitHub REST API
 ↓
github_service
 ↓
normalized evidence
 ↓
Supabase
 ↓
dashboard
```

## Lead Generation

```text
GitHub sync
 ↓
repository snapshots
 ↓
change detection
 ↓
repo_pushed event
 ↓
lead_service
 ↓
lead record
 ↓
dashboard
 ↓
manual review
```

---

# Environment Variables

The exact variable names should match the `.env` files/configuration used by the project.

Typical configuration categories include:

### Frontend

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_BASE_URL=
```

### Backend

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

### AI

```env
# Provider-specific AI configuration
AI_API_KEY=
```

Do **not** commit real secrets to Git.

Use:

```text
.env
.env.local
```

and keep secret configuration outside source control.

The service-role key is especially sensitive because it has elevated database privileges.

---

# Local Development

## 1. Clone the repository

```bash
git clone <your-repository-url>
cd LITMUS
```

---

## 2. Install frontend dependencies

```bash
cd frontend
npm install
```

Start the Next.js application:

```bash
npm run dev
```

---

## 3. Set up the backend

From the backend directory:

```bash
cd backend
```

Create/activate the Python virtual environment if required.

On Windows:

```powershell
python -m venv .venv
.venv\Scripts\activate
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

Run FastAPI with Uvicorn:

```bash
uvicorn main:app --reload --port 8000
```

---

# Database Migrations

Database changes are stored as SQL migration files.

When a migration has not been applied, the backend can fail even if the application code is correct.

For example, the backend once returned:

```text
Could not find the table 'public.leads' in the schema cache
```

The root cause was that the D2 migration had not yet been applied.

The fix was to apply the migration in the Supabase SQL editor.

### Lesson

When an API returns a database table/schema error:

1. check the endpoint traceback,
2. identify the missing table/column,
3. check the corresponding migration,
4. verify the migration is applied,
5. retry the endpoint.

Do not immediately assume the frontend is broken.

---

# Important Engineering Decisions

## 1. Keep GitHub logic in a service

Instead of putting GitHub API calls everywhere:

```text
main.py
  ↓
github_service.py
```

This gives the application a clear boundary for external API integration.

---

## 2. Persist evidence

GitHub data is synchronized into the database.

This means the application can:

- display the last successful snapshot,
- compare changes,
- avoid unnecessary API calls,
- generate events from historical state,
- build intelligence on top of stored evidence.

---

## 3. Separate activity from events

A commit count is a metric.

A repository push event is an event.

A lead is a product-level interpretation of an event.

Keeping these separate prevents unrelated concepts from becoming tightly coupled.

---

## 4. Use a sync cooldown

GitHub synchronization is not treated as an unlimited operation.

A cooldown reduces:

- unnecessary API requests,
- accidental repeated synchronization,
- external API pressure,
- redundant database writes.

---

## 5. Normalize dates

External APIs and Python can represent dates differently.

Supabase expects JSON-compatible values when sending request payloads.

During development, Python `date` objects caused:

```text
Object of type date is not JSON serializable
```

The activity snapshot dates were converted to ISO-8601 strings before persistence.

This produces a safe representation such as:

```text
2026-08-28
```

or an ISO datetime representation when appropriate.

---

## 6. Use pagination for GitHub collections

External APIs commonly paginate large collections.

The GitHub integration uses the existing pagination helper for commit collection rather than assuming that the first API response contains every result.

This prevents the application from silently undercounting larger histories.

---

## 7. Review before publishing

Lead generation produces a reviewable draft.

The system does not automatically publish professional communication.

This is a product and engineering decision because AI-generated professional content should remain under user control.

---

# Error Handling and Debugging

One of the most useful parts of building LITMUS was debugging the complete request path.

For example, a frontend message:

```text
Failed to fetch
```

was not itself the root cause.

Browser DevTools showed:

```text
GET /api/profile/leads
500 Internal Server Error
```

The FastAPI traceback then revealed:

```text
Could not find the table 'public.leads' in the schema cache
```

This demonstrates an important debugging method:

```text
UI error
  ↓
Network request
  ↓
HTTP status
  ↓
Backend traceback
  ↓
Database/API error
  ↓
Root cause
```

Another issue occurred during GitHub synchronization:

```text
Object of type date is not JSON serializable
```

The investigation traced it to the payload sent to Supabase rather than to GitHub itself.

The dates were then converted to ISO strings before persistence.

---

# Security Considerations

## OAuth instead of manually supplied GitHub PAT

The user does not need to paste a GitHub Personal Access Token into the application.

The GitHub provider token is obtained through the OAuth flow.

---

## Do not expose service-role credentials

The Supabase service-role key belongs on the backend only.

It should never be placed in:

```text
NEXT_PUBLIC_*
```

variables or shipped to the browser.

---

## Do not log provider tokens

The provider token should be treated as a secret.

The application architecture passes it to the backend for the synchronization operation rather than storing it as normal profile data.

---

## Database access

Supabase/PostgreSQL is responsible for persistent storage and can use Row Level Security policies to restrict user-specific data.

When modifying the schema, database policies should be considered alongside table creation.

---

# Current Scope and Limitations

LITMUS is currently an MVP.

The following distinctions are important:

### GitHub

Current GitHub evidence collection focuses on public repositories.

Potential future expansion:

- private repositories with appropriate scopes,
- broader branch coverage,
- richer contribution analysis,
- pull request quality,
- issue participation,
- commit quality signals.

### LinkedIn

The system currently drafts/recommends professional content for review.

It does **not** automatically publish LinkedIn posts.

### Lead generation

Lead generation currently depends on detected repository activity/events.

It is intentionally conservative rather than trying to infer every possible career opportunity.

### AI

AI outputs should be treated as assistance rather than unquestionable truth.

The application should preserve user review for important professional decisions.

---

# Project Structure

A simplified repository structure:

```text
LITMUS/
│
├── backend/
│   ├── main.py
│   └── services/
│       ├── ai_service.py
│       ├── github_service.py
│       └── lead_service.py
│
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   └── src/
│       ├── app/
│       │   ├── api/
│       │   │   └── auth/
│       │   │       └── callback/
│       │   ├── assessment/
│       │   ├── auth/
│       │   ├── dashboard/
│       │   ├── transition/
│       │   ├── globals.css
│       │   ├── layout.tsx
│       │   └── page.tsx
│       │
│       └── lib/
│           ├── api.ts
│           ├── database.types.ts
│           └── supabase.ts
│
├── supabase/
│   └── migrations/
│       ├── 20260827010000_phase_c_github_evidence.sql
│       ├── 20260828010000_phase_d1_change_detection.sql
│       └── 20260828020000_phase_d2_leads.sql
│
├── design/
│   ├── designhint.png
│   └── litmus image.png
│
├── design.md
├── validate_migration.py
└── README.md
```

---

# Development Workflow

A practical development loop used for LITMUS:

```text
Design
  ↓
Implement frontend
  ↓
Connect API
  ↓
Implement backend service
  ↓
Create migration
  ↓
Apply migration
  ↓
Run application
  ↓
Test in browser
  ↓
Inspect Network tab
  ↓
Inspect FastAPI traceback
  ↓
Fix root cause
  ↓
Validate
  ↓
Commit
```

Useful validation commands include:

```bash
git diff --check
```

and Python syntax checks such as:

```bash
python -m py_compile backend/main.py
python -m py_compile backend/services/github_service.py
```

---

# What I Learned

Building LITMUS involved learning how the individual pieces of a modern application fit together.

### Frontend

- Next.js App Router
- React state
- TypeScript
- API calls
- authentication-aware UI
- multi-step flows
- dashboard rendering

### Backend

- FastAPI
- REST endpoints
- request models
- service-layer separation
- external API integration
- exception tracing
- JSON serialization

### Database

- PostgreSQL concepts
- Supabase
- migrations
- schema evolution
- persisted snapshots
- database/API contracts

### Authentication

- OAuth
- provider authentication
- Supabase sessions
- authorization callbacks
- provider tokens

### External APIs

- GitHub REST API
- authentication headers
- pagination
- date filtering
- author attribution
- rate/request considerations

### AI

- service abstraction
- structured AI outputs
- separating model logic from business logic
- treating AI as an assistant rather than an authority

### Debugging

The project also reinforced a key engineering habit:

> **Follow the request from the browser to the database instead of guessing from the UI.**

---

# Future Roadmap

Possible next phases include:

## Product

- unified single-page authenticated experience
- richer career recommendations
- job-role matching
- opportunity tracking
- application tracking
- personalized learning plans

## GitHub

- private repository support
- branch-aware activity
- deeper pull-request analysis
- contribution quality scoring
- project health signals

## AI

- stronger structured profile extraction
- role-specific resume feedback
- interview preparation
- personalized project recommendations
- evidence-to-story generation

## Automation

- scheduled GitHub synchronization
- meaningful-change alerts
- opportunity monitoring
- recurring career progress summaries

## Professional presence

- stronger LinkedIn post drafting
- profile optimization
- outreach drafting
- recruiter communication assistance

---

# Resume Description

### One-line version

**LITMUS — Career Intelligence Platform:** Built a full-stack career intelligence platform using Next.js, TypeScript, FastAPI, Supabase/PostgreSQL, OAuth, GitHub REST APIs, and AI services to assess student readiness, collect GitHub evidence, detect meaningful repository activity, and generate reviewable career leads.

### Stronger project bullet

- Built **LITMUS**, an end-to-end career intelligence platform with a Next.js/TypeScript frontend and FastAPI backend, integrating **Supabase Auth/PostgreSQL, GitHub OAuth/REST APIs, AI services, database migrations, activity snapshots, change detection, and lead generation**.
- Implemented a GitHub evidence pipeline that authenticates through OAuth, collects repositories and recent activity, handles paginated commit data, normalizes external API data, persists snapshots, and exposes the results through backend APIs.
- Designed a conservative event-to-lead workflow that separates raw GitHub activity from detected repository events and produces reviewable opportunity drafts instead of automatically publishing professional content.

---

# Interview Talking Points

If discussing LITMUS in an interview, the strongest technical story is the complete request lifecycle:

```text
Next.js UI
   ↓
Supabase authentication
   ↓
OAuth provider token
   ↓
FastAPI endpoint
   ↓
GitHub REST API
   ↓
github_service
   ↓
normalized evidence
   ↓
PostgreSQL/Supabase
   ↓
FastAPI read endpoint
   ↓
Next.js dashboard
```

Be prepared to explain:

- Why Next.js instead of a plain React setup?
- Why FastAPI?
- Why PostgreSQL/Supabase?
- How does OAuth work?
- Where does the GitHub token come from?
- Why should the provider token not be stored casually?
- How does pagination work?
- Why is commit counting separate from repository-push detection?
- Why persist GitHub evidence?
- Why use migrations?
- How did you debug the `public.leads` schema-cache error?
- Why did the `date is not JSON serializable` error occur?
- Why are dates converted to ISO strings?
- How does the frontend communicate with FastAPI?
- How does the AI service remain replaceable?
- How would you support private repositories?
- How would you handle GitHub API rate limits?
- How would you secure user-specific database records?
- Why does lead generation require review?
- How would you scale synchronization for many users?

These questions are useful because they demonstrate understanding of the architecture rather than only the visual result.

---

# License

This project is currently a portfolio/interview project.

Add the license you intend to use before distributing the repository publicly.

---

## Project Status

**Current status: Working MVP**
<img width="1882" height="1022" alt="Screenshot 2026-08-28 232036" src="https://github.com/user-attachments/assets/6a78ce3e-891d-4186-b86f-70e48d4504b5" />

The implemented system currently includes:

- guided assessment experience,
- authentication,
- GitHub connection,
- GitHub evidence synchronization,
- persisted activity data,
- repository change detection,
- lead generation,
- AI service integration,
- Supabase database migrations,
- dashboard presentation.

The next major product improvement is to bring the currently separated experiences into a more unified authenticated application flow.


