import { describe, expect, test } from "bun:test";
import { resolveFrameMap, type FrameMap } from "../frame-map.ts";

interface PresetFile {
  sheet: string;
  frameMap: FrameMap;
}

async function load(name: string): Promise<PresetFile> {
  return Bun.file(
    new URL(`../../presets/${name}.json`, import.meta.url),
  ).json() as Promise<PresetFile>;
}

describe("the fetchable presets", () => {
  test("soldier: true 8-directional, nothing flipped, three antics", async () => {
    const soldier = await load("soldier");
    const r = resolveFrameMap(soldier.frameMap);
    for (const d of ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const) {
      expect(r.run[d].flip).toBe(false);
    }
    expect(r.alert).not.toBeNull();
    expect(r.antics.map((a) => a.name).sort()).toEqual([
      "cast",
      "swing",
      "throw",
    ]);
    expect(r.scale).toBe(2);
    // every cell within the 24×8 grid of the 768×256 sheet
    for (const cells of Object.values(soldier.frameMap.states)) {
      for (const [c, row] of cells) {
        expect(c).toBeLessThan(24);
        expect(row).toBeLessThan(8);
      }
    }
  });

  test("slime: side-view only, the ladder does the rest", async () => {
    const slime = await load("slime");
    const r = resolveFrameMap(slime.frameMap);
    expect(r.run.E.flip).toBe(false);
    expect(r.run.W.flip).toBe(true); // auto-mirrored
    expect(r.alert).toBeNull();
    expect(r.antics.map((a) => a.name)).toEqual(["splat"]);
    // every cell within the 15×1 grid of the 480×32 sheet
    for (const cells of Object.values(slime.frameMap.states)) {
      for (const [c, row] of cells) {
        expect(c).toBeLessThan(15);
        expect(row).toBe(0);
      }
    }
  });

  test("every preset json names a sheet that ships next to it", async () => {
    for (const name of ["soldier", "slime"]) {
      const preset = await load(name);
      const sheet = Bun.file(
        new URL(`../../presets/${preset.sheet}`, import.meta.url),
      );
      expect(await sheet.exists()).toBe(true);
    }
  });
});
