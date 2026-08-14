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
 * Minimum 90° bends for puzzle arrows at a pack index.
 * Levels 0–19: 0; 20–29: 1; 30–39: 2; then +1 every 10 levels.
 * @param {number} levelIndex
 */
export function minBendsForLevelIndex(levelIndex) {
  const i = Math.max(0, Math.floor(levelIndex));
  return Math.max(0, Math.floor(i / 10) - 1);
}

/**
 * Target polyline length for a puzzle arrow (includes the tail cell).
 * Higher bend floors need longer snakes so curls can fit.
 * @param {number} size
 * @param {() => number} rng
 * @param {number} [minBends]
 */
function pathBudget(size, rng, minBends = 0) {
  const span = Math.min(8, Math.max(3, Math.floor(size / 2)));
  const base = 3 + Math.floor(rng() * span);
  const floor = minBends <= 0 ? 2 : 1 + minBends * 2;
  return Math.max(base, floor + 1);
}

/**
 * Pick a body shape. Higher `minBends` biases toward curls / U-turns and
 * skips straight until the floor is zero.
 * @param {() => number} rng
 * @param {number} budget
 * @param {number} [minBends]
 * @returns {"curl" | "uturn" | "bent" | "straight"}
 */
export function chooseArrowShape(rng, budget, minBends = 0) {
  const roll = rng();
  if (minBends >= 2) {
    if (budget >= 6 && roll < 0.55) return "curl";
    if (budget >= 4) return "uturn";
    if (budget >= 3) return "bent";
    return "straight";
  }
  if (minBends >= 1) {
    if (budget >= 6 && roll < 0.4) return "curl";
    if (budget >= 4 && roll < 0.72) return "uturn";
    if (budget >= 3) return "bent";
    return "straight";
  }
  if (budget >= 6 && roll < 0.22) return "curl";
  if (budget >= 4 && roll < 0.5) return "uturn";
  if (budget >= 3 && roll < 0.88) return "bent";
  return "straight";
}

/**
 * Which perpendicular side has more nearby occupied cells (for hugging).
 * @param {number[]} start
 * @param {import("./logic.js").Dir} exitDir
 * @param {Set<string>} occupied
 * @param {number} size
 * @param {() => number} rng
 * @returns {0 | 1}
 */
