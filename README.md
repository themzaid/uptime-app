# Uptime Monitor

[![Lint](https://github.com/your-username/uptime-app/actions/workflows/lint.yml/badge.svg)](https://github.com/your-username/uptime-app/actions/workflows/lint.yml)
[![Test](https://github.com/your-username/uptime-app/actions/workflows/test.yml/badge.svg)](https://github.com/your-username/uptime-app/actions/workflows/test.yml)

A full-stack Next.js application that monitors your websites and alerts you when they go down.

## Tech Stack
- **Framework:** Next.js (App Router)
- **Package Manager:** pnpm
- **Authentication:** Clerk
- **Styling:** Tailwind CSS

## Local Development Setup

Follow these steps to get the project running locally in under 10 minutes.

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd uptime-app
pnpm install
```

### 2. Configure Environment Variables
Copy the `.env.example` file to create your own `.env.local`:
```bash
cp .env.example .env.local
```
Fill in the Clerk API keys in `.env.local` from your Clerk dashboard.

### 3. Start the Development Server
```bash
pnpm dev
```
The application will be available at [http://localhost:4200](http://localhost:4200).

## CI/CD Pipeline

This repository uses GitHub Actions for continuous integration and continuous deployment (CI/CD):

- **Lint and Typecheck:** Runs ESLint and TypeScript compilation checks on every Pull Request and push to `main`.
- **Automated Tests:** Runs the full Vitest and Playwright test suite against a live, Docker-containerized test database on every Pull Request.
- **Worker Image Publish:** Builds and publishes a new Docker image for the worker node to GitHub Container Registry (GHCR) when changes are merged to `main`.
- **Fly.io Deployment:** Automatically deploys the worker container to Fly.io on push to `main`.

### Dashboard Deployment (Vercel)
The Next.js dashboard application is built to be deployed on Vercel. 
To set up continuous deployment for the frontend:
1. Push this repository to GitHub.
2. Import the project into your Vercel account.
3. Configure the environment variables from your `.env.local` inside the Vercel dashboard.
4. Any pushes to `main` will automatically trigger a production build.
