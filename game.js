import {
  DELTA,
  canEscape as canEscapeArrow,
  snakePositions,
  snakeExitDistance,
} from "./js/logic.js";
import { getLevelData, LEVEL_PACK } from "./js/levels.js";
import {
  STORAGE_KEY,
  parseLevelIndex,
  serializeLevelIndex,
  clearAllProgress,
  menuStats,
} from "./js/progress.js";

const STYLE = `:root {
  --bg-0: #050505;
  --bg-1: #0c0c0c;
  --ink: #f4f4f0;
  --muted: #8a8a82;
  --line: rgba(244, 244, 240, 0.12);
  --accent: #e8ff47;
  --danger: #ff5a3c;
  --ok: #5dffb0;
  --font-display: "Archivo Black", Impact, sans-serif;
  --font-body: "DM Sans", system-ui, sans-serif;
  --board-max: min(92vmin, min(calc(100vw - 2rem), calc(100dvh - 5.5rem - var(--safe-top) - var(--safe-bottom))));
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
}

body {
  min-height: 100dvh;
  min-height: 100svh;
  color: var(--ink);
  font-family: var(--font-body);
  background: var(--bg-0);
  display: grid;
  grid-template-rows: auto 1fr;
  overflow-x: hidden;
  padding-left: var(--safe-left);
  padding-right: var(--safe-right);
}

.atmosphere {
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(ellipse 80% 50% at 50% -10%, rgba(232, 255, 71, 0.08), transparent 55%),
    radial-gradient(ellipse 60% 40% at 100% 100%, rgba(93, 255, 176, 0.05), transparent 50%),
    radial-gradient(ellipse 50% 30% at 0% 80%, rgba(255, 90, 60, 0.04), transparent 45%),
    linear-gradient(180deg, #080808 0%, #050505 40%, #0a0a0a 100%);
  pointer-events: none;
}

.atmosphere::after {
  content: "";
  position: absolute;
  inset: 0;
  opacity: 0.35;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  mix-blend-mode: overlay;
  pointer-events: none;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: calc(0.75rem + var(--safe-top)) clamp(0.85rem, 3vw, 1.5rem) 0.35rem;
  animation: fade-down 0.7s ease both;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
}

.brand-mark {
  width: 0.85rem;
  height: 0.85rem;
  background: var(--accent);
  clip-path: polygon(0 35%, 55% 35%, 55% 0, 100% 50%, 55% 100%, 55% 65%, 0 65%);
  animation: mark-pulse 2.4s ease-in-out infinite;
}

.brand-name {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 4.5vw, 2.4rem);
  letter-spacing: 0.04em;
  line-height: 1;
  font-weight: 400;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-shrink: 0;
}

.icon-btn {
  appearance: none;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 2px;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.15s ease;
}

.icon-btn:hover {
  border-color: rgba(244, 244, 240, 0.35);
  background: rgba(244, 244, 240, 0.04);
}

.icon-btn:active {
  transform: translateY(1px);
}

.icon-btn svg {
  width: 1.15rem;
  height: 1.15rem;
  display: block;
}

.stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.25rem clamp(0.75rem, 3vw, 1.25rem) calc(0.75rem + var(--safe-bottom));
}

.board-wrap {
  position: relative;
  width: var(--board-max);
  height: var(--board-max);
  animation: board-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
}

#board {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  cursor: pointer;
  touch-action: none;
  background: #000;
  box-shadow:
    0 0 0 1px var(--line),
    0 24px 60px rgba(0, 0, 0, 0.55);
}

.board-glow {
  position: absolute;
  inset: -8%;
  z-index: -1;
  background: radial-gradient(circle at 50% 50%, rgba(232, 255, 71, 0.07), transparent 62%);
  pointer-events: none;
}

.btn {
  appearance: none;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 0.92rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  padding: 0.7rem 1.15rem;
  min-height: 44px;
  border-radius: 2px;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.15s ease,
    color 0.2s ease;
}

.btn:hover {
  border-color: rgba(244, 244, 240, 0.35);
  background: rgba(244, 244, 240, 0.04);
}

.btn:active {
  transform: translateY(1px);
}

.btn-primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #111;
}

.btn-primary:hover {
  background: #f3ff7a;
  border-color: #f3ff7a;
}

.btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  transform: none;
}

.btn-danger {
  border-color: rgba(255, 90, 60, 0.45);
  color: var(--danger);
}

.btn-danger:hover {
  border-color: var(--danger);
  background: rgba(255, 90, 60, 0.1);
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(6px);
  padding: calc(1.5rem + var(--safe-top)) calc(1.5rem + var(--safe-right)) calc(1.5rem + var(--safe-bottom)) calc(1.5rem + var(--safe-left));
  animation: fade-in 0.35s ease both;
}

.overlay[hidden] {
  display: none;
}

.overlay-card {
  text-align: center;
  max-width: 22rem;
  padding: 2rem 1.75rem;
  border: 1px solid var(--line);
  background:
    linear-gradient(160deg, rgba(232, 255, 71, 0.08), transparent 40%),
    #0d0d0d;
  animation: pop-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.overlay-kicker {
  margin: 0 0 0.35rem;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.72rem;
  font-weight: 600;
}

.overlay-title {
  margin: 0 0 0.5rem;
  font-family: var(--font-display);
  font-size: clamp(1.8rem, 5vw, 2.4rem);
  font-weight: 400;
  letter-spacing: 0.02em;
}

.overlay-copy {
  margin: 0 0 1.4rem;
  color: var(--muted);
  line-height: 1.45;
}

.overlay-menu {
  z-index: 30;
}

.overlay-card-menu {
  width: min(22rem, 100%);
  text-align: left;
}

.menu-stats {
  display: grid;
  gap: 0.55rem;
  margin: 0 0 1.4rem;
}

.menu-stat {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.45rem;
  border-bottom: 1px solid var(--line);
}

.menu-stat dt {
  margin: 0;
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.menu-stat dd {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 400;
  letter-spacing: 0.02em;
}

.menu-actions {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.menu-actions .btn {
  width: 100%;
}

@keyframes fade-down {
  from {
    opacity: 0;
    transform: translateY(-12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes board-in {
  from {
    opacity: 0;
    transform: scale(0.94);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pop-in {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes mark-pulse {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(3px);
  }
}

`;

