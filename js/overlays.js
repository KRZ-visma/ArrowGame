/** End splash, Menu, and All levels overlays. */

import { LEVEL_PACK } from "./levels.js";
import {
  MAX_STRIKES,
  menuStats,
  canRetryForThreeStars,
  nextLevelIndex,
  levelSelectItems,
  canSkipLevel,
  skipsRemaining,
} from "./progress.js";
import { state, stars } from "./play-session.js";
import { menuVersionLabel } from "./version.js";

/** @typedef {ReturnType<typeof collectEls>} OverlayEls */

function collectEls() {
  return {
    endOverlay: document.getElementById("endOverlay"),
    endCard: document.getElementById("endCard"),
    endKicker: document.getElementById("endKicker"),
    endTitle: document.getElementById("endTitle"),
    endCopy: document.getElementById("endCopy"),
    endStars: document.getElementById("endStars"),
    btnEndPrimary: document.getElementById("btnEndPrimary"),
    btnEndRetry: document.getElementById("btnEndRetry"),
    btnEndSkip: document.getElementById("btnEndSkip"),
    btnEndLevels: document.getElementById("btnEndLevels"),
    btnMenu: document.getElementById("btnMenu"),
    menuOverlay: document.getElementById("menuOverlay"),
    menuMain: document.getElementById("menuMain"),
    menuConfirm: document.getElementById("menuConfirm"),
    menuTitle: document.getElementById("menuTitle"),
    statLevel: document.getElementById("statLevel"),
    statMoves: document.getElementById("statMoves"),
    statArrows: document.getElementById("statArrows"),
    statChances: document.getElementById("statChances"),
    statCleared: document.getElementById("statCleared"),
    statSkips: document.getElementById("statSkips"),
    menuVersion: document.getElementById("menuVersion"),
    livesEl: document.getElementById("lives"),
    btnCloseMenu: document.getElementById("btnCloseMenu"),
    btnAllLevels: document.getElementById("btnAllLevels"),
    btnSkipLevel: document.getElementById("btnSkipLevel"),
    btnClearProgress: document.getElementById("btnClearProgress"),
    btnCancelClear: document.getElementById("btnCancelClear"),
    btnConfirmClear: document.getElementById("btnConfirmClear"),
    levelsOverlay: document.getElementById("levelsOverlay"),
    levelGrid: document.getElementById("levelGrid"),
    btnCloseLevels: document.getElementById("btnCloseLevels"),
  };
}

/** @type {OverlayEls | null} */
let els = null;

/**
 * @typedef {Object} OverlayHandlers
 * @property {(index: number) => void} startLevel
 * @property {() => void} skipCurrentLevel
 * @property {() => void} onEndPrimary
 * @property {() => void} clearAllAndRestart
 */

/** @type {OverlayHandlers | null} */
let handlers = null;

/** @param {OverlayHandlers} h */
export function bindOverlays(h) {
  els = collectEls();
  handlers = h;
  wireOverlayEvents();
  return els;
}

export function refreshPlayHud() {
  if (!els) return;
  const pips = els.livesEl.querySelectorAll(".life");
  pips.forEach((pip, i) => {
    pip.classList.toggle("spent", i < state.strikes);
  });
  els.livesEl.setAttribute(
    "aria-label",
    `${Math.max(0, MAX_STRIKES - state.strikes)} chances left`,
  );
}

function setEndStars(count) {
  if (!els) return;
  const starNodes = els.endStars.querySelectorAll(".star");
  starNodes.forEach((star, i) => {
    star.classList.toggle("filled", i < count);
  });
  els.endStars.setAttribute("aria-label", `${count} star${count === 1 ? "" : "s"}`);
}

export function hideEndOverlay() {
  if (!els) return;
  els.endOverlay.hidden = true;
  state.endMode = null;
  els.endCard.classList.remove("is-fail");
  els.btnEndRetry.hidden = true;
}

