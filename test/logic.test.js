import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canEscapePath,
  canEscape,
  buildOccupancy,
  cellKey,
  stepsToExit,
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
