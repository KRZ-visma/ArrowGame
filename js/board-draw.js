/** Canvas paint + hit-test for arrows on the board. */

import { DELTA, snakePositions } from "./logic.js";
import { state } from "./play-session.js";

/** @type {HTMLCanvasElement | null} */
let canvas = null;
/** @type {CanvasRenderingContext2D | null} */
let ctx = null;

/**
 * @param {HTMLCanvasElement} c
 * @param {CanvasRenderingContext2D} context
 */
export function bindBoardDraw(c, context) {
  canvas = c;
  ctx = context;
}

export function cellCenter(x, y) {
  return {
    x: state.pad + (x + 0.5) * state.cell,
    y: state.pad + (y + 0.5) * state.cell,
  };
}

export function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/** @param {import('./play-session.js').Arrow} arrow */
export function arrowPathPoints(arrow) {
  const pathCells =
    arrow.state === "sliding"
      ? snakePositions(arrow.path, arrow.dir, arrow.slideDistance)
      : arrow.path;
  return pathCells.map((c) => {
    const p = cellCenter(c.x, c.y);
    return { x: p.x + arrow.offsetX, y: p.y + arrow.offsetY };
  });
}

export function arrowAtBoardPoint(bx, by) {
  const hitSlop = Math.max(16, state.cell * 0.44);
  let best = null;
  let bestDist = hitSlop;
  for (const arrow of state.arrows) {
    if (arrow.state === "gone" || arrow.state === "sliding") continue;
    const pts = arrowPathPoints(arrow);
    for (let i = 0; i < pts.length - 1; i++) {
      const d = distToSegment(bx, by, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
      if (d < bestDist) {
        bestDist = d;
        best = arrow;
      }
    }
    if (pts.length) {
      const tip = pts[pts.length - 1];
      const { x: dx, y: dy } = DELTA[arrow.dir];
      const headLen = state.cell * 0.42;
      const apexX = tip.x + dx * headLen * 0.55;
      const apexY = tip.y + dy * headLen * 0.55;
      const dTip = Math.hypot(bx - apexX, by - apexY);
      if (dTip < bestDist) {
        bestDist = dTip;
        best = arrow;
      }
    }
  }
  return best;
}

/** @param {import('./play-session.js').Arrow} arrow */
export function drawArrow(arrow) {
  if (!ctx || arrow.state === "gone") return;

  const pathCells =
    arrow.state === "sliding"
      ? snakePositions(arrow.path, arrow.dir, arrow.slideDistance)
      : arrow.path;

  const pts = pathCells.map((c) => {
    const p = cellCenter(c.x, c.y);
    return { x: p.x + arrow.offsetX, y: p.y + arrow.offsetY };
  });

  const blockedShake = arrow.state === "shake";
  const hovering = arrow.hovered && arrow.state === "idle";

  let stroke = "#f2f2ec";
  if (blockedShake) stroke = "#ff5a3c";
  else if (hovering) stroke = "#ffffff";

  const width = Math.max(2.5, state.cell * 0.18);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (hovering || arrow.state === "sliding") {
    ctx.shadowColor = "rgba(255,255,255,0.2)";
    ctx.shadowBlur = hovering || arrow.state === "sliding" ? 14 : 8;
  }

  ctx.strokeStyle = stroke;
  ctx.fillStyle = stroke;
  ctx.lineWidth = width;

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();

  const tip = pts[pts.length - 1];
  const { x: dx, y: dy } = DELTA[arrow.dir];
  const headLen = state.cell * 0.42;
  const headWidth = state.cell * 0.34;
  const apexX = tip.x + dx * headLen * 0.55;
  const apexY = tip.y + dy * headLen * 0.55;
  const wingLX = tip.x - dx * headLen * 0.15 + -dy * headWidth * 0.55;
  const wingLY = tip.y - dy * headLen * 0.15 + dx * headWidth * 0.55;
  const wingRX = tip.x - dx * headLen * 0.15 - -dy * headWidth * 0.55;
  const wingRY = tip.y - dy * headLen * 0.15 - dx * headWidth * 0.55;
  const baseX = tip.x - dx * headLen * 0.05;
  const baseY = tip.y - dy * headLen * 0.05;

  ctx.shadowBlur = hovering || arrow.state === "sliding" ? 10 : 0;
  ctx.beginPath();
  ctx.moveTo(apexX, apexY);
  ctx.lineTo(wingLX, wingLY);
  ctx.lineTo(wingRX, wingRY);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(baseX, baseY, width * 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawBoard() {
  if (!canvas || !ctx) return;
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, rect.width, rect.height);

  ctx.save();
  ctx.translate(state.viewX, state.viewY);
  ctx.scale(state.viewScale, state.viewScale);

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.035)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= state.size; i++) {
    const p = state.pad + i * state.cell;
    ctx.beginPath();
    ctx.moveTo(state.pad, p);
    ctx.lineTo(state.pad + state.size * state.cell, p);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p, state.pad);
    ctx.lineTo(p, state.pad + state.size * state.cell);
    ctx.stroke();
  }
  ctx.restore();

  const idle = state.arrows.filter((a) => a.state === "idle" || a.state === "shake");
  const sliding = state.arrows.filter((a) => a.state === "sliding");
  for (const a of idle) drawArrow(a);
  for (const a of sliding) drawArrow(a);
  ctx.restore();
}
