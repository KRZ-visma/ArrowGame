import {
  DIRS,
  DELTA_ARR,
  TURNS,
  cellKey,
  canEscapePath,
} from "./logic.js";

/**
 * Build a solvable level by placing arrows in reverse clear order:
 * each new arrow is slid in from off-board along its tip direction onto empty cells.
 * Clearing in reverse of placement order is always possible.
 *
 * @param {number} size
 * @param {number} count
 * @param {() => number} [rng]
 */
export function buildSolvableLevel(size, count, rng = Math.random) {
  const occupied = new Set();
  const placed = [];

  let attempts = 0;
  while (placed.length < count && attempts < count * 120) {
    attempts += 1;
    const dir = DIRS[Math.floor(rng() * 4)];
    const [dx, dy] = DELTA_ARR[dir];

    const entries = [];
    if (dir === "E") {
      for (let y = 0; y < size; y++) entries.push([-1, y]);
    } else if (dir === "W") {
      for (let y = 0; y < size; y++) entries.push([size, y]);
    } else if (dir === "S") {
      for (let x = 0; x < size; x++) entries.push([x, -1]);
    } else {
      for (let x = 0; x < size; x++) entries.push([x, size]);
    }

    const entry = entries[Math.floor(rng() * entries.length)];
    const len = 2 + Math.floor(rng() * Math.min(5, Math.max(2, Math.floor(size / 2))));

    const path = [];
    let x = entry[0];
    let y = entry[1];
    let travel = dir;
    let ok = true;

    for (let i = 0; i < len; i++) {
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

  return { size, arrows: placed };
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
export const TUTORIAL = {
  size: 6,
  arrows: [
    { dir: "E", path: [[1, 1], [2, 1], [3, 1]] },
    { dir: "S", path: [[4, 1], [4, 2], [4, 3]] },
    { dir: "W", path: [[3, 4], [2, 4], [1, 4]] },
    { dir: "N", path: [[1, 3], [1, 2]] },
  ],
};

/** First board pack */
export const LEVELS = [
  TUTORIAL,
  makeHandLevel(42, 7, 8),
  makeHandLevel(77, 8, 11),
  makeHandLevel(103, 9, 13),
  makeHandLevel(211, 10, 15),
  makeHandLevel(308, 11, 17),
  makeHandLevel(404, 11, 19),
  makeHandLevel(512, 12, 21),
  makeHandLevel(640, 12, 23),
  makeHandLevel(777, 13, 25),
  makeHandLevel(890, 14, 27),
  makeHandLevel(901, 14, 28),
];

/**
 * @param {number} levelIndex
 */
export function generateLevel(levelIndex) {
  if (levelIndex < LEVELS.length) return LEVELS[levelIndex];
  const size = Math.min(8 + Math.floor((levelIndex - LEVELS.length) / 2), 16);
  const count = Math.min(8 + levelIndex, Math.floor(size * size * 0.32));
  return makeHandLevel(1000 + levelIndex * 17, size, count);
}

/**
 * @param {number} index
 */
export function getLevelData(index) {
  if (index < LEVELS.length) return LEVELS[index];
  return generateLevel(index);
}
