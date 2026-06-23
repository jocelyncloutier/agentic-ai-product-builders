# Meeting Bingo — Implementation Plan

**Version**: 1.1 (plan-reviewed — see §8)
**Date**: June 23, 2026
**Source docs**: [UXR](meeting-bingo-uxr.md), [PRD](meeting-bingo-prd.md), [Architecture](meeting-bingo-architecture.md)
**Target**: Functional MVP in ~90 minutes of focused build time

---

## 0. Scope Reconciliation (read first)

The three docs disagree in a few places. This plan locks the following decisions so we don't burn time deciding mid-build:

| Topic | UXR mentions | PRD/Arch says | **Decision for MVP** |
|-------|--------------|---------------|----------------------|
| Multiplayer / "Join Game" / leaderboard | Yes (journey, storyboards) | Out of scope | **Solo only.** Single "Create/New Game" entry. No join flow. |
| Custom buzzword pack | Yes (Scene 4) | Out of scope | **3 preset packs only.** Custom is post-MVP backlog. |
| Sound effects | Optional, off | Out of scope | **No audio.** Visual celebration only. |
| Persistence | History across meetings | localStorage, current session (P1) | **localStorage for in-progress game only.** No multi-game history. |
| Routing | — | screen state in `App.tsx` | **No router lib.** `useState<Screen>` switch, as in Architecture. |
| Privacy copy accuracy | "Audio processed locally, never recorded" | "Audio never leaves device" | **Correct the claim.** Chrome's Web Speech API sends audio to the browser's remote speech service. Copy: "Audio is sent to your browser's speech service for transcription; we never record or store it." |

Everything below builds the PRD/Architecture MVP. UXR is used for UX quality bars (delight moments, privacy messaging, silent celebration), not for added scope.

---

## 1. Build Sequence (4 phases)

Phases are ordered so the app is runnable and demoable after each one. If time runs short, stop after Phase 3 — speech is the only piece that can't be faked, so it ships before polish but the game is already winnable manually after Phase 2.

### Phase 1 — Foundation (~15 min)
Goal: dev server runs, Tailwind works, types + data in place.

1. Scaffold: `npm create vite@latest meeting-bingo -- --template react-ts`
2. Deps: `npm i canvas-confetti` and `npm i -D tailwindcss postcss autoprefixer @types/canvas-confetti`
3. `npx tailwindcss init -p`, configure `content` globs + `index.css` with `@tailwind` directives (per Architecture §Tailwind config).
4. Create `src/types/index.ts` (copy from Architecture "Core Type Definitions").
5. Create `src/data/categories.ts` (copy from Architecture "Buzzword Data").
6. Create `src/lib/utils.ts` with the `cn()` helper (Architecture references it but never defines it — see §3 below).

**Exit check**: `npm run dev` serves a blank styled page; `npm run typecheck` passes.

### Phase 2 — Core Game, manual-only (~30 min)
Goal: a fully playable bingo game with click-to-fill and win detection. No mic yet.

1. `lib/cardGenerator.ts` — `generateCard()` (Architecture).
2. `lib/bingoChecker.ts` — `checkForBingo()`, `countFilled()`, `getClosestToWin()` (Architecture).
3. Screens via `App.tsx` screen-state machine: `landing → category → preview → game → win`.
4. Components: `LandingPage`, `CategorySelect` (3 cards, each showing 3 sample words per PRD US-1.2), `GameBoard`, `BingoCard`, `BingoSquare`, `GameControls`.
   - **Preview/Ready screen**: after category select, show the generated card with a "Regenerate" button and an explicit "Enable mic & Start" action. Do NOT set `startedAt` until the user starts — the timer must reflect meeting time, not setup time. [H1]
5. Wire manual toggle: clicking a square flips `isFilled`; after each change run `checkForBingo()`; on win, set status and route to `WinScreen`.
6. Progress counter `X/24` (exclude free space from the 24, include it as pre-filled). Highlight "one away" using `getClosestToWin()`, naming the specific unfilled word(s) on the closest line (e.g. "One away! Need: Scope Creep or MVP") per UXR Scene 8. [M4]
7. **State ownership**: Squares' `isFilled` is canonical; derive `filledCount` via memoized `countFilled()` — do NOT store `filledCount` in `GameState`. Pick ONE state owner (GameBoard via `setGame`); drop the optional `useGame`/`useBingoDetection` hooks from MVP to avoid two sources of truth. [H5]
8. **Mobile-first layout**: build `BingoCard` legible in split-screen / beside a video call from the start (`aspect-square` grid, fluid text wrap). This is the dominant real-world usage, NOT a deferrable Phase 4 polish item. [M6]
9. **Accessibility baseline (P0)**: squares get `role="button"` + `aria-pressed={isFilled}` + `aria-label` ("Sprint, filled"); add an `aria-live="polite"` region announcing detections, X/24 progress, "one away", and BINGO; add a non-color state cue (checkmark on filled, distinct border on winning line) since color alone is insufficient. [H8, H9, L4]

