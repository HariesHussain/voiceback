
Absolutely. Since you're using **Antigravity** and want Gemini 3.6 Flash High as the main coding model, `AGENTS.md` should act as the **permanent constitution of the VoiceBack repository**.

Put this file at:

```text
razorpay/
└── AGENTS.md
```

Then paste the following into it.

````md
# VoiceBack — AGENTS.md

## 1. PROJECT IDENTITY

Project name: VoiceBack

VoiceBack is an AI-assisted payment recovery and revenue recovery agent being built for the Razorpay AI Builder / Buildathon.

The project processes synthetic failed-payment orders, diagnoses the failure, recommends a recovery strategy, passes that recommendation through a deterministic policy/guardrail engine, executes only an approved action using Razorpay test-mode capabilities, records an audit trail, and evaluates the agent's performance.

The core principle is:

> AI recommends. Policy decides. The execution layer acts. The audit system records everything.

The most important product idea is:

> The agent knows when NOT to act.

This is a competition project, not a production payment processor. All customer/payment data used for the competition demo is synthetic or test-mode data.

Never represent simulated financial recovery as real money recovered.

---

# 2. CURRENT TECHNOLOGY

Use the technologies already established in this repository.

Current stack:

- Next.js
- TypeScript
- React
- Tailwind CSS
- Gemini API
- Razorpay Test APIs
- Supabase / PostgreSQL
- Vercel deployment
- Browser Web Speech API for voice simulation

IMPORTANT:

Do NOT assume an old Next.js version from an external guide.

Always inspect `package.json` and the actual installed dependencies before making version-specific decisions.

The repository currently uses the Next.js App Router.

---

# 3. ARCHITECTURE CONTRACT

The existing repository architecture is intentionally designed before feature implementation.

Treat the existing architecture as an architectural contract.

Current intended structure:

```text
razorpay/
│
├── app/
│   ├── api/
│   │   ├── run-agent/
│   │   │   └── route.ts
│   │   ├── orders/
│   │   │   └── route.ts
│   │   ├── create-link/
│   │   │   └── route.ts
│   │   ├── log-action/
│   │   │   └── route.ts
│   │   └── health/
│   │       └── route.ts
│   │
│   ├── audit/
│   │   └── [orderId]/
│   │       └── page.tsx
│   │
│   ├── results/
│   │   └── page.tsx
│   │
│   ├── error.tsx
│   ├── not-found.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│
├── lib/
│   ├── gemini.ts
│   ├── razorpay.ts
│   ├── supabase.ts
│   ├── policy-engine.ts
│   ├── synthetic-orders.ts
│   ├── voice.ts
│   ├── evaluation.ts
│   ├── rate-limit.ts
│   └── idempotency.ts
│
├── types/
│   └── index.ts
│
├── public/
│
├── .env.example
├── .env.local
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── package.json
├── package-lock.json
├── README.md
└── AGENTS.md
````

This is the intended architecture, but NOT every future file must exist immediately.

Create files only when their functionality is actually implemented.

---

# 4. FILE CREATION RULE

DO NOT create a new file merely because creating one feels cleaner.

Before creating a new file:

1. Inspect the repository.
2. Search for existing relevant functionality.
3. Determine whether the feature logically belongs in an existing file.
4. Determine whether a new file represents a genuine architectural boundary.
5. Prefer the smallest implementation.

If a new file is genuinely required, explain why before creating it.

If the user has explicitly prohibited new files for the current task, obey that restriction.

Do NOT create files for:

* five-line helpers
* tiny constants
* trivial wrappers
* duplicate utilities
* duplicate services
* duplicate API clients
* duplicate types
* duplicate validation
* duplicate business logic

A new file should exist because it has a meaningful responsibility, not because an AI coding pattern suggests one.

---

# 5. ANTI-AI-SLOP RULES

These rules apply to every coding task.

Before writing code, output:

```text
Repository assessment

Files inspected:
...

Existing functionality reused:
...

Files to modify:
...

Files to create:
...

Why each new file is necessary:
...

