import { LEVELS, generateLevel } from "./levels.js";

/** @typedef {'N'|'E'|'S'|'W'} Dir */
/** @typedef {{x:number,y:number}} Cell */
/**
 * @typedef {Object} Arrow
 * @property {string} id
 * @property {Dir} dir
 * @property {Cell[]} path
 * @property {number} offsetX
 * @property {number} offsetY
 * @property {'idle'|'shake'|'sliding'|'gone'} state
 * @property {number} animT
 * @property {number} shakePhase
 * @property {boolean} hovered
 */

const DIR_DELTA = /** @type {Record<Dir, Cell>} */ ({
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 },
});

const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("board"));
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d"));

const elLevel = document.getElementById("levelNum");
const elLeft = document.getElementById("arrowsLeft");
const elMoves = document.getElementById("moveCount");
const elHint = document.getElementById("hint");
const winOverlay = document.getElementById("winOverlay");
const winTitle = document.getElementById("winTitle");
const winCopy = document.getElementById("winCopy");
const btnUndo = /** @type {HTMLButtonElement} */ (document.getElementById("btnUndo"));
const btnReset = /** @type {HTMLButtonElement} */ (document.getElementById("btnReset"));
const btnSkip = /** @type {HTMLButtonElement} */ (document.getElementById("btnSkip"));
const btnNext = /** @type {HTMLButtonElement} */ (document.getElementById("btnNext"));

const state = {
  levelIndex: 0,
  size: 8,
  /** @type {Arrow[]} */
  arrows: [],
  moves: 0,
  /** @type {string[]} */
  history: [],
  cell: 40,
  pad: 24,
  dpr: 1,
  pointer: /** @type {Cell|null} */ (null),
  animating: false,
  won: false,
};

function loadProgress() {
  try {
    const raw = localStorage.getItem("arrow-out-level");
    if (raw != null) {
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0) state.levelIndex = Math.floor(n);
    }
  } catch {
    /* ignore */
  }
}

function saveProgress() {
  try {
    localStorage.setItem("arrow-out-level", String(state.levelIndex));
  } catch {
    /* ignore */
  }
}

/**
 * @param {{size:number, arrows: Array<{dir:Dir, path:number[][]}>}} level
 */
function hydrateLevel(level) {
  state.size = level.size;
  state.arrows = level.arrows.map((a, i) => ({
    id: `a${i}-${a.path.map((p) => p.join(".")).join("_")}`,
    dir: a.dir,
    path: a.path.map(([x, y]) => ({ x, y })),
    offsetX: 0,
    offsetY: 0,
    state: /** @type {const} */ ("idle"),
    animT: 0,
    shakePhase: 0,
    hovered: false,
  }));
  state.moves = 0;
  state.history = [];
  state.animating = false;
  state.won = false;
  winOverlay.hidden = true;
  resize();
  updateHud();
  updateHint();
}

function getLevelData(index) {
  if (index < LEVELS.length) return LEVELS[index];
  return generateLevel(index);
}

function startLevel(index) {
  state.levelIndex = Math.max(0, index);
  saveProgress();
  hydrateLevel(structuredClone(getLevelData(state.levelIndex)));
}

function updateHud() {
  elLevel.textContent = String(state.levelIndex + 1);
  elLeft.textContent = String(state.arrows.filter((a) => a.state !== "gone").length);
  elMoves.textContent = String(state.moves);
  btnUndo.disabled = state.history.length === 0 || state.animating;
}

function updateHint() {
  const remaining = state.arrows.filter((a) => a.state === "idle").length;
  if (remaining === 0) {
    elHint.textContent = "Board clear — nice work.";
    return;
  }
  const free = state.arrows.filter((a) => a.state === "idle" && canEscape(a)).length;
  if (free === 0) {
    elHint.textContent = "No free arrows — undo or reset and try another order.";
  } else if (free === 1) {
    elHint.textContent = "One arrow can leave. Start there.";
  } else {
    elHint.textContent = `${free} arrows can leave right now. Tap one with a clear exit.`;
  }
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * state.dpr);
  canvas.height = Math.round(rect.height * state.dpr);
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  const side = Math.min(rect.width, rect.height);
  state.pad = Math.max(14, side * 0.04);
  state.cell = (side - state.pad * 2) / state.size;
}

