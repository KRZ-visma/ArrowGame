/** Injected CSS + DOM shell for ARROW OUT play surface. */

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
  height: 100dvh;
  height: 100svh;
  color: var(--ink);
  font-family: var(--font-body);
  background: var(--bg-0);
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: hidden;
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

.lives {
  display: flex;
  align-items: center;
  gap: 0.32rem;
  padding: 0 0.2rem;
  min-height: 44px;
}

.life {
  width: 0.78rem;
  height: 0.78rem;
  background: var(--accent);
  clip-path: polygon(0 35%, 55% 35%, 55% 0, 100% 50%, 55% 100%, 55% 65%, 0 65%);
}

.life.spent {
  background: var(--danger);
  opacity: 0.38;
}

.stage {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: stretch;
  padding: 0 0 var(--safe-bottom);
  min-height: 0;
  height: 100%;
}

.board-wrap {
  position: relative;
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  height: 100%;
  animation: board-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
}

#board {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 0;
  cursor: pointer;
  touch-action: none;
  background: #000;
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

.menu-version {
  margin: 1rem 0 0;
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-align: center;
  text-transform: uppercase;
}

.menu-actions .btn {
  width: 100%;
}

.end-stars {
  display: flex;
  justify-content: center;
  gap: 0.55rem;
  margin: 0.15rem 0 1rem;
}

.end-stars[hidden] {
  display: none;
}

.star {
  width: 1.45rem;
  height: 1.45rem;
  background: rgba(244, 244, 240, 0.14);
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
}

.star.filled {
  background: var(--accent);
}

.overlay-card.is-fail {
  background:
    linear-gradient(160deg, rgba(255, 90, 60, 0.12), transparent 42%),
    #0d0d0d;
}

.overlay-card.is-fail .overlay-kicker {
  color: var(--danger);
}