Potential duplication avoided:
...
```

Then implement.

Never silently create a large number of files.

If a task that should reasonably require one or two files starts turning into four or more new files:

STOP.

Explain why.

Do not continue creating abstractions automatically.

Avoid:

* unnecessary service layers
* unnecessary repositories
* unnecessary factories
* unnecessary adapters
* unnecessary managers
* unnecessary hooks
* unnecessary providers
* unnecessary contexts
* unnecessary utility folders
* unnecessary constants files
* unnecessary wrapper components
* unnecessary state-management libraries
* fake microservices
* premature abstraction

Prefer straightforward code.

---

# 6. DO NOT REWRITE WORKING CODE

Never rewrite working code merely to make it look different.

Before modifying a file:

* understand its current behavior
* preserve existing behavior
* make the smallest reasonable change

Do not refactor unrelated code during a feature task.

Do not "clean up" unrelated files.

Do not rename working files unless explicitly requested.

Do not reorganize the repository without explicit approval.

---

# 7. SOURCE OF TRUTH

For project decisions, use this priority:

1. Current repository implementation
2. Explicit user instruction
3. VoiceBack Master Build Guide
4. Current official API documentation
5. Reasonable engineering judgment

If the Master Build Guide contains outdated API/model information, do NOT blindly implement it.

Flag the outdated information and use the current official documentation.

Never invent an API endpoint, SDK method, model name, quota, webhook behavior, or Razorpay behavior.

---

# 8. AI ARCHITECTURE

The AI model is NOT the final decision-maker.

Correct architecture:

```text
Synthetic Order
      ↓
Gemini
      ↓
Diagnosis + Recommendation
      ↓
Schema Validation
      ↓
Policy / Guardrail Engine
      ↓
ALLOW / MODIFY / ESCALATE / STOP
      ↓
Execution Layer
      ↓
Razorpay Test API / Simulation
      ↓
Outcome
      ↓
Audit Trail
```

Gemini may:

* classify failure
* diagnose likely cause
* estimate recoverability
* recommend a strategy
* identify risk signals
* generate structured reasoning/evidence

Gemini must NOT:

* directly execute payment actions
* bypass the policy engine
* authorize itself
* decide that a payment definitely succeeded without evidence
* invent Razorpay results
* modify security rules
* modify database authorization
* execute arbitrary tools based solely on generated text

Treat all AI output as untrusted input.

Validate AI output against a strict schema.

Malformed AI output must never reach the payment execution layer.

---

# 9. GEMINI

Use the currently configured Gemini model from the project's environment/configuration.

Do not hard-code outdated models from old documentation.

The current development preference is a lightweight Flash model suitable for high-frequency experimentation.

Before changing Gemini integration:

* inspect the current SDK
* inspect package.json
* verify the current official Gemini API documentation
* preserve server-side secret handling

Gemini API calls belong in:

```text
lib/gemini.ts
```

Do not create:

```text
lib/gemini-client.ts
lib/gemini-service.ts
lib/ai-service.ts
lib/ai-helper.ts
```

unless there is an explicit architectural reason.

---

# 10. STRUCTURED AI OUTPUT

AI responses must use structured output whenever supported.

Expected conceptual shape:

```text
GeminiDiagnosis
├── failure_type
├── likely_cause
├── confidence
├── recommended_strategy
├── recoverability
├── risk_flags
└── evidence
```

The exact type must match the project's `/types/index.ts`.

Never trust arbitrary strings as executable instructions.

Validate:

* enum values
* numeric ranges
* required fields
* nullable fields
* string lengths
* confidence range

If validation fails:

```text
AI response
   ↓
validation failure
   ↓
NO payment action
   ↓
safe fallback
   ↓
