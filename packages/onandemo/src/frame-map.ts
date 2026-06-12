import { DIRECTIONS, type Direction } from "./direction.ts";

/** one tile of a sheet, addressed [col, row] from the top-left. */
export type Cell = [col: number, row: number];

/** describes how a sheet animates: a uniform cell grid plus state-named cell lists. */
export interface FrameMap {
  /** cell size in px; a number for square cells, [width, height] otherwise. required. */
  cellSize: number | [width: number, height: number];
  /** state name to ordered cells; `idle` plus one run direction required, non-reserved names are antics. required. */
  states: Record<string, Cell[]>;
  /** auto-mirror a missing horizontal run direction with scaleX(-1). default true. */
  mirror?: boolean;
  /** display multiplier for cells. default 1. */
  scale?: number;
  /** chase speed in px per tick. default 10. */
  speed?: number;
  /** distance in px inside which the companion rests. default 48. */
  restRadius?: number;
}

export interface RunFrames {
  cells: Cell[];
  flip: boolean;
}

/** a frame map after the ADR-0007 ladder: complete, validated, ready to tick. */
export interface ResolvedFrameMap {
  cellW: number;
  cellH: number;
  idle: Cell[];
  alert: Cell[] | null;
  run: Record<Direction, RunFrames>;
  antics: { name: string; cells: Cell[] }[];
  scale: number;
  speed: number;
  restRadius: number;
}

const RESERVED = new Set<string>(["idle", "alert", ...DIRECTIONS]);

const MIRRORED: Record<Direction, Direction> = {
  N: "N",
  S: "S",
  E: "W",
  W: "E",
  NE: "NW",
  NW: "NE",
  SE: "SW",
  SW: "SE",
};

/** the last rung of the ladder: any run direction, in this order. */
const ANY: readonly Direction[] = ["E", "W", "N", "S", "NE", "NW", "SE", "SW"];

function horizontal(d: Direction): Direction | null {
  return d.includes("E") ? "E" : d.includes("W") ? "W" : null;
}

/** frame maps arrive as fetched JSON: tuning numbers are validated, not trusted. */
function tune(name: string, v: number | undefined, fallback: number): number {
  if (v === undefined) return fallback;
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0) {
    throw new Error(`onandemo: ${name} must be a finite number >= 0`);
  }
  return v;
}

/**
 * resolves a frame map once, at load (ADR-0007): validates the two-state
 * minimum, walks the direction ladder to a complete 8-way table, and collects
 * antics by exclusion. the tick loop never sees a hole.
 */
export function resolveFrameMap(map: FrameMap): ResolvedFrameMap {
  const size = map.cellSize;
  const pair: [number, number] =
    typeof size === "number"
      ? [size, size]
      : Array.isArray(size) && size.length === 2
        ? [Number(size[0]), Number(size[1])]
        : [NaN, NaN];
  const [cellW, cellH] = pair;
  if (
    !Number.isFinite(cellW) ||
    cellW <= 0 ||
    !Number.isFinite(cellH) ||
    cellH <= 0
  ) {
    throw new Error(
      "onandemo: cellSize must be a positive number or [width, height]",
    );
  }
  for (const [name, cells] of Object.entries(map.states)) {
    if (!Array.isArray(cells)) {
      throw new Error(`onandemo: state \`${name}\` must be a list of cells`);
    }
    for (const cell of cells) {
      if (
        !Array.isArray(cell) ||
        cell.length !== 2 ||
        !Number.isFinite(cell[0]) ||
        !Number.isFinite(cell[1])
      ) {
        throw new Error(
          `onandemo: state \`${name}\` has a malformed cell — cells are [col, row]`,
        );
      }
    }
  }
  const has = (name: string): Cell[] | null => {
    const cells = map.states[name];
    return cells && cells.length > 0 ? cells : null;
  };
  const idle = has("idle");
  if (!idle) {
    throw new Error("onandemo: a frame map needs an `idle` state");
  }
  if (!DIRECTIONS.some((d) => has(d))) {
    throw new Error(
      "onandemo: a frame map needs at least one run direction (N, NE, E, SE, S, SW, W, NW)",
    );
  }
  const mirror = map.mirror !== false;
  const run = {} as Record<Direction, RunFrames>;
  for (const d of DIRECTIONS) {
    run[d] = resolveDirection(d, has, mirror);
  }
  const antics = Object.keys(map.states)
    .filter((name) => !RESERVED.has(name))
    .map((name) => ({ name, cells: map.states[name] ?? [] }))
    .filter((a) => a.cells.length > 0);
  const scale = tune("scale", map.scale, 1);
  if (scale === 0) {
    throw new Error("onandemo: scale must be positive");
  }
  return {
    cellW,
    cellH,
    idle,
    alert: has("alert"),
    run,
    antics,
    scale,
    speed: tune("speed", map.speed, 10),
    restRadius: tune("restRadius", map.restRadius, 48),
  };
}

/** one direction down the ladder: exact → mirrored → horizontal → mirrored horizontal → vertical → any. */
function resolveDirection(
  d: Direction,
  has: (name: string) => Cell[] | null,
  mirror: boolean,
): RunFrames {
  const exact = has(d);
  if (exact) return { cells: exact, flip: false };
  if (mirror && MIRRORED[d] !== d) {
    const m = has(MIRRORED[d]);
    if (m) return { cells: m, flip: true };
  }
  const h = horizontal(d);
  if (h) {
    const hc = has(h);
    if (hc) return { cells: hc, flip: false };
    if (mirror) {
      const hm = has(MIRRORED[h]);
      if (hm) return { cells: hm, flip: true };
    }
  }
  const v = d.startsWith("N") ? has("N") : d.startsWith("S") ? has("S") : null;
  if (v) return { cells: v, flip: false };
  for (const a of ANY) {
    const c = has(a);
    if (c) return { cells: c, flip: false };
  }
  // unreachable: at least one direction was validated above
  throw new Error("onandemo: no run direction resolvable");
}
