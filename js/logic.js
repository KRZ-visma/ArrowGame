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

/** @type {Record<Dir, Dir>} */
export const OPPOSITE = {
  N: "S",
  E: "W",
  S: "N",
  W: "E",
};

/**
 * Cardinal step from cell `a` to `b`, or null if they are not orthogonal neighbors.
 * @param {Cell | [number, number]} a
 * @param {Cell | [number, number]} b
 * @returns {Dir | null}
 */
export function dirBetween(a, b) {
  const ax = Array.isArray(a) ? a[0] : a.x;
  const ay = Array.isArray(a) ? a[1] : a.y;
  const bx = Array.isArray(b) ? b[0] : b.x;
  const by = Array.isArray(b) ? b[1] : b.y;
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 1 && dy === 0) return "E";
  if (dx === -1 && dy === 0) return "W";
  if (dx === 0 && dy === 1) return "S";
  if (dx === 0 && dy === -1) return "N";
  return null;
}

/**
 * Step directions along a polyline (skips non-orthogonal pairs).
 * @param {Array<Cell | [number, number]>} path
 * @returns {Dir[]}
 */
export function pathStepDirs(path) {
  /** @type {Dir[]} */
  const dirs = [];
  for (let i = 1; i < path.length; i++) {
    const d = dirBetween(path[i - 1], path[i]);
    if (d) dirs.push(d);
  }
  return dirs;
}

/**
 * Number of times the polyline changes cardinal direction.
 * @param {Array<Cell | [number, number]>} path
 */
export function countPathTurns(path) {
  const dirs = pathStepDirs(path);
  let n = 0;
  for (let i = 1; i < dirs.length; i++) {
    if (dirs[i] !== dirs[i - 1]) n += 1;
  }
  return n;
}

/**
 * Whether the snake travels both a direction and its opposite (U-turn / S-curve).
 * @param {Array<Cell | [number, number]>} path
 */
export function pathHasReversal(path) {
  const seen = new Set();
  for (const d of pathStepDirs(path)) {
    if (seen.has(OPPOSITE[d])) return true;
    seen.add(d);
  }
  return false;
}

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
 * Sample a polyline at arc-length `s` (1 = one cell).
 * @param {Cell[]} pts
 * @param {number} s
 * @returns {Cell}
 */
export function pointAlong(pts, s) {
  if (pts.length === 0) return { x: 0, y: 0 };
  if (s <= 0) return { x: pts[0].x, y: pts[0].y };
  const last = pts.length - 1;
  if (s >= last) return { x: pts[last].x, y: pts[last].y };
  const i = Math.floor(s);
  const f = s - i;
  const a = pts[i];
  const b = pts[i + 1];
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}

/**
 * Snake pose after traveling `distance` cells: the head walks in `dir`,
 * and each body cell follows the polyline (then the exit corridor).
 *
 * @param {Array<Cell | [number, number]>} path — tail → head
 * @param {Dir} dir
 * @param {number} distance
 * @returns {Cell[]}
 */
export function snakePositions(path, dir, distance) {
  const cells = normalizePath(path);
  if (cells.length === 0) return [];
  const { x: dx, y: dy } = DELTA[dir];
  const extra = Math.max(2, Math.ceil(Math.max(0, distance)) + cells.length + 2);
  /** @type {Cell[]} */
  const pts = cells.map((c) => ({ x: c.x, y: c.y }));
  const head = cells[cells.length - 1];
  for (let i = 1; i <= extra; i++) {
    pts.push({ x: head.x + dx * i, y: head.y + dy * i });
  }
  const d = Math.max(0, distance);
  return cells.map((_, i) => pointAlong(pts, d + i));
}

/**
 * Cells of travel until the tail is off the board (plus a little extra).
 *
 * @param {Array<Cell | [number, number]>} path
 * @param {Dir} dir
 * @param {number} size
 */
export function snakeExitDistance(path, dir, size) {
  const cells = normalizePath(path);
  if (cells.length === 0) return 0;
  const head = cells[cells.length - 1];
  return stepsToExit(head.x, head.y, dir, size) + cells.length;
}

/**
 * Whether the snake can crawl out in `dir`. The head walks forward; the body
 * follows the existing polyline. Only foreign cells on the head's corridor
 * (or a self-collision that is not the vacating tail) block it.
 *
 * @param {Array<Cell | [number, number]>} path
 * @param {Dir} dir
 * @param {number} size
 * @param {Set<string>} occupied — cell keys that block (excluding the moving arrow)
 */
export function canEscapePath(path, dir, size, occupied) {
  const cells = normalizePath(path);
  if (cells.length === 0) return true;
  const { x: dx, y: dy } = DELTA[dir];

  let snake = cells.map((c) => ({ x: c.x, y: c.y }));
  const maxMoves = snake.length + size + 2;

  for (let move = 0; move < maxMoves && snake.length > 0; move++) {
    const head = snake[snake.length - 1];
    const next = { x: head.x + dx, y: head.y + dy };
    const onBoard = next.x >= 0 && next.y >= 0 && next.x < size && next.y < size;

    if (onBoard) {
      if (occupied.has(cellKey(next.x, next.y))) return false;
      for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === next.x && snake[i].y === next.y) return false;
      }
    }

    snake = snake.slice(1).concat([next]).filter((c) => c.x >= 0 && c.y >= 0 && c.x < size && c.y < size);
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

/**
 * Occupancy of `arrows` excluding `skip`'s own cells.
 * @param {Array<{ path: Array<Cell | [number, number]> }>} arrows
 * @param {{ path: Array<Cell | [number, number]> }} skip
 * @returns {Set<string>}
 */
function foreignOccupied(arrows, skip) {
  const self = new Set(normalizePath(skip.path).map((c) => cellKey(c.x, c.y)));
  const occupied = new Set();
  for (const a of arrows) {
    if (a === skip) continue;
    for (const c of normalizePath(a.path)) {
      const k = cellKey(c.x, c.y);
      if (!self.has(k)) occupied.add(k);
    }
  }
  return occupied;
}

/**
 * Whether `arrow` can leave given the other arrows in `group`.
 *
 * @param {{ dir: Dir, path: Array<Cell | [number, number]> }} arrow
 * @param {number} size
 * @param {Array<{ dir: Dir, path: Array<Cell | [number, number]> }>} group
 */
export function canEscapeAmong(arrow, size, group) {
  return canEscapePath(arrow.path, arrow.dir, size, foreignOccupied(group, arrow));
}

/**
 * Arrows that remain when no more can leave. Empty means the puzzle is solvable:
 * a free arrow only vacates cells, so greedy removal is safe.
 *
 * @param {number} size
 * @param {Array<{ dir: Dir, path: Array<Cell | [number, number]> }>} arrows
 */
export function stuckArrows(size, arrows) {
  const remaining = arrows.slice();
  while (remaining.length > 0) {
    const idx = remaining.findIndex((arrow) => canEscapeAmong(arrow, size, remaining));
    if (idx < 0) return remaining;
    remaining.splice(idx, 1);
  }
  return remaining;
}

/**
 * @param {number} size
 * @param {Array<{ dir: Dir, path: Array<Cell | [number, number]> }>} arrows
 */
export function isSolvable(size, arrows) {
  return stuckArrows(size, arrows).length === 0;
}
