/** onandemo — oneko.js, but anything chases your cursor. */

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

/** the six knobs: `preset` or `sheet` + `frameMap`, then tuning. */
export interface OnandemoOptions {
  /** bundled companion by name. default "neko". */
  preset?: string;
  /** sprite-sheet image URL; pair with `frameMap`. no default. */
  sheet?: string;
  /** frame map for `sheet`. no default. */
  frameMap?: FrameMap;
  /** chase speed in px per tick; overrides the frame map. default 10. */
  speed?: number;
  /** rest distance in px; overrides the frame map. default 48. */
  restRadius?: number;
  /** display multiplier; overrides the frame map. default the preset's, else 1. */
  scale?: number;
  /** stacking order of the companion element. default 2147483647. */
  zIndex?: number;
  /** remember position in localStorage["onandemo"]. default true. */
  persist?: boolean;
}

/**
 * mounts a companion that chases the cursor; returns its destroy function.
 *
 * 0.0.1 is a name-stub: types are final, the engine is not — calling it does nothing.
 */
export function onandemo(options?: OnandemoOptions): () => void {
  void options;
  return () => {};
}
