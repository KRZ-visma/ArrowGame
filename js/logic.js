/** @typedef {'N' | 'E' | 'S' | 'W'} Dir */
/** @typedef {{ x: number, y: number }} Cell */

export const DIRS = /** @type {const} */ (["N", "E", "S", "W"]);

/** @type {Record<Dir, Cell>} */
export const DELTA = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 },
};

/** Array deltas for the level generator. @type {Record<Dir, [number, number]>} */
export const DELTA_ARR = {
  N: [0, -1],
  E: [1, 0],
  S: [0, 1],
  W: [-1, 0],
};

/** @type {Record<Dir, Dir[]>} */
export const TURNS = {
  N: ["E", "W"],
  E: ["N", "S"],
  S: ["E", "W"],
  W: ["N", "S"],
};

/**
 * @param {number} x
 * @param {number} y
 */
export function cellKey(x, y) {
  return `${x},${y}`;
}

/**
 * @param {number} x
 * @param {number} y
 * @param {Dir} dir
 * @param {number} size
 */
export function stepsToExit(x, y, dir, size) {
  const { x: dx, y: dy } = DELTA[dir];
  if (dx === 1) return size - x;
  if (dx === -1) return x + 1;
  if (dy === 1) return size - y;
  return y + 1;
}

/**
 * Normalize path cells to `{ x, y }`.
 * @param {Array<Cell | [number, number]>} path
 * @returns {Cell[]}
 */
export function normalizePath(path) {
  return path.map((p) => (Array.isArray(p) ? { x: p[0], y: p[1] } : { x: p.x, y: p.y }));
}

/**
 * Whether translating `path` in `dir` is blocked by `occupied` cells.
 * The whole polyline slides rigidly; any foreign cell on the swept path blocks it.
 *
 * @param {Array<Cell | [number, number]>} path
 * @param {Dir} dir
 * @param {number} size
 * @param {Set<string>} occupied — cell keys that block (excluding the moving arrow)
 */
export function canEscapePath(path, dir, size, occupied) {
  const cells = normalizePath(path);
  const { x: dx, y: dy } = DELTA[dir];

  let maxSteps = 0;
  for (const c of cells) {
    maxSteps = Math.max(maxSteps, stepsToExit(c.x, c.y, dir, size));
  }

  for (let step = 1; step <= maxSteps; step++) {
    for (const c of cells) {
      const nx = c.x + dx * step;
      const ny = c.y + dy * step;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
      if (occupied.has(cellKey(nx, ny))) return false;
    }
  }
  return true;
}

/**
 * Occupancy map of idle (non-moving / non-gone) arrows except optional skip.
 *
 * @param {Array<{ id: string, path: Cell[], state: string }>} arrows
 * @param {string | null} [skipId]
 * @returns {Map<string, string>}
 */
export function buildOccupancy(arrows, skipId = null) {
  /** @type {Map<string, string>} */
  const map = new Map();
  for (const arrow of arrows) {
    if (arrow.state === "gone" || arrow.state === "sliding") continue;
    if (skipId && arrow.id === skipId) continue;
    for (const c of arrow.path) {
      map.set(cellKey(c.x, c.y), arrow.id);
    }
  }
  return map;
}

/**
 * @param {{ id: string, dir: Dir, path: Cell[], state: string }} arrow
 * @param {number} size
 * @param {Array<{ id: string, path: Cell[], state: string }>} arrows
 */
export function canEscape(arrow, size, arrows) {
  const occ = buildOccupancy(arrows, arrow.id);
  return canEscapePath(arrow.path, arrow.dir, size, new Set(occ.keys()));
}
