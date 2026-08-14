/** Persisted level index — do not rename without a migration. */
export const STORAGE_KEY = "arrow-out-level";

/** Best stars per level + furthest unlocked index. Additive; do not reuse STORAGE_KEY. */
export const STARS_KEY = "arrow-out-stars";

/** Keys owned by the game. Clear-all removes every entry here. */
export const STORAGE_KEYS = Object.freeze([STORAGE_KEY, STARS_KEY]);

/** Blocked taps that fail the run. */
export const MAX_STRIKES = 3;

/** Extra taps over par that still earn 2 stars. 3+ extras (or 3 strikes) cannot clear. */
export const STAR_EXTRA_FOR_TWO = 1;

/**
 * Wipe saved progress (level index and any future keys in STORAGE_KEYS).
 * Does not restart the in-memory game — the caller should start level 0.
 * @param {{ removeItem: (key: string) => void }} storage
 */
export function clearAllProgress(storage) {
  for (const key of STORAGE_KEYS) {
    storage.removeItem(key);
  }
}

/**
 * Numbers for the Menu overlay. `levelNumber` is 1-based.
 * `levelsCleared` counts finished levels; include the current one when `won`.
 * `chances` is remaining blocked-tap lives this run.
 * @param {{
 *   levelIndex: number,
 *   moves: number,
 *   arrows: Array<{ state: string }>,
 *   packSize: number,
 *   won?: boolean,
 *   strikes?: number,
 * }} input
 */
export function menuStats({
  levelIndex,
  moves,
  arrows,
  packSize,
  won = false,
  strikes = 0,
}) {
  const arrowsTotal = arrows.length;
  const arrowsRemaining = arrows.filter((a) => a.state !== "gone").length;
  return {
    levelNumber: levelIndex + 1,
    packSize,
    moves,
    arrowsRemaining,
    arrowsTotal,
    levelsCleared: levelIndex + (won ? 1 : 0),
    chances: chancesLeft(strikes),
  };
}

/**
 * Minimum clears equals arrow count — each arrow leaves once.
 * @param {Array<unknown>} arrows
 */
export function minMovesForArrows(arrows) {
  return arrows.length;
}

/**
 * 3 stars at or under par, 2 stars one tap over, 1 star for any other clear.
 * @param {number} minMoves
 * @param {number} moves — successful escapes + blocked taps this run
 */
export function starsForClear(minMoves, moves) {
  const par = Number.isFinite(minMoves) ? Math.max(0, minMoves) : 0;
  const used = Number.isFinite(moves) ? Math.max(0, moves) : 0;
  const extra = Math.max(0, used - par);
  if (extra <= 0) return 3;
  if (extra <= STAR_EXTRA_FOR_TWO) return 2;
  return 1;
}

/**
 * @param {number} strikes
 */
export function hasFailed(strikes) {
  return strikes >= MAX_STRIKES;
}

/**
 * @param {number} strikes
 */
export function chancesLeft(strikes) {
  const n = Number.isFinite(strikes) ? strikes : 0;
  return Math.max(0, MAX_STRIKES - Math.max(0, n));
}

/** @returns {{ best: Record<number, number>, unlocked: number }} */
export function emptyStarRecords() {
  return { best: {}, unlocked: 0 };
}

/**
 * @param {string | null | undefined} raw
 * @returns {{ best: Record<number, number>, unlocked: number }}
 */
export function parseStarRecords(raw) {
  if (raw == null || raw === "") return emptyStarRecords();
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return emptyStarRecords();
    }
    /** @type {Record<number, number>} */
    const best = {};
    const src =
      data.best && typeof data.best === "object" && !Array.isArray(data.best)
        ? data.best
        : {};
    for (const [k, v] of Object.entries(src)) {
      const i = Math.floor(Number(k));
      const s = Math.floor(Number(v));
      if (!Number.isFinite(i) || i < 0) continue;
      if (!Number.isFinite(s) || s < 1 || s > 3) continue;
      best[i] = s;
    }
    let unlocked = Math.floor(Number(data.unlocked));
    if (!Number.isFinite(unlocked) || unlocked < 0) unlocked = 0;
    for (const k of Object.keys(best)) {
      unlocked = Math.max(unlocked, Math.floor(Number(k)) + 1);
    }
    return { best, unlocked };
  } catch {
    return emptyStarRecords();
  }
}