function injectStyles() {
  const font = document.createElement("link");
  font.rel = "stylesheet";
  font.href =
    "https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap";
  document.head.appendChild(font);

  const style = document.createElement("style");
  style.textContent = STYLE;
  document.head.appendChild(style);
}

function buildUI() {
  document.body.innerHTML = `
    <div class="atmosphere" aria-hidden="true"></div>
    <header class="top-bar">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true"></span>
        <h1 class="brand-name">ARROW OUT</h1>
      </div>
      <div class="top-actions">
        <button type="button" class="icon-btn" id="btnMenu" title="Menu" aria-label="Menu" aria-haspopup="dialog" aria-controls="menuOverlay" aria-expanded="false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
          </svg>
        </button>
        <button type="button" class="icon-btn" id="btnReset" title="Reset level" aria-label="Reset level">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
        </button>
      </div>
    </header>
    <main class="stage">
      <div class="board-wrap">
        <canvas id="board" width="720" height="720" role="img" aria-label="Arrow puzzle board"></canvas>
        <div class="board-glow" aria-hidden="true"></div>
      </div>
    </main>
    <div class="overlay" id="winOverlay" hidden>
      <div class="overlay-card">
        <p class="overlay-kicker">Cleared</p>
        <h2 class="overlay-title" id="winTitle">Level complete</h2>
        <p class="overlay-copy" id="winCopy">Every arrow found its way out.</p>
        <button type="button" class="btn btn-primary" id="btnNext">Next level</button>
      </div>
    </div>
    <div class="overlay overlay-menu" id="menuOverlay" hidden>
      <div class="overlay-card overlay-card-menu" id="menuDialog" role="dialog" aria-modal="true" aria-labelledby="menuTitle">
        <div id="menuMain">
          <p class="overlay-kicker">Status</p>
          <h2 class="overlay-title" id="menuTitle">Level 1</h2>
          <dl class="menu-stats">
            <div class="menu-stat">
              <dt>Level</dt>
              <dd id="statLevel">1 / 100</dd>
            </div>
            <div class="menu-stat">
              <dt>Moves</dt>
              <dd id="statMoves">0</dd>
            </div>
            <div class="menu-stat">
              <dt>Arrows left</dt>
              <dd id="statArrows">0 / 0</dd>
            </div>
            <div class="menu-stat">
              <dt>Levels cleared</dt>
              <dd id="statCleared">0</dd>
            </div>
          </dl>
          <div class="menu-actions">
            <button type="button" class="btn" id="btnCloseMenu">Close</button>
            <button type="button" class="btn btn-danger" id="btnClearProgress">Clear all progress</button>
          </div>
        </div>
        <div id="menuConfirm" hidden>
          <p class="overlay-kicker">Start over</p>
          <h2 class="overlay-title">Reset everything?</h2>
          <p class="overlay-copy">Clears saved progress and returns you to Level 1. This cannot be undone.</p>
          <div class="menu-actions">
            <button type="button" class="btn" id="btnCancelClear">Cancel</button>
            <button type="button" class="btn btn-danger" id="btnConfirmClear">Start over</button>
          </div>
        </div>
      </div>
    </div>`;
}

