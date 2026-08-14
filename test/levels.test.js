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
  levelParamsForIndex,
  levelComplexity,
  orderLevelsByComplexity,
  HAND_LEVEL_SPECS,
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

  it("keeps size and snake-count nondecreasing after the tutorial", () => {
    let prevSize = 6;
    let prevCount = 0;
    for (let i = 1; i < 100; i += 1) {
      const params = levelParamsForIndex(i);
      assert.equal(params.tutorial, undefined);
      assert.ok(
        params.size >= prevSize,
        `size dropped at index ${i}: ${params.size} < ${prevSize}`,
      );
      assert.ok(
        params.count >= prevCount,
        `count dropped at index ${i}: ${params.count} < ${prevCount}`,
      );
      prevSize = params.size;
      prevCount = params.count;
    }
    assert.deepEqual(levelParamsForIndex(0), { tutorial: true });
    assert.deepEqual(levelParamsForIndex(-1), { tutorial: true });
    const afterHand = levelParamsForIndex(HAND_LEVEL_SPECS.length + 1);
    const lastHand = levelParamsForIndex(HAND_LEVEL_SPECS.length);
    assert.ok(afterHand.size >= lastHand.size);
    assert.ok(afterHand.count >= lastHand.count);
  });

  it("keeps the tutorial as pack level 1 and generates later indices deterministically", () => {
    assert.deepEqual(LEVEL_PACK[0], TUTORIAL);
    assert.deepEqual(buildLevelForIndex(0), TUTORIAL);
    for (const index of [1, 11, 12, 50, 99]) {
      const a = buildLevelForIndex(index);
      const b = buildLevelForIndex(index);
      assert.deepEqual(a, b);
      assert.equal(isSolvable(a.size, a.arrows), true);
    }
  });

  it("orders the baked pack by nondecreasing complexity", () => {
    assert.deepEqual(LEVEL_PACK[0], TUTORIAL);
    let prev = -Infinity;
    for (let i = 0; i < LEVEL_PACK.length; i += 1) {
      const score = levelComplexity(LEVEL_PACK[i]);
      assert.ok(
        score >= prev,
        `level ${i + 1} complexity ${score} is below level ${i} (${prev})`,
      );
      prev = score;
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

describe("levelComplexity", () => {
  it("scores an empty board as 0", () => {
    assert.equal(levelComplexity({ size: 8, arrows: [] }), 0);
    assert.equal(levelComplexity({ size: 8 }), 0);
  });

  it("rates a larger blocked board above a tiny clear one", () => {
    const easy = {
      size: 4,
      arrows: [{ dir: "E", path: [[0, 0]] }],
    };
    const harder = {
      size: 8,
      arrows: [
        { dir: "E", path: [[0, 0], [1, 0], [2, 0]] },
        { dir: "W", path: [[7, 0], [6, 0]] },
      ],
    };
    assert.ok(levelComplexity(harder) > levelComplexity(easy));
    assert.ok(levelComplexity(TUTORIAL) > levelComplexity(easy));
  });

  it("counts object-cell bends the same as tuple paths", () => {
    const tuples = {
      size: 5,
      arrows: [{ dir: "E", path: [[1, 1], [2, 1], [2, 2]] }],
    };
    const objects = {
      size: 5,
      arrows: [
        {
          dir: "E",
          path: [
            { x: 1, y: 1 },
            { x: 2, y: 1 },
            { x: 2, y: 2 },
          ],
        },
      ],
    };
    assert.equal(levelComplexity(tuples), levelComplexity(objects));
    const straight = {
      size: 5,
      arrows: [{ dir: "E", path: [[0, 0], [1, 0], [2, 0]] }],
    };
    assert.ok(levelComplexity(tuples) > levelComplexity(straight));
  });

  it("still returns a finite score when greedy clear cannot finish", () => {
    const stuck = {
      size: 4,
      arrows: [
        { dir: "E", path: [[0, 0], [1, 1]] },
        { dir: "W", path: [[3, 0], [2, 1]] },
      ],
    };
    assert.equal(isSolvable(stuck.size, stuck.arrows), false);
    const score = levelComplexity(stuck);
    assert.ok(Number.isFinite(score));
    assert.ok(score > 0);
  });
});

describe("orderLevelsByComplexity", () => {
  it("pins the tutorial first and sorts the rest by score", () => {
    const easy = { size: 3, arrows: [{ dir: "N", path: [[1, 1]] }] };
    const hard = {
      size: 10,
      arrows: [
        { dir: "E", path: [[0, 0], [1, 0]] },
        { dir: "S", path: [[2, 0], [2, 1], [2, 2]] },
      ],
    };
    const ordered = orderLevelsByComplexity([hard, TUTORIAL, easy]);
    assert.equal(ordered[0], TUTORIAL);
    assert.equal(ordered[1], easy);
    assert.equal(ordered[2], hard);
  });

  it("keeps equal-score input order and copies the array", () => {
    const a = { size: 4, arrows: [{ dir: "E", path: [[0, 0]] }] };
    const b = { size: 4, arrows: [{ dir: "E", path: [[0, 0]] }] };
    const input = [a, b];
    const ordered = orderLevelsByComplexity(input);
    assert.equal(ordered[0], a);
    assert.equal(ordered[1], b);
    assert.notEqual(ordered, input);
    assert.deepEqual(orderLevelsByComplexity([]), []);
    assert.deepEqual(orderLevelsByComplexity([a]), [a]);
  });
});
