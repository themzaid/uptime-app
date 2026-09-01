# Uptime Monitor — Sprint Backlog

This mirrors the current state of the "Uptime Monitor" project in Linear (team: Zaid). Each `###` heading is one Linear issue. The number prefix on each title is its exact build-order position within that sprint — go top to bottom. **Status** reflects Linear as of the last sync; update this file manually if you don't keep it live.

---

## Sprint 1 (Weeks 1–2): Foundations
**Sprint Goal:** A clickable skeleton app with no real functionality yet, but the full environment running.

### 1. Scaffold Next.js + TypeScript + Tailwind project
- **Status:** ✅ Done
- **Labels:** infra
- **Priority:** Urgent
- **Estimate:** 2
- Set up the repo, base folder structure, linting/formatting config.
- **Acceptance criteria:**
  - `npm run dev` runs a working Next.js app locally
  - ESLint + Prettier configured and passing

### 2. Set up Clerk authentication
- **Status:** ✅ Done
- **Labels:** infra, auth
- **Priority:** High
- **Estimate:** 3
- Sign up, log in, log out, protected routes.
- **Acceptance criteria:**
  - New user can sign up and land on a dashboard
  - Logged-out users are redirected away from protected pages

### 3. Provision Neon Postgres + Drizzle schema
- **Status:** ✅ Done
- **Labels:** infra, database
- **Priority:** Medium
- **Estimate:** 3
- Tables: `monitors`, `checks`, `incidents`. Done directly against Neon (hosted), so this didn't need docker-compose first.
- **Acceptance criteria:**
  - Schema migrated via Drizzle
  - Tables visible in Neon console with correct relations

