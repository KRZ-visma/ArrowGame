# PWA lane — install, offline shell, deploy assets

## Modules

| Concern | File |
| --- | --- |
| Manifest | `manifest.webmanifest` |
| Service worker | `sw.js` |
| Build id (Menu + cache) | `js/version.js` |
| Icons | `icons/*` |
| Registration / meta | `index.html` |
| Deploy staging | `.github/workflows/deploy-pages.yml` |
| Version stamp | `scripts/stamp-app-version.js` |
| Tests | `test/pwa.test.js`, `test/stamp-app-version.test.js` |

## Rules

- Use **relative** `start_url` / `scope` / icon / precache URLs (`./…`) so GitHub Pages project sites (e.g. `/ArrowGame/`) stay installable
- Keep PRECACHE aligned with deploy staging (include new `js/*` play modules when added)
- **Do not hand-bump `CACHE_NAME`.** Source uses the token `__APP_VERSION__` in `sw.js` (`arrow-out-__APP_VERSION__`) and `js/version.js`. Deploy runs `node scripts/stamp-app-version.js _site`, which hashes the staged shell (token still present) and replaces the token with an 8-char content hash in `_site/` only. Menu shows that id (`Version …`); unreplaced → `dev`
- Google Fonts stay network-only (offline falls back to Impact / system-ui)
- Do not add a bundler for the PWA
- Deploy stages `index.html`, `game.js`, `js/*`, `manifest.webmanifest`, `sw.js`, `icons/*`, `.nojekyll`, then stamps the version hash
- Update path: new `sw.js` bytes → install → `skipWaiting` → activate deletes old caches → `clients.claim`. Fetches are cache-first; reopen/refresh to run new in-memory JS
