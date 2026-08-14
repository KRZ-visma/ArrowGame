# Agent instructions — ARROW OUT

## Project

Browser-only arrow-escape puzzle: tap an arrow to slide it off the board in its tip direction when the path is clear. Progress is saved in `localStorage`. Live via GitHub Pages from `main` (root). No backend, no build step required to play (serve over HTTP so ES modules load — `file://` will not work).

## Stack (keep it this way)

- Vanilla HTML / CSS / JS — no framework, bundler, or TypeScript unless explicitly requested
- Native ES modules (`type="module"`) — no bundler
- Storage key: `arrow-out-level` (do not break without a migration). Owned keys live in `STORAGE_KEYS`; clear-all must remove every entry there
- Stars / unlocks: `arrow-out-stars` (`STARS_KEY`) JSON `{ best, unlocked, skipped }` — `best` maps level index → 1–3 (keep the higher on replay); `unlocked` is the furthest playable index; `skipped` is uncleared skipped indices (max `MAX_SKIPS` / 3). Completing a skipped level removes it and restores a skip. Old saves without `skipped` parse as `[]`. Do not fold this into `arrow-out-level`
- Strikes: 3 blocked taps (arrow cannot move) fail the run. Stars on a clear: 3 at par (arrow count), 2 at +1 tap, 1 otherwise — extras are blocked taps; each arrow leaves once so par is `arrows.length`
- UI copy language: **English**
- Unit tests: Node’s built-in test runner (`npm test` → `node --test test/`)
- Levels ship as a static pack in `js/levels-data.js`; regenerate with `npm run generate-levels -- [count]` (default 100). Every baked level must pass `isSolvable` (the generator repairs filler deadlocks; the script exits if a level is still stuck)

## Files (by domain)

| Domain | File(s) | Notes / tests |
| --- | --- | --- |
| Shell / markup | `index.html` | `viewport-fit=cover`; loads `game.js` as a module |
| Injected CSS + canvas UI / input | `game.js` | Brand, atmosphere, render, HUD (level + chances), end splash (win/fail + stars), All levels overlay, Menu overlay, pointer/keyboard |
| Escape / occupancy / move rules | `js/logic.js` | `canEscape`, `canEscapePath`, occupancy, `isSolvable` / `stuckArrows` (greedy clear is enough — leaving only frees cells) — **unit tests** |
| Level data & generation | `js/levels.js`, `js/level-build.js`, `js/levels-data.js` | Static pack + build helpers; `buildSolvableLevel` places multi-cell puzzle arrows (tails in center zone) then `fillEmptyCells` fills remaining **center** cells (prefer length 2, allow length 1; edges may stay empty); `repairToSolvable` then reorients leftover deadlocks (`fillEmptyCells` does not check escape, so two fillers can face each other); repair may reverse a snake (new tail can sit on an edge; at least one endpoint stays in the center); TUTORIAL is built via `buildTutorial()` for consistency — **unit tests** |
| Session progress / undo snapshots | `js/progress.js` | `localStorage` key helpers, undo JSON, `menuStats`, `clearAllProgress`, star records, skip quota (`MAX_SKIPS` / `skipLevel` / `canSkipLevel`), `starsForClear` / `MAX_STRIKES` — **unit tests** |
| Deploy | `.github/workflows/deploy-pages.yml` | Stages `index.html`, `game.js`, `js/*`, `.nojekyll` |
| CI unit tests | `.github/workflows/unit-tests.yml` | Runs `npm test` on push/PR |
| Agent instructions | `AGENTS.md` | Conventions, workflow, pitfalls — **update when a PR teaches something new** (see below) |

Touch only the relevant module(s) for a feature. Prefer extending these modules over growing unrelated logic back into `game.js`.

## Design

- Keep the existing visual system (Archivo Black + DM Sans, `.atmosphere`, brand-first **ARROW OUT**)
- No generic AI look (purple gradients, cream + terracotta, broadsheet)
- One job per section; board is the hero — no card clutter in the play surface
- **Primary target device: iPhone 16 Pro (Safari)** — mobile first; large touch targets; safe areas via `viewport-fit=cover` + `env(safe-area-inset-*)` (Dynamic Island, home indicator); canvas must remain usable on a ~393×852 viewport
- **Reset vs Menu vs Skip** — the toolbar Reset button restarts the **current** level only (and the fail splash Reset does the same). Level number, stats, All levels, skip, and “start over from zero” live in the Menu overlay (`btnMenu`). Skip also appears on the fail splash when a slot remains. Clear-all wipes every key in `STORAGE_KEYS` (currently `arrow-out-level` and `arrow-out-stars`) then starts level 0; do not fold that into Reset
- **Skip quota** — at most three outstanding skipped (uncleared) levels. Skip unlocks the next pack index. Finishing a skipped level from All levels restores a slot. Skip is disabled on cleared or already-skipped levels, and when the quota is empty
- **End splash** — win and fail share one overlay. Win shows stars + the next level number and requires **Next**. Fail tells the player they did not complete the level and requires **Reset**. Do not auto-advance

