/** Persisted level index — do not rename without a migration. */
export const STORAGE_KEY = "arrow-out-level";

/** Keys owned by the game. Clear-all removes every entry here. */
export const STORAGE_KEYS = Object.freeze([STORAGE_KEY]);

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
 * @param {{
 *   levelIndex: number,
 *   moves: number,
 *   arrows: Array<{ state: string }>,
 *   packSize: number,
 *   won?: boolean,
 * }} input
 */
export function menuStats({ levelIndex, moves, arrows, packSize, won = false }) {
  const arrowsTotal = arrows.length;
  const arrowsRemaining = arrows.filter((a) => a.state !== "gone").length;
  return {
    levelNumber: levelIndex + 1,
    packSize,
    moves,
    arrowsRemaining,
    arrowsTotal,
    levelsCleared: levelIndex + (won ? 1 : 0),
  };
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
