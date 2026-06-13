# MannMitra — Exam Wellness Companion

An AI companion for students preparing for high-stakes Indian exams (NEET, JEE, CUET,
CAT, GATE, UPSC). It turns open-ended daily journaling into a **Stress-Trigger Graph** —
surfacing hidden patterns a basic mood tracker misses — and offers an exam-timeline-aware
conversational companion with a crisis-safety guardrail that routes severe distress to
verified Indian helplines.

## What makes it different

- **Stress DNA**: one structured Gemini call extracts mood, hidden triggers (label +
  category + intensity), a coping micro-step, and a crisis flag — visualized as a ranked,
  color-coded stress map that builds up across entries.
- **Exam-timeline aware**: the companion knows your exam and days remaining, and adapts.
- **Safety first**: keyword + model-based distress detection surfaces Tele-MANAS (14416),
  iCall, and Vandrevala helplines.

## Tech stack

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Supabase (Postgres + anonymous
auth + Row-Level Security) · Google Gemini via `@google/genai` · Recharts · Vitest.

## Project layout

```
challenge/
├── .env              # secrets (kept outside the app; git-ignored)
├── planning/plan.md  # build plan
└── project/          # the Next.js app
    ├── app/          # pages + API routes (analyze, chat)
    ├── components/   # EntryForm, StressGraph, ChatPanel, HelplineBanner
    ├── lib/          # gemini, supabase clients, safety, triggers
    └── supabase/schema.sql
```

## Environment

Secrets live in `challenge/.env` (one level above `project/`). `next.config.ts` reads it
at startup and maps the names to Next.js conventions, so you don't duplicate them:

```
GEMINI_API_KEY=...
anon_key=<supabase anon key>
VITE_SUPABASE_URL=https://<ref>.supabase.co/rest/v1/
```

On Vercel the file is absent; set these instead in the dashboard:
`GEMINI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Run locally

Prerequisites: Node 20+ and a Supabase project.

1. **Database** — in the Supabase SQL editor, run `project/supabase/schema.sql`.
2. **Auth** — Authentication → Sign In / Providers → enable **Anonymous sign-ins**.
3. **Secrets** — ensure `challenge/.env` has the three values above.
4. **Install & run** (from `project/`):

   ```bash
   npm install
   npm run dev
   ```

   Open http://localhost:3000.

   > **Corporate / TLS-intercepting networks:** Node can't verify the intercepted certs
   > because it doesn't read the Windows cert store. Instead of disabling verification,
   > export the system root CAs once: `npm run setup:certs` (Windows/PowerShell). This
   > writes `certs/win-roots.pem`, and the `dev` script points `NODE_EXTRA_CA_CERTS` at it
   > so HTTPS works with verification **on**. On normal networks the file is harmless if
   > absent (Node falls back to its built-in CAs). Vercel is unaffected.

## Test & build

```bash
npm test     # vitest: safety detection + trigger normalization
npm run build
```

## Security notes

- The Gemini API key is used only in server API routes (`app/api/**`) and never reaches
  the client bundle (client code imports Gemini types via `import type` only).
- Every table has Row-Level Security so each anonymous user can read/write only their own
  rows; API routes act on the caller's bearer token.
- Journal input is length-capped before reaching the model.