/**
 * @param {{ best?: Record<number, number>, unlocked?: number } | null | undefined} records
 */
export function serializeStarRecords(records) {
  const src =
    records?.best && typeof records.best === "object" && !Array.isArray(records.best)
      ? records.best
      : {};
  /** @type {Record<string, number>} */
  const best = {};
  for (const [k, v] of Object.entries(src)) {
    best[String(k)] = v;
  }
  const unlocked = Math.max(0, Math.floor(Number(records?.unlocked) || 0));
  return JSON.stringify({ best, unlocked });
}

/**
 * Ensure `levelIndex` (and anything below) can be played.
 * @param {{ best: Record<number, number>, unlocked: number }} records
 * @param {number} levelIndex
 */
export function withUnlocked(records, levelIndex) {
  const i = Math.max(0, Math.floor(Number(levelIndex) || 0));
  return {
    best: { ...records.best },
    unlocked: Math.max(records.unlocked, i),
  };
}

/**
 * Keep the higher star count; completing a level unlocks the next.
 * @param {{ best: Record<number, number>, unlocked: number }} records
 * @param {number} levelIndex
 * @param {number} stars
 */
export function recordLevelStars(records, levelIndex, stars) {
  const i = Math.max(0, Math.floor(levelIndex));
  const s = Math.min(3, Math.max(1, Math.floor(stars)));
  const prev = records.best[i] ?? 0;
  return {
    best: { ...records.best, [i]: Math.max(prev, s) },
    unlocked: Math.max(records.unlocked, i + 1),
  };
}

/**
 * @param {{ best: Record<number, number> }} records
 * @param {number} levelIndex
 */
export function starsForLevel(records, levelIndex) {
  const s = records.best[levelIndex];
  return Number.isFinite(s) ? s : 0;
}

/**
 * @param {{ unlocked: number }} records
 * @param {number} levelIndex
 */
export function isLevelUnlocked(records, levelIndex) {
  return Math.floor(levelIndex) <= records.unlocked;
}

/**
 * @param {number} levelIndex
 * @param {number} packSize
 */
export function nextLevelIndex(levelIndex, packSize) {
  if (!Number.isFinite(packSize) || packSize <= 0) return 0;
  const next = Math.floor(levelIndex) + 1;
  if (next >= packSize) return 0;
  return next;
}

/**
 * @param {{ best: Record<number, number>, unlocked: number }} records
 * @param {number} packSize
 */
export function levelSelectItems(records, packSize) {
  const size = Math.max(0, Math.floor(Number(packSize) || 0));
  /** @type {Array<{ index: number, number: number, stars: number, unlocked: boolean, completed: boolean }>} */
  const items = [];
  for (let i = 0; i < size; i++) {
    const stars = starsForLevel(records, i);
    items.push({
      index: i,
      number: i + 1,
      stars,
      unlocked: isLevelUnlocked(records, i),
      completed: stars > 0,
    });
  }
  return items;
}

/**
 * @param {string | null | undefined} raw
 * @returns {number | null}
 */
export function parseLevelIndex(raw) {
  if (raw == null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

/**
 * @param {number} index
 */
export function serializeLevelIndex(index) {
  return String(Math.max(0, Math.floor(index)));
}

/**
 * Snapshot remaining arrows for the undo stack.
 * @param {Array<{ id: string, dir: string, path: { x: number, y: number }[], state: string }>} arrows
 */
export function snapshotArrows(arrows) {
  return JSON.stringify(
    arrows
      .filter((a) => a.state !== "gone")
      .map((a) => ({
        id: a.id,
        dir: a.dir,
        path: a.path,
      })),
  );
}

/**
 * @param {string} raw
 * @returns {Array<{ id: string, dir: string, path: { x: number, y: number }[] }>}
 */
export function parseArrowSnapshot(raw) {
  const restored = JSON.parse(raw);
  if (!Array.isArray(restored)) throw new Error("Invalid snapshot");
  return restored.map((a) => ({
    id: a.id,
    dir: a.dir,
    path: a.path.map((p) => ({ x: p.x, y: p.y })),
  }));
}