**Exit check**: Pick a category, click 5 in a row (or use free space), BINGO fires, win screen shows stats. All 12 lines win correctly.

### Phase 3 — Speech recognition + auto-fill (~25 min)
Goal: the magic moment — squares fill when buzzwords are spoken.

1. `hooks/useSpeechRecognition.ts` (Architecture) — wrap Web Speech API, `continuous + interimResults`, auto-restart on `onend`.
2. `lib/wordDetector.ts` — `detectWords()` + `detectWordsWithAliases()` (Architecture). Phrase = substring; single word = `\b` boundary.
3. Wire in `GameBoard`: on each **final** transcript chunk only, run detection against `card.words` minus already-filled, set matched squares `isFilled=true, isAutoFilled=true`, then re-check bingo. Briefly highlight the exact matched square so the user sees which one filled (UXR Moment 1). [M5]
4. `TranscriptPanel` — listening dot, last ~100 chars, interim text, last 5 detected chips.
5. Mic permission UX: explicit pre-prompt copy ("Audio is sent to your browser's speech service for transcription; we never record or store it" — see §0), `isSupported` feature-detect, graceful fallback to manual-only mode if denied/unavailable. [C1]
6. Listening toggle in `GameControls` (start/stop).
7. **Plural/tense defense (US-2.3, >70% accuracy AC)**: for single-word matches, strip trailing `s`/`ed`/`ing` before comparing ("sprints"→"sprint", "blocked"→"block") in addition to the `WORD_ALIASES` map. This defends the P0 accuracy bar without full stemming. [H2]
8. **Detection performance**: precompute per-word regexes once per card (not per transcript chunk); wrap `BingoSquare` in `React.memo` so interim transcript updates don't re-render all 25 squares. [M3]

**Exit check**: Enable mic, speak two card words in a sentence, both squares auto-fill < 1s with toast/chip feedback. **Validate detection accuracy ≥70% on a sample sentence set** (not just "two words fill"). Deny mic → game still playable manually. Unsupported browser → clear message, no crash.

### Phase 4 — Polish, share, persist, deploy (~20 min)

**Priority order if time runs short: cut localStorage BEFORE share** — share (US-4.3) is the viral loop and a tracked success metric. [H7]

1. `WinScreen` — `canvas-confetti` burst, highlight winning line, stats (time-to-bingo, winning word, squares filled, category), Play Again / Home.
   - **Discreet default**: card-contained confetti or a "minimize" toggle so celebration is professional when a boss may be watching the screen (UXR Principle 3). [H11]
2. `lib/shareUtils.ts` — build text summary + app link (use `window.location.origin`, not a hardcoded URL [L2]); `navigator.share` on mobile, clipboard fallback on desktop. Toast on copy.
3. `hooks/useLocalStorage.ts` + persist in-progress `GameState` (and `screen`); rehydrate on load so a tab refresh mid-meeting doesn't lose the card. On rehydrate: force `isListening=false` (mic can't auto-resume without a user gesture), recompute `filledCount` from squares, and wrap `JSON.parse` in try/catch to avoid a boot crash on corrupt data. [M2]
4. Responsive pass: confirm the mobile/split-screen layout built in Phase 2 holds; `aspect-square` squares, text wrap.
5. **Animation hygiene**: replace permanent `animate-pulse` on auto-filled squares with the finite `animate-bounce-in` keyframe (already in tailwind config) so it self-terminates after ~0.5s. Guard both the bounce animation and confetti behind `prefers-reduced-motion: reduce` (degrade to instant state change). [M1, H10]
6. **Analytics**: add minimal local event capture (game start, auto-fill, win, share-click) so PRD success metrics are measurable. [H6]
7. Deploy to Vercel (static build, `dist`).

**Exit check**: Win → confetti + correct stats; Share copies a paste-ready summary; refresh restores the game; layout holds on narrow viewport; reduced-motion users get no strobing/confetti; production build deploys.

---

## 2. File-by-file work list

Tracks the Architecture project structure. ✅ = copy near-verbatim from Architecture doc; ✍️ = write fresh.