audit event
```

---

# ARCHITECTURE LOCK — STRICT

The existing folder structure is LOCKED.

The agent MUST NOT create any new top-level folders or subfolders without explicit user approval.

The currently approved top-level directories are:

- /app
- /components
- /lib
- /types
- /public

Do NOT create folders such as:

- /scripts
- /utils
- /services
- /hooks
- /helpers
- /tests
- /config
- /data
- /providers
- /stores
- /workers

unless the user explicitly approves the new directory.

If verification, testing, or a feature appears to require a new folder:

1. STOP.
2. Explain why the folder is needed.
3. Identify whether the functionality can be implemented using the existing architecture.
4. Propose the exact path.
5. Wait for explicit approval.

Do not treat "better organization", "clean architecture", "best practice", or "testing" as automatic permission to create a new directory.

Existing architecture takes priority over the agent's preferred project structure.

## NO SILENT ARCHITECTURE EXPANSION

Creating a new file inside an approved directory requires justification.

Creating a NEW DIRECTORY requires explicit user approval.

Never silently expand the repository architecture.

# 11. POLICY ENGINE

The policy engine is deterministic code.

It must NOT depend on Gemini's reasoning to enforce safety.

Policy logic belongs in:

```text
lib/policy-engine.ts
```

The policy engine determines whether an AI recommendation is allowed.

Relevant checks include:

* maximum attempts
* hard decline
* fraud signal
* stolen card
* customer opt-out
* calling hours
* amount thresholds
* previous attempts
* repeated strategy failure
* recovery eligibility
* invalid AI recommendation

Possible policy outcomes:

```text
ALLOW
MODIFY
ESCALATE
STOP
```

The policy engine must be unit-testable without calling Gemini.

---

# 12. MANDATE FAILURE STRATEGY

Do not directly map:

```text
mandate_failed → voice
```

Correct conceptual sequence:

```text
mandate_failed
      ↓
retry eligibility
      ↓
mandate retry
      ↓
outcome
      ↓
still inconclusive?
      ↓
eligibility check
      ↓
voice recovery simulation
      ↓
failure
      ↓
human escalation
```

Maximum attempts and escalation behavior must be explicitly defined in code.

Never rely on vague prompt wording for this.

---

# 13. PAYMENT SAFETY

Payment-related actions are high-risk.

The system must defend against:

* double-clicks
* browser refresh
* duplicate API requests
* concurrent requests
* network retries
* timeout after successful execution
* duplicate payment-link creation
* duplicate recovery execution
* duplicate webhooks
* webhook retries
* replayed webhook events
* race conditions
* stale order state
* database failure after external execution

Never assume frontend button disabling is payment protection.

Payment safety must exist on the server.

---

# 14. IDEMPOTENCY

Rate limiting and idempotency are different.

Both are required.

Idempotency prevents the same logical action from being executed more than once.

Every payment/recovery action that can cause an external side effect should have a stable idempotency/action identity.

The design must account for concurrency.

Do NOT implement:

```text
check database
→ call Razorpay
→ insert database record
```

as though that sequence alone prevents duplicate external operations.

Think carefully about:

* concurrent requests
* state transitions
* unique constraints
* action ownership
* retries
* external API idempotency support
* reconciliation

If an external API has its own idempotency mechanism, use it correctly.

Never claim database uniqueness alone makes an external API call atomic.

---

# 15. RAZORPAY

Razorpay integration belongs in:

```text
lib/razorpay.ts
```

Do not expose Razorpay secret credentials to the browser.

Correct:

```text
Browser
   ↓
Next.js server route
   ↓
Razorpay server-side SDK/API
```

Incorrect:

```text
Browser
   ↓