/**
 * @param {Arrow} arrow
 */
function cellsOf(arrow) {
  return arrow.path;
}

/**
 * Occupancy map of all idle (non-moving) arrows except optional skip.
 * @param {string|null} skipId
 */
function occupancy(skipId = null) {
  /** @type {Map<string, string>} */
  const map = new Map();
  for (const arrow of state.arrows) {
    if (arrow.state === "gone" || arrow.state === "sliding") continue;
    if (skipId && arrow.id === skipId) continue;
    for (const c of arrow.path) {
      map.set(`${c.x},${c.y}`, arrow.id);
    }
  }
  return map;
}

/**
 * Check whether translating `arrow` in its tip direction is blocked.
 * The whole polyline slides rigidly; any foreign cell on the swept path blocks it.
 * @param {Arrow} arrow
 */
function canEscape(arrow) {
  const { x: dx, y: dy } = DIR_DELTA[arrow.dir];
  const occ = occupancy(arrow.id);
  const size = state.size;

  // Max steps needed for every cell of the arrow to leave the board
  let maxSteps = 0;
  for (const c of arrow.path) {
    let steps;
    if (dx === 1) steps = size - c.x;
    else if (dx === -1) steps = c.x + 1;
    else if (dy === 1) steps = size - c.y;
    else steps = c.y + 1;
    maxSteps = Math.max(maxSteps, steps);
  }

  for (let step = 1; step <= maxSteps; step++) {
    for (const c of arrow.path) {
      const nx = c.x + dx * step;
      const ny = c.y + dy * step;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
      if (occ.has(`${nx},${ny}`)) return false;
    }
  }
  return true;
}

/**
 * @param {Arrow} arrow
 */
function snapshotArrows() {
  return JSON.stringify(
    state.arrows
      .filter((a) => a.state !== "gone")
      .map((a) => ({
        id: a.id,
        dir: a.dir,
        path: a.path,
      })),
  );
}

function pushHistory() {
  state.history.push(snapshotArrows());
  if (state.history.length > 80) state.history.shift();
}

function undo() {
  if (!state.history.length || state.animating) return;
  const raw = state.history.pop();
  if (!raw) return;
  const restored = JSON.parse(raw);
  state.arrows = restored.map((a) => ({
    id: a.id,
    dir: a.dir,
    path: a.path.map((p) => ({ x: p.x, y: p.y })),
    offsetX: 0,
    offsetY: 0,
    state: "idle",
    animT: 0,
    shakePhase: 0,
    hovered: false,
  }));
  state.moves = Math.max(0, state.moves - 1);
  state.won = false;
  winOverlay.hidden = true;
  updateHud();
  updateHint();
}

/**
 * @param {number} clientX
 * @param {number} clientY
 */
function pointerToCell(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const gx = Math.floor((x - state.pad) / state.cell);
  const gy = Math.floor((y - state.pad) / state.cell);
  if (gx < 0 || gy < 0 || gx >= state.size || gy >= state.size) return null;
  return { x: gx, y: gy };
}

/**
 * @param {Cell} cell
 */
function arrowAt(cell) {
  for (const arrow of state.arrows) {
    if (arrow.state === "gone" || arrow.state === "sliding") continue;
    if (arrow.path.some((p) => p.x === cell.x && p.y === cell.y)) return arrow;
  }
  return null;
}

/**
 * @param {Arrow} arrow
 */
