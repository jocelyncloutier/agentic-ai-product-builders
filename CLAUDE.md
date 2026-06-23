# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A coursework repo for "NEU Agentic AI for Product Builders." It currently holds **planning/spec documents, not application code** — the `MeetingBingo/` product has been fully spec'd (UXR, PRD, architecture, implementation plan) but the app itself has not been scaffolded yet. There is no `package.json`, build, lint, or test setup at the repo root.

## MeetingBingo document set

`MeetingBingo/` specs a browser-based bingo game that auto-fills squares when meeting buzzwords are spoken (via the Web Speech API). The four docs form a pipeline and **disagree in places by design** — read them in this precedence order:

1. **`meeting-bingo-implementation-plan.md`** — the current source of truth (v1.1, plan-reviewed). Its **§0 Scope Reconciliation** table resolves conflicts between the other three docs; §3 records concrete gaps/fixes to apply during the build; §8 logs the 22 applied plan-review findings (referenced inline as `[C1]`, `[H3]`, etc.). When the docs conflict, this plan wins.
2. **`meeting-bingo-architecture.md`** — technical design: stack decisions, planned `src/` layout, type definitions, and the per-phase build sequence.
3. **`meeting-bingo-prd.md`** — product requirements; user stories are referenced by ID (e.g. `US-2.3`).
4. **`meeting-bingo-uxr.md`** — UX research; used for quality bars (delight moments, privacy messaging, discreet celebration), **not** for scope. Features it mentions but the PRD cuts (multiplayer, leaderboard, custom packs, sound) are out of scope per §0.

Decisions already locked that override the older docs: solo play only, 3 preset packs, no audio, localStorage for in-progress game only, `useState<Screen>` state machine (no router), and build phases of **15 / 30 / 25 / 20 min** (90 total). If you edit one doc's scope or timing, reconcile it against the implementation plan's §0/§8 rather than leaving the docs inconsistent.

## When scaffolding the MeetingBingo app

The stack is **Vite + React + TypeScript + Tailwind CSS**, `canvas-confetti` for celebration, Web Speech API for transcription, localStorage for persistence, deployed to Vercel. State lives in `useState` + Context (no extra state libs).

**Phase 1 is scaffolded (NEU-5/NEU-6).** The app lives in **`MeetingBingo/app/`**. The Vite scaffold pinned newer versions than the architecture doc assumed: **React 19, Vite 8, TypeScript 6** (the doc said React 18 — this is the only stack deviation, and the planned code is compatible). Tailwind is pinned to **v3** so the architecture's `tailwind.config.js` format applies. `verbatimModuleSyntax` is on, so type-only imports must use `import type { … }`.

Commands (run from `MeetingBingo/app/`):

```bash
npm run dev        # Vite dev server (http://localhost:5173)
npm run build      # tsc -b && vite build → dist/
npm run typecheck  # tsc -b (no emit)
npm run lint       # oxlint
```

In place after Phase 1: `src/types/index.ts` (note `filledCount` is **dropped** from `GameState` — derive it), `src/data/categories.ts` (3 preset packs: agile/corporate/tech), `src/lib/utils.ts` (`cn()` helper). `src/App.tsx` is still a Phase-1 placeholder — the real screen-state machine lands in Phase 2 (NEU-8).

Several architecture-doc snippets have known issues the plan corrects in §3 (e.g. the `useSpeechRecognition` `onend` restart must be ref-based, not inside a `setState` updater; `filledCount` is derived, not stored); follow the plan's §3 over the raw architecture code.

## plan-review-skill

`.claude/skills/plan-review-skill/` is a committed **project-level** Claude Code skill (a thin dispatcher in `SKILL.md` that spawns the coordinator defined in `agent-prompt.md`). It runs a three-VP (Product / Engineering / Design) review of a plan file, then returns recommended edits as text for the main session to apply. The skill's `SKILL.md` must keep Claude Code frontmatter (`name: plan-review-skill`, `allowed-tools: …`) — the upstream GitHub copy uses marketplace frontmatter (`name: "Plan Review"`, `tools:`) that the skill loader will not discover, so do not copy that version over it.