### 4. Build CRUD UI for monitors
- **Status:** ✅ Done
- **Labels:** Feature
- **Priority:** Medium
- **Estimate:** 5
- Add/edit/delete a URL to watch (no actual checking yet — just data entry). Needs auth (#2) and schema (#3), both done/finishing.
- **Acceptance criteria:**
  - User can add a monitor with a name + URL + check interval
  - List view shows all of a user's monitors

### 5. Create docker-compose.yml for local dev
- **Status:** ✅ Done
- **Labels:** infra, docker
- **Priority:** Medium
- **Estimate:** 2
- Postgres + Redis running locally via one command. Not a blocker for #3/#4 since those use hosted services — becomes a hard requirement once Sprint 2's worker needs local Redis.
- **Acceptance criteria:**
  - `docker-compose up` starts Postgres + Redis
  - App connects to both without manual config changes

### 6. Write local setup README
- **Status:** ✅ Done
- **Labels:** docs
- **Priority:** Low
- **Estimate:** 1
- Written last so it documents the actual working setup, including docker-compose.
- **Acceptance criteria:**
  - A new clone + `docker-compose up` + `npm install` + `npm run dev` gets someone running in under 10 minutes

---

## Sprint 2 (Weeks 3–4): Check Engine + Docker
**Sprint Goal:** The app actually checks whether a site is up, on a schedule.

### 1. Build standalone Node worker for HTTP checks
- **Status:** ✅ Done
- **Labels:** Feature, worker
- **Priority:** Urgent
- **Estimate:** 5
- Separate service (not a Vercel function) that performs the actual ping.
- **Acceptance criteria:**
  - Worker can hit a URL and record status code + latency

### 2. Set up Redis + BullMQ scheduling
- **Status:** ✅ Done
- **Labels:** infra, worker
- **Priority:** High
- **Estimate:** 5
- Repeatable job per monitor, respecting its configured interval.
- **Acceptance criteria:**
  - Each monitor gets checked automatically at its set interval without manual triggering

### 3. Implement incident detection rule
- **Status:** ✅ Done
- **Labels:** Feature, worker
- **Priority:** Medium
- **Estimate:** 3
- e.g. 3 consecutive failures = incident opened; 1 success = resolved.
- **Acceptance criteria:**
  - Killing a test endpoint creates an incident record after the threshold
  - Restoring it resolves the incident

### 4. Dockerize the worker service
- **Status:** ✅ Done
- **Labels:** infra, docker
- **Priority:** Medium
- **Estimate:** 3
- **Acceptance criteria:**
  - Worker runs as its own container with a Dockerfile
  - Builds successfully with `docker build`

### 5. Add worker to docker-compose, verify end-to-end locally
- **Status:** ✅ Done
- **Labels:** infra, docker
- **Priority:** Low
- **Estimate:** 2
- **Acceptance criteria:**
  - `docker-compose up` brings up app + worker + Postgres + Redis together
  - A monitor added in the UI gets checked by the containerized worker

---

## Sprint 3 (Weeks 5–6): Dashboard + Alerts
**Sprint Goal:** A human can see the data and get notified when something breaks.

### 1. Build live status dashboard
- **Status:** ✅ Done
- **Labels:** Feature, frontend
- **Priority:** Urgent
- **Estimate:** 5
- Per-monitor current status (up/down/degraded).

### 2. Uptime % + latency chart
- **Status:** ✅ Done
- **Labels:** Feature, frontend
- **Priority:** High
- **Estimate:** 5
- Recharts-based visualization of historical check data.

### 3. Email alerts via Resend
- **Status:** ✅ Done
- **Labels:** Feature, alerts
- **Priority:** Medium
- **Estimate:** 3
- Fires on incident open and resolve.

### 4. Webhook alerts for Slack
- **Status:** ✅ Done
- **Labels:** Feature, alerts
- **Priority:** Medium
- **Estimate:** 3

### 5. Alert deduplication/throttling
- **Status:** ✅ Done
- **Labels:** Feature, alerts
- **Priority:** Medium
- **Estimate:** 3
- Prevents one flapping monitor from spamming notifications.

### 6. Public read-only status page
- **Status:** ⏭️ Skipped
- **Labels:** Feature, frontend
- **Priority:** Low
- **Estimate:** 5
- This becomes your demo link — no login required to view.

---

## Sprint 4 (Weeks 7–8): Test Automation
**Sprint Goal:** The app proves itself automatically, without manual clicking.

### 1. Vitest unit tests — check logic and incident rules
- **Status:** ✅ Done
- **Labels:** test
- **Priority:** Urgent
- **Estimate:** 3

### 2. API/integration tests for CRUD + alert-trigger endpoints
- **Status:** ✅ Done
- **Labels:** test
- **Priority:** High
- **Estimate:** 3

### 3. Playwright framework setup (fixtures, page objects, config)
- **Status:** ✅ Done
- **Labels:** test, framework
- **Priority:** Medium
- **Estimate:** 5
- This is the "framework ownership" ticket — structure, not just scripts.

### 4. E2E: login → create monitor → simulate downtime → verify alert
- **Status:** ✅ Done
- **Labels:** test
- **Priority:** Medium
- **Estimate:** 5

### 5. E2E: public status page renders correct state
- **Status:** ⏭️ Skipped
- **Labels:** test
- **Priority:** Medium
- **Estimate:** 2

### 6. Document how to run the full test suite locally
- **Status:** ✅ Done
- **Labels:** docs, test
- **Priority:** Low
- **Estimate:** 1

---

## Sprint 5 (Weeks 9–10): CI/CD Pipeline
**Sprint Goal:** Pushing code is the only manual step left.

### 1. GitHub Actions: lint + typecheck on every PR
- **Status:** ✅ Done
- **Labels:** devops, ci
- **Priority:** Urgent
- **Estimate:** 2

### 2. GitHub Actions: run Vitest + Playwright suite on PR
- **Status:** ✅ Done
- **Labels:** devops, ci
- **Priority:** High
- **Estimate:** 5
- Runs against a docker-compose'd test environment in CI.

### 3. Build & push worker Docker image to GHCR on merge to main
- **Status:** ✅ Done
- **Labels:** devops, docker
- **Priority:** Medium
- **Estimate:** 3

### 4. Configure Vercel auto-deploy for dashboard
- **Status:** ✅ Done
- **Labels:** devops
- **Priority:** Medium
- **Estimate:** 2

### 5. Configure Fly.io/Railway auto-deploy for worker image
- **Status:** ✅ Done
- **Labels:** devops, docker
- **Priority:** Medium
- **Estimate:** 3

### 6. Add pipeline status badge + docs to README
- **Status:** ✅ Done
- **Labels:** docs
- **Priority:** Low
- **Estimate:** 1

---

## Sprint 6 (Weeks 11–12): Staging → Production + Polish
**Sprint Goal:** A stable, demoable product with a real environment story.

### 1. Provision staging environment
- **Status:** ✅ Done
- **Labels:** infra, devops
- **Priority:** Urgent
- **Estimate:** 3
- Separate Fly.io app + Neon staging branch.

### 2. Run Playwright smoke suite against staging before promotion
- **Status:** ✅ Done
- **Labels:** test, devops
- **Priority:** High
- **Estimate:** 3

### 3. Provision production environment + secrets
- **Status:** ⬜ Not started
- **Labels:** infra, devops
- **Priority:** Medium
- **Estimate:** 3

### 4. Final QA pass — real alerts end-to-end in prod
- **Status:** ⬜ Not started
- **Labels:** test
- **Priority:** Medium
- **Estimate:** 2

### 5. Architecture diagram
- **Status:** ⬜ Not started
- **Labels:** docs
- **Priority:** Low
- **Estimate:** 2
- Excalidraw or draw.io — show Vercel, worker container, Postgres, Redis, alert flow.

### 6. README polish — why Docker, why Playwright, demo link
- **Status:** ⬜ Not started
- **Labels:** docs
- **Priority:** Low
- **Estimate:** 2
- This is your interview talking-points doc.
