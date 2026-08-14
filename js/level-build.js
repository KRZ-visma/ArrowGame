import {
  DIRS,
  DELTA_ARR,
  TURNS,
  cellKey,
  canEscapePath,
  canEscapeAmong,
  stuckArrows,
  isSolvable,
  levelComplexity,
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
  while (placed.length < count && attempts < count * 120) {
    attempts += 1;
    const dir = DIRS[Math.floor(rng() * 4)];
    const [dx, dy] = DELTA_ARR[dir];

    const starts = [];
    for (let y = margin; y < size - margin; y++) {
      for (let x = margin; x < size - margin; x++) {
        if (!occupied.has(cellKey(x, y))) starts.push([x, y]);
      }
    }
    if (starts.length === 0) continue;

    const start = starts[Math.floor(rng() * starts.length)];
    const len = 2 + Math.floor(rng() * Math.min(5, Math.max(2, Math.floor(size / 2))));

    const path = [[start[0], start[1]]];
    let x = start[0];
    let y = start[1];
    let travel = dir;
    let ok = true;

    for (let i = 1; i < len; i++) {
      if (path.length >= 2 && rng() < 0.45) {
        travel = TURNS[travel][Math.floor(rng() * 2)];
      } else {
        travel = dir;
      }
      const [sx, sy] = DELTA_ARR[travel];
      x += sx;
      y += sy;
      if (x < 0 || y < 0 || x >= size || y >= size) {
        ok = false;
        break;
      }
      if (occupied.has(cellKey(x, y)) || path.some(([px, py]) => px === x && py === y)) {
        ok = false;
        break;
      }
      path.push([x, y]);
    }

    if (!ok || path.length < 2) continue;

    const [lx, ly] = path[path.length - 1];
    const [plx, ply] = path[path.length - 2];
    if (lx - plx !== dx || ly - ply !== dy) {
      const nx = lx + dx;
      const ny = ly + dy;
      if (
        nx < 0 ||
        ny < 0 ||
        nx >= size ||
        ny >= size ||
        occupied.has(cellKey(nx, ny)) ||
        path.some(([px, py]) => px === nx && py === ny)
      ) {
        continue;
      }
      path.push([nx, ny]);
    }

    if (!canEscapePath(path, dir, size, occupied)) continue;

    for (const [px, py] of path) occupied.add(cellKey(px, py));
    placed.push({ dir, path });
  }

  fillEmptyCells(size, occupied, placed, rng);
  repairToSolvable({ size, arrows: placed });

  return { size, arrows: placed };
}

/**
 * Fill empty center cells with arrows (prefer length 2, allow length 1 when needed).
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
      if (!occupied.has(key)) {
        let placed2Cell = false;
        
        const dirOptions = [...DIRS].sort(() => rng() - 0.5);
        for (const dir of dirOptions) {
          const [dx, dy] = DELTA_ARR[dir];
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx >= 0 && ny >= 0 && nx < size && ny < size && !occupied.has(cellKey(nx, ny))) {
            occupied.add(key);
            occupied.add(cellKey(nx, ny));
            placed.push({ dir, path: [[x, y], [nx, ny]] });
            placed2Cell = true;
            break;
          }
        }
        
        if (!placed2Cell) {
          const dir = DIRS[Math.floor(rng() * 4)];
          occupied.add(key);
          placed.push({ dir, path: [[x, y]] });
        }
      }
    }
  }
}

/**
 * Cardinal step from cell `a` to `b`, or null if they are not orthogonal neighbors.
 * @param {[number, number]} a
 * @param {[number, number]} b
 * @returns {import("./logic.js").Dir | null}
 */
function dirFromCells(a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (dx === 1 && dy === 0) return "E";
  if (dx === -1 && dy === 0) return "W";
  if (dx === 0 && dy === 1) return "S";
  if (dx === 0 && dy === -1) return "N";
  return null;
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
  const ndir = dirFromCells(rev[rev.length - 2], rev[rev.length - 1]);
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
      { dir: "N", path: [[1, 3], [1, 2]] },
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
 * Keep `levels[0]` first (tutorial). Sort the rest by `levelComplexity`
 * so the shipped pack never drops in difficulty (the generated-param curve
 * used to restart at size 8 after the hand pack, which made level 13 easier
 * than level 12).
 *
 * @param {Array<{ size: number, arrows: Array }>} levels
 */
export function orderLevelsByComplexity(levels) {
  if (levels.length <= 1) return levels.slice();
  const [first, ...rest] = levels;
  const ranked = rest.map((level, i) => ({
    level,
    score: levelComplexity(level.size, level.arrows),
    i,
  }));
  ranked.sort((a, b) => a.score - b.score || a.i - b.i);
  return [first, ...ranked.map((entry) => entry.level)];
}

/** Seed/size/count inputs for early generated boards (then ordered by complexity). */
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
 * Difficulty parameters for a generation index. The shipped pack is this
 * sequence reordered by `orderLevelsByComplexity` (tutorial stays first).
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