## Workflow

### Idea → approval → build

1. **Show a short idea first** — what you want to do, why, which modules/files, and risks (level solvability, storage, deploy paths). No code, no branch, no commit/PR in this phase.
2. **Stop and wait** for explicit user approval, e.g. **"ja bouwen"**, "build it", "go", "akkoord".
3. **Only then build** — without that confirmation do not implement, including “just preparing”.
4. **Exceptions:**
   - Pure questions / explanation → answer only, no build.
   - Explicit “build directly …” in the same request → may start immediately.
   - **Fine-tuning** an already approved idea (small adjustment within the same scope) → may continue without new approval.
   - Anything that is effectively a **new idea** (different direction, extra feature, other domain, other approach) → show a new idea and wait for approval again.

### Execution (after approval)

1. Small, focused diffs — only what the task asks; **one feature ≈ one domain module** when possible
2. Changes to level generation, escape rules, undo, or progress → add or update **unit tests** (not Playwright/UI tests). Use `npm test` (Node’s built-in runner) so pure logic imports without a browser
3. Before merge: unit tests must **pass** locally; the unit-test workflow must be green. When testing board coverage, check occupied cells (via Set size) not arrow count, since arrows can be multi-cell — and assert **center** cells are filled, not the full board (`fillEmptyCells` leaves edges empty). Assert every pack level (and generator output) is `isSolvable` — greedy removal is enough because a free arrow only vacates cells
4. UI / canvas / controls changes: verify on **iPhone 16 Pro**-sized viewport (≈ 393×852, DPR 3) — layout, touch, safe areas; note briefly in the PR that this was checked
5. Do not add secrets, analytics, or external APIs without asking
6. Commits/PRs short and clear; UI copy always English
7. Do not silently change the `localStorage` key or progress schema without a migration plan
8. If you split or rename shipped files, update `.github/workflows/deploy-pages.yml` so Pages still deploys every asset
9. Start/rebase PRs from recent `main` before merge; serialize parallel PRs that touch the same domain
10. Mark the pull request **ready for review** (not left as draft) when the change is ready — and wait until required checks are green
11. **Update `AGENTS.md` when the PR teaches something new** — see [Improve instructions](#improve-instructions-when-learned) below

### Improve instructions (when learned)

When a pull request surfaces something future agents should know, add a small, concrete note to `AGENTS.md`. If nothing new was learned, skip the update — do not pad the doc for its own sake.

**Good updates (pick what fits the PR):**

- New or moved file → add or adjust a row in **Files (by domain)**
- New convention, API, or storage detail → one bullet under **Stack**, **Design**, or **Do not**
- Bug, edge case, or solvability pitfall → short note so the mistake is not repeated
- Workflow or testing lesson → clarify **Execution** or link deploy/CI paths that were easy to miss

**How to keep it useful:**

- Minimal diff — usually one bullet, table row, or a tightened sentence; no drive-by rewrites
- Tie the note to this PR’s change (what changed, where it lives, what to watch for)
- In the PR description, add a one-line **Agent instructions** note when you updated the doc: what you added and why; if you skipped, say “nothing new to capture”

**When to skip:**

- Nothing new was learned — no update needed
- The PR’s only purpose is editing `AGENTS.md` (the doc change *is* the feature)
- A pure revert with no new lesson beyond “reverted X”

## Do not

- Ship a feature PR without updating `AGENTS.md` when the change introduced something future agents should know
- Change code without a prior idea and explicit approval (“ja bouwen” etc.), unless an exception above applies
- Add dependencies or a bundler “for later”
- Dump new domain logic into `game.js` when it belongs in `js/logic.js`, `js/levels.js`, or `js/progress.js`
- Silently change the localStorage schema — add keys to `STORAGE_KEYS` (as with `arrow-out-stars`) instead of overloading `arrow-out-level`. Additive fields on `arrow-out-stars` (such as `skipped`) must parse missing values as defaults so old saves keep working
- Overhaul hero/layout for a bugfix or small feature
- Merge while required checks are failing or still running
- Add Playwright/e2e UI tests by default — use **unit tests** for puzzle logic instead
- Ship a `LEVEL_PACK` entry that `isSolvable` rejects — `fillEmptyCells` can deadlock (facing fillers); `repairToSolvable` must run after fill, and `generate-levels` must fail the run if a level stays stuck
