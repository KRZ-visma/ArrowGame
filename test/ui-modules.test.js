import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const UI_MODULES = [
  "js/ui-shell.js",
  "js/play-session.js",
  "js/board-view.js",
  "js/board-draw.js",
  "js/overlays.js",
  "js/pointer-input.js",
];

const LANE_DOCS = [
  "agents/ui.md",
  "agents/levels.md",
  "agents/progress.md",
  "agents/pwa.md",
];

describe("UI module split", () => {
  it("ships the play UI modules and lane agent docs", () => {
    for (const rel of [...UI_MODULES, ...LANE_DOCS]) {
      assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
    }
  });

  it("game.js imports UI modules instead of inlining the CSS shell", () => {
    const game = readFileSync(join(root, "game.js"), "utf8");
    assert.match(game, /from "\.\/js\/ui-shell\.js"/);
    assert.match(game, /from "\.\/js\/board-view\.js"/);
    assert.match(game, /from "\.\/js\/board-draw\.js"/);
    assert.match(game, /from "\.\/js\/overlays\.js"/);
    assert.match(game, /from "\.\/js\/pointer-input\.js"/);
    assert.doesNotMatch(game, /const STYLE = `/);
  });

  it("service worker precaches every UI module", () => {
    const sw = readFileSync(join(root, "sw.js"), "utf8");
    for (const rel of UI_MODULES) {
      assert.match(sw, new RegExp(`"\\.\\/${rel.replace(/\//g, "\\/")}"`));
    }
    assert.match(sw, /CACHE_NAME = "arrow-out-v3"/);
  });

  it("AGENTS.md points pack ownership and parallel lanes at agents/", () => {
    const agents = readFileSync(join(root, "AGENTS.md"), "utf8");
    assert.match(agents, /Parallel lanes/);
    assert.match(agents, /agents\/levels\.md/);
    assert.match(agents, /agents\/ui\.md/);
    const levelsLane = readFileSync(join(root, "agents/levels.md"), "utf8");
    assert.match(levelsLane, /Pack ownership/);
    assert.match(levelsLane, /Do not rewrite `js\/levels-data\.js`/);
  });
});