function hugTurnSide(start, exitDir, occupied, size, rng) {
  /** @param {0 | 1} side */
  const scoreSide = (side) => {
    const turn = TURNS[exitDir][side];
    const [tdx, tdy] = DELTA_ARR[turn];
    const [edx, edy] = DELTA_ARR[exitDir];
    let score = 0;
    for (let a = 1; a <= 3; a += 1) {
      for (let b = 0; b <= 2; b += 1) {
        const x = start[0] + tdx * a + edx * b;
        const y = start[1] + tdy * a + edy * b;
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        if (occupied.has(cellKey(x, y))) score += 1;
      }
    }
    return score;
  };
  const s0 = scoreSide(0);
  const s1 = scoreSide(1);
  if (s0 > s1) return 0;
  if (s1 > s0) return 1;
  return rng() < 0.5 ? 0 : 1;
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
  const side = hugTurnSide(start, exitDir, occupied, size, rng);
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
  const hug = hugTurnSide(start, exitDir, occupied, size, rng);
  const sides = hug === 0 ? [0, 1] : [1, 0];
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
 * Two or more turns: S-curve, staircase, hook, or coil that hugs occupied cells.
 * @param {number[]} start
 * @param {import("./logic.js").Dir} exitDir
 * @param {number} size
 * @param {Set<string>} occupied
 * @param {() => number} rng
 * @param {number} budget
 * @param {number} [minTurns]
 */
function realizeCurl(start, exitDir, size, occupied, rng, budget, minTurns = 2) {
  const side = hugTurnSide(start, exitDir, occupied, size, rng);
  const turn = TURNS[exitDir][side];
  const other = TURNS[exitDir][1 - side];
  const opp = OPPOSITE[exitDir];
  const a = 1 + Math.floor(rng() * 2);
  const b = 1 + Math.floor(rng() * 2);
  const c = 1 + Math.floor(rng() * 2);
  const d = Math.max(1, budget - 1 - a - b - 1);
  const coilRest = Math.max(1, budget - 1 - a - b - c - 1);
  const z1 = 1 + Math.floor(rng() * 2);
  const z2 = 1 + Math.floor(rng() * 2);
  const z3 = Math.max(1, budget - 1 - z1 - 1 - z2 - 1);
  const hookBack = 1 + Math.floor(rng() * 2);
  const hookSide = 1 + Math.floor(rng() * 2);
  const wrapOut = Math.max(1, budget - 1 - a - 1 - b - 1);
  const recipes = [
    // Same-side coil: wrap around a neighbor then exit
    [
      { dir: turn, steps: a },
      { dir: exitDir, steps: b },
      { dir: turn, steps: c },
      { dir: exitDir, steps: coilRest },
    ],
    // Hug then reverse-jog out (C-shape around occupied)
    [
      { dir: turn, steps: a },
      { dir: exitDir, steps: Math.max(2, b) },
      { dir: other, steps: 1 },
      { dir: opp, steps: 1 },
      { dir: other, steps: 1 },
      { dir: exitDir, steps: Math.max(1, wrapOut - 2) },
    ],
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
  const need = Math.max(2, minTurns);
  for (const legs of recipes) {
    const path = walkLegs(start, legs, size, occupied);
    if (path && countPathTurns(path) >= need) return path;
  }
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
 * When `minBends` > 0, skips straights until softer fallbacks are exhausted.
 *
 * @param {number[]} start
 * @param {import("./logic.js").Dir} exitDir
 * @param {number} size
 * @param {Set<string>} occupied
 * @param {() => number} rng
 * @param {"curl" | "uturn" | "bent" | "straight"} [shape]
 * @param {number} [minBends]
 * @returns {number[][] | null}
 */
export function growWindingPath(start, exitDir, size, occupied, rng, shape, minBends = 0) {
  let floor = Math.max(0, minBends | 0);
  const budget = pathBudget(size, rng, floor);
  const preferred = shape || chooseArrowShape(rng, budget, floor);
  /** @type {Array<"curl" | "uturn" | "bent" | "straight">} */
  const order = [preferred];
  for (const s of SHAPE_FALLBACK) {
    if (!order.includes(s)) order.push(s);
  }

  /** @param {number} need */
  const tryOrder = (need) => {
    for (const kind of order) {
      if (need >= 1 && kind === "straight") continue;
      if (need >= 2 && kind === "bent") continue;
      let path = null;
      if (kind === "curl") {
        path = realizeCurl(start, exitDir, size, occupied, rng, budget, need);
      } else if (kind === "uturn") {
        path = realizeUTurn(start, exitDir, size, occupied, rng, budget);
      } else if (kind === "bent") {
        path = realizeBent(start, exitDir, size, occupied, rng, budget);
      } else {
        path = realizeStraight(start, exitDir, size, occupied, budget);
      }
      if (path && path.length >= 2 && countPathTurns(path) >= need) return path;
    }
    return null;
  };

  while (floor >= 0) {
    const path = tryOrder(floor);
    if (path) return path;
    floor -= 1;
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
 * @param {number} [minBends] minimum turns on puzzle snakes (fillers may soften)
 */
export function buildSolvableLevel(size, count, rng = Math.random, minBends = 0) {
  const occupied = new Set();
  const placed = [];
  const margin = centerMarginForSize(size);
  const floor = Math.max(0, minBends | 0);

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
    const path = growWindingPath(start, dir, size, occupied, rng, undefined, floor);
    if (!path) continue;

    if (!canEscapePath(path, dir, size, occupied)) continue;

    for (const [px, py] of path) occupied.add(cellKey(px, py));
    placed.push({ dir, path });
  }

  fillEmptyCells(size, occupied, placed, rng, floor);
  repairToSolvable({ size, arrows: placed });

  return { size, arrows: placed };
}

/**
 * Fill empty center cells with arrows (prefer a 3-cell L, then length 2, then 1).
 * When `minBends` ≥ 1, always try an L first so fillers are not all sticks.
 * Edge cells may remain empty.
 * @param {number} size
 * @param {Set<string>} occupied
 * @param {Array} placed
 * @param {() => number} rng
 * @param {number} [minBends]
 */
function fillEmptyCells(size, occupied, placed, rng, minBends = 0) {
  const margin = centerMarginForSize(size);
  const preferBend = minBends >= 1;

  for (let y = margin; y < size - margin; y++) {
    for (let x = margin; x < size - margin; x++) {
      const key = cellKey(x, y);
      if (occupied.has(key)) continue;

      const dirOptions = [...DIRS].sort(() => rng() - 0.5);
      let placedHere = false;

      if (preferBend || rng() < 0.6) {
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
 * @param {number} [minBends]
 */
export function makeHandLevel(seed, size, count, minBends = 0) {
  let best = null;
  for (let i = 0; i < 8; i++) {
    const candidate = buildSolvableLevel(size, count, rngFrom(seed + i * 97), minBends);
    if (!isSolvable(candidate.size, candidate.arrows)) continue;
    if (!best || candidate.arrows.length > best.arrows.length) best = candidate;
  }
  return best || buildSolvableLevel(size, count, rngFrom(seed), minBends);
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

/**
 * 90-degree turns along a snake (length-1/2 arrows contribute 0).
 * @param {Array<[number, number] | { x: number, y: number }>} path
 */
function countBends(path) {
  if (path.length < 3) return 0;
  let n = 0;
  for (let i = 1; i < path.length - 1; i += 1) {
    const a = path[i - 1];
    const b = path[i];
    const c = path[i + 1];
    const ax = Array.isArray(a) ? a[0] : a.x;
    const ay = Array.isArray(a) ? a[1] : a.y;
    const bx = Array.isArray(b) ? b[0] : b.x;
    const by = Array.isArray(b) ? b[1] : b.y;
    const cx = Array.isArray(c) ? c[0] : c.x;
    const cy = Array.isArray(c) ? c[1] : c.y;
    if (bx - ax !== cx - bx || by - ay !== cy - by) n += 1;
  }
  return n;
}

/**
 * Simultaneous-free clearance layers (all currently free arrows leave together).
 * @param {number} size
 * @param {Array<{ dir: string, path: Array }>} arrows
 */
function clearanceProfile(size, arrows) {
  let remaining = arrows.slice();
  let waves = 0;
  let blocked0 = 0;
  let depthSum = 0;
  let first = true;
  while (remaining.length > 0) {
    const free = remaining.filter((arrow) => canEscapeAmong(arrow, size, remaining));
    if (first) {
      blocked0 = remaining.length - free.length;
      first = false;
    }
    if (free.length === 0) break;
    waves += 1;
    depthSum += free.length * waves;
    const freeSet = new Set(free);
    remaining = remaining.filter((arrow) => !freeSet.has(arrow));
  }
  return { waves, blocked0, depthSum };
}

/**
 * How mixed exit directions are: unique dirs (1–4) and arrows off the dominant dir.
 * Uniform boards score 0; four different dirs score high. Exit `dir` only — not bends.
 *
 * @param {Array<{ dir: string }>} arrows
 */
function directionSpread(arrows) {
  const counts = { N: 0, E: 0, S: 0, W: 0 };
  for (const arrow of arrows) {
    if (counts[arrow.dir] !== undefined) counts[arrow.dir] += 1;
  }
  let uniqueDirs = 0;
  let maxCount = 0;
  for (const dir of ["N", "E", "S", "W"]) {
    const c = counts[dir];
    if (c > 0) uniqueDirs += 1;
    if (c > maxCount) maxCount = c;
  }
  return {
    uniqueDirs,
    offDominant: arrows.length - maxCount,
  };
}

/**
 * Integer difficulty score. Clearance structure leads (blocked openers, wave
 * count, depthSum); direction spread is next (mixed exit dirs feel harder than
 * a uniform flock); arrow count, occupancy, and bends are lighter tie-breakers.
 * Board size is not part of the score. Does not reorder the shipped pack.
 *
 * @param {{ size: number, arrows: Array<{ dir: string, path: Array }> }} level
 */
export function levelComplexity(level) {
  const arrows = level.arrows ?? [];
  if (arrows.length === 0) return 0;
  const { size } = level;
  let cells = 0;
  let bends = 0;
  for (const arrow of arrows) {
    cells += arrow.path.length;
    bends += countBends(arrow.path);
  }
  const profile = clearanceProfile(size, arrows);
  const spread = directionSpread(arrows);
  return (
    profile.blocked0 * 40 +
    profile.waves * 60 +
    profile.depthSum * 8 +
    (spread.uniqueDirs - 1) * 30 +
    spread.offDominant * 15 +
    arrows.length * 10 +
    cells * 2 +
    bends * 5
  );
}

/**
 * Pin the tutorial first, then sort the rest by nondecreasing `levelComplexity`.
 * Equal scores keep input order. Not used when baking `LEVEL_PACK` — pack order
 * follows generation index.
 *
 * @param {Array<{ size: number, arrows: Array }>} levels
 */
export function orderLevelsByComplexity(levels) {
  const pinned = [];
  const rest = [];
  for (const level of levels) {
    if (level === TUTORIAL) pinned.push(level);
    else rest.push(level);
  }
  const keyed = rest.map((level, i) => ({
    level,
    i,
    score: levelComplexity(level),
  }));
  keyed.sort((a, b) => a.score - b.score || a.i - b.i);
  return pinned.concat(keyed.map((row) => row.level));
}

/** Seed/size/count for curated early boards (then the size/count curve continues). */
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
 * Size and snake-count never drop after the tutorial — the curve continues from
 * the last hand spec instead of resetting to an 8×8. `minBends` ramps so later
 * pack indices force windier puzzle arrows (0 until 20, then +1 each 10 levels).
 *
 * @param {number} levelIndex
 */
export function levelParamsForIndex(levelIndex) {
  if (levelIndex <= 0) return { tutorial: true };
  const minBends = minBendsForLevelIndex(levelIndex);
  if (levelIndex <= HAND_LEVEL_SPECS.length) {
    const spec = HAND_LEVEL_SPECS[levelIndex - 1];
    return { seed: spec.seed, size: spec.size, count: spec.count, minBends };
  }
  const last = HAND_LEVEL_SPECS[HAND_LEVEL_SPECS.length - 1];
  const extra = levelIndex - HAND_LEVEL_SPECS.length;
  const size = Math.min(16, last.size + Math.floor((extra - 1) / 4));
  const count = last.count + extra;
  return { seed: 1000 + levelIndex * 17, size, count, minBends };
}

/**
 * Build one level for the generator script.
 * @param {number} levelIndex
 */
export function buildLevelForIndex(levelIndex) {
  const params = levelParamsForIndex(levelIndex);
  if (params.tutorial) return TUTORIAL;
  return makeHandLevel(params.seed, params.size, params.count, params.minBends);
}
