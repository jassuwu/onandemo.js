import { describe, expect, test } from "bun:test";
import { createState, tick, TICK_MS, type TickInput } from "./engine.ts";
import { resolveFrameMap, type ResolvedFrameMap } from "./frame-map.ts";

const IDLE: [number, number][] = [[0, 0]];
const ALERT: [number, number][] = [[7, 0]];
const RUN_E: [number, number][] = [
  [1, 0],
  [2, 0],
];

function makeMap(withAlert = true, withAntic = false): ResolvedFrameMap {
  const states: Record<string, [number, number][]> = {
    idle: IDLE,
    E: RUN_E,
    W: [[3, 0]],
    N: [[4, 0]],
    S: [[5, 0]],
  };
  if (withAlert) states["alert"] = ALERT;
  if (withAntic) states["sleeping"] = [[6, 0]];
  return resolveFrameMap({ cellSize: 32, states });
}

const input = (mouseX: number, mouseY: number): TickInput => ({
  mouseX,
  mouseY,
  minX: 16,
  minY: 16,
  maxX: 1904,
  maxY: 1064,
});

const never = () => 0.999; // rng that never triggers an antic

describe("oneko parity constants", () => {
  test("the tick is 100 ms", () => {
    expect(TICK_MS).toBe(100);
  });
});

describe("resting", () => {
  test("inside the rest radius the companion holds still and idles", () => {
    const s = createState(100, 100);
    const r = tick(s, input(110, 110), makeMap(), never); // dist ≈ 14 < 48
    expect(r.x).toBe(100);
    expect(r.y).toBe(100);
    expect(r.cell).toEqual([0, 0]);
    expect(s.idleTicks).toBe(1);
  });

  test("rest radius is 48 px by default: 47 rests, 49 does not", () => {
    const rests = createState(100, 100);
    tick(rests, input(147, 100), makeMap(), never);
    expect(rests.x).toBe(100);

    const chases = createState(100, 100);
    tick(chases, input(149, 100), makeMap(), never);
    expect(chases.x).not.toBe(100);
  });
});

describe("chasing", () => {
  test("moves exactly speed (10) px per tick along the unit vector", () => {
    const s = createState(100, 100);
    tick(s, input(300, 100), makeMap(), never); // cursor due east
    expect(s.x).toBe(110);
    expect(s.y).toBe(100);
  });

  test("uses the run direction's cells, alternating per tick", () => {
    const s = createState(100, 100);
    const map = makeMap();
    const a = tick(s, input(500, 100), map, never);
    const b = tick(s, input(500, 100), map, never);
    expect([a.cell, b.cell].sort()).toEqual([
      [1, 0],
      [2, 0],
    ]);
    expect(a.cell).not.toEqual(b.cell);
  });

  test("clamps to the viewport margins", () => {
    const s = createState(20, 20);
    tick(s, input(-500, 20), makeMap(), never); // cursor far west, beyond the edge
    expect(s.x).toBe(16);
  });
});

describe("alert countdown (oneko's manners)", () => {
  test("after lingering, the alert pose shows before the chase", () => {
    const s = createState(100, 100);
    const map = makeMap();
    for (let i = 0; i < 5; i++) tick(s, input(100, 100), map, never); // idleTicks = 5
    const r = tick(s, input(500, 100), map, never);
    expect(r.cell).toEqual([7, 0]);
    expect(r.x).toBe(100); // alert ticks do not move
  });

  test("countdown runs min(idleTicks, 7) - 1 down to 1, then the chase starts", () => {
    const s = createState(100, 100);
    const map = makeMap();
    for (let i = 0; i < 30; i++) tick(s, input(100, 100), map, never); // idleTicks = 30
    let alertTicks = 0;
    while (tick(s, input(500, 100), map, never).cell[0] === 7) alertTicks++;
    expect(alertTicks).toBe(6); // capped at 7, decremented to 1
    expect(s.x).toBeGreaterThan(100);
  });

  test("no alert state: straight from rest to chase (ADR-0007)", () => {
    const s = createState(100, 100);
    const map = makeMap(false);
    for (let i = 0; i < 5; i++) tick(s, input(100, 100), map, never);
    const r = tick(s, input(500, 100), map, never);
    expect(r.x).toBe(110);
  });

  test("a multi-frame alert animates through its cells", () => {
    const map = resolveFrameMap({
      cellSize: 32,
      states: {
        idle: IDLE,
        E: RUN_E,
        alert: [
          [7, 0],
          [8, 0],
        ],
      },
    });
    const s = createState(100, 100);
    for (let i = 0; i < 30; i++) tick(s, input(100, 100), map, never);
    const a = tick(s, input(500, 100), map, never);
    const b = tick(s, input(500, 100), map, never);
    expect(a.cell).not.toEqual(b.cell);
    expect([a.cell, b.cell].sort()).toEqual([
      [7, 0],
      [8, 0],
    ]);
  });
});

