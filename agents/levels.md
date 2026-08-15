# Levels lane — generation, solvability, pack bake

## Modules

| Concern | File |
| --- | --- |
| Pack accessors | `js/levels.js` |
| Build / repair / complexity | `js/level-build.js` |
| Baked static pack | `js/levels-data.js` |
| Hand-authored beta demo (3-board ramp) | `js/beta-level.js` |
| Generator CLI | `scripts/generate-levels.js` |
| Tests | `test/levels.test.js`, `test/beta-level.test.js` (and logic tests when escape rules change) |

## Pack ownership

- **Do not rewrite `js/levels-data.js` unless this PR’s job is baking/shipping the pack.** Generator, solvability, complexity, or growth changes belong in `level-build` / `levels.js` / tests / `scripts/generate-levels.js` only.
- When the pack must update, prefer a **dedicated pack-bake PR** (or clearly own the pack in the same PR) so parallel levels-logic work does not collide on a 60k-line blob.
- Regenerate with `npm run generate-levels -- [count]` (default 100). Every baked level must pass `isSolvable` (generator repairs filler deadlocks; script exits if still stuck).

## Beta demo levels

- One Menu entry (**Beta levels**) loads `getBetaLevel(index)` from `js/beta-level.js` (`BETA_LEVELS`, cap `BETA_LEVEL_COUNT` = 3). Not in `LEVEL_PACK`; does not write stars, unlocks, skips, or `arrow-out-level`.
- Sequence ramps like pack **milestones**, not consecutive early levels: Beta 1 ≈ tutorial, Beta 2 ≈ pack ~20, Beta 3 ≈ mid/late pack. Win advances 1→2→3; after 3, primary returns to the pack level you left. Restart replays the current beta board only.
- Hand-author each board (swap `BETA_LEVELS` / bump `BETA_LEVEL_ID` when the experiment changes). **Do not** use `buildSolvableLevel` or other `level-build` generators — only assert `isSolvable`.
- Document the experiment’s placement rules in the header comment of `js/beta-level.js` (v2 = axis-traffic three-step ramp: row/column flows instead of center→edge radial tips).
- Play wiring: `state.beta` + `state.betaIndex` in `js/play-session.js`; Menu / win-fail copy in `js/overlays.js`; load/restart/advance in `game.js`. Precache `./js/beta-level.js` in `sw.js`.

## Generator invariants

- Pack order follows generation index (tutorial first) — do not sort by `levelComplexity`
- `levelComplexity` is clearance-led (`blocked0`, `waves`, `depthSum`) then direction spread (unique exit dirs + arrows off the dominant dir; uniform flocks score lower than mixed dirs); no board `size`. Analysis only — not used to reorder
- `levelParamsForIndex` must not drop size or snake-count after the hand specs; continue from the last hand spec
- Puzzle-arrow `minBends` ramps with pack index (`minBendsForLevelIndex`: 0 until 20, then +1 each 10 levels); growth hugs occupied cells and softens the floor only when nothing fits
- `buildSolvableLevel` places winding multi-cell puzzle arrows via `growWindingPath` (bends, U-turns, multi-turn curls/coils; `minBends` floor; last segment matches exit dir; tails in center zone) then `fillEmptyCells` fills remaining **center** cells (prefer a 3-cell L — always when `minBends` ≥ 1 — then length 2, allow length 1; edges may stay empty)
- `repairToSolvable` after fill — fillers can face each other; repair may reverse a snake (new tail may sit on an edge; at least one endpoint stays in the center)
- `makeHandLevel` keeps the densest **solvable** candidate across seed retries; TUTORIAL via `buildTutorial()` includes an L-shape
- Do not place a winding arrow whose head crawls into its own body — `canEscapePath` rejects tight inward spirals; U-turns must end traveling in the exit dir
- Tip / last segment must match crawl `dir`
- When testing coverage: occupied cells (Set size), assert **center** cells filled — not full board
