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
  repairToSolvable,
} from "../js/levels.js";
import { isCenterCell } from "../js/level-build.js";
import { canEscapePath, cellKey, isSolvable, stuckArrows } from "../js/logic.js";

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
    for (let y = 0; y < TUTORIAL.size; y++) {
      for (let x = 0; x < TUTORIAL.size; x++) {
        if (isCenterCell(x, y, TUTORIAL.size)) {
          assert.ok(occupied.has(cellKey(x, y)), `center (${x}, ${y}) should be filled`);
        }
      }
    }
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

  it("keeps a center-zone endpoint on each multi-cell arrow", () => {
    const level = buildSolvableLevel(10, 12, rngFrom(77));
    const multiCellArrows = level.arrows.filter((arrow) => arrow.path.length > 1);
    assert.ok(multiCellArrows.length > 0, "expected at least one multi-cell arrow");
    for (const arrow of multiCellArrows) {
      const [tx, ty] = arrow.path[0];
      const [hx, hy] = arrow.path[arrow.path.length - 1];
      assert.ok(
        isCenterCell(tx, ty, level.size) || isCenterCell(hx, hy, level.size),
        `tail (${tx}, ${ty}) or head (${hx}, ${hy}) should be in the center zone on size ${level.size}`,
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

  it("fills all center cells (edges may be empty)", () => {
    const level = buildSolvableLevel(8, 10, rngFrom(42));
    const occupied = new Set();
    for (const arrow of level.arrows) {
      for (const [x, y] of arrow.path) {
        occupied.add(cellKey(x, y));
      }
    }
    for (let y = 0; y < level.size; y++) {
      for (let x = 0; x < level.size; x++) {
        if (isCenterCell(x, y, level.size)) {
          assert.ok(occupied.has(cellKey(x, y)), `center (${x}, ${y}) should be filled`);
        }
      }
    }
  });

  it("produces solvable boards", () => {
    const level = buildSolvableLevel(10, 12, rngFrom(77));
    assert.equal(isSolvable(level.size, level.arrows), true);
    assert.equal(isSolvable(TUTORIAL.size, TUTORIAL.arrows), true);
  });

  it("every pack level is solvable", () => {
    assert.ok(LEVEL_PACK.length > 0);
    for (let i = 0; i < LEVEL_PACK.length; i += 1) {
      const level = LEVEL_PACK[i];
      assert.equal(
        isSolvable(level.size, level.arrows),
        true,
        `level ${i + 1} (index ${i}) should be solvable`,
      );
    }
  });
});

describe("repairToSolvable", () => {
  it("leaves an already-clear board unchanged", () => {
    const level = {
      size: 4,
      arrows: [{ dir: "E", path: [[0, 0]] }],
    };
    assert.equal(repairToSolvable(level), true);
    assert.equal(level.arrows[0].dir, "E");
  });

  it("flips a facing length-1 pair so greedy clear works", () => {
    const level = {
      size: 14,
      arrows: [
        { dir: "S", path: [[5, 5]] },
        { dir: "N", path: [[5, 7]] },
      ],
    };
    assert.equal(isSolvable(level.size, level.arrows), false);
    assert.equal(repairToSolvable(level), true);
    assert.equal(isSolvable(level.size, level.arrows), true);
    assert.deepEqual(
      level.arrows.map((a) => a.path),
      [[[5, 5]], [[5, 7]]],
    );
  });

  it("reverses a head-to-head pair on a file", () => {
    const level = {
      size: 8,
      arrows: [
        { dir: "E", path: [[2, 2], [3, 2]] },
        { dir: "W", path: [[5, 2], [4, 2]] },
      ],
    };
    assert.equal(isSolvable(level.size, level.arrows), false);
    assert.equal(repairToSolvable(level), true);
    assert.equal(isSolvable(level.size, level.arrows), true);
    const cells = new Set();
    for (const arrow of level.arrows) {
      for (const [x, y] of arrow.path) cells.add(cellKey(x, y));
    }
    assert.equal(cells.size, 4);
  });

  it("reverses a north-south head-to-head pair", () => {
    const level = {
      size: 8,
      arrows: [
        { dir: "S", path: [[3, 2], [3, 3]] },
        { dir: "N", path: [[3, 5], [3, 4]] },
      ],
    };
    assert.equal(repairToSolvable(level), true);
    assert.equal(isSolvable(level.size, level.arrows), true);
  });

  it("returns false when leftover arrows cannot be reoriented", () => {
    const level = {
      size: 4,
      arrows: [
        { dir: "E", path: [[0, 0], [1, 1]] },
        { dir: "W", path: [[3, 0], [2, 1]] },
      ],
    };
    assert.equal(isSolvable(level.size, level.arrows), false);
    assert.equal(repairToSolvable(level), false);
    assert.equal(stuckArrows(level.size, level.arrows).length, 2);
  });

  it("skips a length-1 whose every dir is blocked, then frees a neighbor", () => {
    const level = {
      size: 5,
      arrows: [
        { dir: "N", path: [[2, 2]] },
        { dir: "S", path: [[2, 1]] },
        { dir: "N", path: [[2, 3]] },
        { dir: "E", path: [[1, 2]] },
        { dir: "W", path: [[3, 2]] },
      ],
    };
    assert.equal(repairToSolvable(level), true);
    assert.equal(isSolvable(level.size, level.arrows), true);
  });

  it("reverts a reverse that is still blocked and repairs another arrow", () => {
    const level = {
      size: 6,
      arrows: [
        { dir: "E", path: [[1, 2], [2, 2]] },
        { dir: "W", path: [[4, 2], [3, 2]] },
        { dir: "E", path: [[0, 2]] },
      ],
    };
    assert.equal(isSolvable(level.size, level.arrows), false);
    assert.equal(repairToSolvable(level), true);
    assert.equal(isSolvable(level.size, level.arrows), true);
  });
});
