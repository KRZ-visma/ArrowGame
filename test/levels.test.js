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
import {
  isCenterCell,
  chooseArrowShape,
  growWindingPath,
} from "../js/level-build.js";
import { canEscapePath, cellKey, isSolvable, stuckArrows, countPathTurns, pathHasReversal, dirBetween } from "../js/logic.js";

describe("chooseArrowShape / growWindingPath", () => {
  it("picks curl, U-turn, bent, or straight from the roll and budget", () => {
    assert.equal(chooseArrowShape(() => 0, 6), "curl");
    assert.equal(chooseArrowShape(() => 0.3, 6), "uturn");
    assert.equal(chooseArrowShape(() => 0.7, 6), "bent");
    assert.equal(chooseArrowShape(() => 0.95, 8), "straight");
    assert.equal(chooseArrowShape(() => 0, 5), "uturn");
    assert.equal(chooseArrowShape(() => 0, 3), "bent");
    assert.equal(chooseArrowShape(() => 0, 2), "straight");
  });

  it("grows a U-turn that reverses and still ends in the exit dir", () => {
    const path = growWindingPath([5, 5], "E", 12, new Set(), rngFrom(3), "uturn");
    assert.ok(path);
    assert.ok(path.length >= 4);
    assert.equal(dirBetween(path[path.length - 2], path[path.length - 1]), "E");
    assert.equal(pathHasReversal(path), true);
  });

  it("grows an angled path with at least one bend", () => {
    const path = growWindingPath([5, 5], "N", 12, new Set(), rngFrom(8), "bent");
    assert.ok(path);
    assert.ok(countPathTurns(path) >= 1);
    assert.equal(dirBetween(path[path.length - 2], path[path.length - 1]), "N");
  });

  it("grows a multi-turn curl", () => {
    const path = growWindingPath([6, 6], "W", 14, new Set(), rngFrom(11), "curl");
    assert.ok(path);
    assert.ok(countPathTurns(path) >= 2);
    assert.equal(dirBetween(path[path.length - 2], path[path.length - 1]), "W");
  });

  it("grows a straight path when asked", () => {
    const path = growWindingPath([2, 4], "S", 10, new Set(), rngFrom(1), "straight");
    assert.ok(path);
    assert.equal(countPathTurns(path), 0);
    assert.equal(dirBetween(path[path.length - 2], path[path.length - 1]), "S");
  });

  it("grows both L-bends and jogs", () => {
    let elbows = 0;
    let jogs = 0;
    for (let seed = 1; seed <= 24; seed += 1) {
      const path = growWindingPath([5, 5], "E", 12, new Set(), rngFrom(seed), "bent");
      assert.ok(path);
      const turns = countPathTurns(path);
      assert.ok(turns >= 1);
      if (turns >= 2) jogs += 1;
      else elbows += 1;
    }
    assert.ok(elbows >= 1, "expected an L-bend");
    assert.ok(jogs >= 1, "expected a jog with two turns");
  });

  it("returns null when every neighbor is blocked", () => {
    const occupied = new Set([
      cellKey(3, 2),
      cellKey(3, 4),
      cellKey(2, 3),
      cellKey(4, 3),
    ]);
    assert.equal(growWindingPath([3, 3], "E", 8, occupied, rngFrom(1), "curl"), null);
  });

  it("falls back after a 2x2 pocket blocks longer curls", () => {
    const occupied = new Set();
    for (let y = 0; y < 6; y += 1) {
      for (let x = 0; x < 6; x += 1) {
        if (x >= 2 && x <= 3 && y >= 2 && y <= 3) continue;
        occupied.add(cellKey(x, y));
      }
    }
    const path = growWindingPath([2, 2], "E", 6, occupied, rngFrom(4), "curl");
    assert.ok(path);
    assert.ok(path.length >= 2);
    assert.equal(dirBetween(path[path.length - 2], path[path.length - 1]), "E");
  });

  it("falls back when the preferred shape cannot fit", () => {
    const occupied = new Set();
    for (let x = 0; x < 10; x++) {
      if (x !== 1) occupied.add(cellKey(x, 0));
    }
    const path = growWindingPath([1, 0], "S", 10, occupied, rngFrom(2), "uturn");
    assert.ok(path);
    assert.equal(dirBetween(path[path.length - 2], path[path.length - 1]), "S");
  });

  it("picks a shape from rng when none is forced", () => {
    const path = growWindingPath([4, 4], "E", 10, new Set(), rngFrom(21));
    assert.ok(path);
    assert.ok(path.length >= 2);
    assert.equal(dirBetween(path[path.length - 2], path[path.length - 1]), "E");
  });
});

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
    assert.ok(
      TUTORIAL.arrows.some((arrow) => countPathTurns(arrow.path) >= 1),
      "tutorial should include a bent arrow",
    );
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

  it("places angled, U-turn, and multi-turn arrows", () => {
    let bent = 0;
    let reversals = 0;
    let multi = 0;
    for (let seed = 1; seed <= 12; seed += 1) {
      const level = buildSolvableLevel(12, 18, rngFrom(seed * 17));
      for (const arrow of level.arrows) {
        const turns = countPathTurns(arrow.path);
        if (turns >= 1) bent += 1;
        if (turns >= 2) multi += 1;
        if (pathHasReversal(arrow.path)) reversals += 1;
      }
    }
    assert.ok(bent >= 20, `expected many bent arrows, got ${bent}`);
    assert.ok(reversals >= 8, `expected U-turns / S-curves, got ${reversals}`);
    assert.ok(multi >= 8, `expected multi-turn arrows, got ${multi}`);
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

  it("bakes bent and reversing arrows into the pack", () => {
    let bent = 0;
    let reversals = 0;
    let multi = 0;
    for (const level of LEVEL_PACK) {
      for (const arrow of level.arrows) {
        const turns = countPathTurns(arrow.path);
        if (turns >= 1) bent += 1;
        if (turns >= 2) multi += 1;
        if (pathHasReversal(arrow.path)) reversals += 1;
      }
    }
    assert.ok(bent >= 40, `expected bent arrows in the pack, got ${bent}`);
    assert.ok(reversals >= 10, `expected reversing arrows in the pack, got ${reversals}`);
    assert.ok(multi >= 10, `expected multi-turn arrows in the pack, got ${multi}`);
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
