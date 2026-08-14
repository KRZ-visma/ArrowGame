/** Persisted level index — do not rename without a migration. */
export const STORAGE_KEY = "arrow-out-level";

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
