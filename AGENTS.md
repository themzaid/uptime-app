<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.


# 

<!-- END:nextjs-agent-rules -->

# Clerk Core 3 (v7) & Next.js 15+
Because Next.js 15+ has made dynamic APIs (like reading cookies) asynchronous, Clerk's Next.js SDK (`@clerk/nextjs` >= 7) has breaking changes:
- `createRouteMatcher()` in middleware is deprecated. Instead, protect routes at the resource level.
- `auth()` is now asynchronous.
- To protect a route, DO NOT use `auth().protect()`.
- INSTEAD, use `await auth.protect()` in a Server Component or Server Action. Ensure the component is marked as `async`.

# Git Commit Instructions
When asked to generate a git commit message, ALWAYS use the following exact format:

```bash
git add .
git commit -m "type: [Task Name] description
- First change
- Second change
- Third change"
git push
```

**Valid Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semi colons, etc; no code change
- `refactor`: Refactoring production code
- `perf`: Performance improvements
- `test`: Adding missing tests
- `chore`: Maintenance tasks (build, dependencies, etc)

**CRITICAL RULES:**
1. **Never run commands:** NEVER automatically run any of these 3 git commands yourself. Only output the text block for the user to copy and run.
2. **Include Task Name:** ALWAYS include the primary task completed in the commit message description/subject line.
3. **Format Body as Bullets:** ALWAYS format the commit body as a bulleted list using dashes (`- `). NEVER combine everything into a single paragraph. Each major change gets its own bullet point.
4. **No Code Snippets:** KEEP COMMIT MESSAGES BRIEF AND CONCEPTUAL. NEVER include actual code snippets, CSS classes, or terminal output in the commit message body. Focus on *what* changed and *why*, not the raw code.
5. **Final Changes Only:** ONLY include changes that are ACTUALLY present in the final working tree. Do not track intermediate attempts or scratchpad steps (e.g., "tried X, then fixed Y").
6. **Summarize Everything:** ALWAYS summarize ALL changes made across the entire codebase since the last commit, not just the most recent file.

# General Rules
- ALWAYS use `pnpm` as the package manager for this project. NEVER suggest or use `npm` or `npx`. Use `pnpm dlx` or `pnpm exec` instead of `npx`.
- NEVER add new files or folders on your own.
- NEVER edit empty files automatically.
- You MAY automatically edit files that are already present and have code in them. For all other code changes (like creating new files), provide the code for the user to copy/paste.
- BACKLOG RULE: You are allowed to edit `uptime-monitor-backlog.md` to check off completed tasks, BUT ONLY do so when the user explicitly asks for a commit message or confirms the task is completely finished. Never check it off prematurely.
- NEVER run any commands yourself (e.g., via terminal/shell tools). Only tell the user what commands to run so they can execute them manually.
- ALWAYS provide a git commit message block when the current task or step is finished.

# Next 16, Tailwind v4 & Vercel Deployment Rules
1. **Next 16 Middleware:** The `middleware.ts` convention is deprecated. ALWAYS use `proxy.ts` instead of `middleware.ts`.
2. **Tailwind v4 Configuration:** `tailwind.config.ts` is mostly deprecated in v4, but if you need it (e.g. for Tremor safelisting), you MUST type the config as `any` (i.e. `const config: any = { ... }`). The official Tailwind `Config` type is missing v3 properties like `safelist` and will fail the Next.js production build typechecker.
3. **pnpm 10+ on Vercel:** pnpm versions 10+ and 11+ are extremely strict about lockfiles and post-install scripts. This will cause Vercel to fail with `ERR_PNPM_IGNORED_BUILDS` if packages like `esbuild` try to run.
   - You MUST add `"pnpm": { "onlyBuiltDependencies": ["esbuild"] }` to `package.json`.
   - The user MUST manually override the Vercel Install Command in their dashboard settings to: `pnpm install --ignore-scripts` to bypass lockfile strictness in CI.

# Database & Environment Rules
1. **Schema Updates:** If you modify `src/db/schema.ts`, you MUST remind the user to run `pnpm db:push` against their **live production database**, not just their local docker database. Failure to sync the live DB will crash Vercel in production.
2. **Environment Variable Shadowing:** Do NOT define the same environment variable twice in `.env.local` (e.g., a local `DATABASE_URL` overriding a production `DATABASE_URL`). Variables lower in the file will silently overwrite the ones above them, causing deployments or local scripts to connect to the wrong database.
