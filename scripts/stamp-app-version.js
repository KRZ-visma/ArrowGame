#!/usr/bin/env node
/**
 * Stamp `__APP_VERSION__` in a staged site tree with an 8-char content hash.
 * Hash is over relative paths + file bytes while the token is still present.
 * Usage: node scripts/stamp-app-version.js [_site]
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const TOKEN = "__APP_VERSION__";
const STAMP_FILES = ["sw.js", "js/version.js"];

/**
 * @param {string} dir
 * @param {string[]} out
 */
function listFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) listFiles(p, out);
    else out.push(p);
  }
  return out;
}

/**
 * @param {string} root
 * @returns {string}
 */
export function contentHashForSite(root) {
  const files = listFiles(root).sort();
  const h = createHash("sha256");
  for (const abs of files) {
    h.update(relative(root, abs).split("\\").join("/"));
    h.update("\0");
    h.update(readFileSync(abs));
  }
  return h.digest("hex").slice(0, 8);
}

/**
 * @param {string} root
 * @returns {string} stamped hash
 */
export function stampAppVersion(root) {
  const hash = contentHashForSite(root);
  for (const rel of STAMP_FILES) {
    const path = join(root, rel);
    const text = readFileSync(path, "utf8");
    if (!text.includes(TOKEN)) {
      throw new Error(`missing ${TOKEN} in ${path}`);
    }
    writeFileSync(path, text.split(TOKEN).join(hash), "utf8");
  }
  return hash;
}

const entry = process.argv[1]?.replace(/\\/g, "/") ?? "";
if (entry.endsWith("/stamp-app-version.js") || entry.endsWith("stamp-app-version.js")) {
  const root = process.argv[2] || "_site";
  const hash = stampAppVersion(root);
  console.log(`APP_VERSION=${hash}`);
}