injectStyles();
buildUI();

/**
 * @typedef {Object} Arrow
 * @property {string} id
 * @property {import('./js/logic.js').Dir} dir
 * @property {import('./js/logic.js').Cell[]} path
 * @property {number} offsetX
 * @property {number} offsetY
 * @property {number} slideDistance
 * @property {'idle'|'shake'|'sliding'|'gone'} state
 * @property {number} animT
 * @property {number} shakePhase
 * @property {boolean} hovered
 */

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const winOverlay = document.getElementById("winOverlay");
const winTitle = document.getElementById("winTitle");
const winCopy = document.getElementById("winCopy");
const btnReset = document.getElementById("btnReset");
const btnNext = document.getElementById("btnNext");
const btnMenu = document.getElementById("btnMenu");
const menuOverlay = document.getElementById("menuOverlay");
const menuMain = document.getElementById("menuMain");
const menuConfirm = document.getElementById("menuConfirm");
const menuTitle = document.getElementById("menuTitle");
const statLevel = document.getElementById("statLevel");
const statMoves = document.getElementById("statMoves");
const statArrows = document.getElementById("statArrows");
const statCleared = document.getElementById("statCleared");
const btnCloseMenu = document.getElementById("btnCloseMenu");
const btnClearProgress = document.getElementById("btnClearProgress");
const btnCancelClear = document.getElementById("btnCancelClear");
const btnConfirmClear = document.getElementById("btnConfirmClear");

const state = {
  levelIndex: 0,
  size: 8,
  arrows: /** @type {Arrow[]} */ ([]),
  moves: 0,
  cell: 40,
  pad: 24,
  dpr: 1,
  pointer: null,
  animating: false,
  won: false,
};

function loadProgress() {
  try {
    const parsed = parseLevelIndex(localStorage.getItem(STORAGE_KEY));
    if (parsed != null) state.levelIndex = parsed;
  } catch {
    /* ignore */
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, serializeLevelIndex(state.levelIndex));
  } catch {
    /* ignore */
  }
}

