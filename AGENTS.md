# Agent instructions — ARROW OUT

## Project

Browser-only arrow-escape puzzle: tap an arrow to slide it off the board in its tip direction when the path is clear. Progress is saved in `localStorage`. Live via GitHub Pages from `main` (root). No backend, no build step required to play.

## Stack (keep it this way)

- Vanilla HTML / CSS / JS — no framework, bundler, or TypeScript unless explicitly requested
- Prefer native ES modules (`type="module"`) when splitting files — no bundler
- Storage key: `arrow-out-level` (do not break without a migration)
- UI copy language: **English**

## Files (by domain)

Today most code still lives in a single `game.js`. **When a feature grows, prefer splitting into modules** by domain (like the table below) rather than growing one mega-file. Touch only the relevant module(s) for a feature.

| Domain | Suggested JS | Notes / tests |
| --- | --- | --- |
| Shell / markup / injected CSS | `index.html`, styles module or `styles.css` | Keep brand + atmosphere; no dashboard clutter |
| Level data & generation | `js/levels.js` (or extract from `game.js`) | Tutorial, hand levels, seeded generator — **unit tests** |
| Escape / occupancy / move rules | `js/logic.js` | `canEscape`, path blocking — **unit tests** |
| Session state / undo / progress | `js/state.js` | History stack, `localStorage` — **unit tests** where pure |
| Canvas render & animation | `js/render.js` | Drawing, slide/shake animation |
| Input / HUD / overlay wire-up | `js/main.js` or `js/ui.js` | Pointer, buttons, keyboard |
| Deploy | `.github/workflows/deploy-pages.yml` | Stages `index.html`, `game.js` (update if paths change) |

Entry today: `index.html` → `game.js`. After a split, update `index.html` (and the Pages workflow file list) accordingly. Until split, edit the matching section inside `game.js` and still add unit tests for pure logic you change.

## Design

- Keep the existing visual system (Archivo Black + DM Sans, `.atmosphere`, brand-first **ARROW OUT**)
- No generic AI look (purple gradients, cream + terracotta, broadsheet)
- One job per section; board is the hero — no card clutter in the play surface
- **Primary target device: iPhone 16 Pro (Safari)** — mobile first; large touch targets; safe areas (Dynamic Island, home indicator); canvas must remain usable on a ~393×852 viewport

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
2. Changes to level generation, escape rules, undo, or progress → add or update **unit tests** (not Playwright/UI tests). Prefer a lightweight Node test runner (e.g. Node’s built-in test runner or a minimal harness) that can import pure logic without a browser
3. Before merge: unit tests must **pass** locally; if a CI unit-test workflow exists, it must be green
4. UI / canvas / controls changes: verify on **iPhone 16 Pro**-sized viewport (≈ 393×852, DPR 3) — layout, touch, safe areas; note briefly in the PR that this was checked
5. Do not add secrets, analytics, or external APIs without asking
6. Commits/PRs short and clear; UI copy always English
7. Do not silently change the `localStorage` key or progress schema without a migration plan
8. If you split or rename shipped files, update `.github/workflows/deploy-pages.yml` so Pages still deploys every asset
9. Start/rebase PRs from recent `main` before merge; serialize parallel PRs that touch the same domain
10. Mark the pull request **ready for review** (not left as draft) when the change is ready — and wait until required checks are green

## Do not

- Change code without a prior idea and explicit approval (“ja bouwen” etc.), unless an exception above applies
- Add dependencies or a bundler “for later”
- Grow `game.js` further when the change clearly belongs in a new module — split instead
- Silently change the localStorage schema
- Overhaul hero/layout for a bugfix or small feature
- Merge while required checks are failing or still running
- Add Playwright/e2e UI tests by default — use **unit tests** for puzzle logic instead