function tryMove(arrow) {
  if (state.animating || arrow.state !== "idle") return;

  if (!canEscape(arrow)) {
    arrow.state = "shake";
    arrow.animT = 0;
    arrow.shakePhase = Math.random() * Math.PI * 2;
    return;
  }

  pushHistory();
  state.moves += 1;
  state.animating = true;
  arrow.state = "sliding";
  arrow.animT = 0;
  arrow.offsetX = 0;
  arrow.offsetY = 0;
  updateHud();
}

/**
 * @param {Arrow} arrow
 * @param {number} dt
 */
function updateArrow(arrow, dt) {
  if (arrow.state === "shake") {
    arrow.animT += dt;
    if (arrow.animT >= 0.42) {
      arrow.state = "idle";
      arrow.animT = 0;
      arrow.offsetX = 0;
      arrow.offsetY = 0;
    } else {
      const damp = 1 - arrow.animT / 0.42;
      const amp = state.cell * 0.12 * damp;
      const { x: dx, y: dy } = DIR_DELTA[arrow.dir];
      arrow.offsetX = Math.sin(arrow.animT * 48 + arrow.shakePhase) * amp * (dx || 0.35);
      arrow.offsetY = Math.sin(arrow.animT * 48 + arrow.shakePhase) * amp * (dy || 0.35);
    }
    return;
  }

  if (arrow.state === "sliding") {
    arrow.animT += dt;
    const { x: dx, y: dy } = DIR_DELTA[arrow.dir];
    // Distance to fully clear the board
    let maxSteps = 0;
    for (const c of arrow.path) {
      let steps;
      if (dx === 1) steps = state.size - c.x;
      else if (dx === -1) steps = c.x + 1;
      else if (dy === 1) steps = state.size - c.y;
      else steps = c.y + 1;
      maxSteps = Math.max(maxSteps, steps);
    }
    const travel = (maxSteps + 1.2) * state.cell;
    const duration = Math.min(0.85, 0.28 + travel / 900);
    const t = Math.min(1, arrow.animT / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    arrow.offsetX = dx * travel * eased;
    arrow.offsetY = dy * travel * eased;
    if (t >= 1) {
      arrow.state = "gone";
      arrow.offsetX = 0;
      arrow.offsetY = 0;
      state.animating = state.arrows.some((a) => a.state === "sliding" || a.state === "shake");
      updateHud();
      updateHint();
      checkWin();
    }
  }
}

function checkWin() {
  if (state.won) return;
  if (state.arrows.every((a) => a.state === "gone")) {
    state.won = true;
    winTitle.textContent = `Level ${state.levelIndex + 1}`;
    winCopy.textContent =
      state.moves === 1
        ? "One clean shot. Ready for the next maze?"
        : `Cleared in ${state.moves} moves. Keep the exits open.`;
    winOverlay.hidden = false;
  }
}

function cellCenter(x, y) {
  return {
    x: state.pad + (x + 0.5) * state.cell,
    y: state.pad + (y + 0.5) * state.cell,
  };
}

/**
 * @param {Arrow} arrow
 */
function drawArrow(arrow) {
  if (arrow.state === "gone") return;

  const pts = arrow.path.map((c) => {
    const p = cellCenter(c.x, c.y);
    return { x: p.x + arrow.offsetX, y: p.y + arrow.offsetY };
  });

  const free = arrow.state === "idle" && canEscape(arrow);
  const blockedShake = arrow.state === "shake";
  const hovering = arrow.hovered && arrow.state === "idle";

  let stroke = "#f2f2ec";
  if (blockedShake) stroke = "#ff5a3c";
  else if (hovering && free) stroke = "#e8ff47";
  else if (hovering) stroke = "#ffffff";
  else if (free) stroke = "#c8e86a";

  const width = Math.max(2.5, state.cell * 0.18);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Soft glow for free / hover
  if (free || hovering || arrow.state === "sliding") {
    ctx.shadowColor = free || arrow.state === "sliding" ? "rgba(232,255,71,0.35)" : "rgba(255,255,255,0.2)";
    ctx.shadowBlur = hovering || arrow.state === "sliding" ? 14 : 8;
  }

  ctx.strokeStyle = stroke;
  ctx.fillStyle = stroke;
  ctx.lineWidth = width;

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();

  // Arrowhead at tip, pointing in travel direction
  const tip = pts[pts.length - 1];
  const { x: dx, y: dy } = DIR_DELTA[arrow.dir];
  const headLen = state.cell * 0.42;
  const headWidth = state.cell * 0.34;
  const apexX = tip.x + dx * headLen * 0.55;
  const apexY = tip.y + dy * headLen * 0.55;
  const wingLX = tip.x - dx * headLen * 0.15 + (-dy) * headWidth * 0.55;
  const wingLY = tip.y - dy * headLen * 0.15 + dx * headWidth * 0.55;
  const wingRX = tip.x - dx * headLen * 0.15 - (-dy) * headWidth * 0.55;
  const wingRY = tip.y - dy * headLen * 0.15 - dx * headWidth * 0.55;
  const baseX = tip.x - dx * headLen * 0.05;
  const baseY = tip.y - dy * headLen * 0.05;

  ctx.shadowBlur = free || hovering ? 10 : 0;
  ctx.beginPath();
  ctx.moveTo(apexX, apexY);
  ctx.lineTo(wingLX, wingLY);
  ctx.lineTo(wingRX, wingRY);
  ctx.closePath();
  ctx.fill();

  // Cover joint under head so the polyline meets cleanly
  ctx.beginPath();
  ctx.arc(baseX, baseY, width * 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawBoard() {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  // Background
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, rect.width, rect.height);

  // Subtle grid
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

  // Draw blocked arrows first, free ones later for emphasis — actually draw all idle then sliding
  const idle = state.arrows.filter((a) => a.state === "idle" || a.state === "shake");
  const sliding = state.arrows.filter((a) => a.state === "sliding");
  for (const a of idle) drawArrow(a);
  for (const a of sliding) drawArrow(a);
}

let lastTs = performance.now();
function frame(ts) {
  const dt = Math.min(0.05, (ts - lastTs) / 1000);
  lastTs = ts;
  for (const arrow of state.arrows) updateArrow(arrow, dt);
  drawBoard();
  requestAnimationFrame(frame);
}

function syncHover(cell) {
  for (const arrow of state.arrows) arrow.hovered = false;
  if (!cell) {
    canvas.style.cursor = "default";
    return;
  }
  const arrow = arrowAt(cell);
  if (arrow) {
    arrow.hovered = true;
    canvas.style.cursor = canEscape(arrow) ? "pointer" : "not-allowed";
  } else {
    canvas.style.cursor = "default";
  }
}

canvas.addEventListener("pointermove", (e) => {
  const cell = pointerToCell(e.clientX, e.clientY);
  state.pointer = cell;
  syncHover(cell);
});

canvas.addEventListener("pointerleave", () => {
  state.pointer = null;
  syncHover(null);
});

canvas.addEventListener("pointerdown", (e) => {
  const cell = pointerToCell(e.clientX, e.clientY);
  if (!cell) return;
  const arrow = arrowAt(cell);
  if (!arrow) return;
  tryMove(arrow);
});

btnUndo.addEventListener("click", () => undo());
btnReset.addEventListener("click", () => startLevel(state.levelIndex));
btnSkip.addEventListener("click", () => startLevel(state.levelIndex + 1));
btnNext.addEventListener("click", () => startLevel(state.levelIndex + 1));

window.addEventListener("keydown", (e) => {
  if (e.key === "z" && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    undo();
  } else if (e.key === "r" || e.key === "R") {
    startLevel(state.levelIndex);
  } else if (e.key === "n" || e.key === "N") {
    if (!winOverlay.hidden) startLevel(state.levelIndex + 1);
  }
});

window.addEventListener("resize", () => resize());

loadProgress();
startLevel(state.levelIndex);
requestAnimationFrame(frame);
