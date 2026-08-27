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
git commit -m "type: description"
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
1. NEVER automatically run any of these 3 git commands yourself. Only output the text block for the user to copy and run.
2. NEVER include the iterative "scratchpad" steps taken during sessions since the last commit (e.g., "tried X, then fixed Y"). Focus ONLY on the final outcome of the code changes.
3. ALWAYS summarize ALL changes made across the entire codebase since the last commit. Do not just focus on the most recently edited file or current chat session.

# General Rules
- NEVER write, edit, or touch any code files unless explicitly asked to do so by the user. The user will always edit the code manually. Only provide the code or commands for the user to copy/paste. (EXCEPTION: You are allowed to edit uptime-monitor-backlog.md to check off completed tasks).
- NEVER run any commands yourself (e.g., via terminal/shell tools). Only tell the user what commands to run so they can execute them manually.
- ALWAYS provide a git commit message block when the current task or step is finished.
