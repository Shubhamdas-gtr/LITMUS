# LITMUS Design System

> LITMUS — unsure about your value, give yourself a LITMUS test.

This document is the visual and interaction source of truth for the LITMUS frontend.

The goal is to create a distinctive career-intelligence product that feels:
- intelligent
- futuristic
- mysterious
- confident
- premium
- purposeful

The interface should feel like an intelligence instrument, not a generic SaaS dashboard.

---

# 1. Reference Images

Two visual references define the direction.

## Primary Brand Reference

File:

`./design/litmus-brand-reference.png`

This is the canonical reference for:

- LITMUS logo
- LITMUS symbol
- wordmark
- tagline treatment
- purple → acid-lime relationship
- typography personality
- logo proportions
- glow treatment
- brand identity

The logo shown in this reference is the canonical LITMUS brand mark.

Reuse the logo consistently throughout the application.

Do not redesign or reinterpret the logo unless explicitly requested.

---

## Atmosphere Reference

File:

`./design/designhint.png`

This is the atmosphere reference.

Use it to establish:

- deep-space feeling
- black negative space
- purple planetary atmosphere
- nebula-like depth
- subtle environmental glow
- spatial layering
- mysterious futuristic mood

Do NOT copy the composition, artwork, layout, or exact imagery.

Extract the visual principles only.

---

# 2. Core Visual Formula

The LITMUS visual identity is:

BLACK SPACE
+
PURPLE ATMOSPHERE
+
WHITE TYPOGRAPHY
+
ACID-LIME INTELLIGENCE SIGNALS
+
THIN TECHNICAL UI LINES

This formula should remain recognizable across:

- landing page
- assessment
- processing transition
- dashboard
- roadmap
- skill-gap analysis
- profile
- navigation
- buttons
- inputs
- progress indicators
- future pages

---

# 3. Visual Personality

LITMUS should feel:

### Intelligent
Data-driven, analytical, deliberate.

### Futuristic
Modern and forward-looking without becoming cyberpunk.

### Mysterious
Dark space, depth, restrained glow, atmospheric backgrounds.

### Confident
Strong typography, clean hierarchy, intentional spacing.

### Premium
Minimal clutter, controlled visual effects, precise alignment.

### Purposeful
Every visual element should communicate something.

---

# 4. What LITMUS Is NOT

Avoid these design directions:

- generic dark SaaS
- generic AI dashboard
- cyberpunk
- gamer UI
- excessive neon
- neon-everything
- excessive glassmorphism
- rainbow gradients
- excessive purple cards
- excessive lime elements
- giant glowing buttons
- excessive rounded cards
- excessive shadows
- component-library/demo aesthetics
- unnecessary decorative elements
- excessive animation
- visual clutter

Do not make the interface "neon" simply because the brand contains purple and lime.

The majority of the screen should remain dark and restrained.

---

# 5. Color System

## Core Colors

Space Black:
`#080B0F`

Deep Violet:
`#5B2BC6`

Indigo:
`#2A184D`

Acid Lime:
`#C6FF00`

Off White:
`#F5F5F7`

Muted Gray:
`#8A8EA3`

Lavender:
`#B879CF`

---

## Semantic Colors

Success:
`#C6FF00`

Warning:
`#FFB800`

Danger:
`#FF4D4F`

Info / Secondary:
`#B879CF`

---

# 6. Color Usage Rules

### Black

Black is the dominant visual field.

Use it for:

- page backgrounds
- navigation
- large empty areas
- primary surfaces

### Purple

Purple establishes atmosphere and depth.

Use it for:

- background glow
- secondary borders
- secondary interaction states
- subtle highlights
- atmospheric gradients
- selected/focused states when appropriate

Purple should NOT dominate every component.

### Acid Lime

Lime is the intelligence signal.

Use it selectively for:

- completed states
- primary actions
- important progress
- positive signals
- active indicators
- key data points
- intelligence/status indicators

Lime should feel valuable because it is used sparingly.

### White

White/off-white carries most important typography.

Use it for:

- headings
- primary content
- important labels
- active navigation
- major data

### Muted Gray

Use muted gray for:

- descriptions
- secondary information
- metadata
- helper text
- inactive states

---

# 7. Typography

Local fonts are already available in the project.

Use:

### Display

TBJ Gobank Demo

CSS class:

`.font-display`

Use for:

- major page headings
- dashboard hero
- major intelligence statements
- LITMUS Intelligence title
- large numbers where appropriate

### UI / Body

GC Gatuzo Demo

CSS class:

`.font-ui`

Use for:

- body text
- navigation
- buttons
- labels
- metadata
- forms
- controls
- descriptions

### Optional Decorative Font

Gulams Condensed Demo

Use sparingly for:

- tiny technical labels
- decorative metadata
- system-like labels
- special brand moments