export function showWinSplash(starCount) {
  if (!els) return;
  const next = nextLevelIndex(state.levelIndex, LEVEL_PACK.length);
  const nextNumber = next + 1;
  const last = state.levelIndex >= LEVEL_PACK.length - 1;
  const retry = canRetryForThreeStars(starCount);
  state.endMode = "win";
  els.endCard.classList.remove("is-fail");
  els.endKicker.textContent = "Cleared";
  els.endTitle.textContent = "Level complete";
  setEndStars(starCount);
  els.endStars.hidden = false;
  els.btnEndSkip.hidden = true;
  els.btnEndRetry.hidden = !retry;
  els.endCopy.textContent = last
    ? "That's the last one in the pack."
    : "Every arrow found its way out.";
  els.btnEndPrimary.textContent = `Next — Level ${nextNumber}`;
  els.endOverlay.hidden = false;
}

export function showFailSplash() {
  if (!els) return;
  state.endMode = "fail";
  els.endCard.classList.add("is-fail");
  els.endKicker.textContent = "Failed";
  els.endTitle.textContent = "Out of chances";
  els.endStars.hidden = true;
  els.btnEndRetry.hidden = true;
  els.endCopy.textContent = "Three arrows could not move.";
  els.btnEndPrimary.textContent = "Restart";
  refreshSkipButtons();
  els.endOverlay.hidden = false;
}

export function refreshSkipButtons() {
  if (!els) return;
  const allowed = canSkipLevel(stars.records, state.levelIndex);
  const left = skipsRemaining(stars.records);
  els.btnSkipLevel.disabled = !allowed;
  els.btnSkipLevel.setAttribute(
    "aria-label",
    allowed
      ? `Skip this level, ${left} skip${left === 1 ? "" : "s"} left`
      : left <= 0
        ? "No skips left. Finish a skipped level to get one back."
        : "Cannot skip this level",
  );
  const showEndSkip = state.endMode === "fail" && allowed;
  els.btnEndSkip.hidden = !showEndSkip;
  if (showEndSkip) {
    const nextNumber = nextLevelIndex(state.levelIndex, LEVEL_PACK.length) + 1;
    els.btnEndSkip.textContent = `Skip — Level ${nextNumber}`;
  }
}

function refreshMenuStats() {
  if (!els) return;
  const stats = menuStats({
    levelIndex: state.levelIndex,
    moves: state.moves,
    arrows: state.arrows,
    packSize: LEVEL_PACK.length,
    won: state.won,
    strikes: state.strikes,
    skipsLeft: skipsRemaining(stars.records),
  });
  els.menuTitle.textContent = `Level ${stats.levelNumber}`;
  els.statLevel.textContent = `${stats.levelNumber} / ${stats.packSize}`;
  els.statMoves.textContent = String(stats.moves);
  els.statArrows.textContent = `${stats.arrowsRemaining} / ${stats.arrowsTotal}`;
  els.statChances.textContent = String(stats.chances);
  els.statCleared.textContent = String(stats.levelsCleared);
  els.statSkips.textContent = String(stats.skipsLeft);
  if (els.menuVersion) {
    els.menuVersion.textContent = `Version ${menuVersionLabel()}`;
  }
  refreshSkipButtons();
}

export function closeLevels() {
  if (!els) return;
  els.levelsOverlay.hidden = true;
}

