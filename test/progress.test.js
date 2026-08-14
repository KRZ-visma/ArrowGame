import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  STORAGE_KEY,
  STARS_KEY,
  STORAGE_KEYS,
  MAX_STRIKES,
  STAR_EXTRA_FOR_TWO,
  parseLevelIndex,
  serializeLevelIndex,
  snapshotArrows,
  parseArrowSnapshot,
  clearAllProgress,
  menuStats,
  minMovesForArrows,
  starsForClear,
  canRetryForThreeStars,
  hasFailed,
  chancesLeft,
  emptyStarRecords,
  parseStarRecords,
  serializeStarRecords,
  withUnlocked,
  recordLevelStars,
  starsForLevel,
  isLevelUnlocked,
  nextLevelIndex,
  levelSelectItems,
  MAX_SKIPS,
  normalizeSkipped,
  skippedLevels,
  skipsRemaining,
  isLevelSkipped,
  canSkipLevel,
  skipLevel,
} from "../js/progress.js";

describe("progress storage", () => {
  it("keeps the public localStorage key stable", () => {
    assert.equal(STORAGE_KEY, "arrow-out-level");
    assert.equal(STARS_KEY, "arrow-out-stars");
  });

  it("parses valid indices and rejects junk", () => {
    assert.equal(parseLevelIndex("3"), 3);
    assert.equal(parseLevelIndex("3.9"), 3);
    assert.equal(parseLevelIndex(null), null);
    assert.equal(parseLevelIndex("nope"), null);
    assert.equal(parseLevelIndex("-1"), null);
  });

  it("serializes non-negative floor indices", () => {
    assert.equal(serializeLevelIndex(4.8), "4");
    assert.equal(serializeLevelIndex(-2), "0");
  });

  it("lists every owned key and clearAllProgress removes only those", () => {
    assert.deepEqual([...STORAGE_KEYS], [STORAGE_KEY, STARS_KEY]);
    const store = new Map([
      [STORAGE_KEY, "5"],
      [STARS_KEY, "{}"],
      ["unrelated", "keep"],
    ]);
    const storage = {
      removeItem(key) {
        store.delete(key);
      },
    };
    clearAllProgress(storage);
    assert.equal(store.has(STORAGE_KEY), false);
    assert.equal(store.has(STARS_KEY), false);
    assert.equal(store.get("unrelated"), "keep");
  });
});

describe("menu stats", () => {
  const arrows = [
    { state: "idle" },
    { state: "gone" },
    { state: "sliding" },
  ];

  it("uses 1-based level numbers and counts remaining arrows", () => {
    assert.deepEqual(
      menuStats({
        levelIndex: 4,
        moves: 7,
        arrows,
        packSize: 100,
      }),
      {
        levelNumber: 5,
        packSize: 100,
        moves: 7,
        arrowsRemaining: 2,
        arrowsTotal: 3,
        levelsCleared: 4,
        chances: MAX_STRIKES,
        skipsLeft: MAX_SKIPS,
      },
    );
  });

  it("counts the current level as cleared after a win", () => {
    const stats = menuStats({
      levelIndex: 0,
      moves: 3,
      arrows: [{ state: "gone" }],
      packSize: 100,
      won: true,
    });
    assert.equal(stats.levelNumber, 1);
    assert.equal(stats.arrowsRemaining, 0);
    assert.equal(stats.levelsCleared, 1);
    assert.equal(stats.chances, MAX_STRIKES);
    assert.equal(stats.skipsLeft, MAX_SKIPS);
  });

  it("reports remaining chances from strikes", () => {
    const stats = menuStats({
      levelIndex: 0,
      moves: 1,
      arrows: [{ state: "idle" }],
      packSize: 10,
      strikes: 2,
    });
    assert.equal(stats.chances, 1);
  });

  it("clamps skip slots to 0–MAX_SKIPS", () => {
    const base = {
      levelIndex: 0,
      moves: 0,
      arrows: [{ state: "idle" }],
      packSize: 10,
    };
    assert.equal(menuStats({ ...base, skipsLeft: 2 }).skipsLeft, 2);
    assert.equal(menuStats({ ...base, skipsLeft: -4 }).skipsLeft, 0);
    assert.equal(menuStats({ ...base, skipsLeft: 9 }).skipsLeft, MAX_SKIPS);
    assert.equal(menuStats({ ...base, skipsLeft: NaN }).skipsLeft, MAX_SKIPS);
  });
});