Never sacrifice readability for decorative typography.

---

# 8. Typography Rules

Prefer:

- strong hierarchy
- large display headings
- compact technical labels
- generous whitespace
- short readable line lengths

Avoid:

- excessive font sizes everywhere
- overly tight paragraphs
- decorative fonts for body text
- excessive uppercase text
- excessive letter spacing

Large typography should feel editorial and intentional.

---

# 9. Background / Atmosphere

The background is a major part of the LITMUS identity.

Use:

- deep black base
- subtle purple radial gradients
- soft atmospheric glow
- distant planetary/nebula-inspired forms
- layered depth
- restrained grain/noise if performant

The atmosphere should feel spatial rather than like a simple CSS gradient.

Important:

The background must never compete with readable content.

Content always wins over atmosphere.

---

# 10. Background Motion

Background motion should be extremely subtle.

Acceptable:

- slow orbital movement
- extremely slow nebula movement
- subtle glow breathing
- slow particle drift

Avoid:

- fast particles
- constant movement
- distracting parallax
- aggressive animations

The environment should feel alive, not animated.

---

# 11. UI Surfaces

Do not make every section a card.

Prefer a mixture of:

- open sections
- technical panels
- thin bordered surfaces
- timeline structures
- data blocks
- cards only where grouping is useful

Cards should have purpose.

Avoid stacking large rounded cards inside other large rounded cards.

---

# 12. Borders

Borders should be thin and technical.

Preferred:

- 1px borders
- low-opacity white borders
- subtle purple borders
- occasional lime border for active/completed states

Borders should define structure without becoming visually heavy.

---

# 13. Glow

Glow is a supporting effect, not the primary design language.

Use glow around:

- active indicators
- important progress
- completed states
- primary CTA
- intelligence core
- selected elements

Avoid:

- glowing every border
- glowing every button
- glowing all text
- permanent large neon shadows

A glow should indicate importance.

---

# 14. Buttons

Buttons should feel technical and intentional.

Primary button:

- dark or black base OR acid-lime depending on context
- white or black text depending on contrast
- thin border
- subtle interaction glow
- clear directional affordance where useful

Secondary:

- transparent/dark surface
- thin border
- white text

Ghost:

- minimal border or no border
- muted text
- subtle hover treatment

Do not use giant pill-shaped CTA buttons by default.

---

# 15. Inputs

Inputs should feel like part of an intelligence console.

Use:

- dark surfaces
- thin borders
- clear labels
- strong focus states
- subtle purple/lime focus glow
- readable placeholder text

Focus must always be visible.

Never rely only on color to communicate focus.

---

# 16. Progress Indicators

Progress should feel technical.

Prefer:

- thin connecting lines
- luminous nodes
- numbered steps
- active node
- completed node
- subtle animation

Avoid generic thick progress bars unless the context genuinely requires one.

---

# 17. Assessment

The assessment is not a generic form.

It should feel like:

> LITMUS is learning how you think.

Preserve the existing:

- 8-step flow
- state logic
- API calls
- payload structures
- backend behavior
- validation
- navigation

Change presentation only unless explicitly instructed otherwise.

Assessment UI should use:

- dark environment
- technical progress indicator
- clear question hierarchy
- tactile selection states
- restrained purple glow
- acid-lime confirmation
- strong typography
- intentional spacing

Selected options should feel clearly active.

---

# 18. Assessment → Intelligence Transition

This is a signature LITMUS interaction.

After assessment completion:

1. Assessment answers disappear/fade.
2. Screen transitions into deep black space.
3. A small luminous intelligence core forms.
4. Purple and lime energy begins to orbit the core.
5. Small information points/orbits appear.
6. The system visually suggests:
   - profile analysis
   - skill mapping
   - gap identification
   - roadmap construction
7. The core becomes brighter.
8. Display:

`LITMUS INTELLIGENCE`

9. Transition into the dashboard.

Suggested system messages:

`ANALYZING PROFILE`

`MAPPING SKILLS`

`IDENTIFYING GAPS`

`BUILDING ROADMAP`

Then:

`LITMUS INTELLIGENCE`

The transition should be short.

It should feel premium and purposeful rather than like a loading screen.

---

# 19. 3D Transition

The intelligence transition is the signature visual moment of LITMUS.

Preferred visual language:

- central luminous core
- orbital rings
- depth
- particles/data points
- purple atmospheric light
- acid-lime intelligence signals
- subtle 3D movement

Start lightweight.

Prefer:

- CSS
- transforms
- canvas
- lightweight WebGL only if justified

Do not introduce a large 3D dependency without a clear reason.

Performance and accessibility remain important.

---

# 20. Dashboard

The dashboard should feel like:

> A Career Intelligence Console.

It should NOT feel like a normal analytics dashboard.

Recommended hierarchy:

