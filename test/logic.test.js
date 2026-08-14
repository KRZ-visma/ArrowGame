import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canEscapePath,
  canEscape,
  buildOccupancy,
  cellKey,
  stepsToExit,
  snakePositions,
  snakeExitDistance,
} from "../js/logic.js";

describe("stepsToExit", () => {
  it("counts cells until off-board in each direction", () => {
    assert.equal(stepsToExit(2, 1, "E", 5), 3);
    assert.equal(stepsToExit(2, 1, "W", 5), 3);
    assert.equal(stepsToExit(2, 1, "S", 5), 4);
    assert.equal(stepsToExit(2, 1, "N", 5), 2);
  });
});

describe("canEscapePath", () => {
  it("allows a clear east exit", () => {
    const path = [
      [0, 0],
      [1, 0],
    ];
    assert.equal(canEscapePath(path, "E", 4, new Set()), true);
  });

  it("blocks when another arrow sits on the exit path", () => {
    const path = [
      [0, 0],
      [1, 0],
    ];
    const occupied = new Set([cellKey(3, 0)]);
    assert.equal(canEscapePath(path, "E", 4, occupied), false);
  });

  it("ignores occupied cells that are not on the swept path", () => {
    const path = [
      [0, 0],
      [1, 0],
    ];
    const occupied = new Set([cellKey(1, 1)]);
    assert.equal(canEscapePath(path, "E", 4, occupied), true);
  });

  it("accepts {x,y} path objects", () => {
    const path = [
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ];
    assert.equal(canEscapePath(path, "S", 4, new Set()), true);
  });

  it("lets an L-shape crawl past a cell the rigid body would sweep", () => {
    // Tail at (0,1), corner (0,0), head (1,0) pointing east.
    // (1,1) sits east of the tail — rigid slide would hit it; the snake does not.
    const path = [
      [0, 1],
      [0, 0],
      [1, 0],
    ];
    const occupied = new Set([cellKey(1, 1)]);
    assert.equal(canEscapePath(path, "E", 4, occupied), true);
  });

  it("still blocks an L-shape when the head corridor is occupied", () => {
    const path = [
      [0, 1],
      [0, 0],
      [1, 0],
    ];
    const occupied = new Set([cellKey(3, 0)]);
    assert.equal(canEscapePath(path, "E", 4, occupied), false);
  });

  it("blocks when the head would crawl into its own body", () => {
    const path = [
      [3, 3],
      [3, 2],
      [3, 1],
      [2, 1],
      [1, 1],
      [1, 2],
      [2, 2],
    ];
    assert.equal(canEscapePath(path, "E", 5, new Set()), false);
  });

  it("allows crawling into the vacating tail cell", () => {
    const path = [
      [2, 1],
      [2, 0],
      [1, 0],
      [0, 0],
      [0, 1],
      [1, 1],
    ];
    assert.equal(canEscapePath(path, "E", 4, new Set()), true);
  });
});

describe("snakePositions", () => {
  it("returns the original path at distance 0", () => {
    const path = [
      [0, 1],
      [0, 0],
      [1, 0],
    ];
    assert.deepEqual(snakePositions(path, "E", 0), [
      { x: 0, y: 1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ]);
  });

  it("advances the head and pulls the tail around a corner", () => {
    const path = [
      [0, 1],
      [0, 0],
      [1, 0],
    ];
    assert.deepEqual(snakePositions(path, "E", 1), [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ]);
  });

  it("interpolates a half-step around the bend", () => {
    const path = [
      [0, 1],
      [0, 0],
      [1, 0],
    ];
    assert.deepEqual(snakePositions(path, "E", 0.5), [
      { x: 0, y: 0.5 },
      { x: 0.5, y: 0 },
      { x: 1.5, y: 0 },
    ]);
  });

  it("sizes exit travel so the tail leaves the board", () => {
    const path = [
      [0, 1],
      [0, 0],
      [1, 0],
    ];
    const distance = snakeExitDistance(path, "E", 4);
    const pose = snakePositions(path, "E", distance);
    assert.ok(pose.every((c) => c.x >= 4 || c.x < 0 || c.y >= 4 || c.y < 0));
  });
});

describe("buildOccupancy / canEscape", () => {
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
      path: [
        { x: 3, y: 0 },
        { x: 3, y: 1 },
      ],
      state: "idle",
    },
  ];

  it("maps idle cells and skips gone/sliding", () => {
    const map = buildOccupancy(arrows);
    assert.equal(map.get(cellKey(0, 0)), "a");
    assert.equal(map.get(cellKey(3, 1)), "b");
    assert.equal(buildOccupancy([{ ...arrows[0], state: "gone" }, arrows[1]]).has(cellKey(0, 0)), false);
  });

  it("detects a blocked east arrow", () => {
    assert.equal(canEscape(arrows[0], 4, arrows), false);
  });

  it("allows escape after the blocker is gone", () => {
    const cleared = [arrows[0], { ...arrows[1], state: "gone" }];
    assert.equal(canEscape(cleared[0], 4, cleared), true);
  });
});
