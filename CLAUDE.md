# InternshipBridge - Claude Code Instructions

## Project Overview
Multi-tenant internship platform connecting students with employers, built with Next.js 16, Supabase, TypeScript, and Tailwind CSS. See README.md for full documentation.

## Key Commands
- `npm run dev` — Start dev server (port 3000)
- `npm test` — Run vitest tests
- `npm run build` — Production build
- `npm run lint` — ESLint

## Test Accounts
- **Employer**: `employer@mail.com` / `1234Test!`
- **Student**: `student@mail.com` / `1234Test!`

## Chrome DevTools MCP
This project uses the `chrome-devtools-mcp` for browser-based testing (smoke tests, regression tests).

### Setup
The MCP should be configured globally via:
```bash
claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp
```

If Chrome DevTools tools are unavailable, check:
1. Run `ps aux | grep chrome` to see if Chrome/MCP processes exist
2. If zombie processes exist, kill them: `pkill -9 chrome`
3. Remove lock file if present: `rm -f ~/.cache/chrome-devtools-mcp/chrome-profile/SingletonLock`
4. The MCP server should auto-restart on next tool call. If not, the user may need to re-add it.

### Usage Patterns
- Use `mcp__chrome-devtools__new_page` to open pages (Chrome launches headless in the Linux container)
- Use `mcp__chrome-devtools__take_snapshot` to read page content (accessibility tree)
- Use `mcp__chrome-devtools__fill` for individual form fields
- Use `mcp__chrome-devtools__click` to interact with elements (by uid from snapshot)
- After navigation/clicks, wait 2-3 seconds before taking snapshots for client-rendered pages
- The `wait_for` tool expects array and number types, not strings

### Available Test Commands
- `/smoke-test` — Quick verification that all pages load and core flows work (read-only)
- `/regression-test` — Full test exercising forms, validation, state changes (creates test data)

## Project Structure
- `src/app/` — Next.js app router pages
- `src/components/` — React components (DashboardNav, SchoolPicker, LanguageToggle, ui/)
- `src/lib/` — Utilities (supabase, validation, i18n, school context)
- `src/types/` — TypeScript types
- `src/__tests__/` — Vitest tests
- `src/middleware.ts` — Auth route protection and role-based access

## Conventions
- All user-facing strings must use i18n (`useTranslations` hook) with both EN and ES translations
- Validation uses Zod schemas in `src/lib/validation.ts`
- Auth uses Supabase with middleware-level route protection
- Four user roles: student, employer, school_admin, global_admin
- Only student and employer can self-register
