(function () {
  "use strict";

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
  --board-max: min(78vmin, 720px);
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
  color: var(--ink);
  font-family: var(--font-body);
  background: var(--bg-0);
  display: grid;
  grid-template-rows: auto 1fr auto;
  overflow-x: hidden;
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
  padding: 1.1rem clamp(1rem, 3vw, 2rem) 0.4rem;
  animation: fade-down 0.7s ease both;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.7rem;
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

.stats {
  display: flex;
  gap: clamp(0.75rem, 2.5vw, 1.5rem);
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 2.5rem;
}

.stat-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--muted);
}

.stat-value {
  font-family: var(--font-display);
  font-size: 1.25rem;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  padding: 0.5rem 1rem 1rem;
}

.hint {
  margin: 0;
  max-width: 28rem;
  text-align: center;
  color: var(--muted);
  font-size: clamp(0.85rem, 2.2vw, 0.98rem);
  line-height: 1.45;
  animation: fade-up 0.8s 0.1s ease both;
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
  touch-action: manipulation;
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

.controls {
  display: flex;
  justify-content: center;
  gap: 0.65rem;
  padding: 0.5rem 1rem 1.4rem;
  animation: fade-up 0.8s 0.2s ease both;
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

.overlay {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(6px);
  padding: 1.5rem;
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

@media (max-width: 560px) {
  .top-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats {
    width: 100%;
    justify-content: space-between;
  }

  .stat {
    align-items: flex-start;
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
      <div class="stats" aria-live="polite">
        <div class="stat">
          <span class="stat-label">Level</span>
          <span class="stat-value" id="levelNum">1</span>
        </div>
        <div class="stat">
          <span class="stat-label">Left</span>
          <span class="stat-value" id="arrowsLeft">0</span>
        </div>
        <div class="stat">
          <span class="stat-label">Moves</span>
          <span class="stat-value" id="moveCount">0</span>
        </div>
      </div>
    </header>
    <main class="stage">
      <p class="hint" id="hint">
        Tap an arrow to send it flying — only if nothing blocks its path.
      </p>
      <div class="board-wrap">
        <canvas id="board" width="720" height="720" role="img" aria-label="Arrow puzzle board"></canvas>
        <div class="board-glow" aria-hidden="true"></div>
      </div>
    </main>
    <footer class="controls">
      <button type="button" class="btn btn-ghost" id="btnUndo" title="Undo">Undo</button>
      <button type="button" class="btn btn-primary" id="btnReset" title="Reset level">Reset</button>
      <button type="button" class="btn btn-ghost" id="btnSkip" title="Next level">Skip</button>
    </footer>
    <div class="overlay" id="winOverlay" hidden>
      <div class="overlay-card">
        <p class="overlay-kicker">Cleared</p>
        <h2 class="overlay-title" id="winTitle">Level complete</h2>
        <p class="overlay-copy" id="winCopy">Every arrow found its way out.</p>
        <button type="button" class="btn btn-primary" id="btnNext">Next level</button>
      </div>
    </div>`;
  }

  injectStyles();
  buildUI();



  const DIRS = ["N", "E", "S", "W"];
  const DELTA = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
  const TURNS = {
    N: ["E", "W"],
    E: ["N", "S"],
    S: ["E", "W"],
    W: ["N", "S"],
  };

  const key = (x, y) => `${x},${y}`;

  /**
   * Build a solvable level by placing arrows in reverse clear order:
   * each new arrow is slid in from off-board along its tip direction onto empty cells.
   * Clearing in reverse of placement order is always possible.
   *
   * @param {number} size
   * @param {number} count
   * @param {() => number} rng
   */
  function buildSolvableLevel(size, count, rng = Math.random) {
    const occupied = new Set();
    const placed = [];

    let attempts = 0;
    while (placed.length < count && attempts < count * 120) {
      attempts += 1;
      const dir = DIRS[Math.floor(rng() * 4)];
      const [dx, dy] = DELTA[dir];

      const entries = [];
      if (dir === "E") {
        for (let y = 0; y < size; y++) entries.push([-1, y]);
      } else if (dir === "W") {
        for (let y = 0; y < size; y++) entries.push([size, y]);
      } else if (dir === "S") {
        for (let x = 0; x < size; x++) entries.push([x, -1]);
      } else {
        for (let x = 0; x < size; x++) entries.push([x, size]);
      }

      const entry = entries[Math.floor(rng() * entries.length)];
      const len = 2 + Math.floor(rng() * Math.min(5, Math.max(2, Math.floor(size / 2))));

      const path = [];
      let x = entry[0];
      let y = entry[1];
      let travel = dir;
      let ok = true;

      for (let i = 0; i < len; i++) {
        if (path.length >= 2 && rng() < 0.45) {
          travel = TURNS[travel][Math.floor(rng() * 2)];
        } else {
          travel = dir;
        }
        const [sx, sy] = DELTA[travel];
        x += sx;
        y += sy;
        if (x < 0 || y < 0 || x >= size || y >= size) {
          ok = false;
          break;
        }
        if (occupied.has(key(x, y)) || path.some(([px, py]) => px === x && py === y)) {
          ok = false;
          break;
        }
        path.push([x, y]);
      }

      if (!ok || path.length < 2) continue;

      const [lx, ly] = path[path.length - 1];
      const [plx, ply] = path[path.length - 2];
      if (lx - plx !== dx || ly - ply !== dy) {
        const nx = lx + dx;
        const ny = ly + dy;
        if (
          nx < 0 ||
          ny < 0 ||
          nx >= size ||
          ny >= size ||
          occupied.has(key(nx, ny)) ||
          path.some(([px, py]) => px === nx && py === ny)
        ) {
          continue;
        }
        path.push([nx, ny]);
      }

      if (!canEscapePath(path, dir, size, occupied)) continue;

      for (const [px, py] of path) occupied.add(key(px, py));
      placed.push({ dir, path });
    }

    return { size, arrows: placed };
  }

  /**
   * @param {number[][]} path
   * @param {Dir} dir
   * @param {number} size
   * @param {Set<string>} occupied
   */
  function canEscapePath(path, dir, size, occupied) {
    const [dx, dy] = DELTA[dir];
    let maxSteps = 0;
    for (const [x, y] of path) {
      const steps = dx === 1 ? size - x : dx === -1 ? x + 1 : dy === 1 ? size - y : y + 1;
      maxSteps = Math.max(maxSteps, steps);
    }
    for (let step = 1; step <= maxSteps; step++) {
      for (const [x, y] of path) {
        const nx = x + dx * step;
        const ny = y + dy * step;
        if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
        if (occupied.has(key(nx, ny))) return false;
      }
    }
    return true;
  }

  /** Mulberry32 — deterministic levels from an index */
  function rngFrom(seed) {
    let t = seed >>> 0;
    return () => {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeHandLevel(seed, size, count) {
    let best = buildSolvableLevel(size, count, rngFrom(seed));
    for (let i = 1; i < 8; i++) {
      const candidate = buildSolvableLevel(size, count, rngFrom(seed + i * 97));
      if (candidate.arrows.length > best.arrows.length) best = candidate;
    }
    return best;
  }

  /** Level 1 — tiny tutorial with an obvious free arrow and a blocked one */
  const TUTORIAL = {
    size: 6,
    arrows: [
      { dir: "E", path: [[1, 1], [2, 1], [3, 1]] },
      { dir: "S", path: [[4, 1], [4, 2], [4, 3]] },
      { dir: "W", path: [[3, 4], [2, 4], [1, 4]] },
      { dir: "N", path: [[1, 3], [1, 2]] },
    ],
  };

  /** First board pack */
  const LEVELS = [
    TUTORIAL,
    makeHandLevel(42, 7, 8),
    makeHandLevel(77, 8, 11),
    makeHandLevel(103, 9, 13),
    makeHandLevel(211, 10, 15),
    makeHandLevel(308, 11, 17),
    makeHandLevel(404, 11, 19),
    makeHandLevel(512, 12, 21),
    makeHandLevel(640, 12, 23),
    makeHandLevel(777, 13, 25),
    makeHandLevel(890, 14, 27),
    makeHandLevel(901, 14, 28),
  ];

  /**
   * @param {number} levelIndex
   */
  function generateLevel(levelIndex) {
    if (levelIndex < LEVELS.length) return LEVELS[levelIndex];
    const size = Math.min(8 + Math.floor((levelIndex - LEVELS.length) / 2), 16);
    const count = Math.min(8 + levelIndex, Math.floor(size * size * 0.32));
    return makeHandLevel(1000 + levelIndex * 17, size, count);
  }

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

  const DIR_DELTA = ({
    N: { x: 0, y: -1 },
    E: { x: 1, y: 0 },
    S: { x: 0, y: 1 },
    W: { x: -1, y: 0 },
  });

  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");

  const elLevel = document.getElementById("levelNum");
  const elLeft = document.getElementById("arrowsLeft");
  const elMoves = document.getElementById("moveCount");
  const elHint = document.getElementById("hint");
  const winOverlay = document.getElementById("winOverlay");
  const winTitle = document.getElementById("winTitle");
  const winCopy = document.getElementById("winCopy");
  const btnUndo = document.getElementById("btnUndo");
  const btnReset = document.getElementById("btnReset");
  const btnSkip = document.getElementById("btnSkip");
  const btnNext = document.getElementById("btnNext");

  const state = {
    levelIndex: 0,
    size: 8,
    arrows: [],
    moves: 0,
    history: [],
    cell: 40,
    pad: 24,
    dpr: 1,
    pointer: null,
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

  function hydrateLevel(level) {
    state.size = level.size;
    state.arrows = level.arrows.map((a, i) => ({
      id: `a${i}-${a.path.map((p) => p.join(".")).join("_")}`,
      dir: a.dir,
      path: a.path.map(([x, y]) => ({ x, y })),
      offsetX: 0,
      offsetY: 0,
      state: "idle",
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

  function pointerToCell(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const gx = Math.floor((x - state.pad) / state.cell);
    const gy = Math.floor((y - state.pad) / state.cell);
    if (gx < 0 || gy < 0 || gx >= state.size || gy >= state.size) return null;
    return { x: gx, y: gy };
  }

  function arrowAt(cell) {
    for (const arrow of state.arrows) {
      if (arrow.state === "gone" || arrow.state === "sliding") continue;
      if (arrow.path.some((p) => p.x === cell.x && p.y === cell.y)) return arrow;
    }
    return null;
  }

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
})();