describe("strikes and stars", () => {
  it("treats arrow count as par and rates extras 0/1/2+", () => {
    assert.equal(minMovesForArrows([{ id: 1 }, { id: 2 }, { id: 3 }]), 3);
    assert.equal(STAR_EXTRA_FOR_TWO, 1);
    assert.equal(starsForClear(10, 10), 3);
    assert.equal(starsForClear(10, 9), 3);
    assert.equal(starsForClear(10, 11), 2);
    assert.equal(starsForClear(10, 12), 1);
    assert.equal(starsForClear(10, 20), 1);
  });

  it("treats non-finite or negative inputs as empty runs", () => {
    assert.equal(starsForClear(NaN, NaN), 3);
    assert.equal(starsForClear(-4, -1), 3);
    assert.equal(starsForClear(undefined, 2), 1);
  });

  it("offers a retry only when this clear earned 1 or 2 stars", () => {
    assert.equal(canRetryForThreeStars(1), true);
    assert.equal(canRetryForThreeStars(2), true);
    assert.equal(canRetryForThreeStars(3), false);
    assert.equal(canRetryForThreeStars(0), false);
    assert.equal(canRetryForThreeStars(1.9), true);
    assert.equal(canRetryForThreeStars(NaN), false);
    assert.equal(canRetryForThreeStars(undefined), false);
  });

  it("fails after MAX_STRIKES blocked taps and clamps chances", () => {
    assert.equal(MAX_STRIKES, 3);
    assert.equal(hasFailed(2), false);
    assert.equal(hasFailed(3), true);
    assert.equal(hasFailed(8), true);
    assert.equal(chancesLeft(0), 3);
    assert.equal(chancesLeft(3), 0);
    assert.equal(chancesLeft(10), 0);
    assert.equal(chancesLeft(-2), 3);
    assert.equal(chancesLeft(NaN), 3);
  });
});

