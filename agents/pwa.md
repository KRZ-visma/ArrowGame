# PWA lane — install, offline shell, deploy assets

## Modules

| Concern | File |
| --- | --- |
| Manifest | `manifest.webmanifest` |
| Service worker | `sw.js` |
| Icons | `icons/*` |
| Registration / meta | `index.html` |
| Deploy staging | `.github/workflows/deploy-pages.yml` |
| Tests | `test/pwa.test.js` |

## Rules

- Use **relative** `start_url` / `scope` / icon / precache URLs (`./…`) so GitHub Pages project sites (e.g. `/ArrowGame/`) stay installable
- Bump `CACHE_NAME` in `sw.js` when shipped assets change; keep PRECACHE aligned with deploy staging (include new `js/*` play modules when added)
- Google Fonts stay network-only (offline falls back to Impact / system-ui)
- Do not add a bundler for the PWA
- Deploy stages `index.html`, `game.js`, `js/*`, `manifest.webmanifest`, `sw.js`, `icons/*`, `.nojekyll`