Razorpay secret key
```

Use Razorpay Test Mode for the competition.

Clearly label simulated/test financial values in the UI.

Never claim:

```text
₹3,42,800 recovered
```

if it is only a simulation.

Instead use wording such as:

```text
₹3,42,800
Test-mode simulation value
```

---

# 16. WEBHOOK SECURITY

Never trust a frontend success message as authoritative payment confirmation.

Webhook processing must consider:

* signature verification
* raw request body requirements
* duplicate delivery
* replay
* event IDs
* idempotent processing
* state validation
* logging
* invalid signature rejection

Do not invent webhook behavior.

Verify current Razorpay documentation before implementing.

---

# 17. DATABASE

Supabase/PostgreSQL is the persistent data layer.

Keep database access centralized.

Do not create multiple Supabase clients.

Conceptual domain entities include:

* orders
* payment attempts
* AI diagnoses
* policy decisions
* recovery actions
* action outcomes
* audit events
* evaluation runs/results
* webhook/idempotency records where required

Database state is the source of truth for persistent application state.

Do not depend on in-memory variables for important payment state.

---

# 18. RATE LIMITING

Rate limiting must protect:

* AI endpoints
* recovery endpoints
* payment-related actions
* payment-link creation
* administrative endpoints
* authentication if introduced
* expensive operations

Do not add Redis automatically.

This project is deployed in a serverless environment.

If distributed rate limiting is required, choose an architecture appropriate to the actual deployment and justify it.

Never confuse:

```text
Rate limiting
```

with:

```text
Idempotency
```

Rate limiting controls request frequency.

Idempotency controls duplicate logical operations.

---

# 19. SECURITY

Implement defensive security.

Consider:

* secret management
* server/client boundaries
* input validation
* schema validation
* authorization
* least privilege
* SQL injection prevention
* XSS prevention
* CSRF considerations
* SSRF considerations
* open redirect prevention
* webhook verification
* replay protection
* rate limiting
* idempotency
* database security
* RLS where appropriate
* CORS
* security headers
* CSP
* secure cookies where applicable
* dependency auditing
* log redaction
* PII minimization
* safe error messages

Never expose secrets.

Never log API keys.

Never log unnecessary payment/customer information.

Security work must be defensive.

---

# 20. NEXT.JS SERVER/CLIENT BOUNDARIES

Prefer Server Components by default.

Use:

```tsx
'use client';
```

ONLY when browser-side functionality genuinely requires it.

Examples:

* React state
* event handlers
* browser APIs
* Web Speech API
* interactive dashboard components

Do not add `'use client'` to entire page trees unnecessarily.

Keep secrets and privileged APIs server-side.

---

# 21. VOICE

The competition voice feature is a browser simulation.

It MUST be clearly labelled:

```text
Voice Recovery Simulation — Browser Demo
```

Do not claim it is a real outbound phone call.

The production architecture may eventually use a voice provider, but the competition implementation is a browser simulation.

Do not introduce a real voice provider unless explicitly requested.

---

# 22. SYNTHETIC DATA

Synthetic orders belong in:

```text
lib/synthetic-orders.ts
```

There should be one authoritative synthetic dataset.

Do not create:

```text
mock-orders.ts
fake-orders.ts
test-orders.ts
sample-orders.ts
demo-orders.ts
```

unless explicitly required.

The dataset must be deterministic and reproducible.

Expected outcomes must be explicit so the evaluation system can measure agent performance.

---

# 23. EVALUATION

The agent must be evaluated against known expected outcomes.

Metrics should include, where applicable:

* strategy selection accuracy
* expected outcome match
* recovery rate
* guardrail violation count
* correct escalation rate
* incorrect retry count
* average attempts
* AI failure rate
* execution failure rate

Never fabricate metrics.

Never hard-code impressive metrics such as:

```text
90% accuracy
0 guardrail violations
71% recovery
```

unless the application actually computes those values from the evaluation dataset.

---

# 24. UI/UX PRINCIPLES

The UI must NOT look like generic AI-generated SaaS.

Avoid:

* purple AI gradients
* excessive glassmorphism
* glowing cards
* giant rounded containers
* random neon colors
* meaningless animations
* excessive shadows
* AI robot imagery
* excessive emojis
* generic dashboard templates

The visual language should feel naturally compatible with Razorpay's product ecosystem while remaining an original implementation.

Use current official Razorpay visual references when making design decisions.

Do not blindly copy proprietary assets.

The interface should feel:

```text
financial product
+
professional
+
dense but readable
+
trustworthy
+
technical
+
restrained
```

not:

```text
generic AI dashboard
```

---

# 25. UX STATES

Every important operation should have:

* loading state
* success state
* failure state
* empty state
* retry behavior
* safe disabled state where appropriate

Do not leave users wondering whether a payment action happened.

For payment/recovery operations, clearly communicate:

```text
requested
processing
completed
failed
escalated
```

Use status colors carefully.

Do not communicate critical payment state using color alone.

---

# 26. DECISION TRACE

Do NOT create fake "AI thinking" UI.

Use:

```text
Decision Trace
```

Show structured evidence such as:

```text
DIAGNOSIS
Failure type
Previous attempts
Amount
AI recommendation
Confidence

POLICY CHECK
Attempt limit
Calling hours
Hard decline
Opt-out
Eligibility

EXECUTION
Action
API result

