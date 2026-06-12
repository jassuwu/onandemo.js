import { describe, expect, mock, test } from "bun:test";
import type { MountOptions } from "./src/dom.ts";
import type { FrameMap } from "./src/frame-map.ts";

const captured: MountOptions[] = [];
mock.module("./src/dom.ts", () => ({
  mount: (o: MountOptions) => {
    captured.push(o);
    return () => {};
  },
}));
const { onandemo } = await import("./index.ts");

describe("the factory", () => {
  test("throws without sheet + frameMap", () => {
    expect(() => onandemo({})).toThrow("sheet");
  });

  test("knob precedence: user option > frame map > default, zeros included", () => {
    onandemo({
      sheet: "s.png",
      frameMap: {
        cellSize: 32,
        states: { idle: [[0, 0]], E: [[1, 0]] },
        speed: 5,
        restRadius: 100,
        scale: 2,
      },
      speed: 0,
      restRadius: 0,
      scale: 3,
      zIndex: 9,
      persist: false,
    });
    const o = captured.at(-1)!;
    expect([o.map.speed, o.map.restRadius, o.map.scale]).toEqual([0, 0, 3]);
    expect(o.zIndex).toBe(9);
    expect(o.persist).toBe(false);
  });

  test("invalid user knobs are rejected, not absorbed", () => {
    const frameMap: FrameMap = {
      cellSize: 32,
      states: { idle: [[0, 0]], E: [[1, 0]] },
    };
    expect(() =>
      onandemo({ sheet: "s.png", frameMap, speed: Number.NaN }),
    ).toThrow("speed");
    expect(() =>
      onandemo({ sheet: "s.png", frameMap, zIndex: Number.NaN }),
    ).toThrow("zIndex");
  });
});
