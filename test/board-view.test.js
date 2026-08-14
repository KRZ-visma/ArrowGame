import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  bindBoardView,
  boardOverflowsViewport,
  clamp,
  clampView,
  clientToBoard,
  clientToScreen,
  fitContainView,
  minViewScale,
  panRange,
  resetView,
  resize,
  zoomAt,
} from "../js/board-view.js";
import { state, VIEW_MAX_SCALE } from "../js/play-session.js";

function portraitStage() {
  state.viewW = 390;
  state.viewH = 720;
  state.side = Math.max(state.viewW, state.viewH);
  state.size = 8;
  state.viewScale = 1;
  state.viewX = 0;
  state.viewY = 0;
  state.pad = 24;
  state.cell = 40;
}

function mockCanvas(width, height, left = 10, top = 20) {
  const ctx = {
    setTransform() {},
  };
  const canvas = {
    width: 0,
    height: 0,
    getBoundingClientRect() {
      return { width, height, left, top, right: left + width, bottom: top + height };
    },
  };
  return { canvas, ctx };
}

describe("board view contain default", () => {
  beforeEach(() => {
    portraitStage();
    bindBoardView(/** @type {any} */ (null), /** @type {any} */ (null));
  });

  it("minViewScale fits the square on the short axis", () => {
    assert.equal(minViewScale(), 390 / 720);
  });

  it("minViewScale is 1 when layout is missing", () => {
    state.side = 0;
    assert.equal(minViewScale(), 1);
  });

  it("fitContainView shows the full board without overflow", () => {
    fitContainView();
    assert.ok(Math.abs(state.viewScale - 390 / 720) < 1e-9);
    assert.equal(boardOverflowsViewport(), false);
    const scaled = state.side * state.viewScale;
    assert.ok(Math.abs(scaled - state.viewW) < 1e-6);
    assert.ok(scaled <= state.viewH + 1e-6);
    assert.ok(Math.abs(state.viewX - (state.viewW - scaled) / 2) < 1e-6);
    assert.ok(Math.abs(state.viewY - (state.viewH - scaled) / 2) < 1e-6);
  });

  it("fitContainView zeros pan when layout is missing", () => {
    state.side = 0;
    state.viewX = 9;
    state.viewY = 9;
    fitContainView();
    assert.equal(state.viewX, 0);
    assert.equal(state.viewY, 0);
  });

  it("resetView uses contain, not cover", () => {
    state.viewScale = VIEW_MAX_SCALE;
    resetView();
    assert.ok(Math.abs(state.viewScale - minViewScale()) < 1e-9);
    assert.equal(boardOverflowsViewport(), false);
  });

  it("cover scale (1) still overflows portrait so pinch-in can enlarge", () => {
    state.viewScale = 1;
    assert.equal(boardOverflowsViewport(), true);
  });

  it("boardOverflowsViewport detects tall overflow on a wide stage", () => {
    state.viewW = 800;
    state.viewH = 400;
    state.side = 800;
    state.viewScale = 1;
    assert.equal(boardOverflowsViewport(), true);
  });

  it("clamp and panRange center or limit translation", () => {
    assert.equal(clamp(5, 0, 3), 3);
    assert.equal(clamp(-1, 0, 3), 0);
    assert.deepEqual(panRange(100, 40), [30, 30]);
    assert.deepEqual(panRange(100, 140), [-40, 0]);
  });

  it("clampView no-ops without a board side", () => {
    state.side = 0;
    state.viewScale = 2;
    clampView();
    assert.equal(state.viewScale, 2);
  });

  it("zoomAt keeps the board point under the cursor fixed", () => {
    fitContainView();
    const sx = state.viewW / 2;
    const sy = state.viewH / 2;
    const beforeX = (sx - state.viewX) / state.viewScale;
    const beforeY = (sy - state.viewY) / state.viewScale;
    zoomAt(sx, sy, 1);
    assert.ok(Math.abs(state.viewScale - 1) < 1e-9);
    const afterX = (sx - state.viewX) / state.viewScale;
    const afterY = (sy - state.viewY) / state.viewScale;
    assert.ok(Math.abs(afterX - beforeX) < 1e-6);
    assert.ok(Math.abs(afterY - beforeY) < 1e-6);
  });

  it("zoomAt ignores non-positive previous scale", () => {
    state.viewScale = 0;
    zoomAt(10, 10, 2);
    assert.equal(state.viewScale, 0);
  });

  it("resize without bind is a no-op; with bind contain-resets", () => {
    resize({ resetView: true });
    assert.equal(state.side, 720);

    const { canvas, ctx } = mockCanvas(390, 720);
    globalThis.window = { devicePixelRatio: 2 };
    bindBoardView(/** @type {any} */ (canvas), /** @type {any} */ (ctx));
    state.size = 8;
    resize({ resetView: true });
    assert.equal(state.viewW, 390);
    assert.equal(state.viewH, 720);
    assert.equal(state.side, 720);
    assert.ok(Math.abs(state.viewScale - 390 / 720) < 1e-9);
    assert.equal(canvas.width, 780);
    assert.equal(canvas.height, 1440);

    state.viewScale = 2;
    resize();
    assert.ok(state.viewScale <= VIEW_MAX_SCALE);
    assert.ok(state.viewScale >= minViewScale());
  });

  it("clientToScreen and clientToBoard map through the view transform", () => {
    assert.deepEqual(clientToScreen(5, 5), { x: 0, y: 0 });

    const { canvas, ctx } = mockCanvas(390, 720, 10, 20);
    bindBoardView(/** @type {any} */ (canvas), /** @type {any} */ (ctx));
    fitContainView();
    const screen = clientToScreen(10 + 100, 20 + 200);
    assert.deepEqual(screen, { x: 100, y: 200 });
    const board = clientToBoard(10 + state.viewX, 20 + state.viewY);
    assert.ok(Math.abs(board.x) < 1e-9);
    assert.ok(Math.abs(board.y) < 1e-9);
  });
});
