import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { APP_VERSION, menuVersionLabel } from "../js/version.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("PWA shell", () => {
  it("manifest has install fields and every icon file exists", () => {
    const manifest = JSON.parse(
      readFileSync(join(root, "manifest.webmanifest"), "utf8"),
    );
    assert.equal(manifest.name, "ARROW OUT");
    assert.equal(manifest.display, "standalone");
    assert.equal(manifest.start_url, "./");
    assert.equal(manifest.scope, "./");
    assert.equal(manifest.theme_color, "#050505");
    assert.equal(manifest.background_color, "#050505");
    assert.ok(Array.isArray(manifest.icons));
    assert.ok(manifest.icons.length >= 2);
    const purposes = new Set();
    for (const icon of manifest.icons) {
      assert.match(icon.src, /^\.\//);
      const path = join(root, icon.src.replace(/^\.\//, ""));
      assert.ok(existsSync(path), `missing icon ${icon.src}`);
      for (const purpose of String(icon.purpose || "any").split(/\s+/)) {
        purposes.add(purpose);
      }
    }
    assert.ok(purposes.has("any"));
    assert.ok(purposes.has("maskable"));
  });

  it("service worker precache list uses relative URLs and existing files", () => {
    const sw = readFileSync(join(root, "sw.js"), "utf8");
    const match = sw.match(/const PRECACHE = \[([\s\S]*?)\];/);
    assert.ok(match, "PRECACHE array missing");
    const urls = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    assert.ok(urls.includes("./index.html"));
    assert.ok(urls.includes("./game.js"));
    assert.ok(urls.includes("./manifest.webmanifest"));
    assert.ok(urls.includes("./js/version.js"));
    for (const url of urls) {
      assert.match(url, /^\.\//);
      if (url === "./") continue;
      const path = join(root, url.replace(/^\.\//, ""));
      assert.ok(existsSync(path), `missing precache asset ${url}`);
    }
  });

  it("index.html links the manifest and registers the service worker", () => {
    const html = readFileSync(join(root, "index.html"), "utf8");
    assert.match(html, /rel="manifest"\s+href="manifest\.webmanifest"/);
    assert.match(html, /serviceWorker\.register\("\.\/sw\.js"\)/);
    assert.match(html, /name="theme-color"\s+content="#050505"/);
    assert.match(html, /rel="apple-touch-icon"/);
  });

  it("deploy workflow stages manifest, service worker, and icons", () => {
    const yml = readFileSync(
      join(root, ".github/workflows/deploy-pages.yml"),
      "utf8",
    );
    assert.match(yml, /manifest\.webmanifest/);
    assert.match(yml, /\bsw\.js\b/);
    assert.match(yml, /_site\/icons/);
    assert.match(yml, /cp icons\/\* _site\/icons\//);
  });

  it("version token is shared by sw cache name and Menu helper", () => {
    assert.equal(APP_VERSION, "__APP_VERSION__");
    assert.equal(menuVersionLabel(), "dev");
    assert.equal(menuVersionLabel("a1b2c3d4"), "a1b2c3d4");
    const sw = readFileSync(join(root, "sw.js"), "utf8");
    assert.match(sw, /CACHE_NAME = "arrow-out-__APP_VERSION__"/);
    const versionSrc = readFileSync(join(root, "js/version.js"), "utf8");
    assert.match(versionSrc, /export const APP_VERSION = "__APP_VERSION__"/);
  });

  it("Menu shell shows a version footer", () => {
    const shell = readFileSync(join(root, "js/ui-shell.js"), "utf8");
    assert.match(shell, /id="menuVersion"/);
    assert.match(shell, /menu-version/);
    const overlays = readFileSync(join(root, "js/overlays.js"), "utf8");
    assert.match(overlays, /menuVersionLabel/);
  });

  it("deploy stamps content hash via scripts/stamp-app-version.js", () => {
    const yml = readFileSync(
      join(root, ".github/workflows/deploy-pages.yml"),
      "utf8",
    );
    assert.match(yml, /stamp-app-version\.js/);
    assert.match(yml, /node scripts\/stamp-app-version\.js _site/);
  });
});
