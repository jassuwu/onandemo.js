/** the eight run directions, named exactly as frame map state keys. */
export type Direction = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

export const DIRECTIONS: readonly Direction[] = [
  "N",
  "NE",
  "E",
  "SE",
  "S",
  "SW",
  "W",
  "NW",
];

/**
 * oneko's exact direction bands: the components of the normalized vector
 * thresholded at ±0.5 (~30° bands). dx/dy point from the cursor to the
 * companion (companion minus cursor), so the returned direction is the way
 * the companion must run. dist must be the euclidean length of (dx, dy), > 0.
 */
export function direction(dx: number, dy: number, dist: number): Direction {
  let d = "";
  if (dy / dist > 0.5) d += "N";
  else if (dy / dist < -0.5) d += "S";
  if (dx / dist > 0.5) d += "W";
  else if (dx / dist < -0.5) d += "E";
  // a unit vector always has a component beyond 0.5; "E" only guards dist=0 misuse
  return (d || "E") as Direction;
}
