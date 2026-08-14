import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  STORAGE_KEY,
  STORAGE_KEYS,
  parseLevelIndex,
  serializeLevelIndex,
  snapshotArrows,
  parseArrowSnapshot,
  clearAllProgress,
  menuStats,
} from "../js/progress.js";

describe("progress storage", () => {
  it("keeps the public localStorage key stable", () => {
    assert.equal(STORAGE_KEY, "arrow-out-level");
  });

  it("parses valid indices and rejects junk", () => {
    assert.equal(parseLevelIndex("3"), 3);
    assert.equal(parseLevelIndex("3.9"), 3);
    assert.equal(parseLevelIndex(null), null);
    assert.equal(parseLevelIndex("nope"), null);
    assert.equal(parseLevelIndex("-1"), null);
  });

  it("serializes non-negative floor indices", () => {
    assert.equal(serializeLevelIndex(4.8), "4");
    assert.equal(serializeLevelIndex(-2), "0");
  });

  it("lists every owned key and clearAllProgress removes only those", () => {
    assert.deepEqual([...STORAGE_KEYS], [STORAGE_KEY]);
    const store = new Map([
      [STORAGE_KEY, "5"],
      ["unrelated", "keep"],
    ]);
    const storage = {
      removeItem(key) {
        store.delete(key);
      },
    };
    clearAllProgress(storage);
    assert.equal(store.has(STORAGE_KEY), false);
    assert.equal(store.get("unrelated"), "keep");
  });
});

describe("menu stats", () => {
  const arrows = [
    { state: "idle" },
    { state: "gone" },
    { state: "sliding" },
  ];

  it("uses 1-based level numbers and counts remaining arrows", () => {
    assert.deepEqual(
      menuStats({
        levelIndex: 4,
        moves: 7,
        arrows,
        packSize: 100,
      }),
      {
        levelNumber: 5,
        packSize: 100,
        moves: 7,
        arrowsRemaining: 2,
        arrowsTotal: 3,
        levelsCleared: 4,
      },
    );
  });

  it("counts the current level as cleared after a win", () => {
    const stats = menuStats({
      levelIndex: 0,
      moves: 3,
      arrows: [{ state: "gone" }],
      packSize: 100,
      won: true,
    });
    assert.equal(stats.levelNumber, 1);
    assert.equal(stats.arrowsRemaining, 0);
    assert.equal(stats.levelsCleared, 1);
  });
});

describe("undo snapshots", () => {
  it("round-trips remaining arrows and drops gone ones", () => {
    const arrows = [
      {
        id: "a",
        dir: "E",
        path: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ],
        state: "idle",
      },
      {
        id: "b",
        dir: "N",
        path: [{ x: 2, y: 2 }],
        state: "gone",
      },
    ];
    const raw = snapshotArrows(arrows);
    const restored = parseArrowSnapshot(raw);
    assert.equal(restored.length, 1);
    assert.deepEqual(restored[0], {
      id: "a",
      dir: "E",
      path: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
    });
  });
});