OUTCOME
Recovered / failed / escalated
```

Never expose hidden chain-of-thought.

Only display structured decision evidence intentionally returned by the application.

---

# 27. ERROR HANDLING

Never swallow errors.

Never show raw secrets, stack traces, or internal credentials to users.

Errors should be:

* logged server-side
* assigned useful identifiers where appropriate
* safely presented to the user
* actionable where possible

Payment errors must never incorrectly result in:

```text
success
```

If an external API response is uncertain:

```text
unknown
→ reconcile
```

rather than:

```text
assume success
```

---

# 28. TESTING

Every implementation must include verification.

After a feature is implemented:

1. Run relevant automated tests.
2. Run TypeScript checks.
3. Run lint where configured.
4. Run a production build when appropriate.
5. Perform relevant manual testing.
6. Test failure cases, not only happy paths.

Never say "works" without verification.

For payment-related features, explicitly test:

* duplicate requests
* concurrent requests
* retry
* timeout
* stale state
* duplicate webhook
* invalid webhook
* invalid input
* policy block

---

# 29. GIT CHECKPOINTS

Keep the repository recoverable.

After each completed major stage:

```text
test
→ verify
→ git status
→ commit
```

Use meaningful commits.

Examples:

```text
chore: initialize VoiceBack architecture
feat: add synthetic order dataset
feat: add Gemini diagnosis
feat: add policy engine
feat: add payment idempotency
feat: add audit trail
feat: add evaluation dashboard
feat: polish Razorpay-inspired UI
fix: prevent duplicate recovery execution
```

Do not commit secrets.

---

# 30. DEPLOYMENT

Target deployment:

```text
Next.js application
        ↓
Vercel
```

Persistent database:

```text
Supabase PostgreSQL
```

External services:

```text
Gemini
Razorpay Test APIs
```

Do not introduce separate backend hosting unless there is a concrete requirement.

The Next.js server/API layer is the backend for this competition application.

---

# 31. SERVERLESS CONSTRAINTS

Remember that Vercel server-side execution is serverless.

Do NOT depend on:

* persistent process memory
* local in-memory queues
* local filesystem persistence
* long-running workers
* process-level locks

Persistent state belongs in the database or an appropriate external service.

Design retries and idempotency accordingly.

---

# 32. SCOPE CONTROL

This is a 7-day competition project.

Prioritize:

1. Correctness
2. Safety
3. Core agent behavior
4. Evaluation
5. UX
6. Visual polish
7. Deployment
8. Demo quality

Do NOT waste time building:

* microservices
* Kubernetes
* complex authentication
* unnecessary infrastructure
* unnecessary queues
* elaborate admin systems
* unnecessary analytics
* unrelated features

A smaller system that works correctly is better than a giant unfinished system.

---

# 33. WHEN THE USER ASKS FOR A FEATURE

Before coding:

```text
Repository assessment
```

Then:

```text
Plan
```

Then:

```text
Implementation
```

Then:

```text
Tests
```

Then:

```text
Result
```

Always tell the user exactly:

```text
Files modified:
...

Files created:
...

Dependencies changed:
...

Tests run:
...

