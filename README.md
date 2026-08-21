# Uptime Monitor

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