1. LITMUS brand/navigation
2. Career trajectory / profile intelligence
3. Skill intelligence
4. Skill-gap analysis
5. Career roadmap
6. Evidence / mastery
7. Supporting information

Use open space and technical structure.

Do not put the entire dashboard inside one giant card.

---

# 21. Skill Gap

Skill gap should feel like an intelligence report.

Categories:

### MISSING

Most urgent.

Use:

- danger red
- subtle red background
- strong technical marker

### WEAK

Needs development.

Use:

- amber
- subtle amber treatment

### STRENGTHS

Positive existing capability.

Use:

- acid lime
- calm visual treatment

The hierarchy should communicate urgency without overwhelming the user.

---

# 22. Career Roadmap

The roadmap should feel like a progression path.

Prefer:

- vertical timeline
- numbered progression nodes
- thin connecting lines
- active/completed markers
- priority indicators
- expandable detail

Each roadmap item should communicate:

- skill
- priority
- reason
- learning topics
- project
- evidence of mastery
- completion

Preserve existing roadmap behavior exactly.

---

# 23. Roadmap Completion

Completion is an intelligence/progression signal.

Completed roadmap items should:

- visibly change state
- use acid lime sparingly
- show a clear completion indicator
- remain readable
- feel satisfying without becoming gamified clutter

Do not turn the roadmap into a generic todo list.

Existing optimistic completion behavior must remain intact.

---

# 24. Navigation

Navigation should be compact and premium.

Use:

- LITMUS logo mark
- wordmark where space allows
- minimal navigation items
- clear active state
- subtle technical divider/border

The logo should remain recognizable at small sizes.

---

# 25. Logo Usage

The canonical LITMUS mark is the logo shown in:

`./design/litmus-brand-reference.png`

Use the logo consistently.

The logo can appear as:

- icon/mark
- wordmark
- wordmark + tagline

Do not:

- redraw the symbol
- change its proportions
- distort it
- introduce unrelated colors
- add excessive glow

Glow may be used subtly against dark backgrounds.

---

# 26. Tagline

Canonical tagline:

> unsure about your value, give yourself a LITMUS test

Preserve this wording.

The tagline may appear:

- landing page
- brand moments
- authentication
- onboarding
- assessment introduction

It should not be repeated unnecessarily throughout the dashboard.

---

# 27. Animation

Normal UI interactions:

150–300ms.

Use animation for:

- hover
- selection
- expansion
- completion
- focus
- page transitions

Use slower motion for:

- atmosphere
- background
- orbital elements
- intelligence-core transition

Avoid animation for animation's sake.

---

# 28. Responsive Design

Design mobile-first.

Do not simply shrink desktop layouts.

On mobile:

- stack information intentionally
- preserve hierarchy
- keep controls touch-friendly
- avoid horizontal scrolling
- preserve readable typography
- simplify decorative elements when necessary

Atmospheric effects may be reduced on smaller devices for performance.

---

# 29. Accessibility

Accessibility is part of the design.

Always maintain:

- visible focus states
- sufficient text contrast
- keyboard navigation
- semantic HTML
- accessible buttons
- accessible form controls
- meaningful labels
- reduced-motion support where appropriate

Never communicate important state using color alone.

---

# 30. Technical Boundaries

When redesigning the frontend, preserve existing functionality.

Do NOT modify unless explicitly requested:

- backend APIs
- backend services
- Supabase schema
- API payload structures
- authentication
- fetch URLs
- state logic
- data models
- existing routes
- roadmap persistence
- assessment persistence
- skill-gap functionality

Presentation and interaction may change.

Application behavior must remain intact.

---

# 31. Existing Frontend Stack

The project uses:

- Next.js 16
- React 19
- Tailwind CSS v4
- CSS-first configuration
- Supabase authentication
- FastAPI backend
- OpenRouter AI
- local fonts

Do not introduce unnecessary dependencies.

Prefer existing project patterns.

---

# 32. Design Decision Rule

When deciding between two visual solutions, choose the one that is:

1. more restrained
2. more intentional
3. more readable
4. more technically elegant
5. more consistent with the LITMUS visual formula

Do not add an effect simply because it looks impressive.

Every visual effect should have a purpose.

---

# 33. Final Design Test

Before considering a page complete, ask:

Does this feel like LITMUS?

Does it feel like an intelligence instrument?

Is black space still dominant?

Is purple creating atmosphere rather than overwhelming the interface?

Is lime being used as an intelligence signal rather than decoration?

Is typography strong and readable?

Are technical lines and borders subtle?

Is the interface premium without being flashy?

Does it feel related to the primary brand reference?

Does it feel atmospherically related to the atmosphere reference?

Does it avoid looking like a generic SaaS dashboard?

If the answer to any of these is no, refine the design before considering it complete.