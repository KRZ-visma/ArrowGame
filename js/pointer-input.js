/** Pointer / pinch / wheel input for board pan, zoom, and arrow taps. */

import { state, TAP_SLOP_PX } from "./play-session.js";
import {
  boardOverflowsViewport,
  clampView,
  clientToBoard,
  clientToScreen,
  zoomAt,
} from "./board-view.js";
import { arrowAtBoardPoint } from "./board-draw.js";

/**
 * @typedef {Object} PointerHandlers
 * @property {(arrow: import('./play-session.js').Arrow) => void} tryMove
 */

/**
 * @param {HTMLCanvasElement} canvas
 * @param {PointerHandlers} handlers
 */
export function bindPointerInput(canvas, handlers) {
  /** @type {Map<number, { x: number, y: number }>} */
  const activePointers = new Map();
  /** @type {'none' | 'pending' | 'pan' | 'pinch'} */
  let gestureMode = "none";
  let panLastX = 0;
  let panLastY = 0;
  let pinchStartDist = 0;
  let pinchStartScale = 1;
  let pinchMidX = 0;
  let pinchMidY = 0;

  function pointerDistance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function pointerMidpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function syncHoverBoard(bx, by) {
    for (const arrow of state.arrows) arrow.hovered = false;
    if (gestureMode === "pan" || gestureMode === "pinch") {
      canvas.style.cursor = gestureMode === "pan" ? "grabbing" : "default";
      return;
    }
    const arrow = arrowAtBoardPoint(bx, by);
    if (arrow) {
      arrow.hovered = true;
      canvas.style.cursor = "pointer";
    } else {
      canvas.style.cursor = boardOverflowsViewport() ? "grab" : "default";
    }
  }

  function beginPinch() {
    const pts = [...activePointers.values()];
    if (pts.length < 2) return;
    gestureMode = "pinch";
    pinchStartDist = Math.max(1, pointerDistance(pts[0], pts[1]));
    pinchStartScale = state.viewScale;
    const mid = pointerMidpoint(pts[0], pts[1]);
    pinchMidX = mid.x;
    pinchMidY = mid.y;
    for (const arrow of state.arrows) arrow.hovered = false;
    canvas.style.cursor = "default";
  }

  function updatePinch() {
    const pts = [...activePointers.values()];
    if (pts.length < 2 || pinchStartDist <= 0) return;
    const dist = Math.max(1, pointerDistance(pts[0], pts[1]));
    const mid = pointerMidpoint(pts[0], pts[1]);
    const nextScale = pinchStartScale * (dist / pinchStartDist);
    zoomAt(pinchMidX, pinchMidY, nextScale);
    const dx = mid.x - pinchMidX;
    const dy = mid.y - pinchMidY;
    state.viewX += dx;
    state.viewY += dy;
    pinchMidX = mid.x;
    pinchMidY = mid.y;
    clampView();
  }

  canvas.addEventListener("pointermove", (e) => {
    if (activePointers.has(e.pointerId)) {
      activePointers.set(e.pointerId, clientToScreen(e.clientX, e.clientY));
    }

    if (gestureMode === "pinch") {
      e.preventDefault();
      updatePinch();
      return;
    }

    if (gestureMode === "pending" || gestureMode === "pan") {
      const screen = activePointers.get(e.pointerId);
      if (!screen) return;
      e.preventDefault();
      if (gestureMode === "pending") {
        const dx = screen.x - panLastX;
        const dy = screen.y - panLastY;
        if (Math.hypot(dx, dy) >= TAP_SLOP_PX) {
          if (boardOverflowsViewport()) {
            gestureMode = "pan";
            panLastX = screen.x;
            panLastY = screen.y;
            for (const arrow of state.arrows) arrow.hovered = false;
            canvas.style.cursor = "grabbing";
          } else {
            gestureMode = "none";
          }
        }
      }
      if (gestureMode === "pan") {
        const dx = screen.x - panLastX;
        const dy = screen.y - panLastY;
        panLastX = screen.x;
        panLastY = screen.y;
        state.viewX += dx;
        state.viewY += dy;
        clampView();
      }
      return;
    }

    const { x, y } = clientToBoard(e.clientX, e.clientY);
    state.pointer = { x, y };
    syncHoverBoard(x, y);
  });

  canvas.addEventListener("pointerleave", () => {
    if (gestureMode !== "none") return;
    state.pointer = null;
    syncHoverBoard(-1, -1);
  });

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    const screen = clientToScreen(e.clientX, e.clientY);
    activePointers.set(e.pointerId, screen);
    if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);

    if (activePointers.size >= 2) {
      beginPinch();
      return;
    }

    if (state.won || state.failed) {
      gestureMode = "none";
      return;
    }

    gestureMode = "pending";
    panLastX = screen.x;
    panLastY = screen.y;
  });

  function endPointer(e) {
    const wasPending = gestureMode === "pending" && activePointers.size === 1;
    const screen = activePointers.get(e.pointerId);
    activePointers.delete(e.pointerId);
    if (canvas.hasPointerCapture?.(e.pointerId)) canvas.releasePointerCapture(e.pointerId);

    if (gestureMode === "pinch") {
      if (activePointers.size >= 2) {
        beginPinch();
        return;
      }
      if (activePointers.size === 1) {
        const remaining = [...activePointers.values()][0];
        gestureMode = boardOverflowsViewport() ? "pan" : "none";
        panLastX = remaining.x;
        panLastY = remaining.y;
        return;
      }
      gestureMode = "none";
      return;
    }

    if (gestureMode === "pan") {
      if (activePointers.size === 0) gestureMode = "none";
      return;
    }

    if (wasPending && screen && !state.won && !state.failed) {
      gestureMode = "none";
      const board = {
        x: (screen.x - state.viewX) / state.viewScale,
        y: (screen.y - state.viewY) / state.viewScale,
      };
      const arrow = arrowAtBoardPoint(board.x, board.y);
      if (arrow) handlers.tryMove(arrow);
      syncHoverBoard(board.x, board.y);
      return;
    }

    gestureMode = "none";
  }

  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const { x, y } = clientToScreen(e.clientX, e.clientY);
      const factor = Math.exp(-e.deltaY * 0.0018);
      zoomAt(x, y, state.viewScale * factor);
    },
    { passive: false },
  );
}
