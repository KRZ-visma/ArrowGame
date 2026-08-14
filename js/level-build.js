import {
  DIRS,
  DELTA_ARR,
  TURNS,
  OPPOSITE,
  cellKey,
  canEscapePath,
  canEscapeAmong,
  stuckArrows,
  isSolvable,
  dirBetween,
  countPathTurns,
} from "./logic.js";

/**
 * Inner-board margin for center-origin placement (tail must start here).
 * @param {number} size
 */
export function centerMarginForSize(size) {
  return Math.max(1, Math.floor(size / 4));
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} size
 */
export function isCenterCell(x, y, size) {
  const margin = centerMarginForSize(size);
  return x >= margin && y >= margin && x < size - margin && y < size - margin;
}

/**
 * Target polyline length for a puzzle arrow (includes the tail cell).
 * @param {number} size
 * @param {() => number} rng
 */
function pathBudget(size, rng) {
  const span = Math.min(8, Math.max(3, Math.floor(size / 2)));
  return 3 + Math.floor(rng() * span);
}

/**
 * Pick a body shape. Straight is the fallback; most arrows bend, U-turn, or curl.
 * @param {() => number} rng
 * @param {number} budget
 * @returns {"curl" | "uturn" | "bent" | "straight"}
 */
export function chooseArrowShape(rng, budget) {
  const roll = rng();
  if (budget >= 6 && roll < 0.22) return "curl";
  if (budget >= 4 && roll < 0.5) return "uturn";
  if (budget >= 3 && roll < 0.88) return "bent";
  return "straight";
}

/**
 * Walk `steps` in `dir` from the last cell of `path`.
 * @param {number[][]} path
 * @param {import("./logic.js").Dir} dir
 * @param {number} steps
 * @param {number} size
 * @param {Set<string>} occupied
 * @returns {number[][] | null}
 */
function tryWalk(path, dir, steps, size, occupied) {
  const next = path.map((p) => [p[0], p[1]]);
  let x = next[next.length - 1][0];
  let y = next[next.length - 1][1];
  const [dx, dy] = DELTA_ARR[dir];
  for (let i = 0; i < steps; i++) {
    x += dx;
    y += dy;
    if (x < 0 || y < 0 || x >= size || y >= size) return null;
    if (occupied.has(cellKey(x, y))) return null;
    if (next.some(([px, py]) => px === x && py === y)) return null;
    next.push([x, y]);
  }
  return next;
}

/**
 * @param {number[]} start
 * @param {Array<{ dir: import("./logic.js").Dir, steps: number }>} legs
 * @param {number} size
 * @param {Set<string>} occupied
 * @returns {number[][] | null}
 */
function walkLegs(start, legs, size, occupied) {
  let path = [[start[0], start[1]]];
  for (const leg of legs) {
    const next = tryWalk(path, leg.dir, leg.steps, size, occupied);
    if (!next) return null;
    path = next;
  }
  return path.length >= 2 ? path : null;
}

/**
 * @param {number[]} start
 * @param {import("./logic.js").Dir} exitDir
 * @param {number} size
 * @param {Set<string>} occupied
 * @param {number} budget
 */
function realizeStraight(start, exitDir, size, occupied, budget) {
  return tryWalk([start], exitDir, Math.max(1, budget - 1), size, occupied);
}

/**
 * One 90° bend (L) or a jog (dir → turn → dir).
 * @param {number[]} start
 * @param {import("./logic.js").Dir} exitDir
 * @param {number} size
 * @param {Set<string>} occupied
 * @param {() => number} rng
 * @param {number} budget
 */
function realizeBent(start, exitDir, size, occupied, rng, budget) {
  const side = rng() < 0.5 ? 0 : 1;
  const turn = TURNS[exitDir][side];
  const other = TURNS[exitDir][1 - side];
  /** @type {Array<Array<{ dir: import("./logic.js").Dir, steps: number }>>} */
  const attempts = [];
  if (rng() < 0.4) {
    const a = 1 + Math.floor(rng() * 2);
    const mid = 1;
    const c = Math.max(1, budget - 1 - a - mid);
    attempts.push([
      { dir: exitDir, steps: a },
      { dir: turn, steps: mid },
      { dir: exitDir, steps: c },
    ]);
    attempts.push([
      { dir: exitDir, steps: a },
      { dir: other, steps: mid },
      { dir: exitDir, steps: c },
    ]);
  }
  const first = 1 + Math.floor(rng() * Math.min(3, Math.max(1, budget - 2)));
  const rest = Math.max(1, budget - 1 - first);
  attempts.push(
    [
      { dir: turn, steps: first },
      { dir: exitDir, steps: rest },
    ],
    [
      { dir: other, steps: first },
      { dir: exitDir, steps: rest },
    ],
    [
      { dir: turn, steps: 1 },
      { dir: exitDir, steps: 1 },
    ],
    [
      { dir: other, steps: 1 },
      { dir: exitDir, steps: 1 },
    ],
  );
  for (const legs of attempts) {
    const path = walkLegs(start, legs, size, occupied);
    if (path) return path;
  }
  return null;
}

