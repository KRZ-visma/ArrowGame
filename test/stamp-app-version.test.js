import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  contentHashForSite,
  stampAppVersion,
} from "../scripts/stamp-app-version.js";

describe("stamp-app-version", () => {
  it("hashes staged files and replaces the version token", () => {
    const root = mkdtempSync(join(tmpdir(), "arrow-out-stamp-"));
    try {
      mkdirSync(join(root, "js"));
      writeFileSync(join(root, "sw.js"), 'const CACHE_NAME = "arrow-out-__APP_VERSION__";\n');
      writeFileSync(
        join(root, "js/version.js"),
        'export const APP_VERSION = "__APP_VERSION__";\n',
      );
      writeFileSync(join(root, "index.html"), "<!doctype html>\n");

      const expected = contentHashForSite(root);
      assert.match(expected, /^[0-9a-f]{8}$/);

      const stamped = stampAppVersion(root);
      assert.equal(stamped, expected);

      const sw = readFileSync(join(root, "sw.js"), "utf8");
      const version = readFileSync(join(root, "js/version.js"), "utf8");
      assert.equal(sw, `const CACHE_NAME = "arrow-out-${expected}";\n`);
      assert.equal(version, `export const APP_VERSION = "${expected}";\n`);
      assert.doesNotMatch(sw, /__APP_VERSION__/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("throws when the token is missing", () => {
    const root = mkdtempSync(join(tmpdir(), "arrow-out-stamp-"));
    try {
      mkdirSync(join(root, "js"));
      writeFileSync(join(root, "sw.js"), 'const CACHE_NAME = "arrow-out-x";\n');
      writeFileSync(join(root, "js/version.js"), 'export const APP_VERSION = "x";\n');
      assert.throws(() => stampAppVersion(root), /missing __APP_VERSION__/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("same assets yield the same hash", () => {
    const a = mkdtempSync(join(tmpdir(), "arrow-out-stamp-a-"));
    const b = mkdtempSync(join(tmpdir(), "arrow-out-stamp-b-"));
    try {
      for (const root of [a, b]) {
        mkdirSync(join(root, "js"));
        writeFileSync(join(root, "sw.js"), "sw-__APP_VERSION__\n");
        writeFileSync(join(root, "js/version.js"), "ver-__APP_VERSION__\n");
        writeFileSync(join(root, "game.js"), "game\n");
      }
      assert.equal(contentHashForSite(a), contentHashForSite(b));
    } finally {
      rmSync(a, { recursive: true, force: true });
      rmSync(b, { recursive: true, force: true });
    }
  });
});
