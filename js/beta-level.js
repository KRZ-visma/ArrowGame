/**
 * Hand-authored beta demo sequence — not part of LEVEL_PACK or scoring.
 *
 * Three boards that jump in complexity like pack milestones (not consecutive
 * early levels): Beta 1 ≈ tutorial, Beta 2 ≈ pack ~20, Beta 3 ≈ mid/late pack.
 * Keep generation notes below in sync when swapping boards.
 * Do not call `buildSolvableLevel` / `level-build` helpers; validate with `isSolvable` only.
 *
 * ## Generation rules (axis-traffic v3 — winding ramp)
 *
 * Pack levels tend to place tails in the center zone with exit dirs radiating
 * outward (center → edge). That reads clearly but clears too easily: many tips
 * already face open rim.
 *
 * This beta prefers **axis traffic** instead:
 * - Long runs along rows (E / W) and columns (N / S), so arrows cross lanes.
 * - Exit corridors often pass through another arrow's body — order matters.
 * - Openers may sit near a rim, but the puzzle is built from parallel flows
 *   (left↔right, top↔bottom), not a star of tips from the board center.
 * - Tip / last path segment must match crawl `dir` (same invariant as the pack).
 * - Cells must not overlap; every entry must pass `isSolvable(size, arrows)`.
 *
 * **Winding shapes** (same vocabulary as pack `growWindingPath`):
 * - Bent — one 90° turn (L / jog).
 * - U-turn — walk opposite the exit, jog, then head out (reversal).
 * - Curl — two or more turns (staircase, hook, coil; often with a reversal).
 *
 * Ramp (max 3):
 * - Beta 1 — 6×6, tutorial read: mostly straights + L-bends + one U-turn.
 * - Beta 2 — 15×15, dense crossings (~pack level 20): many bends / U-turns / curls.
 * - Beta 3 — 16×16, denser traffic (~mid/late pack): curls, U-turns, and bend combos.
 *
 * Solvability asserted in `test/beta-level.test.js`.
 */

/** Stable id for this demo sequence (bump when swapping the hand-authored layouts). */
export const BETA_LEVEL_ID = "axis-traffic-v3";

/** Number of boards in the beta sequence (fixed cap). */
export const BETA_LEVEL_COUNT = 3;

/**
 * @typedef {{ size: number, arrows: Array<{ dir: 'N' | 'E' | 'S' | 'W', path: [number, number][] }> }} BetaBoard
 */

/**
 * @type {BetaBoard[]}
 */
