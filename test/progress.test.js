import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  STORAGE_KEY,
  parseLevelIndex,
  serializeLevelIndex,
  snapshotArrows,
  parseArrowSnapshot,
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