describe("antics", () => {
  test("never trigger before 10 idle ticks, even with a willing rng", () => {
    const s = createState(100, 100);
    const map = makeMap(true, true);
    const willing = () => 0; // floor(0 * 200) === 0 → would trigger
    for (let i = 0; i < 10; i++) {
      const r = tick(s, input(100, 100), map, willing);
      expect(r.cell).toEqual([0, 0]); // still the idle cell
    }
  });

  test("a 1-in-200 roll after lingering starts an antic for 10-59 ticks", () => {
    const s = createState(100, 100);
    const map = makeMap(true, true);
    for (let i = 0; i < 11; i++) tick(s, input(100, 100), map, never);
    // rolls: trigger(0), pick antic 0 (0), duration 10 + floor(0*50) = 10
    const rolls = [0, 0, 0];
    let r = tick(s, input(100, 100), map, () => rolls.shift() ?? 0.999);
    expect(r.cell).toEqual([6, 0]); // sleeping
    for (let i = 0; i < 9; i++) {
      r = tick(s, input(100, 100), map, never);
      expect(r.cell).toEqual([6, 0]);
    }
    r = tick(s, input(100, 100), map, never);
    expect(r.cell).toEqual([0, 0]); // back to idle
  });

  test("an unwilling rng never antics", () => {
    const s = createState(100, 100);
    const map = makeMap(true, true);
    for (let i = 0; i < 500; i++) {
      const r = tick(s, input(100, 100), map, never);
      expect(r.cell).toEqual([0, 0]);
    }
  });

  test("the pick roll chooses among multiple antics, and the span is 10-59", () => {
    const map = resolveFrameMap({
      cellSize: 32,
      states: {
        idle: IDLE,
        E: RUN_E,
        sleeping: [[6, 0]],
        scratch: [[8, 0]],
      },
    });
    const s = createState(100, 100);
    for (let i = 0; i < 11; i++) tick(s, input(100, 100), map, never);
    // rolls: trigger(0), pick floor(0.999 * 2) = 1 → scratch, span 10 + floor(0.999 * 50) = 59
    const rolls = [0, 0.999, 0.999];
    let r = tick(s, input(100, 100), map, () => rolls.shift() ?? 0.999);
    expect(r.cell).toEqual([8, 0]);
    for (let i = 0; i < 58; i++) {
      r = tick(s, input(100, 100), map, never);
      expect(r.cell).toEqual([8, 0]);
    }
    r = tick(s, input(100, 100), map, never);
    expect(r.cell).toEqual([0, 0]); // tick 60: back to idle
  });

  test("a two-cell idle breathes every 4 ticks", () => {
    const map = resolveFrameMap({
      cellSize: 32,
      states: {
        idle: [
          [0, 0],
          [9, 0],
        ],
        E: RUN_E,
      },
    });
    const s = createState(100, 100);
    const cells: number[] = [];
    for (let i = 0; i < 8; i++) {
      cells.push(tick(s, input(100, 100), map, never).cell[0]);
    }
    // idleTicks 1-3 → idle[0], 4-7 → idle[1], 8 wraps to idle[0]
    expect(cells).toEqual([0, 0, 0, 9, 9, 9, 9, 0]);
  });

  test("speed 0 + restRadius 0: the companion holds finite (dist === 0 guard)", () => {
    const map = resolveFrameMap({
      cellSize: 32,
      states: { idle: IDLE, E: RUN_E },
      speed: 0,
      restRadius: 0,
    });
    const s = createState(100, 100);
    const r = tick(s, input(100, 100), map, never);
    expect(r.x).toBe(100);
    expect(r.y).toBe(100);
    expect(r.cell).toEqual([0, 0]);
  });

  test("clamps at the far corner on both axes", () => {
    const s = createState(1904, 1064);
    tick(s, input(3000, 3000), makeMap(), never);
    expect(s.x).toBe(1904);
    expect(s.y).toBe(1064);
  });

  test("the chase interrupts an antic instantly", () => {
    const s = createState(100, 100);
    const map = makeMap(true, true);
    for (let i = 0; i < 11; i++) tick(s, input(100, 100), map, never);
    const rolls = [0, 0, 0.999]; // trigger, pick 0, long duration
    tick(s, input(100, 100), map, () => rolls.shift() ?? 0.999);
    expect(s.antic).not.toBeNull();
    tick(s, input(500, 100), map, never);
    expect(s.antic).toBeNull();
  });
});
