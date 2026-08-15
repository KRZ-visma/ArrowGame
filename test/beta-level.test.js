import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { BETA_LEVEL, BETA_LEVEL_ID, getBetaLevel } from "../js/beta-level.js";
import { cellKey, dirBetween, isSolvable } from "../js/logic.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("beta level", () => {
  it("exports a stable id and a cloneable board", () => {
    assert.equal(BETA_LEVEL_ID, "axis-traffic-v1");
    assert.equal(BETA_LEVEL.size, 8);
    assert.ok(BETA_LEVEL.arrows.length >= 8);
    const clone = getBetaLevel();
    assert.notEqual(clone, BETA_LEVEL);
    assert.notEqual(clone.arrows, BETA_LEVEL.arrows);
    assert.deepEqual(clone, BETA_LEVEL);
    clone.arrows[0].path[0][0] = 99;
    assert.notEqual(BETA_LEVEL.arrows[0].path[0][0], 99);
  });

  it("has no overlapping cells and tip matches crawl dir", () => {
    const seen = new Set();
    for (const arrow of BETA_LEVEL.arrows) {
      assert.ok(arrow.path.length >= 2, "arrow needs a segment");
      for (let i = 1; i < arrow.path.length; i++) {
        assert.ok(dirBetween(arrow.path[i - 1], arrow.path[i]), "path must be orthogonal");
      }
      const last = arrow.path[arrow.path.length - 1];
      const prev = arrow.path[arrow.path.length - 2];
      assert.equal(dirBetween(prev, last), arrow.dir);
      for (const [x, y] of arrow.path) {
        assert.ok(x >= 0 && y >= 0 && x < BETA_LEVEL.size && y < BETA_LEVEL.size);
        const k = cellKey(x, y);
        assert.equal(seen.has(k), false, `overlap at ${k}`);
        seen.add(k);
      }
    }
  });

  it("passes isSolvable and does not import the pack generator", () => {
    assert.equal(isSolvable(BETA_LEVEL.size, BETA_LEVEL.arrows), true);
    const src = readFileSync(join(root, "js/beta-level.js"), "utf8");
    assert.doesNotMatch(src, /level-build|buildSolvableLevel|growWindingPath|LEVEL_PACK/);
    assert.match(src, /axis traffic/i);
  });
});
