import { direction } from "./direction.ts";
import type { Cell, ResolvedFrameMap } from "./frame-map.ts";

/** one engine step is 100 ms — fixed and unexposed (ADR-0009). */
export const TICK_MS = 100;

// oneko's constants, pinned by tests
const ALERT_CAP = 7;
const ANTIC_MIN_IDLE = 10;
const ANTIC_ODDS = 200; // 1-in-200 per tick ≈ every ~20 s
const ANTIC_TICKS_MIN = 10;
const ANTIC_TICKS_SPAN = 50;
const IDLE_CADENCE = 4;

export interface EngineState {
  x: number;
  y: number;
  idleTicks: number;
  frame: number;
  antic: number | null;
  anticFrame: number;
  anticTicks: number;
}

export interface TickInput {
  mouseX: number;
  mouseY: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface RenderCmd {
  x: number;
  y: number;
  cell: Cell;
  flip: boolean;
}

export function createState(x: number, y: number): EngineState {
  return {
    x,
    y,
    idleTicks: 0,
    frame: 0,
    antic: null,
    anticFrame: 0,
    anticTicks: 0,
  };
}

const at = (cells: Cell[], i: number): Cell => cells[i % cells.length]!;

const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(Math.max(lo, v), hi);

/**
 * one oneko step: rest inside the rest radius (antics after lingering),
 * alert countdown on waking, then the 8-way chase. mutates `s`; returns what
 * to draw. rng is injectable so every behavior is testable.
 */
export function tick(
  s: EngineState,
  input: TickInput,
  map: ResolvedFrameMap,
  rng: () => number = Math.random,
): RenderCmd {
  s.frame += 1;
  const dx = s.x - input.mouseX;
  const dy = s.y - input.mouseY;
  const dist = Math.hypot(dx, dy);

  // oneko keeps both clauses: with speed > restRadius the first prevents
  // overshoot. dist === 0 guards the division below when both knobs are 0.
  if (dist === 0 || dist < map.speed || dist < map.restRadius) {
    return idle(s, map, rng);
  }

  s.antic = null;
  s.anticFrame = 0;
  s.anticTicks = 0;

  if (s.idleTicks > 1) {
    if (map.alert) {
      s.idleTicks = Math.min(s.idleTicks, ALERT_CAP) - 1;
      return { x: s.x, y: s.y, cell: at(map.alert, s.frame), flip: false };
    }
    s.idleTicks = 0; // no alert pose: straight to the chase (ADR-0007)
  }

  const dir = direction(dx, dy, dist);
  const frames = map.run[dir];
  s.x = clamp(s.x - (dx / dist) * map.speed, input.minX, input.maxX);
  s.y = clamp(s.y - (dy / dist) * map.speed, input.minY, input.maxY);
  return { x: s.x, y: s.y, cell: at(frames.cells, s.frame), flip: frames.flip };
}

function idle(
  s: EngineState,
  map: ResolvedFrameMap,
  rng: () => number,
): RenderCmd {
  s.idleTicks += 1;
  if (
    s.antic === null &&
    s.idleTicks > ANTIC_MIN_IDLE &&
    map.antics.length > 0 &&
    Math.floor(rng() * ANTIC_ODDS) === 0
  ) {
    s.antic = Math.floor(rng() * map.antics.length);
    s.anticFrame = 0;
    s.anticTicks = ANTIC_TICKS_MIN + Math.floor(rng() * ANTIC_TICKS_SPAN);
  }
  if (s.antic !== null) {
    const antic = map.antics[s.antic]!;
    const cell = at(antic.cells, s.anticFrame);
    s.anticFrame += 1;
    if (s.anticFrame >= s.anticTicks) {
      s.antic = null;
      s.anticFrame = 0;
      s.anticTicks = 0;
    }
    return { x: s.x, y: s.y, cell, flip: false };
  }
  return {
    x: s.x,
    y: s.y,
    cell: at(map.idle, Math.floor(s.idleTicks / IDLE_CADENCE)),
    flip: false,
  };
}
