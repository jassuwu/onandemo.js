/** onandemo — oneko.js, but anything chases your cursor. */

import { mount } from "./src/dom.ts";
import { resolveFrameMap, type FrameMap } from "./src/frame-map.ts";
import { neko } from "./src/presets/neko.ts";

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

const PRESETS: Record<string, { sheet: string; frameMap: FrameMap }> = {
  neko,
};

/** mounts a companion that chases the cursor; returns its destroy function. */
export function onandemo(options: OnandemoOptions = {}): () => void {
  if ((options.sheet === undefined) !== (options.frameMap === undefined)) {
    throw new Error("onandemo: `sheet` and `frameMap` come together");
  }
  let sheet = options.sheet;
  let frameMap = options.frameMap;
  if (!sheet || !frameMap) {
    const preset = PRESETS[options.preset ?? "neko"];
    if (!preset) {
      throw new Error(
        `onandemo: unknown preset \`${options.preset}\` — v1 bundles \`neko\``,
      );
    }
    sheet = preset.sheet;
    frameMap = preset.frameMap;
  }
  if (options.zIndex !== undefined && !Number.isFinite(options.zIndex)) {
    throw new Error("onandemo: zIndex must be a finite number");
  }
  // user knobs ride into the frame map so resolveFrameMap validates everything once
  const map = resolveFrameMap({
    ...frameMap,
    speed: options.speed ?? frameMap.speed,
    restRadius: options.restRadius ?? frameMap.restRadius,
    scale: options.scale ?? frameMap.scale,
  });
  return mount({
    sheet,
    map,
    zIndex: options.zIndex ?? 2147483647,
    persist: options.persist ?? true,
  });
}
