/**
 * Single hand-authored beta demo level — not part of LEVEL_PACK or scoring.
 *
 * Replace `BETA_LEVEL` when trying a new idea. Keep generation notes below in sync.
 * Do not call `buildSolvableLevel` / `level-build` helpers; validate with `isSolvable` only.
 *
 * ## Generation rules (axis-traffic v1)
 *
 * Pack levels tend to place tails in the center zone with exit dirs radiating
 * outward (center → edge). That reads clearly but clears too easily: many tips
 * already face open rim.
 *
 * This beta prefers **axis traffic** instead:
 * - Long runs along rows (E / W) and columns (N / S), so arrows cross lanes.
 * - Exit corridors often pass through another arrow’s body — order matters.
 * - Openers may sit near a rim, but the puzzle is built from parallel flows
 *   (left↔right, top↔bottom), not a star of tips from the board center.
 * - Tip / last path segment must match crawl `dir` (same invariant as the pack).
 * - Cells must not overlap; every entry must pass `isSolvable(size, arrows)`.
 *
 * Built manually on an 8×8 grid; solvability asserted in `test/beta-level.test.js`.
 */

/** Stable id for this demo board (bump when swapping the hand-authored layout). */
export const BETA_LEVEL_ID = "axis-traffic-v1";

/**
 * @type {{ size: number, arrows: Array<{ dir: 'N' | 'E' | 'S' | 'W', path: [number, number][] }> }}
 */
export const BETA_LEVEL = {
  size: 8,
  arrows: [
    // Rim openers — still axis-aligned lanes, not center-radiating flocks
    { dir: "E", path: [[4, 0], [5, 0], [6, 0]] },
    { dir: "W", path: [[3, 7], [2, 7], [1, 7]] },

    // Eastbound row 2 gated by southbound col 6
    { dir: "E", path: [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2]] },
    { dir: "S", path: [[6, 1], [6, 2]] },

    // Westbound row 4 gated by northbound col 1
    { dir: "W", path: [[5, 4], [4, 4], [3, 4], [2, 4]] },
    { dir: "N", path: [[1, 5], [1, 4]] },

    // Eastbound row 6 gated by southbound col 4
    { dir: "E", path: [[0, 6], [1, 6], [2, 6], [3, 6]] },
    { dir: "S", path: [[4, 5], [4, 6]] },

    // Westbound row 3; northbound col 7 waits on its corridor
    { dir: "W", path: [[7, 3], [6, 3], [5, 3]] },
    { dir: "N", path: [[7, 6], [7, 5], [7, 4]] },
  ],
};

/**
 * Fresh clone for play / tests (pack loaders must not mutate the source).
 * @returns {{ size: number, arrows: Array<{ dir: 'N' | 'E' | 'S' | 'W', path: [number, number][] }> }}
 */
export function getBetaLevel() {
  return structuredClone(BETA_LEVEL);
}
