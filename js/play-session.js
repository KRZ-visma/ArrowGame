/** Shared play session — board view state and star records for UI modules. */

import { emptyStarRecords } from "./progress.js";

export const VIEW_MAX_SCALE = 3;
export const TAP_SLOP_PX = 12;

/**
 * @typedef {Object} Arrow
 * @property {string} id
 * @property {import('./logic.js').Dir} dir
 * @property {import('./logic.js').Cell[]} path
 * @property {number} offsetX
 * @property {number} offsetY
 * @property {number} slideDistance
 * @property {'idle'|'shake'|'sliding'|'gone'} state
 * @property {number} animT
 * @property {number} shakePhase
 * @property {boolean} hovered
 */

export const state = {
  levelIndex: 0,
  /** When true, the board is the hand-authored beta demo — no stars / unlock / skip. */
  beta: false,
  /** Index into the beta sequence while `beta` is true (`0 .. BETA_LEVEL_COUNT-1`). */
  betaIndex: 0,
  size: 8,
  arrows: /** @type {Arrow[]} */ ([]),
  moves: 0,
  strikes: 0,
  cell: 40,
  pad: 24,
  side: 0,
  viewW: 0,
  viewH: 0,
  dpr: 1,
  viewScale: 1,
  viewX: 0,
  viewY: 0,
  pointer: null,
  animating: false,
  won: false,
  failed: false,
  endMode: /** @type {'win' | 'fail' | null} */ (null),
};

/** @type {{ best: Record<number, number>, unlocked: number, skipped: number[] }} */
export const stars = {
  records: emptyStarRecords(),
};
