import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  BETA_LEVEL,
  BETA_LEVEL_COUNT,
  BETA_LEVEL_ID,
  BETA_LEVELS,
  getBetaLevel,
} from "../js/beta-level.js";
import { cellKey, countPathTurns, dirBetween, isSolvable, pathHasReversal } from "../js/logic.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Pack-milestone scale targets for the three-step ramp (not consecutive early levels). */
const RAMP = [
  { minSize: 6, maxSize: 6, minArrows: 6, maxArrows: 12 },
  { minSize: 14, maxSize: 15, minArrows: 24, maxArrows: 40 },
  { minSize: 16, maxSize: 16, minArrows: 28, maxArrows: 48 },
];

/** Winding-shape floors mirroring pack minBends growth (tutorial → ~20 → mid/late). */
const SHAPE_RAMP = [
  { minBent: 1, minCurl: 0, minReversal: 1 },
  { minBent: 4, minCurl: 4, minReversal: 3 },
  { minBent: 4, minCurl: 8, minReversal: 4 },
];

describe("beta levels", () => {
  it("exports a three-board sequence with a stable id", () => {
    assert.equal(BETA_LEVEL_ID, "axis-traffic-v3");
    assert.equal(BETA_LEVEL_COUNT, 3);
    assert.equal(BETA_LEVELS.length, BETA_LEVEL_COUNT);
    assert.deepEqual(BETA_LEVEL, BETA_LEVELS[0]);
  });

  it("clones a board by index without mutating the source", () => {
    const clone = getBetaLevel(1);
    assert.notEqual(clone, BETA_LEVELS[1]);
    assert.notEqual(clone.arrows, BETA_LEVELS[1].arrows);
    assert.deepEqual(clone, BETA_LEVELS[1]);
    clone.arrows[0].path[0][0] = 99;
    assert.notEqual(BETA_LEVELS[1].arrows[0].path[0][0], 99);
    assert.deepEqual(getBetaLevel(-1), BETA_LEVELS[0]);
    assert.deepEqual(getBetaLevel(99), BETA_LEVELS[BETA_LEVEL_COUNT - 1]);
  });

  it("ramps size and arrow count like pack milestones", () => {
    for (let i = 0; i < BETA_LEVEL_COUNT; i++) {
      const level = BETA_LEVELS[i];
      const spec = RAMP[i];
      assert.ok(level.size >= spec.minSize && level.size <= spec.maxSize, `beta ${i + 1} size`);
      assert.ok(
        level.arrows.length >= spec.minArrows && level.arrows.length <= spec.maxArrows,
        `beta ${i + 1} arrow count`,
      );
    }
    assert.ok(BETA_LEVELS[1].size > BETA_LEVELS[0].size);
    assert.ok(BETA_LEVELS[2].size >= BETA_LEVELS[1].size);
    assert.ok(BETA_LEVELS[1].arrows.length > BETA_LEVELS[0].arrows.length);
    assert.ok(BETA_LEVELS[2].arrows.length >= BETA_LEVELS[1].arrows.length);
  });

  it("ramps bends, curls, and U-turn reversals like pack winding shapes", () => {
    for (let i = 0; i < BETA_LEVEL_COUNT; i++) {
      const level = BETA_LEVELS[i];
      const floor = SHAPE_RAMP[i];
      let bent = 0;
      let curl = 0;
      let reversal = 0;
      for (const arrow of level.arrows) {
        const turns = countPathTurns(arrow.path);
        if (turns === 1) bent += 1;
        if (turns >= 2) curl += 1;
        if (pathHasReversal(arrow.path)) reversal += 1;
      }
      assert.ok(bent >= floor.minBent, `beta ${i + 1} bent count ${bent}`);
      assert.ok(curl >= floor.minCurl, `beta ${i + 1} curl count ${curl}`);
      assert.ok(reversal >= floor.minReversal, `beta ${i + 1} reversal count ${reversal}`);
    }
    const turns = (idx) =>
      BETA_LEVELS[idx].arrows.reduce((n, a) => n + countPathTurns(a.path), 0);
    assert.ok(turns(1) > turns(0), "beta 2 has more total bends than beta 1");
    assert.ok(turns(2) >= turns(1), "beta 3 has at least as many total bends as beta 2");
  });

  for (let i = 0; i < BETA_LEVEL_COUNT; i++) {
    it(`beta ${i + 1}: no overlaps, tip matches crawl dir, isSolvable`, () => {
      const level = BETA_LEVELS[i];
      const seen = new Set();
      for (const arrow of level.arrows) {
        assert.ok(arrow.path.length >= 2, "arrow needs a segment");
        for (let p = 1; p < arrow.path.length; p++) {
          assert.ok(dirBetween(arrow.path[p - 1], arrow.path[p]), "path must be orthogonal");
        }
        const last = arrow.path[arrow.path.length - 1];
        const prev = arrow.path[arrow.path.length - 2];
        assert.equal(dirBetween(prev, last), arrow.dir);
        for (const [x, y] of arrow.path) {
          assert.ok(x >= 0 && y >= 0 && x < level.size && y < level.size);
          const k = cellKey(x, y);
          assert.equal(seen.has(k), false, `overlap at ${k}`);
          seen.add(k);
        }
      }
      assert.equal(isSolvable(level.size, level.arrows), true);
    });
  }

  it("documents axis traffic + winding shapes and does not import the pack generator", () => {
    const src = readFileSync(join(root, "js/beta-level.js"), "utf8");
    assert.doesNotMatch(src, /^import\b/m);
    assert.doesNotMatch(src, /from\s+["'].*level-build/);
    assert.doesNotMatch(src, /from\s+["'].*levels-data/);
    assert.match(src, /axis traffic/i);
    assert.match(src, /Beta 2/i);
    assert.match(src, /pack ~20|level 20/i);
    assert.match(src, /[Uu]-?turn/);
    assert.match(src, /[Cc]url/);
    assert.match(src, /[Bb]end/);
  });
});
