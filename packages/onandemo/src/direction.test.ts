import { describe, expect, test } from "bun:test";
import { direction, type Direction } from "./direction.ts";

// dx/dy are companion minus cursor: cursor to the EAST of the companion
// means dx < 0 and the companion must run "E".
function at(angleDeg: number): Direction {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  return direction(dx, dy, 1);
}

describe("direction", () => {
  test("eight compass points (oneko's table)", () => {
    expect(direction(-1, 0, 1)).toBe("E"); // cursor east
    expect(direction(1, 0, 1)).toBe("W"); // cursor west
    expect(direction(0, 1, 1)).toBe("N"); // cursor above (dy = companion - cursor > 0)
    expect(direction(0, -1, 1)).toBe("S"); // cursor below
    const d = Math.SQRT1_2;
    expect(direction(-d, d, 1)).toBe("NE");
    expect(direction(-d, -d, 1)).toBe("SE");
    expect(direction(d, d, 1)).toBe("NW");
    expect(direction(d, -d, 1)).toBe("SW");
  });

  test("±0.5 band edges: a component beyond 0.5 joins the name", () => {
    // dy/dist just above 0.5 → N appears; just below → it does not
    const above = 0.51;
    const below = 0.49;
    const x = (c: number) => -Math.sqrt(1 - c * c); // keep unit length, cursor east
    expect(direction(x(above), above, 1)).toBe("NE");
    expect(direction(x(below), below, 1)).toBe("E");
  });

  test("exactly 0.5 stays out — the bands are strict", () => {
    const c = Math.sqrt(3) / 2;
    expect(direction(-c, 0.5, 1)).toBe("E");
    expect(direction(-c, -0.5, 1)).toBe("E");
  });

  test("never returns an empty name over the full circle", () => {
    for (let a = 0; a < 360; a++) {
      expect(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]).toContain(at(a));
    }
  });
});