Result:
...
```

Never hide architectural changes.

---

# 34. DO NOT IMPLEMENT FUTURE STAGES

The VoiceBack project is being built sequentially.

If the current task is:

```text
Synthetic Orders
```

do NOT also implement:

* Gemini
* Razorpay
* policy engine
* database
* dashboard
* voice
* security

unless explicitly requested.

Stay within the current stage.

---

# 35. STOP CONDITIONS

STOP and ask the user before proceeding if:

* a new architectural boundary is required
* a new dependency is required for a non-obvious reason
* a security-sensitive design is ambiguous
* payment semantics are unclear
* an external API behavior is unknown
* a database migration could destroy existing data
* an existing architecture must be changed
* a task conflicts with these rules
* a requested implementation could create duplicate payment execution

Do not guess in high-risk areas.

---

# 36. FINAL ENGINEERING PRINCIPLE

Do not optimize for:

```text
more files
more abstractions
more AI
more features
more animation
more infrastructure
```

Optimize for:

```text
clarity
correctness
safety
testability
small surface area
good UX
strong evidence
```

VoiceBack should look like something a thoughtful engineer designed and built intentionally.

The goal is not to make the codebase look complicated.

The goal is to make the system trustworthy.

---

# 37. CORE DEMO PRINCIPLE

The final product should demonstrate three paths:

## Order A — Simple Recovery

```text
soft payment failure
→ diagnosis
→ policy approval
→ retry
→ recovery
```

## Order B — Intelligent Escalation

```text
mandate failure
→ retry
→ inconclusive
→ policy re-evaluation
→ voice simulation
→ payment link
→ simulated recovery
```

## Order C — Safety

```text
hard decline / maximum attempts
→ policy blocks
→ human escalation
→ agent stops
```

The final demo should make clear:

> VoiceBack is not valuable merely because it can recover payments.

It is valuable because:

> VoiceBack knows when it should NOT act.

---

# 38. AGENT BEHAVIOR

When uncertain, prefer:

```text
inspect
→ explain
→ ask
→ implement safely
```

over:

```text
guess
→ create files
→ rewrite architecture
→ claim success
```

The repository is a real engineering project.

Treat existing code as valuable.

Treat payment operations as high-risk.

Treat AI output as untrusted.

Treat security as a requirement.

Treat the user's time as valuable.

````

### One thing I'd do after creating it

Your project becomes:

```text
razorpay/
├── AGENTS.md          ← permanent rules
├── app/
├── components/
├── lib/
├── types/
├── public/
├── package.json
└── ...
````


# Project Rules

- Automatically create a git commit after every change made to the codebase.
## MANDATORY VERIFICATION GATE

After EVERY code modification:

1. Run `npm run lint`.
2. Run `npm run build`.
3. Run relevant tests if a test script exists.
4. For API/payment/database changes, perform the relevant manual/API verification as well.
5. If any check fails, STOP reporting success and fix the failure.
6. Re-run all affected checks after fixing.
7. Never say "working", "complete", or "verified" unless the required checks actually passed.

Do not skip verification because a change appears small. Do not assume another file change cannot affect the build.

ANTI-SLOP ENGINEERING RULES — Follow these for every task in this session:

BEFORE writing any code:
1. List the files you are going to read/inspect
2. List the files you will modify (existing)
3. List any NEW files you need to create and justify why a new file is necessary
4. List what existing functionality you will reuse

Output this assessment before writing any code:
---
Repository assessment:
Files inspected: [list]
Existing functionality reused: [list]
Files to modify: [list]
Files to create: [list]
Why each new file is necessary: [reason per file]
Potential duplication avoided: [list]
---

RULES:
- Do NOT create a new file if the code logically belongs in an existing file
- Do NOT create a new file for fewer than 30 lines that belong in an existing module
- Do NOT create duplicate API clients (one Supabase client, one Gemini client, one Razorpay client — in lib/)
- Do NOT create duplicate type definitions — all types live in /types/index.ts
- Do NOT create helper files, utils files, or constants files unless genuinely justified
- Do NOT rewrite working code — modify the smallest possible surface area
- Do NOT create unnecessary abstractions, wrappers, hooks, or services
- Do NOT use 'use client' unless the component genuinely needs browser APIs or React state
- After implementing, report EXACTLY what files you created or modified and what changed in each

If I ask for one feature and you find yourself creating 4+ new files — STOP and ask me if that's really what I want.

## UI ARCHITECTURE LOCK

The UI architecture is intentionally minimal.

Approved component locations:

/components/
  MetricCards.tsx
  StoppingRulesPanel.tsx
  OrderTable.tsx
  AgentRunner.tsx
  VoiceCallModal.tsx
  AuditTimeline.tsx
  EvaluationTable.tsx

Do NOT create a `/components/ui/` directory.

Do NOT create separate Button, Badge, Card, Spinner, Icon, Status, Modal, Typography, or similar primitive files unless the user explicitly approves the architectural change.

Small UI primitives should remain inside the component that owns their usage until genuine reuse justifies extraction.

Do NOT create a new component file merely because a piece of JSX is visually reusable.

Prefer the smallest maintainable component structure.

If a new component/file appears necessary, stop and explain:
1. Why it cannot reasonably remain in an existing component.
2. Where it should live.
3. What existing components will reuse it.
4. Why the additional abstraction is justified.

Do not create new UI directories without explicit user approval.