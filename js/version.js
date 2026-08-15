/** Build id for Menu + service-worker cache.
 *  Pages deploy replaces `__APP_VERSION__` with a short content hash of the staged shell.
 *  Unreplaced token means local / non-deployed. */

export const APP_VERSION = "__APP_VERSION__";

/**
 * Player-facing label: `dev` until deploy stamps a hash.
 * @param {string} [version]
 */
export function menuVersionLabel(version = APP_VERSION) {
  if (version.includes("APP_VERSION")) return "dev";
  return version;
}