function hydrateLevel(level) {
  state.size = level.size;
  state.arrows = level.arrows.map((a, i) => ({
    id: `a${i}-${a.path.map((p) => (Array.isArray(p) ? p.join(".") : `${p.x}.${p.y}`)).join("_")}`,
    dir: a.dir,
    path: a.path.map((p) => (Array.isArray(p) ? { x: p[0], y: p[1] } : { x: p.x, y: p.y })),
    offsetX: 0,
    offsetY: 0,
    slideDistance: 0,
    state: "idle",
    animT: 0,
    shakePhase: 0,
    hovered: false,
  }));
  state.moves = 0;
  state.animating = false;
  state.won = false;
  winOverlay.hidden = true;
  resize();
}

function startLevel(index) {
  state.levelIndex = Math.max(0, index);
  saveProgress();
  hydrateLevel(structuredClone(getLevelData(state.levelIndex)));
}

function canEscape(arrow) {
  return canEscapeArrow(arrow, state.size, state.arrows);
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

function clientToBoard(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function arrowPathPoints(arrow) {
  const pathCells =
    arrow.state === "sliding"
      ? snakePositions(arrow.path, arrow.dir, arrow.slideDistance)
      : arrow.path;
  return pathCells.map((c) => {
    const p = cellCenter(c.x, c.y);
    return { x: p.x + arrow.offsetX, y: p.y + arrow.offsetY };
  });
}

function arrowAtBoardPoint(bx, by) {
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

function syncAnimating() {
  state.animating = state.arrows.some((a) => a.state === "sliding" || a.state === "shake");
}

function tryMove(arrow) {
  if (arrow.state !== "idle") return;

  if (!canEscape(arrow)) {
    arrow.state = "shake";
    arrow.animT = 0;
    arrow.shakePhase = Math.random() * Math.PI * 2;
    syncAnimating();
    return;
  }

  state.moves += 1;
  arrow.state = "sliding";
  syncAnimating();
  arrow.animT = 0;
  arrow.offsetX = 0;
  arrow.offsetY = 0;
  arrow.slideDistance = 0;
}

function updateArrow(arrow, dt) {
  if (arrow.state === "shake") {
    arrow.animT += dt;
    if (arrow.animT >= 0.42) {
      arrow.state = "idle";
      arrow.animT = 0;
      arrow.offsetX = 0;
      arrow.offsetY = 0;
      syncAnimating();
    } else {
      const damp = 1 - arrow.animT / 0.42;
      const amp = state.cell * 0.12 * damp;
      const { x: dx, y: dy } = DELTA[arrow.dir];
      arrow.offsetX = Math.sin(arrow.animT * 48 + arrow.shakePhase) * amp * (dx || 0.35);
      arrow.offsetY = Math.sin(arrow.animT * 48 + arrow.shakePhase) * amp * (dy || 0.35);
    }
    return;
  }

  if (arrow.state === "sliding") {
    arrow.animT += dt;
    const travelCells = snakeExitDistance(arrow.path, arrow.dir, state.size) + 0.35;
    const travel = travelCells * state.cell;
    const duration = Math.min(0.95, 0.32 + travel / 900);
    const t = Math.min(1, arrow.animT / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    arrow.slideDistance = travelCells * eased;
    arrow.offsetX = 0;
    arrow.offsetY = 0;
    if (t >= 1) {
      arrow.state = "gone";
      arrow.slideDistance = 0;
      arrow.offsetX = 0;
      arrow.offsetY = 0;
      syncAnimating();
      checkWin();
    }
  }
}

function checkWin() {
  if (state.won) return;
  if (state.arrows.every((a) => a.state === "gone")) {
    state.won = true;
    winTitle.textContent = "Level complete";
    winCopy.textContent = "Every arrow found its way out.";
    winOverlay.hidden = false;
  }
}

function cellCenter(x, y) {
  return {
    x: state.pad + (x + 0.5) * state.cell,
    y: state.pad + (y + 0.5) * state.cell,
  };
}

function drawArrow(arrow) {
  if (arrow.state === "gone") return;

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

function drawBoard() {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, rect.width, rect.height);

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
}

let lastTs = performance.now();
function frame(ts) {
  const dt = Math.min(0.05, (ts - lastTs) / 1000);
  lastTs = ts;
  for (const arrow of state.arrows) updateArrow(arrow, dt);
  drawBoard();
  requestAnimationFrame(frame);
}

function syncHoverBoard(bx, by) {
  for (const arrow of state.arrows) arrow.hovered = false;
  const arrow = arrowAtBoardPoint(bx, by);
  if (arrow) {
    arrow.hovered = true;
    canvas.style.cursor = "pointer";
  } else {
    canvas.style.cursor = "default";
  }
}

canvas.addEventListener("pointermove", (e) => {
  const { x, y } = clientToBoard(e.clientX, e.clientY);
  state.pointer = { x, y };
  syncHoverBoard(x, y);
});

canvas.addEventListener("pointerleave", () => {
  state.pointer = null;
  syncHoverBoard(-1, -1);
});

canvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  e.preventDefault();
  if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
  const { x, y } = clientToBoard(e.clientX, e.clientY);
  const arrow = arrowAtBoardPoint(x, y);
  if (!arrow) return;
  tryMove(arrow);
});

canvas.addEventListener("pointerup", (e) => {
  if (canvas.hasPointerCapture?.(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
});

canvas.addEventListener("pointercancel", (e) => {
  if (canvas.hasPointerCapture?.(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
});

btnReset.addEventListener("click", () => startLevel(state.levelIndex));
btnNext.addEventListener("click", () => startLevel(state.levelIndex + 1));

function refreshMenuStats() {
  const stats = menuStats({
    levelIndex: state.levelIndex,
    moves: state.moves,
    arrows: state.arrows,
    packSize: LEVEL_PACK.length,
    won: state.won,
  });
  menuTitle.textContent = `Level ${stats.levelNumber}`;
  statLevel.textContent = `${stats.levelNumber} / ${stats.packSize}`;
  statMoves.textContent = String(stats.moves);
  statArrows.textContent = `${stats.arrowsRemaining} / ${stats.arrowsTotal}`;
  statCleared.textContent = String(stats.levelsCleared);
}

function showMenuConfirm(confirming) {
  menuMain.hidden = confirming;
  menuConfirm.hidden = !confirming;
  if (menuOverlay.hidden) return;
  if (confirming) btnCancelClear.focus();
  else btnCloseMenu.focus();
}

function closeMenu() {
  menuOverlay.hidden = true;
  btnMenu.setAttribute("aria-expanded", "false");
  showMenuConfirm(false);
}

function openMenu() {
  refreshMenuStats();
  showMenuConfirm(false);
  menuOverlay.hidden = false;
  btnMenu.setAttribute("aria-expanded", "true");
  btnCloseMenu.focus();
}

btnMenu.addEventListener("click", () => {
  if (menuOverlay.hidden) openMenu();
  else closeMenu();
});
btnCloseMenu.addEventListener("click", () => closeMenu());
btnClearProgress.addEventListener("click", () => showMenuConfirm(true));
btnCancelClear.addEventListener("click", () => showMenuConfirm(false));
btnConfirmClear.addEventListener("click", () => {
  try {
    clearAllProgress(localStorage);
  } catch {
    /* ignore */
  }
  closeMenu();
  startLevel(0);
});
menuOverlay.addEventListener("click", (e) => {
  if (e.target === menuOverlay) closeMenu();
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !menuOverlay.hidden) {
    if (!menuConfirm.hidden) showMenuConfirm(false);
    else closeMenu();
    return;
  }
  if (!menuOverlay.hidden) return;
  if (e.key === "r" || e.key === "R") {
    startLevel(state.levelIndex);
  } else if (e.key === "n" || e.key === "N") {
    if (!winOverlay.hidden) startLevel(state.levelIndex + 1);
  }
});

window.addEventListener("resize", () => resize());
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", () => resize());
}

loadProgress();
startLevel(state.levelIndex);
requestAnimationFrame(frame);
