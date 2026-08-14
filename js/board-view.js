/** Cover-fit board viewport: resize, zoom, pan, screen↔board mapping. */

import { state, VIEW_MAX_SCALE } from "./play-session.js";

/** @type {HTMLCanvasElement | null} */
let canvas = null;
/** @type {CanvasRenderingContext2D | null} */
let ctx = null;

/**
 * @param {HTMLCanvasElement} c
 * @param {CanvasRenderingContext2D} context
 */
export function bindBoardView(c, context) {
  canvas = c;
  ctx = context;
}

export function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/** Scale 1 covers the long viewport axis; zoom-out can fit the full square. */
export function minViewScale() {
  if (!state.side || !state.viewW || !state.viewH) return 1;
  return Math.min(state.viewW, state.viewH) / state.side;
}

export function boardOverflowsViewport() {
  const scaled = state.side * state.viewScale;
  return scaled > state.viewW + 0.5 || scaled > state.viewH + 0.5;
}

export function panRange(viewLen, contentLen) {
  if (contentLen <= viewLen) {
    const centered = (viewLen - contentLen) / 2;
    return [centered, centered];
  }
  return [viewLen - contentLen, 0];
}

export function fitCoverView() {
  if (!state.side || !state.viewW || !state.viewH) {
    state.viewX = 0;
    state.viewY = 0;
    return;
  }
  state.viewScale = 1;
  state.viewX = (state.viewW - state.side) / 2;
  state.viewY = (state.viewH - state.side) / 2;
  clampView();
}

export function clampView() {
  const side = state.side || 0;
  if (side <= 0 || !state.viewW || !state.viewH) return;
  const minScale = minViewScale();
  state.viewScale = clamp(state.viewScale, minScale, VIEW_MAX_SCALE);
  const scaled = side * state.viewScale;
  const [minX, maxX] = panRange(state.viewW, scaled);
  const [minY, maxY] = panRange(state.viewH, scaled);
  state.viewX = clamp(state.viewX, minX, maxX);
  state.viewY = clamp(state.viewY, minY, maxY);
}

export function resetView() {
  state.viewScale = 1;
  fitCoverView();
}

/** Zoom so the board point under (sx, sy) stays fixed. */
export function zoomAt(sx, sy, nextScale) {
  const prev = state.viewScale;
  const scale = clamp(nextScale, minViewScale(), VIEW_MAX_SCALE);
  if (prev <= 0) return;
  const boardX = (sx - state.viewX) / prev;
  const boardY = (sy - state.viewY) / prev;
  state.viewScale = scale;
  state.viewX = sx - boardX * scale;
  state.viewY = sy - boardY * scale;
  clampView();
}

/** @param {{ resetView?: boolean }} [opts] */
export function resize(opts = {}) {
  if (!canvas || !ctx) return;
  const rect = canvas.getBoundingClientRect();
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * state.dpr);
  canvas.height = Math.round(rect.height * state.dpr);
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  state.viewW = rect.width;
  state.viewH = rect.height;
  // Cover the long axis so portrait height is used, not letterboxed.
  const side = Math.max(rect.width, rect.height);
  state.side = side;
  state.pad = Math.max(14, side * 0.04);
  state.cell = state.size > 0 ? (side - state.pad * 2) / state.size : 0;
  if (opts.resetView) resetView();
  else clampView();
}

export function clientToScreen(clientX, clientY) {
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

export function clientToBoard(clientX, clientY) {
  const { x: sx, y: sy } = clientToScreen(clientX, clientY);
  return {
    x: (sx - state.viewX) / state.viewScale,
    y: (sy - state.viewY) / state.viewScale,
  };
}