export function openLevels() {
  if (!els || !handlers) return;
  closeMenu();
  const items = levelSelectItems(stars.records, LEVEL_PACK.length);
  els.levelGrid.replaceChildren();
  for (const item of items) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "level-cell";
    if (item.index === state.levelIndex) btn.classList.add("is-current");
    if (item.unlocked && !item.completed) btn.classList.add("is-incomplete");
    if (item.skipped) btn.classList.add("is-skipped");
    btn.disabled = !item.unlocked;
    const status = !item.unlocked
      ? "locked"
      : item.completed
        ? `${item.stars} star${item.stars === 1 ? "" : "s"}`
        : item.skipped
          ? "skipped, not cleared"
          : "not cleared";
    btn.setAttribute("aria-label", `Level ${item.number}, ${status}`);
    const num = document.createElement("span");
    num.textContent = String(item.number);
    const pips = document.createElement("span");
    pips.className = "level-pips";
    pips.setAttribute("aria-hidden", "true");
    for (let s = 1; s <= 3; s++) {
      const pip = document.createElement("span");
      pip.className = s <= item.stars ? "level-pip filled" : "level-pip";
      pip.textContent = s <= item.stars ? "★" : "☆";
      pips.appendChild(pip);
    }
    btn.append(num, pips);
    if (item.unlocked) {
      btn.addEventListener("click", () => {
        closeLevels();
        closeMenu();
        handlers.startLevel(item.index);
      });
    }
    els.levelGrid.appendChild(btn);
  }
  els.levelsOverlay.hidden = false;
  els.btnCloseLevels.focus();
}

export function showMenuConfirm(confirming) {
  if (!els) return;
  els.menuMain.hidden = confirming;
  els.menuConfirm.hidden = !confirming;
  if (els.menuOverlay.hidden) return;
  if (confirming) els.btnCancelClear.focus();
  else els.btnCloseMenu.focus();
}

export function closeMenu() {
  if (!els) return;
  els.menuOverlay.hidden = true;
  els.btnMenu.setAttribute("aria-expanded", "false");
  showMenuConfirm(false);
}

export function openMenu() {
  if (!els) return;
  if (!els.levelsOverlay.hidden) closeLevels();
  refreshMenuStats();
  showMenuConfirm(false);
  els.menuOverlay.hidden = false;
  els.btnMenu.setAttribute("aria-expanded", "true");
  els.btnCloseMenu.focus();
}

function wireOverlayEvents() {
  if (!els || !handlers) return;

  els.btnEndPrimary.addEventListener("click", () => handlers.onEndPrimary());
  els.btnEndRetry.addEventListener("click", () => handlers.startLevel(state.levelIndex));
  els.btnEndSkip.addEventListener("click", () => handlers.skipCurrentLevel());
  els.btnEndLevels.addEventListener("click", () => openLevels());

  els.btnMenu.addEventListener("click", () => {
    if (!els.levelsOverlay.hidden) {
      closeLevels();
      return;
    }
    if (els.menuOverlay.hidden) openMenu();
    else closeMenu();
  });
  els.btnCloseMenu.addEventListener("click", () => closeMenu());
  els.btnAllLevels.addEventListener("click", () => openLevels());
  els.btnSkipLevel.addEventListener("click", () => handlers.skipCurrentLevel());
  els.btnCloseLevels.addEventListener("click", () => closeLevels());
  els.btnClearProgress.addEventListener("click", () => showMenuConfirm(true));
  els.btnCancelClear.addEventListener("click", () => showMenuConfirm(false));
  els.btnConfirmClear.addEventListener("click", () => handlers.clearAllAndRestart());
  els.menuOverlay.addEventListener("click", (e) => {
    if (e.target === els.menuOverlay) closeMenu();
  });
  els.levelsOverlay.addEventListener("click", (e) => {
    if (e.target === els.levelsOverlay) closeLevels();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!els.levelsOverlay.hidden) {
        closeLevels();
        return;
      }
      if (!els.menuOverlay.hidden) {
        if (!els.menuConfirm.hidden) showMenuConfirm(false);
        else closeMenu();
      }
      return;
    }
    if (!els.menuOverlay.hidden || !els.levelsOverlay.hidden) return;
    if (e.key === "r" || e.key === "R") {
      handlers.startLevel(state.levelIndex);
    } else if ((e.key === "n" || e.key === "N") && state.endMode === "win") {
      handlers.onEndPrimary();
    }
  });
}