/**
 * Classic U: walk opposite the exit, jog perpendicular, then head out in `exitDir`.
 * @param {number[]} start
 * @param {import("./logic.js").Dir} exitDir
 * @param {number} size
 * @param {Set<string>} occupied
 * @param {() => number} rng
 * @param {number} budget
 */
function realizeUTurn(start, exitDir, size, occupied, rng, budget) {
  const opp = OPPOSITE[exitDir];
  const maxArm = Math.max(1, Math.floor((budget - 2) / 2));
  const arm = 1 + Math.floor(rng() * Math.min(3, maxArm));
  const extraGap = budget - 2 * arm >= 2;
  const gap = 1 + Math.floor(rng() * (extraGap ? 2 : 1));
  const sides = rng() < 0.5 ? [0, 1] : [1, 0];
  for (const side of sides) {
    const turn = TURNS[exitDir][side];
    for (const a of [arm, 1]) {
      for (const g of [gap, 1]) {
        const path = walkLegs(
          start,
          [
            { dir: opp, steps: a },
            { dir: turn, steps: g },
            { dir: exitDir, steps: Math.max(a, 1) },
          ],
          size,
          occupied,
        );
        if (path) return path;
      }
    }
  }
  return null;
}

/**
 * Two or more turns: S-curve, staircase, or hook.
 * @param {number[]} start
 * @param {import("./logic.js").Dir} exitDir
 * @param {number} size
 * @param {Set<string>} occupied
 * @param {() => number} rng
 * @param {number} budget
 */
function realizeCurl(start, exitDir, size, occupied, rng, budget) {
  const side = rng() < 0.5 ? 0 : 1;
  const turn = TURNS[exitDir][side];
  const other = TURNS[exitDir][1 - side];
  const opp = OPPOSITE[exitDir];
  const a = 1 + Math.floor(rng() * 2);
  const b = 1 + Math.floor(rng() * 2);
  const d = Math.max(1, budget - 1 - a - b - 1);
  const z1 = 1 + Math.floor(rng() * 2);
  const z2 = 1 + Math.floor(rng() * 2);
  const z3 = Math.max(1, budget - 1 - z1 - 1 - z2 - 1);
  const hookBack = 1 + Math.floor(rng() * 2);
  const hookSide = 1 + Math.floor(rng() * 2);
  const recipes = [
    [
      { dir: turn, steps: a },
      { dir: exitDir, steps: b },
      { dir: other, steps: 1 },
      { dir: exitDir, steps: d },
    ],
    [
      { dir: exitDir, steps: z1 },
      { dir: turn, steps: 1 },
      { dir: exitDir, steps: z2 },
      { dir: turn, steps: 1 },
      { dir: exitDir, steps: z3 },
    ],
    [
      { dir: opp, steps: hookBack },
      { dir: turn, steps: hookSide },
      { dir: exitDir, steps: 2 },
      { dir: other, steps: 1 },
      { dir: exitDir, steps: 1 },
    ],
    [
      { dir: other, steps: a },
      { dir: exitDir, steps: b },
      { dir: turn, steps: 1 },
      { dir: exitDir, steps: d },
    ],
    [
      { dir: exitDir, steps: z1 },
      { dir: other, steps: 1 },
      { dir: exitDir, steps: z2 },
      { dir: other, steps: 1 },
      { dir: exitDir, steps: z3 },
    ],
  ];
  for (const legs of recipes) {
    const path = walkLegs(start, legs, size, occupied);
    if (path && countPathTurns(path) >= 2) return path;
  }
  return null;
}

const SHAPE_FALLBACK = /** @type {const} */ (["curl", "uturn", "bent", "straight"]);

/**
 * Grow a tail→head polyline that ends traveling in `exitDir`.
 * Prefers curled / angled bodies; U-turns walk opposite, jog, then out.
 *
 * @param {number[]} start
 * @param {import("./logic.js").Dir} exitDir
 * @param {number} size
 * @param {Set<string>} occupied
 * @param {() => number} rng
 * @param {"curl" | "uturn" | "bent" | "straight"} [shape]
 * @returns {number[][] | null}
 */
