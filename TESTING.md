# Testing Strategy

This project uses a layered testing approach to ensure both the backend logic and the frontend user experience work flawlessly.

## 1. Unit & Integration Tests (Vitest)
**What it tests:** The "Engine" (Backend logic, database interactions, and background worker logic).
**Where they live:** Colocated next to the files they test (e.g., `src/actions/monitors.test.ts`).
**How it runs:** Extremely fast in a Node.js environment without a browser.

- **Unit Tests (`src/worker/incident-logic.test.ts`):** Tests pure math and logic in complete isolation. We feed functions fake data and ensure they return the right result.
- **Integration Tests (`src/actions/*.test.ts`):** Tests the Next.js Server Actions (API). We bypass the UI and directly call the backend actions, proving that they correctly insert/delete data into the real local PostgreSQL database and schedule jobs in the queue.

## 2. End-to-End (E2E) Tests (Playwright)
**What it tests:** The "Entire Car" (Frontend UI + Backend).
**Where they live:** In the isolated `/tests` directory at the root of the project.
**How it runs:** Spins up actual Chromium browsers, clicks real buttons, types in real inputs, and verifies that the screen visually updates as expected.

## 3. How to Run Tests Locally

### Prerequisites
Before running the test suite, ensure your local Postgres database and Redis cache are running in the background:
```bash
docker compose up -d
```

### Running Unit & Integration Tests (Vitest)
These run instantly in the terminal.
```bash
# Run all tests once
pnpm test

# Run tests in watch mode (auto-reruns when you save a file)
pnpm vitest --watch
```

### Running End-to-End Tests (Playwright)
Playwright tests interact with the actual app. It will automatically start a Next.js development server on port 4200 for you before running the tests.

```bash
# Run tests headlessly in the background
pnpm exec playwright test

# Run tests visually (opens the browser so you can watch it click around)
pnpm exec playwright test --headed

# View a detailed HTML report of the last run (useful for debugging failures)
pnpm exec playwright show-report
```
