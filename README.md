# ARROW OUT

Vanilla JavaScript arrow-escape puzzle. Click an arrow to send it off the board in its tip direction — the body follows like a snake, only when nothing blocks the path.

## Play on GitHub Pages

After Pages is enabled for this repo:

**https://krz-visma.github.io/ArrowGame/**

Installable as a PWA (Add to Home Screen / install). The service worker caches the app shell so levels stay playable offline after the first visit.

## Local

Serve over HTTP (ES modules will not load from `file://`):

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Files

- `index.html` — shell (`viewport-fit=cover`, module entry, PWA meta)
- `manifest.webmanifest` / `sw.js` / `icons/*` — install + offline shell
- `game.js` — UI, styles, canvas, input
- `js/logic.js` — escape / occupancy rules
- `js/levels.js` — tutorial, hand pack, seeded generator
- `js/progress.js` — `localStorage` + undo snapshots + menu stats / clear-all

## Tests

```bash
npm test
```

## Controls

Click / tap · Menu · Restart · Skip · `Ctrl/Cmd+Z` · `R`
