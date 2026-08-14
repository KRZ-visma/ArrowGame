export {
  buildSolvableLevel,
  rngFrom,
  makeHandLevel,
  TUTORIAL,
  HAND_LEVEL_SPECS,
  levelParamsForIndex,
  buildLevelForIndex,
} from "./level-build.js";
export { LEVEL_PACK } from "./levels-data.js";
import { LEVEL_PACK } from "./levels-data.js";

/** @deprecated Use LEVEL_PACK */
export const LEVELS = LEVEL_PACK;

/**
 * @param {number} index
 */
export function getLevelData(index) {
  const i = Math.max(0, Math.floor(index));
  if (i < LEVEL_PACK.length) return LEVEL_PACK[i];
  return LEVEL_PACK[LEVEL_PACK.length - 1];
}
