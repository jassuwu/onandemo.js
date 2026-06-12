import { describe, expect, test } from "bun:test";
import { DIRECTIONS } from "../direction.ts";
import { resolveFrameMap } from "../frame-map.ts";
import { neko } from "./neko.ts";

describe("the neko preset", () => {
  test("inlines the sheet as a gif data url", () => {
    expect(neko.sheet.startsWith("data:image/gif;base64,")).toBe(true);
    expect(neko.sheet.length).toBeGreaterThan(4000); // ~3.3 KB of cat, base64'd
  });

  test("resolves with all eight directions exact and seven antics", () => {
    const r = resolveFrameMap(neko.frameMap);
    for (const d of DIRECTIONS) {
      expect(r.run[d].flip).toBe(false);
    }
    expect(r.alert).not.toBeNull();
    expect(r.antics.map((a) => a.name).sort()).toEqual([
      "scratchSelf",
      "scratchWallE",
      "scratchWallN",
      "scratchWallS",
      "scratchWallW",
      "sleeping",
      "tired",
    ]);
  });

  test("maps all 32 cells of the 8×4 sheet, each exactly once", () => {
    const cells = Object.values(neko.frameMap.states)
      .flat()
      .map(([c, r]) => `${c},${r}`);
    expect(cells.length).toBe(32);
    expect(new Set(cells).size).toBe(32);
  });
});