```
src/
  main.tsx                      ✅ vite default
  App.tsx                       ✅ screen state machine
  index.css                     ✍️ tailwind directives + CSS vars (§6 PRD colors)
  types/index.ts                ✅ (drop filledCount from GameState — derive it; §3.7/H5)
  data/categories.ts            ✅ (add ≥24-unique dev assertion in generateCard — see §3)
  lib/
    cardGenerator.ts            ✅
    bingoChecker.ts             ✅
    wordDetector.ts             ✅
    shareUtils.ts               ✍️ not in Architecture — write (§4)
    utils.ts                    ✍️ cn() helper (§3)
  hooks/
    useSpeechRecognition.ts     ✅
    useGame.ts                  ✂️ DROP for MVP — single state owner is GameBoard (H5)
    useBingoDetection.ts        ✂️ DROP for MVP — call bingoChecker directly (H5)
    useLocalStorage.ts          ✍️ Phase 4
  components/
    LandingPage.tsx             ✍️ (PRD §6.2 layout)
    CategorySelect.tsx          ✍️ (PRD §6.3 — 3 cards, no Custom)
    GameBoard.tsx               ✍️ container; owns listening + detection wiring
    BingoCard.tsx               ✍️ 5x5 grid map
    BingoSquare.tsx             ✅
    TranscriptPanel.tsx         ✅
    WinScreen.tsx               ✍️ (PRD §6.5 + confetti)
    GameControls.tsx            ✍️ new-card + listening toggle
    ui/Button.tsx, Card.tsx, Toast.tsx  ✍️ minimal shared primitives
```

---

## 3. Gaps & fixes in the source docs (resolve during build)

These are concrete things the Architecture/PRD leave dangling. Decide them as written here:

1. **`cn()` is referenced but never defined** (`BingoSquare`, `TranscriptPanel`). Add `src/lib/utils.ts`:
   ```ts
   export function cn(...classes: (string | false | null | undefined)[]) {
     return classes.filter(Boolean).join(' ');
   }
   ```
   (Avoids pulling in `clsx`/`tailwind-merge` for MVP. Upgrade later if class conflicts bite.)

2. **Word-count assertion**: each pack must have ≥24 *unique* words so `generateCard` can fill 24 slots without blanks. The real `categories.ts` packs are 42/43/45 unique (no actual "code review" dup) — so keep just a cheap dev assertion that unique count ≥ 24 in `generateCard`, guarding against a silent blank-square regression. [L1]

3. **Word detection vs. ASR drift + AC conflict**: PRD US-2.3 requires fuzzy/compound matching and >70% accuracy, but exact `\b` match misses "sprints"/"blocked"/"APIs". The chosen resolution (see Phase 3 step 7) is a **lightweight plural/tense strip** (trailing `s`/`ed`/`ing`) for single-word matches, on top of `WORD_ALIASES` — enough to defend the 70% bar without the false-positive risk of full stemming. Validate accuracy (not just "two words fill") in the Phase 3 exit check. Full stemming remains a post-MVP lever. [H2]

4. **`isAutoFilled` animation is permanent** (`animate-pulse` stays on filled squares). Replace with the finite `animate-bounce-in` keyframe (already in tailwind config) so it self-terminates after ~0.5s even though `isAutoFilled` stays true. Guard the animation (and confetti) behind `prefers-reduced-motion: reduce`. [M1, H10]

5. **`onend` auto-restart — structural fix required**: the hook calls `recognition.start()` as a side effect *inside* a `setState` updater reading `prev.isListening` — a React anti-pattern that breaks under StrictMode and races with `onerror`. Fix: track listening in an `isListeningRef` set synchronously in BOTH `onerror` (false) and start/stop; read the ref in `onend` and restart OUTSIDE setState. Add a restart-attempt backoff counter; on `not-allowed`/`audio-capture`, stop and surface the error instead of restarting. [H3, H4]