export function growWindingPath(start, exitDir, size, occupied, rng, shape) {
  const budget = pathBudget(size, rng);
  const preferred = shape || chooseArrowShape(rng, budget);
  /** @type {Array<"curl" | "uturn" | "bent" | "straight">} */
  const order = [preferred];
  for (const s of SHAPE_FALLBACK) {
    if (!order.includes(s)) order.push(s);
  }
  for (const kind of order) {
    let path = null;
    if (kind === "curl") path = realizeCurl(start, exitDir, size, occupied, rng, budget);
    else if (kind === "uturn") path = realizeUTurn(start, exitDir, size, occupied, rng, budget);
    else if (kind === "bent") path = realizeBent(start, exitDir, size, occupied, rng, budget);
    else path = realizeStraight(start, exitDir, size, occupied, budget);
    if (path && path.length >= 2) return path;
  }
  return null;
}

/**
 * Build a solvable level by placing arrows in reverse clear order:
 * each new arrow grows outward from an empty center cell (tail in the middle zone).
 * Clearing in reverse of placement order is always possible (snake-follow exit).
 *
 * @param {number} size
 * @param {number} count
 * @param {() => number} [rng]
 */
export function buildSolvableLevel(size, count, rng = Math.random) {
  const occupied = new Set();
  const placed = [];
  const margin = centerMarginForSize(size);

  let attempts = 0;
  while (placed.length < count && attempts < count * 180) {
    attempts += 1;
    const dir = DIRS[Math.floor(rng() * 4)];

    const starts = [];
    for (let y = margin; y < size - margin; y++) {
      for (let x = margin; x < size - margin; x++) {
        if (!occupied.has(cellKey(x, y))) starts.push([x, y]);
      }
    }
    if (starts.length === 0) continue;

    const start = starts[Math.floor(rng() * starts.length)];
    const path = growWindingPath(start, dir, size, occupied, rng);
    if (!path) continue;

    if (!canEscapePath(path, dir, size, occupied)) continue;

    for (const [px, py] of path) occupied.add(cellKey(px, py));
    placed.push({ dir, path });
  }

  fillEmptyCells(size, occupied, placed, rng);
  repairToSolvable({ size, arrows: placed });

  return { size, arrows: placed };
}

/**
 * Fill empty center cells with arrows (prefer a 3-cell L, then length 2, then 1).
 * Edge cells may remain empty.
 * @param {number} size
 * @param {Set<string>} occupied
 * @param {Array} placed
 * @param {() => number} rng
 */
function fillEmptyCells(size, occupied, placed, rng) {
  const margin = centerMarginForSize(size);

  for (let y = margin; y < size - margin; y++) {
    for (let x = margin; x < size - margin; x++) {
      const key = cellKey(x, y);
      if (occupied.has(key)) continue;

      const dirOptions = [...DIRS].sort(() => rng() - 0.5);
      let placedHere = false;

      if (rng() < 0.6) {
        for (const d1 of dirOptions) {
          const [dx1, dy1] = DELTA_ARR[d1];
          const x1 = x + dx1;
          const y1 = y + dy1;
          if (x1 < 0 || y1 < 0 || x1 >= size || y1 >= size || occupied.has(cellKey(x1, y1))) {
            continue;
          }
          const turns = TURNS[d1];
          const tOrder = rng() < 0.5 ? turns : [turns[1], turns[0]];
          for (const d2 of tOrder) {
            const [dx2, dy2] = DELTA_ARR[d2];
            const x2 = x1 + dx2;
            const y2 = y1 + dy2;
            if (x2 < 0 || y2 < 0 || x2 >= size || y2 >= size || occupied.has(cellKey(x2, y2))) {
              continue;
            }
            occupied.add(key);
            occupied.add(cellKey(x1, y1));
            occupied.add(cellKey(x2, y2));
            placed.push({ dir: d2, path: [[x, y], [x1, y1], [x2, y2]] });
            placedHere = true;
            break;
          }
          if (placedHere) break;
        }
      }

      if (placedHere) continue;

      for (const dir of dirOptions) {
        const [dx, dy] = DELTA_ARR[dir];
        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && ny >= 0 && nx < size && ny < size && !occupied.has(cellKey(nx, ny))) {
          occupied.add(key);
          occupied.add(cellKey(nx, ny));
          placed.push({ dir, path: [[x, y], [nx, ny]] });
          placedHere = true;
          break;
        }
      }

      if (!placedHere) {
        const dir = DIRS[Math.floor(rng() * 4)];
        occupied.add(key);
        placed.push({ dir, path: [[x, y]] });
      }
    }
  }
}

/**
 * Flip a length-1 dir, or reverse a multi-cell snake, so it can leave `stuck`.
 * @param {{ dir: string, path: number[][] }} arrow
 * @param {number} size
 * @param {Array<{ dir: string, path: number[][] }>} stuck
 */
