import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  TUTORIAL,
  LEVEL_PACK,
  LEVELS,
  buildSolvableLevel,
  makeHandLevel,
  getLevelData,
  rngFrom,
  buildLevelForIndex,
} from "../js/levels.js";
import { isCenterCell } from "../js/level-build.js";
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

  it("starts each arrow tail in the center zone", () => {
    const level = buildSolvableLevel(10, 12, rngFrom(77));
    for (const arrow of level.arrows) {
      const [x, y] = arrow.path[0];
      assert.ok(
        isCenterCell(x, y, level.size),
        `tail at (${x}, ${y}) should be in the center zone on size ${level.size}`,
      );
    }
  });

  it("serves pre-generated pack data at runtime", () => {
    assert.equal(LEVEL_PACK.length, 100);
    assert.equal(LEVELS, LEVEL_PACK);
    assert.deepEqual(getLevelData(0), TUTORIAL);
    assert.deepEqual(getLevelData(0), LEVEL_PACK[0]);
    assert.deepEqual(getLevelData(15), LEVEL_PACK[15]);
    assert.deepEqual(getLevelData(999), LEVEL_PACK[LEVEL_PACK.length - 1]);
    assert.deepEqual(getLevelData(-3), LEVEL_PACK[0]);
  });

  it("matches the generator output for sampled indices", () => {
    for (const index of [0, 1, 11, 12, 50, 99]) {
      assert.deepEqual(LEVEL_PACK[index], buildLevelForIndex(index));
    }
  });
});