6. **Free space in the 24 count**: PRD says "X/24 filled" and "24 unique words + 1 free". Count filled *non-free* squares for the progress number; free space is pre-filled and counts toward lines only. Label it **"FREE SPACE"** consistently (Architecture's "⭐ FREE" is inconsistent with PRD/UXR). [L3]

---

## 4. Share format (not specified in Architecture — define now)

`shareUtils.ts` produces a paste-ready block for Slack/Teams/Discord (text, no server-side image for MVP):

```
🎯 I got BINGO on Meeting Bingo!
{category} · {minutes} min · winning word: "{word}"
{filledCount}/24 squares
Play → {appUrl}
```

- Desktop: `navigator.clipboard.writeText(...)` → Toast "Copied!".
- Mobile: `navigator.share({ text })` if available, else clipboard.
- App URL: derive from `window.location.origin` (not a hardcoded constant). [L2]

(Screenshot/image card is post-MVP; the win screen is already screenshot-ready per PRD §6.5.)

---

## 5. Acceptance / test pass (from PRD §9, Arch testing checklist)

Run this manually before calling it done:

- [ ] Card: 24 unique words + center free space, pre-filled, regenerable.
- [ ] Each category yields visibly different cards.
- [ ] Manual tap fills/unfills (auto-fills not unfillable, or visually distinct).
- [ ] All 12 winning lines (5 row, 5 col, 2 diag) trigger BINGO.
- [ ] Win screen: correct time, winning word, filled count, category.
- [ ] Mic prompt shows privacy copy; denial → manual mode, no crash.
- [ ] Two words in one sentence both auto-fill < 1s.
- [ ] Same word twice fills once.
- [ ] Unsupported browser (Firefox default) → manual mode message.
- [ ] Tab switch & return keeps state (localStorage).
- [ ] Confetti plays without jank; share copies correct text.
- [ ] Mobile/narrow layout legible.

---

## 6. Risks (carried from PRD §10 + build-specific)

| Risk | Mitigation |
|------|------------|
| Web Speech API missing/Firefox | Feature-detect `isSupported`; manual-only fallback is first-class, not an error state. |
| Transcription misses obvious words (plurals/tense) | Manual tap always available; aliases map; document as #1 post-MVP improvement. Don't fuzzy-match in MVP. |
| `onend` restart loop on permission errors | Stop + surface error for `not-allowed`/`audio-capture`; only auto-restart on benign ends. |
| Meeting audio not captured (mic hears user, not speakers) | Core value needs others' speech; set onboarding expectations and treat manual tap as a first-class complement. PRD US-2.1 "works with system audio" is only partially met in MVP. [L5] |
| Time overrun | Phases are independently shippable; drop Phase 4 polish first, **then localStorage (keep share)**, keep manual+speech core. [H7] |

---

## 7. Post-MVP backlog (explicitly deferred)

Custom word packs · multiplayer/real-time sync + shared link · leaderboard · image share card · achievement/streak system · more category packs (sales, board, client) · dark mode · PWA · plural/stemming-aware detection.

---

*Next step: execute Phase 1. Recommend building under `MeetingBingo/app/` or repo root `meeting-bingo/` — confirm location before scaffolding.*

---

## 8. Review Summary

Reviewed 2026-06-23 by VP Product, VP Engineering, VP Design (multi-perspective plan review). **22 issues** found: 1 Critical, 11 High, 6 Medium, 4 Low. All applied. For H2 and H6, the chosen path is **add plural strip + add analytics capture**.

### Changes Applied

| ID | Severity | Change |
|----|----------|--------|
| C1 | Critical | Corrected the false "audio never leaves device" privacy claim (§0, Phase 3) |
| H1 | High | Added preview/regenerate screen; timer starts on play, not screen-entry |
| H2 | High | Resolved US-2.3 fuzzy-match AC conflict via lightweight plural/tense strip |
| H3/H4 | High | Mandated ref-based `onend`/`onerror` refactor + restart backoff |
| H5 | High | Single source of truth: derive `filledCount`, drop optional hooks |
| H6 | High | Added minimal local analytics event capture |
| H7 | High | Protect share over localStorage when cutting scope under time pressure |
| H8/H9 | High | A11y baseline: roles, `aria-pressed`, `aria-live`, non-color cues |
| H10 | High | `prefers-reduced-motion` guard on animation + confetti |
| H11 | High | Discreet win-celebration default |
| M1 | Medium | One-shot `bounce-in` instead of permanent `animate-pulse` |
| M2 | Medium | Safe localStorage rehydration (force `isListening=false`, recompute count, try/catch) |
| M3 | Medium | Precomputed regexes + `React.memo` + final-only detection |
| M4/M5 | Medium | Near-win names the needed word; matched-square highlight |
| M6 | Medium | Mobile/split-screen layout as P0 from Phase 2 |
| L1 | Low | `generateCard` ≥24-unique dev assertion (original dup premise was inaccurate) |
| L2 | Low | `window.location.origin` for share URL |
| L3 | Low | "FREE SPACE" label consistency |
| L4 | Low | Free-space contrast check (4.5:1) |
| L5 | Low | System-audio expectation caveat in risks |

### Unresolved / Cosmetic

- [x] L6: reconciled Plan vs Architecture phase-timing — both now read **15 / 30 / 25 / 20 min** (Phase 1–4, 90 total). Architecture updated to match the plan.

## 9. Revision History

- **v1.1** (2026-06-23): Applied plan-review findings — 1 Critical, 11 High, 6 Medium, 4 Low. H2→plural strip, H6→analytics capture. Source: VP Product/Engineering/Design multi-perspective review.
- **v1.0** (2026-06-23): Initial implementation plan from UXR/PRD/Architecture source docs.
