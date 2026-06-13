# MannMitra — Exam Wellness Companion (Hackathon Plan)

## Context

Hackathon problem: a GenAI tool that helps students preparing for high-stakes Indian
exams (NEET, JEE, CUET, CAT, GATE, UPSC) monitor and improve mental well-being. It must
analyze open-ended journaling + mood logs to surface *hidden* stress triggers, and act as
an empathetic conversational companion offering coping strategies and encouragement.

**The differentiation problem:** most teams will ship the same thing — a mood slider, a
journal box, and a generic wellness chatbot with canned tips. To score on *problem
alignment* and *code quality*, we go from **tracking → understanding**:

> A GenAI engine that mines free-text journals into a **structured, evolving Stress-Trigger
> Graph** ("Stress DNA"), surfacing correlations standard trackers miss (e.g. "anxiety
> peaks the night before Physics mocks", "focus crashes after <6h sleep"), wrapped in an
> **exam-timeline-aware** empathetic companion with a **crisis-safety guardrail** that
> routes severe distress to verified Indian helplines.

**Hard constraint: ~90 minutes of build time.** Plan is scoped to a *must-finish core* plus
explicit *stretch* items. Free deploy on Vercel.

## Scoring alignment (designed in, not bolted on)
- **HIGH — Code quality:** small typed modules, single responsibility, one shared Gemini
  client, no defensive over-engineering. **Problem alignment:** journaling + mood + hidden
  trigger mining + conversational companion + coping/encouragement + safety — all five
  requirements covered.
- **MEDIUM — Security:** Supabase Row-Level Security (per-user isolation), anonymous auth
  (no password handling), Gemini key stays **server-side only** in API routes, input length
  caps. **Efficiency:** `gemini-2.0-flash`, *one* structured call extracts mood+triggers+
  coping+crisis-flag together (not multiple round-trips), streamed chat.
- **LOW — Testing:** Vitest unit tests for `safety` detection + trigger parsing.
  **Accessibility:** semantic HTML, form labels, aria, keyboard, WCAG-contrast colors;
  voice journaling as a stretch a11y win.

## Tech stack (all free tier)
- **Next.js 15** (App Router, TypeScript) + **Tailwind CSS** → Vercel
- **Supabase** (Postgres + Auth + RLS) — **anonymous sign-in** so there's a real `auth.uid()`
  for RLS with *zero login UI to build*
- **Google Gemini** via `@google/genai` (latest unified SDK), structured output via
  `responseSchema` — see **Model strategy** below
- **Recharts** for the trigger visualization (lightweight)

## Model strategy (free-tier aware)

Free quotas were cut 50-80% on Dec 7, 2025. We stay on the **Flash family** (avoid 2.5 Pro,
which is ~5 RPM / ~25-100 RPD). Limits are **per Google project, not per key**; reset at
midnight Pacific.

| Use case | Model | Why | Free limit (worst case) |
|---|---|---|---|
| Journal analysis (structured extract) | `gemini-2.5-flash-lite` | cheap, fast, highest free limits; structured output is easy here | highest of the Flash family |
| Companion chat (streamed reply) | `gemini-2.5-flash` | better empathy/reasoning for conversation; quality matters more here | ~10-15 RPM / ~250-1500 RPD |
| Fallback if either rate-limits | the other Flash model | swap on HTTP 429 | — |

- **1 request per user action** by design: a journal submit = **one** structured call
  (mood + triggers + coping + crisis bundled), a chat message = **one** call. So worst-case
  ~250 RPD ≈ ~125 interactions/day — ample for judging + live demo.
- Model IDs centralized in `lib/gemini.ts` (`ANALYZE_MODEL`, `CHAT_MODEL`) so swapping is
  one edit.
- **Backup quota:** keep a second API key from a *different* Google project; swap env var if
  the demo hits the 10 RPM ceiling (only a risk under heavy concurrent traffic).

## Architecture

```
app/
  page.tsx                 # onboarding: pick exam + exam date -> dashboard
  dashboard/page.tsx       # mood+journal entry, Stress Graph, companion chat
  api/analyze/route.ts     # POST journal -> Gemini structured extract -> save
  api/chat/route.ts        # POST message + context -> streamed empathetic reply
lib/
  gemini.ts                # client, prompt builders, response schema
  supabase/client.ts       # browser client (anon)
  supabase/server.ts       # server client for API routes
  safety.ts                # crisis keywords + verified helplines + check()
components/
  EntryForm.tsx  StressGraph.tsx  ChatPanel.tsx  HelplineBanner.tsx
```

**DB (Supabase, RLS `user_id = auth.uid()` on every table):**
- `profiles(user_id pk, exam text, exam_date date)`
- `entries(id, user_id, mood int 1-5, text, created_at)`
- `triggers(id, user_id, entry_id, label, category, intensity int)`

**Analyze flow (the differentiator):** journal text → `gemini.ts` single structured call
returns `{ mood, sentiment, triggers:[{label,category,intensity}], coping, crisis:bool }`
→ save entry + triggers → `StressGraph` aggregates triggers by label/category/intensity
across entries to reveal patterns.

**Chat flow:** companion prompt is built from profile (exam, **days-to-exam**) + last few
entries + top triggers → empathetic, contextual reply with a concrete coping micro-step.
Tone adapts as exam nears.

**Safety:** `safety.check()` runs keyword pre-filter + uses Gemini `crisis` flag; if either
trips, `HelplineBanner` shows Tele-MANAS **14416**, iCall **9152987821**, Vandrevala
**9999666555**. Companion never role-plays therapy for crisis — it hands off.

## Execution stages (90-min budget)

Each stage ends with a **Validate** checkpoint — do not advance until it passes
(incremental, prove-each-step working style).

### Stage 0 — Manual prep (do first, ~5m, cannot be scripted)
- **Gemini key:** Google AI Studio → *Get API key* → copy. (https://aistudio.google.com/apikey)
- **Supabase project:** supabase.com → New project → copy `Project URL` + `anon` key from
  Settings → API. Authentication → Providers → enable **Anonymous sign-ins**.
- **GitHub repo** (empty) ready for Vercel import.
- *Validate:* you have 3 secrets in hand (Gemini key, Supabase URL, Supabase anon key).

### Stage 1 — Scaffold + deploy skeleton (~12m)
- `npx create-next-app@latest` (TypeScript, Tailwind, App Router, no `src/`).
- `npm i @google/genai @supabase/supabase-js recharts`.
- Add `.env.local` with the 3 secrets; add Tailwind theme colors (navy #032147 headings,
  blue #209dd7, purple #753991 buttons, yellow #ecad0a accent, gray #888888).
- Build `lib/supabase/client.ts` + `server.ts`.
- Push to GitHub → import to Vercel → add the 3 env vars → first deploy.
- *Validate:* `npm run dev` shows the styled landing page; Vercel build is green.

### Stage 2 — Database + auth (~8m)
- In Supabase SQL editor: create `profiles`, `entries`, `triggers` tables.
- Enable RLS on all three with policy `user_id = auth.uid()` (select/insert).
- App boot: `supabase.auth.signInAnonymously()` if no session.
- *Validate:* page load creates an anon session; a manual insert from the app appears in
  the Supabase table and is invisible to a second anon session.

### Stage 3 — Onboarding + journal entry (~12m)
- `app/page.tsx`: pick exam (NEET/JEE/CUET/CAT/GATE/UPSC) + exam date → upsert `profiles`
  → redirect to `/dashboard`.
- `components/EntryForm.tsx`: mood (1-5 emoji scale) + open-text journal → POST `/api/analyze`.
- *Validate:* submitting an entry stores a row in `entries` for the current user.

### Stage 4 — Analyze + Stress-Trigger Graph (HERO, ~25m)
- `lib/gemini.ts`: shared client + `responseSchema` for one structured call returning
  `{ mood, sentiment, triggers:[{label,category,intensity}], coping, crisis }`.
- `app/api/analyze/route.ts`: call Gemini, persist entry + triggers (server-side key only).
- `components/StressGraph.tsx`: aggregate triggers across entries → Recharts bar by
  intensity + intensity-sized chips, plus a one-line GenAI insight.
- *Validate:* journal *"Couldn't sleep, scared I'll fail JEE, hate organic chem"* yields
  triggers (sleep, exam-fear, organic chem) rendered in the graph.

### Stage 5 — Companion chat + safety (~15m)
- `lib/safety.ts`: crisis keyword list + verified helplines (Tele-MANAS 14416, iCall
  9152987821, Vandrevala 9999666555) + `check()`.
- `app/api/chat/route.ts`: streamed reply; prompt built from profile (exam, **days-to-exam**)
  + recent entries + top triggers; returns coping micro-step.
- `components/ChatPanel.tsx` + `components/HelplineBanner.tsx` (shown when `safety.check()`
  or Gemini `crisis` flag trips, in both analyze and chat).
- *Validate:* contextual empathetic reply references the user's exam/triggers; a distress
  message surfaces the HelplineBanner.

### Stage 6 — Harden + ship (~8m)
- Vitest unit tests for `safety.check()` + trigger parsing.
- Accessibility pass: labels, aria-live on chat, keyboard focus, contrast check.
- Confirm Gemini key is absent from the client bundle (only in `app/api/**`).
- Final commit → Vercel redeploy → smoke-test the live URL end to end.
- *Validate:* `npm test` green; live URL completes the full journal → graph → chat flow.

### Stage 7 — Stretch (only if time remains)
- **Burnout Radar:** rolling risk score from mood trend + trigger intensity (gauge).
  *(promote to hero if Stage 4 graph proves too slow)*
- **Voice journaling** via Web Speech API (accessibility win).
- **Weekly AI "Reflection Report"** narrative summary of patterns + wins.

## Verification
- `npm run dev`, complete onboarding, submit a journal like *"Couldn't sleep, scared I'll
  fail JEE, hate organic chem"* → confirm triggers extracted (sleep, JEE-fear, organic
  chem) and rendered in Stress Graph; confirm empathetic chat reply references context.
- Submit a distress message → confirm `HelplineBanner` appears with helplines.
- `npm test` → safety + parsing unit tests pass.
- Confirm Gemini key is **not** in any client bundle (only referenced in `app/api/**`).
- Deploy to Vercel, set env vars, re-run the journal flow on the live URL.

## Notes / decisions
- Name "MannMitra" (mind-friend) is a placeholder — easy to rename.
- Anonymous auth chosen over login forms to fit the timebox while still demonstrating real
  RLS security. Cross-device sync is out of scope at 90 min.
- Single combined Gemini structured call (not separate calls per field) is the key
  efficiency decision.