.end-actions {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.end-actions .btn {
  width: 100%;
}

.overlay-levels {
  z-index: 40;
}

.overlay-card-levels {
  width: min(26rem, 100%);
  height: min(78dvh, calc(100dvh - 2.5rem - var(--safe-top) - var(--safe-bottom)));
  max-height: min(78dvh, calc(100dvh - 2.5rem - var(--safe-top) - var(--safe-bottom)));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  text-align: left;
}

.level-legend {
  margin: 0 0 0.85rem;
  color: var(--muted);
  font-size: 0.82rem;
  line-height: 1.4;
  flex-shrink: 0;
}

.level-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.4rem;
  margin: 0 0 1rem;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

.level-cell {
  appearance: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.12rem;
  min-height: 52px;
  padding: 0.35rem 0.2rem 0.3rem;
  border: 1px solid var(--line);
  border-radius: 2px;
  background: transparent;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 400;
  cursor: pointer;
}

.level-cell:hover:not(:disabled) {
  border-color: rgba(244, 244, 240, 0.35);
  background: rgba(244, 244, 240, 0.04);
}

.level-cell.is-current {
  border-color: var(--accent);
}

.level-cell.is-incomplete:not(:disabled) {
  border-color: rgba(232, 255, 71, 0.35);
}

.level-cell.is-skipped:not(:disabled) {
  border-style: dashed;
  border-color: rgba(244, 244, 240, 0.5);
}

.level-cell.is-skipped.is-current:not(:disabled) {
  border-color: var(--accent);
}

.level-cell:disabled {
  opacity: 0.32;
  cursor: not-allowed;
}

.level-pips {
  display: flex;
  justify-content: center;
  gap: 0.06rem;
  line-height: 1;
}

.level-pip {
  flex-shrink: 0;
  font-family: var(--font-body);
  font-size: 0.78rem;
  line-height: 1;
  color: rgba(244, 244, 240, 0.32);
}

.level-pip.filled {
  color: var(--accent);
}

.overlay-card-levels .menu-actions {
  flex-shrink: 0;
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

export function injectStyles() {
  const font = document.createElement("link");
  font.rel = "stylesheet";
  font.href =
    "https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap";
  document.head.appendChild(font);

  const style = document.createElement("style");
  style.textContent = STYLE;
  document.head.appendChild(style);
}

export function buildUI() {
  document.body.innerHTML = `
    <div class="atmosphere" aria-hidden="true"></div>
    <header class="top-bar">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true"></span>
        <h1 class="brand-name">ARROW OUT</h1>
      </div>
      <div class="top-actions">
        <div class="lives" id="lives" aria-label="Chances left">
          <span class="life" data-life="0"></span>
          <span class="life" data-life="1"></span>
          <span class="life" data-life="2"></span>
        </div>
        <button type="button" class="icon-btn" id="btnMenu" title="Menu" aria-label="Menu" aria-haspopup="dialog" aria-controls="menuOverlay" aria-expanded="false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
          </svg>
        </button>
        <button type="button" class="icon-btn" id="btnReset" title="Restart level" aria-label="Restart level">
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
    <div class="overlay" id="endOverlay" hidden>
      <div class="overlay-card" id="endCard" role="dialog" aria-modal="true" aria-labelledby="endTitle">
        <p class="overlay-kicker" id="endKicker">Cleared</p>
        <h2 class="overlay-title" id="endTitle">Level complete</h2>
        <div class="end-stars" id="endStars" hidden>
          <span class="star" data-star="1"></span>
          <span class="star" data-star="2"></span>
          <span class="star" data-star="3"></span>
        </div>
        <p class="overlay-copy" id="endCopy">Every arrow found its way out.</p>
        <div class="end-actions">
          <button type="button" class="btn btn-primary" id="btnEndPrimary">Next</button>
          <button type="button" class="btn" id="btnEndRetry" hidden>Retry for 3 stars</button>
          <button type="button" class="btn" id="btnEndSkip" hidden>Skip this level</button>
          <button type="button" class="btn" id="btnEndLevels">All levels</button>
        </div>
      </div>
    </div>
    <div class="overlay overlay-levels" id="levelsOverlay" hidden>
      <div class="overlay-card overlay-card-levels" id="levelsDialog" role="dialog" aria-modal="true" aria-labelledby="levelsTitle">
        <p class="overlay-kicker">Select</p>
        <h2 class="overlay-title" id="levelsTitle">All levels</h2>
        <p class="level-legend">Filled stars are your best clear. Unlocked levels you have not cleared yet are outlined. Skipped levels have a dashed border — finish one to get a skip back. Locked levels wait until you finish or skip the one before.</p>
        <div class="level-grid" id="levelGrid"></div>
        <div class="menu-actions">
          <button type="button" class="btn" id="btnCloseLevels">Close</button>
        </div>
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
              <dt>Chances</dt>
              <dd id="statChances">3</dd>
            </div>
            <div class="menu-stat">
              <dt>Levels cleared</dt>
              <dd id="statCleared">0</dd>
            </div>
            <div class="menu-stat">
              <dt>Skips left</dt>
              <dd id="statSkips">3</dd>
            </div>
          </dl>
          <div class="menu-actions">
            <button type="button" class="btn" id="btnAllLevels">All levels</button>
            <button type="button" class="btn" id="btnBetaLevel">Beta level</button>
            <button type="button" class="btn" id="btnSkipLevel">Skip this level</button>
            <button type="button" class="btn" id="btnCloseMenu">Close</button>
            <button type="button" class="btn btn-danger" id="btnClearProgress">Clear all progress</button>
          </div>
          <p class="menu-version" id="menuVersion">Version dev</p>
        </div>
        <div id="menuConfirm" hidden>
          <p class="overlay-kicker">Start over</p>
          <h2 class="overlay-title">Clear everything?</h2>
          <p class="overlay-copy">Clears saved progress and returns you to Level 1. This cannot be undone.</p>
          <div class="menu-actions">
            <button type="button" class="btn" id="btnCancelClear">Cancel</button>
            <button type="button" class="btn btn-danger" id="btnConfirmClear">Start over</button>
          </div>
        </div>
      </div>
    </div>`;
}
