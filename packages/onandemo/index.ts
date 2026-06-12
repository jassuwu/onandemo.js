/** onandemo — oneko.js, but anything chases your cursor. */

import { mount } from "./src/dom.ts";
import { resolveFrameMap, type FrameMap } from "./src/frame-map.ts";

export type { Direction } from "./src/direction.ts";
export type { Cell, FrameMap, ResolvedFrameMap } from "./src/frame-map.ts";

/** the six knobs: `preset` or `sheet` + `frameMap`, then tuning (ADR-0009). */
export interface OnandemoOptions {
  /** bundled companion by name. default "neko". */
  preset?: string;
  /** sprite-sheet image URL; pair with `frameMap`. no default. */
  sheet?: string;
  /** frame map for `sheet`. no default. */
  frameMap?: FrameMap;
  /** chase speed in px per tick; overrides the frame map. default 10. */
  speed?: number;
  /** rest distance in px; overrides the frame map. the companion also rests within one `speed` step (oneko's overshoot guard). default 48. */
  restRadius?: number;
  /** display multiplier; overrides the frame map. default the preset's, else 1. */
  scale?: number;
  /** stacking order of the companion element. default 2147483647. */
  zIndex?: number;
  /** remember position in localStorage["onandemo"]. default true. */
  persist?: boolean;
}

/** mounts a companion that chases the cursor; returns its destroy function. */
export function onandemo(options: OnandemoOptions = {}): () => void {
  if (!options.sheet || !options.frameMap) {
    throw new Error(
      "onandemo: presets land soon — until then pass `sheet` and `frameMap`",
    );
  }
  if (options.zIndex !== undefined && !Number.isFinite(options.zIndex)) {
    throw new Error("onandemo: zIndex must be a finite number");
  }
  // user knobs ride into the frame map so resolveFrameMap validates everything once
  const map = resolveFrameMap({
    ...options.frameMap,
    speed: options.speed ?? options.frameMap.speed,
    restRadius: options.restRadius ?? options.frameMap.restRadius,
    scale: options.scale ?? options.frameMap.scale,
  });
  return mount({
    sheet: options.sheet,
    map,
    zIndex: options.zIndex ?? 2147483647,
    persist: options.persist ?? true,
  });
}
