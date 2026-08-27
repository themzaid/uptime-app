# Uptime Monitor — Sprint Backlog

How to use this in Linear: create one **Cycle** per sprint below. Each `###` heading is one Linear **Issue** — copy the title as the issue title, the rest as the description. Suggested **Labels** and **Estimate** (Linear's point scale) are noted per issue.

---

## Sprint 1 (Weeks 1–2): Foundations
**Sprint Goal:** A clickable skeleton app with no real functionality yet, but the full environment running.

### [x] Scaffold Next.js + TypeScript + Tailwind project
- **Labels:** infra
- **Estimate:** 2
- Set up the repo, base folder structure, linting/formatting config.
- **Acceptance criteria:**
  - `npm run dev` runs a working Next.js app locally
  - ESLint + Prettier configured and passing

### [x] Set up Clerk authentication
- **Labels:** infra, auth
- **Estimate:** 3
- Sign up, log in, log out, protected routes.
- **Acceptance criteria:**
  - New user can sign up and land on a dashboard
  - Logged-out users are redirected away from protected pages

### [x] Provision Neon Postgres + Drizzle schema
- **Labels:** infra, database
- **Estimate:** 3
- Tables: `monitors`, `checks`, `incidents`.
- **Acceptance criteria:**
  - Schema migrated via Drizzle
  - Tables visible in Neon console with correct relations

### [x] Build CRUD UI for monitors
- **Labels:** feature
- **Estimate:** 5
- Add/edit/delete a URL to watch (no actual checking yet — just data entry).
- **Acceptance criteria:**
  - User can add a monitor with a name + URL + check interval
  - List view shows all of a user's monitors

### [x] Create docker-compose.yml for local dev
- **Labels:** infra, docker
- **Estimate:** 2
- Postgres + Redis running locally via one command.
- **Acceptance criteria:**
  - `docker-compose up` starts Postgres + Redis
  - App connects to both without manual config changes

### [x] Write local setup README
- **Labels:** docs
- **Estimate:** 1
- **Acceptance criteria:**
  - A new clone + `docker-compose up` + `npm install` + `npm run dev` gets someone running in under 10 minutes

---

## Sprint 2 (Weeks 3–4): Check Engine + Docker
**Sprint Goal:** The app actually checks whether a site is up, on a schedule.

### [x] Build standalone Node worker for HTTP checks
- **Labels:** feature, worker
- **Estimate:** 5
- Separate service (not a Vercel function) that performs the actual ping.
- **Acceptance criteria:**
  - Worker can hit a URL and record status code + latency

### [x] Set up Redis + BullMQ scheduling
- **Labels:** infra, worker
- **Estimate:** 5
- Repeatable job per monitor, respecting its configured interval.
- **Acceptance criteria:**
  - Each monitor gets checked automatically at its set interval without manual triggering

### [x] Implement incident detection rule
- **Labels:** feature, worker
- **Estimate:** 3
- e.g. 3 consecutive failures = incident opened; 1 success = resolved.
- **Acceptance criteria:**
  - Killing a test endpoint creates an incident record after the threshold
  - Restoring it resolves the incident

### Dockerize the worker service
- **Labels:** infra, docker
- **Estimate:** 3
- **Acceptance criteria:**
  - Worker runs as its own container with a Dockerfile
  - Builds successfully with `docker build`

### Add worker to docker-compose, verify end-to-end locally
- **Labels:** infra, docker
- **Estimate:** 2
- **Acceptance criteria:**
  - `docker-compose up` brings up app + worker + Postgres + Redis together
  - A monitor added in the UI gets checked by the containerized worker

---

## Sprint 3 (Weeks 5–6): Dashboard + Alerts
**Sprint Goal:** A human can see the data and get notified when something breaks.

### Build live status dashboard
- **Labels:** feature, frontend
- **Estimate:** 5
- Per-monitor current status (up/down/degraded).

### Uptime % + latency chart
- **Labels:** feature, frontend
- **Estimate:** 5
- Recharts-based visualization of historical check data.

### Email alerts via Resend
- **Labels:** feature, alerts
- **Estimate:** 3
- Fires on incident open and resolve.

### Webhook alerts (Slack/Discord)
- **Labels:** feature, alerts
- **Estimate:** 3

### Alert deduplication/throttling
- **Labels:** feature, alerts
- **Estimate:** 3
- Prevents one flapping monitor from spamming notifications.

### Public read-only status page
- **Labels:** feature, frontend
- **Estimate:** 5
- This becomes your demo link — no login required to view.

---

## Sprint 4 (Weeks 7–8): Test Automation
**Sprint Goal:** The app proves itself automatically, without manual clicking.

### Vitest unit tests — check logic and incident rules
- **Labels:** test
- **Estimate:** 3

### API/integration tests for CRUD + alert-trigger endpoints
- **Labels:** test
- **Estimate:** 3

### Playwright framework setup (fixtures, page objects, config)
- **Labels:** test, framework
- **Estimate:** 5
- This is the "framework ownership" ticket — structure, not just scripts.

### E2E: login → create monitor → simulate downtime → verify alert
- **Labels:** test
- **Estimate:** 5

### E2E: public status page renders correct state
- **Labels:** test
- **Estimate:** 2

### Document how to run the full test suite locally
- **Labels:** docs, test
- **Estimate:** 1

---

## Sprint 5 (Weeks 9–10): CI/CD Pipeline
**Sprint Goal:** Pushing code is the only manual step left.

### GitHub Actions: lint + typecheck on every PR
- **Labels:** devops, ci
- **Estimate:** 2

### GitHub Actions: run Vitest + Playwright suite on PR
- **Labels:** devops, ci
- **Estimate:** 5
- Runs against a docker-compose'd test environment in CI.

### Build & push worker Docker image to GHCR on merge to main
- **Labels:** devops, docker
- **Estimate:** 3

### Configure Vercel auto-deploy for dashboard
- **Labels:** devops
- **Estimate:** 2

### Configure Fly.io/Railway auto-deploy for worker image
- **Labels:** devops, docker
- **Estimate:** 3

### Add pipeline status badge + docs to README
- **Labels:** docs
- **Estimate:** 1

---

## Sprint 6 (Weeks 11–12): Staging → Production + Polish
**Sprint Goal:** A stable, demoable product with a real environment story.

### Provision staging environment
- **Labels:** infra, devops
- **Estimate:** 3
- Separate Fly.io app + Neon staging branch.

### Run Playwright smoke suite against staging before promotion
- **Labels:** test, devops
- **Estimate:** 3

### Provision production environment + secrets
- **Labels:** infra, devops
- **Estimate:** 3

### Final QA pass — real alerts end-to-end in prod
- **Labels:** test
- **Estimate:** 2

### Architecture diagram
- **Labels:** docs
- **Estimate:** 2
- Excalidraw or draw.io — show Vercel, worker container, Postgres, Redis, alert flow.

### README polish — why Docker, why Playwright, demo link
- **Labels:** docs
- **Estimate:** 2
- This is your interview talking-points doc.