describe("star records", () => {
  it("round-trips best stars, unlocked index, and skipped levels", () => {
    const raw = serializeStarRecords({
      best: { 0: 3, 2: 1 },
      unlocked: 4,
      skipped: [3, 1],
    });
    assert.deepEqual(JSON.parse(raw), {
      best: { 0: 3, 2: 1 },
      unlocked: 4,
      skipped: [1, 3],
    });
    const parsed = parseStarRecords(raw);
    assert.equal(starsForLevel(parsed, 0), 3);
    assert.equal(starsForLevel(parsed, 1), 0);
    assert.equal(starsForLevel(parsed, 2), 1);
    assert.equal(parsed.unlocked, 4);
    assert.deepEqual(parsed.skipped, [1, 3]);
  });

  it("returns empty records for missing or junk payloads", () => {
    assert.deepEqual(parseStarRecords(null), emptyStarRecords());
    assert.deepEqual(parseStarRecords(""), emptyStarRecords());
    assert.deepEqual(parseStarRecords("{"), emptyStarRecords());
    assert.deepEqual(parseStarRecords("null"), emptyStarRecords());
    assert.deepEqual(parseStarRecords("[]"), emptyStarRecords());
    assert.deepEqual(parseStarRecords("0"), emptyStarRecords());
    assert.deepEqual(parseStarRecords('"nope"'), emptyStarRecords());
  });

  it("drops invalid best entries and repairs unlocked from stars", () => {
    const parsed = parseStarRecords(
      JSON.stringify({
        best: { "-1": 3, foo: 2, 0: 0, 1: 4, 2: 2.8, 3: 1, 5: "nope" },
        unlocked: -9,
      }),
    );
    assert.deepEqual(parsed.best, { 2: 2, 3: 1 });
    assert.equal(parsed.unlocked, 4);
  });

  it("treats a missing or non-object best as empty", () => {
    assert.deepEqual(parseStarRecords(JSON.stringify({ unlocked: 2 })), {
      best: {},
      unlocked: 2,
      skipped: [],
    });
    assert.deepEqual(parseStarRecords(JSON.stringify({ best: [3], unlocked: 1 })), {
      best: {},
      unlocked: 1,
      skipped: [],
    });
    assert.deepEqual(parseStarRecords(JSON.stringify({ best: null, unlocked: "x" })), {
      best: {},
      unlocked: 0,
      skipped: [],
    });
  });

  it("serializes missing records as empty and ignores array best", () => {
    assert.equal(serializeStarRecords(null), JSON.stringify({ best: {}, unlocked: 0, skipped: [] }));
    assert.equal(serializeStarRecords(undefined), JSON.stringify({ best: {}, unlocked: 0, skipped: [] }));
    assert.equal(
      serializeStarRecords({ best: [1], unlocked: -3 }),
      JSON.stringify({ best: {}, unlocked: 0, skipped: [] }),
    );
    assert.equal(
      serializeStarRecords({ best: { 1: 2 }, unlocked: 2, skipped: [1, 3, 1] }),
      JSON.stringify({ best: { 1: 2 }, unlocked: 2, skipped: [3] }),
    );
  });

  it("keeps the higher star rating and unlocks the next level", () => {
    let rec = emptyStarRecords();
    rec = recordLevelStars(rec, 0, 1);
    assert.equal(starsForLevel(rec, 0), 1);
    assert.equal(rec.unlocked, 1);
    rec = recordLevelStars(rec, 0, 3);
    assert.equal(starsForLevel(rec, 0), 3);
    rec = recordLevelStars(rec, 0, 2);
    assert.equal(starsForLevel(rec, 0), 3);
    rec = recordLevelStars(rec, 2.7, 9);
    assert.equal(starsForLevel(rec, 2), 3);
    assert.equal(rec.unlocked, 3);
    assert.deepEqual(rec.skipped, []);
  });

  it("unlocks a jumped-to index without clearing stars or skips", () => {
    const rec = withUnlocked({ best: { 0: 2 }, unlocked: 1, skipped: [1] }, 6);
    assert.equal(rec.best[0], 2);
    assert.equal(rec.unlocked, 6);
    assert.deepEqual(rec.skipped, [1]);
    assert.equal(withUnlocked(rec, -4).unlocked, 6);
    assert.equal(withUnlocked(emptyStarRecords(), NaN).unlocked, 0);
  });

  it("unlocks level 0 by default and later indices only when reached", () => {
    const rec = { best: { 0: 3 }, unlocked: 2 };
    assert.equal(isLevelUnlocked(rec, 0), true);
    assert.equal(isLevelUnlocked(rec, 2), true);
    assert.equal(isLevelUnlocked(rec, 3), false);
  });

  it("wraps next level to 0 at the end of the pack", () => {
    assert.equal(nextLevelIndex(4, 10), 5);
    assert.equal(nextLevelIndex(9, 10), 0);
    assert.equal(nextLevelIndex(0, 1), 0);
    assert.equal(nextLevelIndex(3, 0), 0);
    assert.equal(nextLevelIndex(3, NaN), 0);
  });

  it("builds level-select rows with stars and lock state", () => {
    const rec = { best: { 0: 3, 1: 1 }, unlocked: 2 };
    assert.deepEqual(levelSelectItems(rec, 4), [
      { index: 0, number: 1, stars: 3, unlocked: true, completed: true, skipped: false },
      { index: 1, number: 2, stars: 1, unlocked: true, completed: true, skipped: false },
      { index: 2, number: 3, stars: 0, unlocked: true, completed: false, skipped: false },
      { index: 3, number: 4, stars: 0, unlocked: false, completed: false, skipped: false },
    ]);
    assert.deepEqual(levelSelectItems(rec, -2), []);
    assert.deepEqual(levelSelectItems(rec, NaN), []);
  });
});

