/**
 * Hand-authored beta demo sequence — not part of LEVEL_PACK or scoring.
 *
 * Three boards that jump in complexity like pack milestones (not consecutive
 * early levels): Beta 1 ≈ tutorial, Beta 2 ≈ pack ~20, Beta 3 ≈ mid/late pack.
 * Keep generation notes below in sync when swapping boards.
 * Do not call `buildSolvableLevel` / `level-build` helpers; validate with `isSolvable` only.
 *
 * ## Generation rules (axis-traffic v2 — three-step ramp)
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
 * Ramp (max 3):
 * - Beta 1 — 6×6, few gated corridors (tutorial read).
 * - Beta 2 — 15×15, dense crossings (~pack level 20 scale).
 * - Beta 3 — 16×16, denser traffic / deeper clearance (~mid/late pack).
 *
 * Solvability asserted in `test/beta-level.test.js`.
 */

/** Stable id for this demo sequence (bump when swapping the hand-authored layouts). */
export const BETA_LEVEL_ID = "axis-traffic-v2";

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
    // Beta 1 — tutorial scale
    size: 6,
    arrows: [
      { dir: "E", path: [[0, 0], [1, 0], [2, 0]] },
      { dir: "W", path: [[5, 5], [4, 5], [3, 5]] },
      { dir: "S", path: [[0, 4], [0, 5]] },
      { dir: "N", path: [[5, 1], [5, 0]] },
      { dir: "E", path: [[0, 2], [1, 2], [2, 2], [3, 2]] },
      { dir: "E", path: [[4, 2], [5, 2]] },
      { dir: "W", path: [[5, 3], [4, 3], [3, 3], [2, 3]] },
      { dir: "W", path: [[1, 3], [0, 3]] },
    ],
  },
  {
    // Beta 2 — ~pack level 20 scale
    size: 15,
    arrows: [
      { dir: "N", path: [[5, 9], [5, 8], [5, 7], [5, 6], [5, 5], [5, 4], [5, 3], [5, 2]] },
      { dir: "E", path: [[0, 12], [1, 12], [2, 12], [3, 12], [4, 12], [5, 12], [6, 12], [7, 12]] },
      { dir: "S", path: [[12, 0], [12, 1], [12, 2], [12, 3], [12, 4], [12, 5], [12, 6], [12, 7]] },
      { dir: "W", path: [[14, 10], [13, 10], [12, 10], [11, 10], [10, 10], [9, 10], [8, 10]] },
      { dir: "W", path: [[14, 11], [13, 11], [12, 11], [11, 11], [10, 11], [9, 11], [8, 11]] },
      { dir: "S", path: [[6, 13], [6, 14]] },
      { dir: "N", path: [[7, 9], [7, 8], [7, 7], [7, 6], [7, 5], [7, 4]] },
      { dir: "E", path: [[7, 14], [8, 14]] },
      { dir: "W", path: [[6, 0], [5, 0], [4, 0], [3, 0], [2, 0]] },
      { dir: "E", path: [[10, 12], [11, 12], [12, 12], [13, 12]] },
      { dir: "S", path: [[5, 13], [5, 14]] },
      { dir: "N", path: [[1, 9], [1, 8], [1, 7], [1, 6], [1, 5], [1, 4], [1, 3], [1, 2]] },
      { dir: "W", path: [[9, 1], [8, 1], [7, 1], [6, 1], [5, 1]] },
      { dir: "S", path: [[14, 13], [14, 14]] },
      { dir: "E", path: [[9, 9], [10, 9]] },
      { dir: "N", path: [[0, 6], [0, 5], [0, 4]] },
      { dir: "N", path: [[11, 9], [11, 8], [11, 7], [11, 6], [11, 5]] },
      { dir: "W", path: [[4, 1], [3, 1]] },
      { dir: "S", path: [[2, 13], [2, 14]] },
      { dir: "W", path: [[1, 13], [0, 13]] },
      { dir: "S", path: [[12, 13], [12, 14]] },
      { dir: "N", path: [[14, 7], [14, 6], [14, 5], [14, 4], [14, 3]] },
      { dir: "E", path: [[12, 8], [13, 8], [14, 8]] },
      { dir: "E", path: [[13, 9], [14, 9]] },
      { dir: "W", path: [[4, 10], [3, 10]] },
      { dir: "N", path: [[11, 4], [11, 3], [11, 2]] },
      { dir: "W", path: [[2, 10], [1, 10]] },
      { dir: "E", path: [[13, 0], [14, 0]] },
      { dir: "N", path: [[10, 8], [10, 7], [10, 6], [10, 5]] },
      { dir: "S", path: [[9, 12], [9, 13], [9, 14]] },
    ],
  },
  {
    // Beta 3 — mid/late pack scale
    size: 16,
    arrows: [
      { dir: "N", path: [[14, 8], [14, 7], [14, 6], [14, 5], [14, 4], [14, 3], [14, 2], [14, 1], [14, 0]] },
      { dir: "E", path: [[0, 9], [1, 9], [2, 9], [3, 9], [4, 9], [5, 9], [6, 9], [7, 9], [8, 9]] },
      { dir: "S", path: [[13, 0], [13, 1], [13, 2], [13, 3], [13, 4], [13, 5], [13, 6], [13, 7], [13, 8]] },
      { dir: "W", path: [[15, 13], [14, 13], [13, 13], [12, 13], [11, 13], [10, 13], [9, 13], [8, 13], [7, 13]] },
      { dir: "W", path: [[14, 12], [13, 12], [12, 12], [11, 12], [10, 12], [9, 12], [8, 12], [7, 12], [6, 12]] },
      { dir: "N", path: [[6, 6], [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0]] },
      { dir: "E", path: [[0, 11], [1, 11], [2, 11], [3, 11], [4, 11], [5, 11], [6, 11], [7, 11]] },
      { dir: "S", path: [[12, 14], [12, 15]] },
      { dir: "W", path: [[15, 10], [14, 10], [13, 10], [12, 10], [11, 10], [10, 10], [9, 10], [8, 10], [7, 10]] },
      { dir: "N", path: [[3, 8], [3, 7], [3, 6], [3, 5], [3, 4], [3, 3], [3, 2]] },
      { dir: "S", path: [[4, 14], [4, 15]] },
      { dir: "E", path: [[8, 11], [9, 11], [10, 11], [11, 11], [12, 11], [13, 11], [14, 11]] },
      { dir: "W", path: [[4, 0], [3, 0], [2, 0], [1, 0], [0, 0]] },
      { dir: "E", path: [[9, 9], [10, 9], [11, 9]] },
      { dir: "N", path: [[9, 6], [9, 5], [9, 4], [9, 3], [9, 2], [9, 1]] },
      { dir: "S", path: [[8, 14], [8, 15]] },
      { dir: "N", path: [[12, 9], [12, 8], [12, 7], [12, 6]] },
      { dir: "W", path: [[2, 14], [1, 14]] },
      { dir: "S", path: [[6, 13], [6, 14]] },
      { dir: "W", path: [[4, 13], [3, 13], [2, 13], [1, 13], [0, 13]] },
      { dir: "N", path: [[8, 3], [8, 2], [8, 1]] },
      { dir: "S", path: [[5, 13], [5, 14]] },
      { dir: "E", path: [[13, 14], [14, 14], [15, 14]] },
      { dir: "W", path: [[6, 10], [5, 10], [4, 10], [3, 10]] },
      { dir: "E", path: [[13, 9], [14, 9]] },
      { dir: "N", path: [[11, 6], [11, 5], [11, 4]] },
      { dir: "W", path: [[1, 5], [0, 5]] },
      { dir: "E", path: [[13, 15], [14, 15], [15, 15]] },
      { dir: "S", path: [[11, 14], [11, 15]] },
      { dir: "N", path: [[15, 9], [15, 8], [15, 7], [15, 6], [15, 5], [15, 4], [15, 3], [15, 2], [15, 1]] },
      { dir: "N", path: [[10, 7], [10, 6], [10, 5], [10, 4], [10, 3], [10, 2], [10, 1], [10, 0]] },
      { dir: "W", path: [[2, 12], [1, 12]] },
      { dir: "W", path: [[2, 8], [1, 8], [0, 8]] },
      { dir: "N", path: [[7, 8], [7, 7], [7, 6], [7, 5]] },
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
