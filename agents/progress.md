# Progress lane — storage, skips, stars, strikes

## Modules

| Concern | File |
| --- | --- |
| Progress API | `js/progress.js` |
| Tests | `test/progress.test.js` |
| UI that calls skip/stars/HUD | `js/overlays.js` / `game.js` (prefer progress module for logic) |

## Storage

- `arrow-out-level` (`STORAGE_KEY`) — current level index; do not break without migration
- `arrow-out-stars` (`STARS_KEY`) JSON `{ best, unlocked, skipped }`:
  - `best` maps level index → 1–3 (keep the higher on replay)
  - `unlocked` is the furthest playable index
  - `skipped` is uncleared skipped indices (max `MAX_SKIPS` / 3)
- Completing a skipped level removes it and restores a skip
- Old saves without `skipped` parse as `[]`
- Do not fold stars/skips into `arrow-out-level`
- Owned keys live in `STORAGE_KEYS`; clear-all must remove every entry there
- Additive fields on `arrow-out-stars` must parse missing values as defaults

## Strikes and clear stars

- 3 blocked taps (arrow cannot move) fail the run (`MAX_STRIKES`)
- Stars on a clear: 3 at par (arrow count), 2 at +1 tap, 1 otherwise — extras are blocked taps; each arrow leaves once so par is `arrows.length`

## Skip quota

- At most three outstanding skipped (uncleared) levels
- Skip unlocks the next pack index
- Finishing a skipped level from All levels restores a slot
- Skip disabled on cleared or already-skipped levels, and when the quota is empty
- APIs: `MAX_SKIPS` / `skipLevel` / `canSkipLevel` / `skipsRemaining`