describe("level skips", () => {
  it("starts with a full skip quota", () => {
    assert.equal(MAX_SKIPS, 3);
    const rec = emptyStarRecords();
    assert.deepEqual(skippedLevels(rec), []);
    assert.equal(skipsRemaining(rec), MAX_SKIPS);
    assert.equal(canSkipLevel(rec, 0), true);
    assert.equal(isLevelSkipped(rec, 0), false);
  });

  it("drops junk, completed, and extra skipped indices", () => {
    assert.deepEqual(normalizeSkipped(null), []);
    assert.deepEqual(normalizeSkipped("1"), []);
    assert.deepEqual(
      normalizeSkipped([-1, 2, 2, "3", "nope", 1.9, 4, 5], { 2: 3 }),
      [1, 3, 4],
    );
  });

  it("treats missing skipped as empty and rejects invalid skip targets", () => {
    assert.deepEqual(skippedLevels({}), []);
    assert.equal(isLevelSkipped({ skipped: [1] }, NaN), false);
    assert.equal(canSkipLevel(emptyStarRecords(), -1), false);
    assert.equal(canSkipLevel(emptyStarRecords(), NaN), false);
    assert.equal(canSkipLevel({ best: { 0: 2 }, skipped: [] }, 0), false);
  });

  it("skips an uncleared level, unlocks the next, and spends a slot", () => {
    let rec = emptyStarRecords();
    rec = skipLevel(rec, 0, 10);
    assert.deepEqual(rec.skipped, [0]);
    assert.equal(rec.unlocked, 1);
    assert.equal(skipsRemaining(rec), 2);
    assert.equal(canSkipLevel(rec, 0), false);
    assert.equal(isLevelSkipped(rec, 0), true);
    rec = skipLevel(rec, 1, 10);
    rec = skipLevel(rec, 2, 10);
    assert.deepEqual(rec.skipped, [0, 1, 2]);
    assert.equal(rec.unlocked, 3);
    assert.equal(skipsRemaining(rec), 0);
    assert.equal(canSkipLevel(rec, 3), false);
  });

  it("does not spend a skip when the level is already skipped or the quota is empty", () => {
    const full = { best: {}, unlocked: 3, skipped: [0, 1, 2] };
    assert.deepEqual(skipLevel(full, 0, 10), full);
    assert.deepEqual(skipLevel(full, 3, 10).skipped, [0, 1, 2]);
    const cleared = { best: { 4: 1 }, unlocked: 5, skipped: [] };
    assert.deepEqual(skipLevel(cleared, 4, 10).skipped, []);
    assert.equal(skipLevel(cleared, 4, 10).unlocked, 5);
  });

  it("restores a skip slot when a skipped level is cleared", () => {
    let rec = skipLevel(emptyStarRecords(), 0, 10);
    rec = skipLevel(rec, 1, 10);
    rec = skipLevel(rec, 2, 10);
    assert.equal(skipsRemaining(rec), 0);
    rec = recordLevelStars(rec, 1, 2);
    assert.deepEqual(rec.skipped, [0, 2]);
    assert.equal(starsForLevel(rec, 1), 2);
    assert.equal(skipsRemaining(rec), 1);
    assert.equal(canSkipLevel(rec, 3), true);
    rec = skipLevel(rec, 3, 10);
    assert.deepEqual(rec.skipped, [0, 2, 3]);
    assert.equal(skipsRemaining(rec), 0);
  });

  it("skips the last pack level without wrapping unlocked backward", () => {
    const rec = skipLevel({ best: {}, unlocked: 9, skipped: [] }, 9, 10);
    assert.deepEqual(rec.skipped, [9]);
    assert.equal(rec.unlocked, 9);
    assert.equal(nextLevelIndex(9, 10), 0);
  });

  it("marks skipped rows in level select", () => {
    const rec = { best: { 0: 3 }, unlocked: 2, skipped: [1] };
    assert.deepEqual(levelSelectItems(rec, 3), [
      { index: 0, number: 1, stars: 3, unlocked: true, completed: true, skipped: false },
      { index: 1, number: 2, stars: 0, unlocked: true, completed: false, skipped: true },
      { index: 2, number: 3, stars: 0, unlocked: true, completed: false, skipped: false },
    ]);
  });

  it("parses legacy star JSON without skipped as an empty list", () => {
    const parsed = parseStarRecords(JSON.stringify({ best: { 0: 1 }, unlocked: 1 }));
    assert.deepEqual(parsed.skipped, []);
    assert.equal(skipsRemaining(parsed), MAX_SKIPS);
  });
});

describe("undo snapshots", () => {
  it("round-trips remaining arrows and drops gone ones", () => {
    const arrows = [
      {
        id: "a",
        dir: "E",
        path: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ],
        state: "idle",
      },
      {
        id: "b",
        dir: "N",
        path: [{ x: 2, y: 2 }],
        state: "gone",
      },
    ];
    const raw = snapshotArrows(arrows);
    const restored = parseArrowSnapshot(raw);
    assert.equal(restored.length, 1);
    assert.deepEqual(restored[0], {
      id: "a",
      dir: "E",
      path: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
    });
  });
});