export const BETA_LEVELS = [
  {
    // Beta 1 — tutorial scale (L-bends + one U-turn)
    size: 6,
    arrows: [
      { dir: "E", path: [[0, 0], [0, 1], [1, 1], [2, 1]] },
      { dir: "W", path: [[5, 5], [5, 4], [4, 4], [3, 4]] },
      { dir: "S", path: [[0, 4], [0, 5]] },
      { dir: "N", path: [[5, 1], [5, 0]] },
      { dir: "E", path: [[3, 2], [2, 2], [1, 2], [1, 3], [2, 3], [3, 3], [4, 3]] },
      { dir: "N", path: [[1, 5], [2, 5], [2, 4]] },
      { dir: "W", path: [[4, 0], [3, 0], [2, 0], [1, 0]] },
      { dir: "E", path: [[4, 1], [4, 2], [5, 2]] },
      { dir: "S", path: [[0, 2], [0, 3]] },
      { dir: "E", path: [[3, 5], [4, 5]] },
    ],
  },
  {
    // Beta 2 — ~pack level 20 scale (bends / U-turns)
    size: 15,
    arrows: [
      { dir: "W", path: [[6, 10], [5, 10], [4, 10], [4, 9], [3, 9], [2, 9]] },
      { dir: "W", path: [[11, 8], [12, 8], [12, 9], [12, 10], [11, 10]] },
      { dir: "N", path: [[13, 9], [13, 8], [13, 7], [13, 6], [12, 6], [12, 5], [12, 4]] },
      { dir: "N", path: [[12, 11], [12, 12], [12, 13], [13, 13], [13, 12], [13, 11]] },
      { dir: "E", path: [[5, 11], [4, 11], [3, 11], [2, 11], [2, 12], [3, 12], [4, 12], [5, 12]] },
      { dir: "S", path: [[3, 6], [4, 6], [5, 6], [6, 6], [7, 6], [8, 6], [8, 7], [8, 8]] },
      { dir: "E", path: [[9, 11], [9, 10], [9, 9], [9, 8], [9, 7], [9, 6], [9, 5], [10, 5]] },
      { dir: "E", path: [[1, 5], [1, 6], [0, 6], [0, 7], [0, 8], [1, 8], [2, 8]] },
      { dir: "E", path: [[1, 10], [0, 10], [0, 11], [0, 12], [1, 12]] },
      { dir: "E", path: [[3, 7], [4, 7], [4, 8], [5, 8], [6, 8], [6, 9], [7, 9], [8, 9]] },
      { dir: "S", path: [[6, 1], [6, 0], [7, 0], [8, 0], [8, 1]] },
      { dir: "W", path: [[8, 10], [8, 11], [7, 11]] },
      { dir: "E", path: [[5, 3], [6, 3], [7, 3], [7, 2], [8, 2]] },
      { dir: "W", path: [[10, 3], [11, 3], [11, 4], [10, 4]] },
      { dir: "S", path: [[4, 1], [4, 2], [3, 2], [3, 3], [3, 4], [3, 5]] },
      { dir: "N", path: [[10, 11], [10, 12], [11, 12], [11, 13], [11, 14], [10, 14], [9, 14], [9, 13]] },
      { dir: "E", path: [[3, 13], [2, 13], [1, 13], [0, 13], [0, 14], [1, 14], [2, 14], [3, 14]] },
      { dir: "N", path: [[9, 2], [10, 2], [10, 1]] },
      { dir: "S", path: [[2, 4], [1, 4], [0, 4], [0, 5]] },
      { dir: "N", path: [[1, 2], [1, 3], [0, 3], [0, 2]] },
      { dir: "S", path: [[6, 7], [7, 7], [7, 8]] },
      { dir: "E", path: [[11, 2], [11, 1], [12, 1]] },
      { dir: "E", path: [[11, 6], [10, 6], [10, 7], [11, 7]] },
      { dir: "W", path: [[2, 6], [2, 7], [1, 7]] },
      { dir: "S", path: [[8, 3], [8, 4], [7, 4], [7, 5]] },
      { dir: "E", path: [[4, 13], [5, 13], [6, 13], [7, 13], [7, 14], [8, 14]] },
      { dir: "N", path: [[13, 10], [14, 10], [14, 9]] },
      { dir: "S", path: [[6, 12], [7, 12], [8, 12], [8, 13]] },
      { dir: "N", path: [[6, 5], [5, 5], [5, 4]] },
      { dir: "E", path: [[10, 0], [11, 0], [12, 0]] },
      { dir: "E", path: [[10, 8], [10, 9], [11, 9]] },
      { dir: "N", path: [[13, 0], [13, 1], [14, 1], [14, 0]] },
      { dir: "N", path: [[13, 3], [12, 3], [12, 2]] },
      { dir: "S", path: [[5, 0], [4, 0], [3, 0], [3, 1]] },
      { dir: "N", path: [[14, 8], [14, 7], [14, 6], [14, 5], [14, 4], [14, 3]] },
      { dir: "S", path: [[1, 1], [2, 1], [2, 2]] },
      { dir: "N", path: [[13, 14], [14, 14], [14, 13]] },
      { dir: "E", path: [[0, 1], [0, 0], [1, 0]] },
      { dir: "N", path: [[6, 2], [5, 2], [5, 1]] },
    ],
  },
  {
    // Beta 3 — mid/late pack scale (curls / U-turns / bends)
    size: 16,
    arrows: [
      { dir: "N", path: [[7, 11], [6, 11], [6, 10], [6, 9], [5, 9], [4, 9], [4, 8]] },
      { dir: "W", path: [[11, 4], [12, 4], [13, 4], [13, 3], [12, 3], [11, 3]] },
      { dir: "W", path: [[8, 2], [8, 1], [7, 1], [7, 0], [6, 0], [5, 0]] },
      { dir: "N", path: [[10, 9], [11, 9], [12, 9], [12, 8], [12, 7], [13, 7], [14, 7], [14, 6]] },
      { dir: "N", path: [[4, 3], [3, 3], [2, 3], [1, 3], [1, 2], [0, 2], [0, 1]] },
      { dir: "W", path: [[10, 12], [11, 12], [12, 12], [12, 11], [12, 10], [11, 10], [10, 10]] },
      { dir: "S", path: [[5, 3], [5, 4], [4, 4], [4, 5], [3, 5], [3, 6], [3, 7]] },
      { dir: "N", path: [[8, 8], [8, 9], [8, 10], [9, 10], [9, 9], [9, 8]] },
      { dir: "E", path: [[5, 13], [5, 14], [5, 15], [6, 15], [7, 15], [7, 14], [8, 14], [9, 14], [10, 14]] },
      { dir: "W", path: [[9, 5], [9, 6], [9, 7], [8, 7], [7, 7], [7, 6], [8, 6], [8, 5], [7, 5]] },
      { dir: "S", path: [[1, 1], [1, 0], [2, 0], [2, 1]] },
      { dir: "N", path: [[13, 11], [13, 12], [14, 12], [14, 11]] },
      { dir: "E", path: [[3, 13], [2, 13], [1, 13], [1, 14], [1, 15], [2, 15], [3, 15], [3, 14], [4, 14]] },
      { dir: "W", path: [[14, 2], [15, 2], [15, 3], [15, 4], [14, 4]] },
      { dir: "S", path: [[11, 6], [11, 5], [10, 5], [10, 6], [10, 7], [11, 7], [11, 8]] },
      { dir: "N", path: [[8, 11], [8, 12], [9, 12], [9, 11]] },
      { dir: "N", path: [[6, 1], [5, 1], [5, 2], [4, 2], [3, 2], [3, 1]] },
      { dir: "W", path: [[8, 4], [9, 4], [10, 4], [10, 3], [9, 3], [8, 3]] },
      { dir: "W", path: [[6, 6], [6, 5], [6, 4], [6, 3], [7, 3], [7, 2], [6, 2]] },
      { dir: "N", path: [[13, 10], [13, 9], [14, 9], [14, 8], [15, 8], [15, 7], [15, 6]] },
      { dir: "E", path: [[1, 8], [0, 8], [0, 7], [1, 7]] },
      { dir: "W", path: [[12, 6], [13, 6], [13, 5], [12, 5]] },
      { dir: "W", path: [[3, 12], [3, 11], [2, 11]] },
      { dir: "W", path: [[2, 8], [3, 8], [3, 9], [2, 9]] },
      { dir: "N", path: [[4, 6], [4, 7], [5, 7], [5, 6]] },
      { dir: "S", path: [[2, 12], [1, 12], [0, 12], [0, 13], [0, 14]] },
      { dir: "E", path: [[8, 0], [9, 0], [10, 0], [11, 0]] },
      { dir: "S", path: [[14, 13], [15, 13], [15, 14]] },
      { dir: "N", path: [[13, 0], [13, 1], [12, 1], [12, 0]] },
      { dir: "W", path: [[0, 4], [1, 4], [1, 5], [1, 6], [0, 6]] },
      { dir: "E", path: [[14, 14], [14, 15], [15, 15]] },
      { dir: "W", path: [[12, 2], [11, 2], [10, 2], [10, 1], [9, 1]] },
      { dir: "W", path: [[1, 9], [1, 10], [0, 10]] },
      { dir: "N", path: [[6, 12], [6, 13], [7, 13], [7, 12]] },
      { dir: "S", path: [[2, 5], [2, 6], [2, 7]] },
      { dir: "N", path: [[5, 10], [5, 11], [4, 11], [4, 10]] },
      { dir: "W", path: [[7, 9], [7, 8], [6, 8]] },
      { dir: "N", path: [[15, 1], [14, 1], [14, 0]] },
      { dir: "E", path: [[12, 13], [12, 14], [13, 14]] },
      { dir: "W", path: [[4, 1], [4, 0], [3, 0]] },
      { dir: "E", path: [[4, 13], [4, 12], [5, 12]] },
      { dir: "E", path: [[11, 14], [11, 15], [12, 15]] },
      { dir: "N", path: [[14, 10], [15, 10], [15, 9]] },
    ],
  },

];

/** @deprecated Use BETA_LEVELS[0]; kept for callers that expect a single board shape. */
export const BETA_LEVEL = BETA_LEVELS[0];

/**
 * Fresh clone for play / tests (pack loaders must not mutate the source).
 * @param {number} [index=0] Board index in `[0, BETA_LEVEL_COUNT)`.
 * @returns {BetaBoard}
 */
export function getBetaLevel(index = 0) {
  const i = Math.max(0, Math.min(BETA_LEVEL_COUNT - 1, Math.floor(index)));
  return structuredClone(BETA_LEVELS[i]);
}
