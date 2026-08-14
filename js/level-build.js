import {
  DIRS,
  DELTA_ARR,
  TURNS,
  cellKey,
  canEscapePath,
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
