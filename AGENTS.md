# Agent instructions — ARROW OUT

## Project

Browser-only arrow-escape puzzle: tap an arrow to slide it off the board in its tip direction when the path is clear. Progress is saved in `localStorage`. Live via GitHub Pages from `main` (root). No backend, no build step required to play (serve over HTTP so ES modules load — `file://` will not work).

## Stack (keep it this way)

- Vanilla HTML / CSS / JS — no framework, bundler, or TypeScript unless explicitly requested
- Native ES modules (`type="module"`) — no bundler
- Storage key: `arrow-out-level` (do not break without a migration). Owned keys live in `STORAGE_KEYS`; clear-all must remove every entry there
- Stars / unlocks: `arrow-out-stars` (`STARS_KEY`) JSON `{ best, unlocked, skipped }` — see `agents/progress.md`
- Strikes / stars-on-clear: see `agents/progress.md` (par = `arrows.length`)
- UI copy language: **English**
- Unit tests: Node’s built-in test runner (`npm test` → `node --test test/`)
- Levels: static pack in `js/levels-data.js` — details and **pack ownership** in `agents/levels.md`
- PWA: `manifest.webmanifest` + root `sw.js` — details in `agents/pwa.md`
- Play UI is split across `game.js` + `js/ui-shell.js`, `js/board-view.js`, `js/board-draw.js`, `js/overlays.js`, `js/pointer-input.js`, `js/play-session.js` — see `agents/ui.md`

## Files (by domain)

| Domain | File(s) | Notes / tests |
| --- | --- | --- |
| Shell / markup | `index.html` | `viewport-fit=cover`; loads `game.js` as a module; manifest + theme-color + apple-touch-icon; registers `./sw.js` |
| PWA | `manifest.webmanifest`, `sw.js`, `icons/*` | Lane: `agents/pwa.md` — **unit tests** (`test/pwa.test.js`) |
| Play orchestration | `game.js` | Level load, moves/strikes/win-fail, wires UI modules |
| UI shell / CSS | `js/ui-shell.js` | Injected CSS + DOM shell — lane: `agents/ui.md` |
| Board view | `js/board-view.js` | Cover-fit, zoom/pan, resize, screen↔board — lane: `agents/ui.md` |
| Board draw | `js/board-draw.js` | Arrow/board paint + hit-test — lane: `agents/ui.md` |
| Overlays | `js/overlays.js` | End splash, Menu, All levels — lane: `agents/ui.md` |
| Pointer input | `js/pointer-input.js` | Pinch/pan/tap — lane: `agents/ui.md` |
| Play session | `js/play-session.js` | Shared `state` + star records box for UI modules |
| Escape / occupancy / move rules | `js/logic.js` | `canEscape`, `canEscapePath`, occupancy, `isSolvable` / `stuckArrows` — **unit tests** |
| Level data & generation | `js/levels.js`, `js/level-build.js`, `js/levels-data.js` | Lane: `agents/levels.md` — **unit tests** |
| Session progress | `js/progress.js` | Lane: `agents/progress.md` — **unit tests** |
| Deploy | `.github/workflows/deploy-pages.yml` | Stages `index.html`, `game.js`, `js/*`, `manifest.webmanifest`, `sw.js`, `icons/*`, `.nojekyll` |
| CI unit tests | `.github/workflows/unit-tests.yml` | Runs `npm test` on push/PR |
| Agent instructions | `AGENTS.md` + `agents/*.md` | Core contract here; lane lessons in `agents/` — see below |

Touch only the relevant module(s) for a feature. Prefer extending domain modules over growing unrelated logic back into `game.js`.

## Design (invariants)

- Keep the existing visual system (Archivo Black + DM Sans, `.atmosphere`, brand-first **ARROW OUT**)
- No generic AI look (purple gradients, cream + terracotta, broadsheet)
- One job per section; board is the hero — no card clutter in the play surface
- **Primary target device: iPhone 16 Pro (Safari)** — mobile first; large touch targets; safe areas via `viewport-fit=cover` + `env(safe-area-inset-*)`; canvas usable on ~393×852; PWA standalone + apple-touch meta (`theme_color` / `background_color` `#050505`)
- The painted **tip points the crawl/exit `dir`**. Last path segment matches `dir`
- Surface roles, overlays, board view, skip quota, copy rules: **`agents/ui.md`**

## Workflow

### Idea → approval → build

1. **Show a short idea first** — what you want to do, why, which modules/files, and risks (level solvability, storage, deploy paths). **Validate the request:** if it fights a core read (tip = leave direction, mobile-first, …) or looks like a worse game, say so, give a short opinion and an alternative, and wait. No code, no branch, no commit/PR in this phase.
2. **Stop and wait** for explicit user approval, e.g. **"build it"**, "go", "approved", "ok to build".
3. **Only then build** — without that confirmation do not implement, including “just preparing”.
4. **Exceptions:**
   - Pure questions / explanation → answer only, no build.
   - Explicit “build directly …” in the same request → may start immediately **unless** the request fights a core rule; then still push back first.
   - **Fine-tuning** an already approved idea (small adjustment within the same scope) → may continue without new approval, but still flag it if the tweak would break a core read (e.g. tip ≠ leave direction).
   - Anything that is effectively a **new idea** → show a new idea and wait for approval again.

