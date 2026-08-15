# UI lane — play surface, overlays, board view

Edit this file for UI / canvas / overlay lessons. Prefer the matching code module below over `game.js` when possible.

## Modules

| Concern | File |
| --- | --- |
| Injected CSS + DOM shell | `js/ui-shell.js` |
| Contain-fit, zoom/pan, resize, screen↔board | `js/board-view.js` |
| Arrow/board paint + hit-test | `js/board-draw.js` |
| End splash, Menu, All levels, chance pips | `js/overlays.js` |
| Pinch/pan/tap → move | `js/pointer-input.js` |
| Shared `state` + star records box | `js/play-session.js` |
| Orchestration (load level, tryMove, win/fail) | `game.js` |

## Surface roles

- **Restart vs Menu vs Skip** — toolbar restart and fail-splash restart both redo the **current** level only. Level number, stats, All levels, skip, and start-over-from-zero live in the Menu overlay — do not show the level index on the play surface. Chance pips stay in the top bar beside Menu (always visible while playing). Skip also appears on the fail splash when a slot remains. Clear-all wipes every key in `STORAGE_KEYS` then starts level 0; do not fold that into current-level restart. Menu footer shows build id (`Version …` from `js/version.js`; deploy stamps a content hash — see `agents/pwa.md`)
- **Beta levels** — Menu action loads the hand-authored 3-board demo (`js/beta-level.js`). Outside the pack: no stars, unlocks, skips, or level-index save. Win splash has no stars; primary advances Beta 1→2→3, then returns to the pack level you left; retry / Restart replay the current beta board. Skip stays disabled while `state.beta`
- **Board view** — canvas fills the stage under the top bar (no letterboxed square chrome). Default fit **contains** the board square so the whole puzzle is visible (short axis); pinch/wheel can zoom in toward cover (long axis) and beyond; drag pans when the board overflows. Short taps still select arrows. Draw and hit-test share the same view transform; reset to contain-fit on level load / restart
- **Functional UI names** — player-facing labels name what the action does (Restart, Skip, Clear), not jargon (Reset). Code ids may stay technical (`btnReset`); copy / `title` / `aria-label` use the functional name
- **Skip quota (UI)** — Skip disabled on cleared or already-skipped levels, and when the quota is empty; finishing a skipped level restores a slot (logic in progress)
- **Overlay copy** — one fact per line. Kicker, title, body, and buttons must not restate the same destination, outcome, or action. Primary button is the action; body is not a second CTA
- **End splash** — win and fail share one overlay; do not auto-advance. Win shows stars + continue. A 1- or 2-star clear also offers retry-this-level on a button (not body copy); hide that retry on a 3-star win and on fail. Fail offers restart-this-level
- **All levels** — each cell shows three ★ `.level-pip` glyphs; earned ones need `.level-pip.filled` (accent color, not clip-path). Separate from `.star.filled` on the win splash
- Tip paint must match crawl/exit `dir` (see core `AGENTS.md`)

## Parallel work

- Overlay/copy PRs → `js/overlays.js` (+ this file)
- Board viewport/zoom PRs → `js/board-view.js` / `js/pointer-input.js`
- Paint/hit-test PRs → `js/board-draw.js`
- Avoid two agents on the same UI module at once
