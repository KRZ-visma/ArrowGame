/** Persisted level index — do not rename without a migration. */
export const STORAGE_KEY = "arrow-out-level";

/** Best stars per level + furthest unlocked index + outstanding skips. Additive; do not reuse STORAGE_KEY. */
export const STARS_KEY = "arrow-out-stars";

/** Keys owned by the game. Clear-all removes every entry here. */
export const STORAGE_KEYS = Object.freeze([STORAGE_KEY, STARS_KEY]);

/** Blocked taps that fail the run. */
export const MAX_STRIKES = 3;

/** Outstanding skipped (uncleared) levels allowed at once. Completing one restores a skip. */
export const MAX_SKIPS = 3;

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
 * `skipsLeft` is remaining skip slots (max 3 outstanding uncleared skips).
 * @param {{
 *   levelIndex: number,
 *   moves: number,
 *   arrows: Array<{ state: string }>,
 *   packSize: number,
 *   won?: boolean,
 *   strikes?: number,
 *   skipsLeft?: number,
 * }} input
 */
export function menuStats({
  levelIndex,
  moves,
  arrows,
  packSize,
  won = false,
  strikes = 0,
  skipsLeft = MAX_SKIPS,
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
    skipsLeft: clampSkipsLeft(skipsLeft),
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
 * Win splash may offer a retry when this clear earned 1 or 2 stars.
 * @param {number} stars
 */
export function canRetryForThreeStars(stars) {
  const s = Math.floor(Number(stars));
  return s === 1 || s === 2;
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

/**
 * @param {unknown} value
 */
function clampSkipsLeft(value) {
  const n = Number.isFinite(value) ? Math.floor(value) : MAX_SKIPS;
  return Math.max(0, Math.min(MAX_SKIPS, n));
}

/**
 * Unique, sorted, incomplete indices, capped at MAX_SKIPS.
 * @param {unknown} raw
 * @param {Record<number, number>} best
 * @returns {number[]}
 */
export function normalizeSkipped(raw, best = {}) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  /** @type {number[]} */
  const out = [];
  for (const item of raw) {
    const i = Math.floor(Number(item));
    if (!Number.isFinite(i) || i < 0) continue;
    if (seen.has(i)) continue;
    const stars = best[i];
    if (Number.isFinite(stars) && stars > 0) continue;
    seen.add(i);
    out.push(i);
  }
  out.sort((a, b) => a - b);
  return out.slice(0, MAX_SKIPS);
}

/** @returns {{ best: Record<number, number>, unlocked: number, skipped: number[] }} */
export function emptyStarRecords() {
  return { best: {}, unlocked: 0, skipped: [] };
}

/**
 * @param {string | null | undefined} raw
 * @returns {{ best: Record<number, number>, unlocked: number, skipped: number[] }}
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
    const skipped = normalizeSkipped(data.skipped, best);
    return { best, unlocked, skipped };
  } catch {
    return emptyStarRecords();
  }
}

/**
 * @param {{ best?: Record<number, number>, unlocked?: number, skipped?: number[] } | null | undefined} records
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
  const skipped = normalizeSkipped(records?.skipped, Object.fromEntries(
    Object.entries(best).map(([k, v]) => [Number(k), v]),
  ));
  return JSON.stringify({ best, unlocked, skipped });
}

/**
 * Ensure `levelIndex` (and anything below) can be played.
 * @param {{ best: Record<number, number>, unlocked: number, skipped?: number[] }} records
 * @param {number} levelIndex
 */
export function withUnlocked(records, levelIndex) {
  const i = Math.max(0, Math.floor(Number(levelIndex) || 0));
  return {
    best: { ...records.best },
    unlocked: Math.max(records.unlocked, i),
    skipped: normalizeSkipped(records.skipped, records.best),
  };
}

/**
 * Keep the higher star count; completing a level unlocks the next.
 * Finishing a skipped level drops it from `skipped` so a skip slot returns.
 * @param {{ best: Record<number, number>, unlocked: number, skipped?: number[] }} records
 * @param {number} levelIndex
 * @param {number} stars
 */
export function recordLevelStars(records, levelIndex, stars) {
  const i = Math.max(0, Math.floor(levelIndex));
  const s = Math.min(3, Math.max(1, Math.floor(stars)));
  const prev = records.best[i] ?? 0;
  const best = { ...records.best, [i]: Math.max(prev, s) };
  return {
    best,
    unlocked: Math.max(records.unlocked, i + 1),
    skipped: normalizeSkipped(records.skipped, best),
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
 * @param {{ skipped?: number[] }} records
 */
export function skippedLevels(records) {
  return normalizeSkipped(records?.skipped);
}

/**
 * @param {{ skipped?: number[] }} records
 */
export function skipsRemaining(records) {
  return Math.max(0, MAX_SKIPS - skippedLevels(records).length);
}

/**
 * @param {{ skipped?: number[] }} records
 * @param {number} levelIndex
 */
export function isLevelSkipped(records, levelIndex) {
  const i = Math.floor(Number(levelIndex));
  if (!Number.isFinite(i)) return false;
  return skippedLevels(records).includes(i);
}

/**
 * Skip is allowed when the level is uncleared, not already skipped, and a slot remains.
 * @param {{ best: Record<number, number>, skipped?: number[] }} records
 * @param {number} levelIndex
 */
export function canSkipLevel(records, levelIndex) {
  const i = Math.floor(Number(levelIndex));
  if (!Number.isFinite(i) || i < 0) return false;
  if (starsForLevel(records, i) > 0) return false;
  if (isLevelSkipped(records, i)) return false;
  return skipsRemaining(records) > 0;
}

/**
 * Mark `levelIndex` skipped and unlock the next pack index. No-op when `canSkipLevel` is false.
 * @param {{ best: Record<number, number>, unlocked: number, skipped?: number[] }} records
 * @param {number} levelIndex
 * @param {number} packSize
 */
export function skipLevel(records, levelIndex, packSize) {
  const best = { ...records.best };
  const skipped = normalizeSkipped(records.skipped, best);
  if (!canSkipLevel({ best, skipped }, levelIndex)) {
    return {
      best,
      unlocked: records.unlocked,
      skipped,
    };
  }
  const i = Math.floor(levelIndex);
  const next = nextLevelIndex(i, packSize);
  return {
    best,
    unlocked: Math.max(records.unlocked, i, next),
    skipped: normalizeSkipped([...skipped, i], best),
  };
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
 * Lowest pack index with fewer than 3 best stars, or -1 when every level is 3★.
 * @param {{ best: Record<number, number> }} records
 * @param {number} packSize
 */
export function firstLevelBelowThreeStars(records, packSize) {
  const size = Math.max(0, Math.floor(Number(packSize) || 0));
  for (let i = 0; i < size; i++) {
    if (starsForLevel(records, i) < 3) return i;
  }
  return -1;
}

/**
 * @param {{ best: Record<number, number>, unlocked: number, skipped?: number[] }} records
 * @param {number} packSize
 */
export function levelSelectItems(records, packSize) {
  const size = Math.max(0, Math.floor(Number(packSize) || 0));
  /** @type {Array<{ index: number, number: number, stars: number, unlocked: boolean, completed: boolean, skipped: boolean }>} */
  const items = [];
  for (let i = 0; i < size; i++) {
    const stars = starsForLevel(records, i);
    items.push({
      index: i,
      number: i + 1,
      stars,
      unlocked: isLevelUnlocked(records, i),
      completed: stars > 0,
      skipped: isLevelSkipped(records, i),
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