### Parallel lanes (reduce merge conflicts)

Name the lane in the prompt and edit **only that lane’s files** (code + matching `agents/*.md`):

| Lane | Primary code | Instruction file |
| --- | --- | --- |
| UI shell / CSS | `js/ui-shell.js` | `agents/ui.md` |
| Board view / draw / input | `js/board-view.js`, `js/board-draw.js`, `js/pointer-input.js` | `agents/ui.md` |
| Overlays / HUD copy | `js/overlays.js` | `agents/ui.md` |
| Play wiring | `game.js`, `js/play-session.js` | `agents/ui.md` (sparingly) |
| Levels generator | `js/level-build.js`, `js/levels.js`, `scripts/generate-levels.js`, `test/levels.test.js` | `agents/levels.md` |
| Pack bake | `js/levels-data.js` only when the PR owns the pack | `agents/levels.md` |
| Progress / storage | `js/progress.js`, `test/progress.test.js` | `agents/progress.md` |
| PWA / deploy assets | `sw.js`, `manifest.webmanifest`, `icons/*`, deploy workflow | `agents/pwa.md` |
| Core contract | `AGENTS.md` | Rare — invariants, workflow gate, Files table rows |

Do not put two agents on the same primary file. UI overlay work and board-view work can run in parallel; two overlay PRs should not.

### Execution (after approval)

1. Small, focused diffs — **one feature ≈ one domain module** when possible
2. Changes to level generation, escape rules, undo, or progress → add or update **unit tests**. Use `npm test`
3. Before merge: unit tests must **pass** locally; CI green. Board coverage: occupied cells (Set size), assert **center** cells filled. Assert every pack level is `isSolvable`
4. UI / canvas / controls: verify on **iPhone 16 Pro**-sized viewport (≈ 393×852, DPR 3); note in the PR
5. No secrets, analytics, or external APIs without asking
6. Commits/PRs short and clear; UI copy always English
7. Do not silently change the `localStorage` key or progress schema without a migration plan
8. Split/rename shipped files → update deploy-pages + bump `CACHE_NAME` / PRECACHE in `sw.js` (see `agents/pwa.md`)
9. Start/rebase PRs from recent `main` before merge; avoid parallel PRs that share a primary file
10. Mark the PR **ready for review** when ready; wait for required checks
11. **Update agent instructions when the PR teaches something new** — prefer the **lane file** in `agents/`; touch `AGENTS.md` only for core contract / Files table / workflow

### Improve instructions (when learned)

Add a small, concrete note to the **matching lane file** under `agents/`. Use `AGENTS.md` only for cross-cutting invariants, new Files-table rows, or workflow changes. If nothing new was learned, skip.

**Good updates:** new file → Files table + lane note; storage/API → `agents/progress.md` or Stack pointer; UI surface rule → `agents/ui.md` (roles, not frozen labels); solvability pitfall → `agents/levels.md`.

**How to keep it useful:** minimal diff; one bullet; PR description one-liner for Agent instructions (what file + why), or “nothing new to capture”.

**When to skip:** nothing learned; the PR’s only purpose is editing instructions; pure revert.

## Do not

- Ship a feature PR without updating the matching `agents/*.md` (or `AGENTS.md` for core contract) when the change introduced something future agents should know
- Change code without a prior idea and explicit approval (“build it” / “go” etc.), unless an exception above applies
- Add dependencies or a bundler “for later”
- Dump new domain logic into `game.js` when it belongs in `js/logic.js`, `js/levels.js`, `js/progress.js`, or a UI lane module
- Silently change the localStorage schema — add keys to `STORAGE_KEYS`; additive `arrow-out-stars` fields must parse missing values as defaults
- Overhaul hero/layout for a bugfix or small feature
- Merge while required checks are failing or still running
- Add Playwright/e2e UI tests by default — use **unit tests** for puzzle logic instead
- Rewrite `js/levels-data.js` unless the PR’s job is baking/shipping the pack — see `agents/levels.md`
- Ship a `LEVEL_PACK` entry that `isSolvable` rejects — see `agents/levels.md`
- Place a winding arrow whose head crawls into its own body — see `agents/levels.md`
- Paint a tip that disagrees with how the arrow leaves — last segment and chevron match crawl `dir`
- Execute a gameplay change that fights a core read just because the user asked — push back first
- Reset generated `size`/`count` after `HAND_LEVEL_SPECS` — continue from the last hand spec; pack order = generation index (do not sort by `levelComplexity`)
