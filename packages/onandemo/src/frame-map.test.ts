import { describe, expect, test } from "bun:test";
import { DIRECTIONS, type Direction } from "./direction.ts";
import { resolveFrameMap, type Cell, type FrameMap } from "./frame-map.ts";

const cell = (n: number): Cell[] => [[n, 0]];

function mapWith(dirs: Direction[], extra: Partial<FrameMap> = {}): FrameMap {
  const states: Record<string, Cell[]> = { idle: cell(0) };
  dirs.forEach((d, i) => {
    states[d] = cell(i + 1);
  });
  return { cellSize: 32, states, ...extra };
}

describe("validation", () => {
  test("idle is required", () => {
    expect(() =>
      resolveFrameMap({ cellSize: 32, states: { E: cell(1) } }),
    ).toThrow("idle");
  });

  test("one run direction is required", () => {
    expect(() =>
      resolveFrameMap({ cellSize: 32, states: { idle: cell(0) } }),
    ).toThrow("run direction");
  });

  test("empty cell lists do not count", () => {
    expect(() =>
      resolveFrameMap({ cellSize: 32, states: { idle: cell(0), E: [] } }),
    ).toThrow("run direction");
  });

  test("cellSize must be positive", () => {
    expect(() => resolveFrameMap(mapWith(["E"], { cellSize: 0 }))).toThrow(
      "positive",
    );
  });

  test("string cellSize from JSON is rejected, not destructured", () => {
    expect(() =>
      resolveFrameMap(mapWith(["E"], { cellSize: "32" as unknown as number })),
    ).toThrow("cellSize");
  });

  test("malformed cells are rejected", () => {
    expect(() =>
      resolveFrameMap({
        cellSize: 32,
        states: { idle: [[0]] as unknown as Cell[], E: cell(1) },
      }),
    ).toThrow("malformed");
  });

  test("non-finite or negative tuning is rejected", () => {
    expect(() => resolveFrameMap(mapWith(["E"], { speed: NaN }))).toThrow(
      "speed",
    );
    expect(() => resolveFrameMap(mapWith(["E"], { restRadius: -1 }))).toThrow(
      "restRadius",
    );
    expect(() => resolveFrameMap(mapWith(["E"], { scale: 0 }))).toThrow(
      "scale",
    );
  });
});

describe("the ladder (ADR-0007)", () => {
  test("8 directions pass through untouched", () => {
    const r = resolveFrameMap(mapWith([...DIRECTIONS]));
    for (const d of DIRECTIONS) {
      expect(r.run[d].flip).toBe(false);
    }
    expect(r.run.N.cells).toEqual(cell(1));
    expect(r.run.NW.cells).toEqual(cell(8));
  });

  test("4 cardinals: diagonals snap, horizontal wins", () => {
    const r = resolveFrameMap(mapWith(["N", "E", "S", "W"]));
    expect(r.run.NE.cells).toEqual(r.run.E.cells);
    expect(r.run.SE.cells).toEqual(r.run.E.cells);
    expect(r.run.NW.cells).toEqual(r.run.W.cells);
    expect(r.run.SW.cells).toEqual(r.run.W.cells);
    expect(r.run.NE.flip).toBe(false);
  });

  test("E/W only: vertical plays a horizontal", () => {
    const r = resolveFrameMap(mapWith(["E", "W"]));
    expect(r.run.N.cells).toEqual(r.run.E.cells);
    expect(r.run.S.cells).toEqual(r.run.E.cells);
    expect(r.run.N.flip).toBe(false);
  });

  test("one direction: the missing horizontal auto-mirrors", () => {
    const r = resolveFrameMap(mapWith(["E"]));
    expect(r.run.W.cells).toEqual(r.run.E.cells);
    expect(r.run.W.flip).toBe(true);
    expect(r.run.NW.flip).toBe(true); // horizontal component W ← mirrored E
    expect(r.run.N.cells).toEqual(r.run.E.cells);
    expect(r.run.N.flip).toBe(false);
  });

  test("diagonals mirror to their opposite diagonal first", () => {
    const r = resolveFrameMap(mapWith(["NE", "E"]));
    expect(r.run.NW.cells).toEqual(r.run.NE.cells);
    expect(r.run.NW.flip).toBe(true);
  });

  test("mirror: false falls through to an unflipped direction", () => {
    const r = resolveFrameMap(mapWith(["E"], { mirror: false }));
    expect(r.run.W.cells).toEqual(r.run.E.cells);
    expect(r.run.W.flip).toBe(false);
  });

  test("only N: diagonals take the vertical rung, the rest fall to any", () => {
    const r = resolveFrameMap(mapWith(["N"]));
    expect(r.run.NE).toEqual({ cells: r.run.N.cells, flip: false });
    expect(r.run.SE).toEqual({ cells: r.run.N.cells, flip: false });
    expect(r.run.E).toEqual({ cells: r.run.N.cells, flip: false });
    expect(r.run.S).toEqual({ cells: r.run.N.cells, flip: false });
  });

  test("only NE: NW mirrors it; everything else falls to any, unflipped", () => {
    const r = resolveFrameMap(mapWith(["NE"]));
    expect(r.run.NW).toEqual({ cells: r.run.NE.cells, flip: true });
    expect(r.run.E).toEqual({ cells: r.run.NE.cells, flip: false });
    expect(r.run.S).toEqual({ cells: r.run.NE.cells, flip: false });
  });
});

describe("antics by exclusion", () => {
  test("non-reserved states become antics; reserved ones never do", () => {
    const m = mapWith(["E"]);
    m.states["sleeping"] = cell(9);
    m.states["scratch"] = cell(10);
    m.states["alert"] = cell(11);
    const r = resolveFrameMap(m);
    expect(r.antics.map((a) => a.name).sort()).toEqual(["scratch", "sleeping"]);
    expect(r.alert).toEqual(cell(11));
  });

  test("missing alert resolves to null", () => {
    expect(resolveFrameMap(mapWith(["E"])).alert).toBeNull();
  });
});

describe("tuning defaults", () => {
  test("oneko's constants when the map is silent", () => {
    const r = resolveFrameMap(mapWith(["E"]));
    expect(r.speed).toBe(10);
    expect(r.restRadius).toBe(48);
    expect(r.scale).toBe(1);
  });

  test("map-supplied tuning survives resolution", () => {
    const r = resolveFrameMap(
      mapWith(["E"], { speed: 5, restRadius: 100, scale: 2 }),
    );
    expect([r.speed, r.restRadius, r.scale]).toEqual([5, 100, 2]);
  });

  test("rectangular cells via tuple", () => {
    const r = resolveFrameMap(mapWith(["E"], { cellSize: [24, 36] }));
    expect(r.cellW).toBe(24);
    expect(r.cellH).toBe(36);
  });
});