function reorientStuckArrow(arrow, size, stuck) {
  if (arrow.path.length === 1) {
    const prev = arrow.dir;
    for (const dir of DIRS) {
      if (dir === prev) continue;
      arrow.dir = dir;
      if (canEscapeAmong(arrow, size, stuck)) return true;
    }
    arrow.dir = prev;
    return false;
  }
  const prevPath = arrow.path;
  const prevDir = arrow.dir;
  const rev = prevPath.slice().reverse();
  const ndir = dirBetween(rev[rev.length - 2], rev[rev.length - 1]);
  if (!ndir) return false;
  arrow.path = rev;
  arrow.dir = ndir;
  if (canEscapeAmong(arrow, size, stuck)) return true;
  arrow.path = prevPath;
  arrow.dir = prevDir;
  return false;
}

/**
 * Break leftover deadlocks without changing occupancy. `fillEmptyCells` can place
 * arrows that face each other (length-1 pair on one file); those fillers are not
 * in reverse-clear order. Reorient stuck arrows until greedy clear succeeds.
 *
 * @param {{ size: number, arrows: Array<{ dir: string, path: number[][] }> }} level
 * @returns {boolean}
 */
export function repairToSolvable(level) {
  const { size, arrows } = level;
  if (isSolvable(size, arrows)) return true;

  for (let step = 0; step < arrows.length + 2; step += 1) {
    const stuck = stuckArrows(size, arrows);
    if (stuck.length === 0) return true;
    let changed = false;
    for (const arrow of stuck) {
      if (reorientStuckArrow(arrow, size, stuck)) {
        changed = true;
        break;
      }
    }
    if (!changed) return false;
  }
  return isSolvable(size, arrows);
}

/** Mulberry32 — deterministic levels from an index */
export function rngFrom(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {number} seed
 * @param {number} size
 * @param {number} count
 */
export function makeHandLevel(seed, size, count) {
  let best = buildSolvableLevel(size, count, rngFrom(seed));
  for (let i = 1; i < 8; i++) {
    const candidate = buildSolvableLevel(size, count, rngFrom(seed + i * 97));
    if (candidate.arrows.length > best.arrows.length) best = candidate;
  }
  return best;
}

/** Level 1 — tiny tutorial with an obvious free arrow and a blocked one */
function buildTutorial() {
  const base = {
    size: 6,
    arrows: [
      { dir: "E", path: [[1, 1], [2, 1], [3, 1]] },
      { dir: "S", path: [[4, 1], [4, 2], [4, 3]] },
      { dir: "W", path: [[3, 4], [2, 4], [1, 4]] },
      { dir: "N", path: [[2, 3], [1, 3], [1, 2]] },
    ],
  };
  
  const occupied = new Set();
  for (const arrow of base.arrows) {
    for (const [x, y] of arrow.path) {
      occupied.add(cellKey(x, y));
    }
  }
  
  const rng = rngFrom(1);
  fillEmptyCells(base.size, occupied, base.arrows, rng);
  repairToSolvable(base);

  return base;
}

export const TUTORIAL = buildTutorial();

/** Seed/size/count for the first curated pack (levels 2–12). */
export const HAND_LEVEL_SPECS = [
  { seed: 42, size: 7, count: 8 },
  { seed: 77, size: 8, count: 11 },
  { seed: 103, size: 9, count: 13 },
  { seed: 211, size: 10, count: 15 },
  { seed: 308, size: 11, count: 17 },
  { seed: 404, size: 11, count: 19 },
  { seed: 512, size: 12, count: 21 },
  { seed: 640, size: 12, count: 23 },
  { seed: 777, size: 13, count: 25 },
  { seed: 890, size: 14, count: 27 },
  { seed: 901, size: 14, count: 28 },
];

/**
 * Difficulty parameters for a level index (used by the level generator script).
 * @param {number} levelIndex
 */
export function levelParamsForIndex(levelIndex) {
  const handCount = 1 + HAND_LEVEL_SPECS.length;
  if (levelIndex < handCount) {
    if (levelIndex === 0) return { tutorial: true };
    const spec = HAND_LEVEL_SPECS[levelIndex - 1];
    return { seed: spec.seed, size: spec.size, count: spec.count };
  }
  const size = Math.min(8 + Math.floor((levelIndex - handCount) / 2), 16);
  const count = Math.min(8 + levelIndex, Math.floor(size * size * 0.32));
  return { seed: 1000 + levelIndex * 17, size, count };
}

/**
 * Build one level for the generator script.
 * @param {number} levelIndex
 */
export function buildLevelForIndex(levelIndex) {
  const params = levelParamsForIndex(levelIndex);
  if (params.tutorial) return TUTORIAL;
  return makeHandLevel(params.seed, params.size, params.count);
}
