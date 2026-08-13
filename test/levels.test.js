import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  TUTORIAL,
  LEVELS,
  buildSolvableLevel,
  makeHandLevel,
  generateLevel,
  getLevelData,
  rngFrom,
} from "../js/levels.js";
import { canEscapePath, cellKey } from "../js/logic.js";

describe("TUTORIAL", () => {
  it("has both free and blocked arrows on a small board", () => {
    const occupied = new Set();
    for (const a of TUTORIAL.arrows) {
      for (const [x, y] of a.path) occupied.add(cellKey(x, y));
    }

    const results = TUTORIAL.arrows.map((arrow) => {
      const occ = new Set(
        [...occupied].filter((k) => !arrow.path.some(([x, y]) => cellKey(x, y) === k)),
      );
      return canEscapePath(arrow.path, arrow.dir, TUTORIAL.size, occ);
    });

    assert.equal(TUTORIAL.size, 6);
    assert.equal(TUTORIAL.arrows.length, 4);
    assert.ok(results.some(Boolean), "expected at least one free arrow");
    assert.ok(results.some((free) => !free), "expected at least one blocked arrow");
  });
});

describe("level generation", () => {
  it("is deterministic for the same seed", () => {
    const a = makeHandLevel(42, 7, 8);
    const b = makeHandLevel(42, 7, 8);
    assert.deepEqual(a, b);
  });

  it("places no overlapping cells", () => {
    const level = buildSolvableLevel(8, 10, rngFrom(99));
    const seen = new Set();
    for (const arrow of level.arrows) {
      for (const [x, y] of arrow.path) {
        const k = cellKey(x, y);
        assert.equal(seen.has(k), false, `overlap at ${k}`);
        seen.add(k);
      }
    }
  });

  it("exposes the hand pack then generated levels", () => {
    assert.equal(LEVELS.length, 12);
    assert.equal(getLevelData(0), TUTORIAL);
    assert.deepEqual(getLevelData(0), generateLevel(0));
    const generated = generateLevel(LEVELS.length + 3);
    assert.ok(generated.size >= 8);
    assert.ok(generated.arrows.length >= 1);
  });
});
