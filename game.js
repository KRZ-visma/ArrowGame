import {
  canEscape as canEscapeArrow,
  snakeExitDistance,
  DELTA,
} from "./js/logic.js";
import { getLevelData, LEVEL_PACK } from "./js/levels.js";
import {
  STORAGE_KEY,
  STARS_KEY,
  parseLevelIndex,
  serializeLevelIndex,
  clearAllProgress,
  minMovesForArrows,
  starsForClear,
  hasFailed,
  parseStarRecords,
  serializeStarRecords,
  emptyStarRecords,
  withUnlocked,
  recordLevelStars,
  nextLevelIndex,
  canSkipLevel,
  skipLevel,
} from "./js/progress.js";
import { injectStyles, buildUI } from "./js/ui-shell.js";
import { state, stars } from "./js/play-session.js";
import { bindBoardView, resize } from "./js/board-view.js";
import { bindBoardDraw, drawBoard } from "./js/board-draw.js";
import {
  bindOverlays,
  refreshPlayHud,
  hideEndOverlay,
  showWinSplash,
  showFailSplash,
  closeMenu,
  closeLevels,
} from "./js/overlays.js";
import { bindPointerInput } from "./js/pointer-input.js";

injectStyles();
buildUI();

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const btnReset = document.getElementById("btnReset");

bindBoardView(canvas, ctx);
bindBoardDraw(canvas, ctx);

function loadProgress() {
  try {
    const parsed = parseLevelIndex(localStorage.getItem(STORAGE_KEY));
    if (parsed != null) state.levelIndex = parsed;
  } catch {
    /* ignore */
  }
  try {
    stars.records = withUnlocked(
      parseStarRecords(localStorage.getItem(STARS_KEY)),
      state.levelIndex,
    );
    saveStars();
  } catch {
    stars.records = withUnlocked(emptyStarRecords(), state.levelIndex);
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, serializeLevelIndex(state.levelIndex));
  } catch {
    /* ignore */
  }
}

function saveStars() {
  try {
    localStorage.setItem(STARS_KEY, serializeStarRecords(stars.records));
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
  state.strikes = 0;
  state.animating = false;
  state.won = false;
  state.failed = false;
  hideEndOverlay();
  refreshPlayHud();
  resize({ resetView: true });
}

function startLevel(index) {
  state.levelIndex = Math.max(0, index);
  stars.records = withUnlocked(stars.records, state.levelIndex);
  saveStars();
  saveProgress();
  hydrateLevel(structuredClone(getLevelData(state.levelIndex)));
}

function skipCurrentLevel() {
  if (!canSkipLevel(stars.records, state.levelIndex)) return;
  const next = nextLevelIndex(state.levelIndex, LEVEL_PACK.length);
  stars.records = skipLevel(stars.records, state.levelIndex, LEVEL_PACK.length);
  saveStars();
  closeMenu();
  startLevel(next);
}

function onEndPrimary() {
  if (state.endMode === "fail") {
    startLevel(state.levelIndex);
    return;
  }
  startLevel(nextLevelIndex(state.levelIndex, LEVEL_PACK.length));
}

function clearAllAndRestart() {
  try {
    clearAllProgress(localStorage);
  } catch {
    /* ignore */
  }
  stars.records = emptyStarRecords();
  closeLevels();
  closeMenu();
  startLevel(0);
}

bindOverlays({
  startLevel,
  skipCurrentLevel,
  onEndPrimary,
  clearAllAndRestart,
});

function canEscape(arrow) {
  return canEscapeArrow(arrow, state.size, state.arrows);
}

function syncAnimating() {
  state.animating = state.arrows.some((a) => a.state === "sliding" || a.state === "shake");
}

function tryMove(arrow) {
  if (state.won || state.failed) return;
  if (arrow.state !== "idle") return;

  if (!canEscape(arrow)) {
    arrow.state = "shake";
    arrow.animT = 0;
    arrow.shakePhase = Math.random() * Math.PI * 2;
    state.strikes += 1;
    refreshPlayHud();
    syncAnimating();
    if (hasFailed(state.strikes)) {
      state.failed = true;
      showFailSplash();
    }
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
  if (state.won || state.failed) return;
  if (state.arrows.every((a) => a.state === "gone")) {
    state.won = true;
    const minMoves = minMovesForArrows(state.arrows);
    const starCount = starsForClear(minMoves, state.moves + state.strikes);
    stars.records = recordLevelStars(stars.records, state.levelIndex, starCount);
    saveStars();
    showWinSplash(starCount);
  }
}

bindPointerInput(canvas, { tryMove });

btnReset.addEventListener("click", () => startLevel(state.levelIndex));

window.addEventListener("resize", () => resize());
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", () => resize());
}

let lastTs = performance.now();
function frame(ts) {
  const dt = Math.min(0.05, (ts - lastTs) / 1000);
  lastTs = ts;
  for (const arrow of state.arrows) updateArrow(arrow, dt);
  drawBoard();
  requestAnimationFrame(frame);
}

loadProgress();
startLevel(state.levelIndex);
requestAnimationFrame(frame);
