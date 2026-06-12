/** onandemo's dusk system — mirror of apps/site/src/styles/global.css @theme. */
export const C = {
  ink: "#181208",
  cream: "#f4e9d3",
  amber: "#ffb347",
  faded: "#b3a384",
} as const;

// 16×16 logical pixels, drawn as rects so it stays pixel art at every size.
// the mark is the product in one glyph: a cursor, and something small and
// amber gaining on it.
const GRID = 16;
const VIEW = 64;

type Px = [x: number, y: number, color: string];

const cursor: [number, number][] = [
  [3, 1],
  [3, 2],
  [4, 2],
  [3, 3],
  [4, 3],
  [5, 3],
  [3, 4],
  [4, 4],
  [5, 4],
  [6, 4],
  [3, 5],
  [4, 5],
  [5, 5],
  [6, 5],
  [7, 5],
  [3, 6],
  [4, 6],
  [5, 6],
  [6, 6],
  [7, 6],
  [8, 6],
  [3, 7],
  [4, 7],
  [5, 7],
  [5, 8],
  [6, 8],
  [6, 9],
];

const chaser: [number, number][] = [
  [10, 9], // ears — the silhouette is what reads at 16px
  [13, 9],
  [10, 10],
  [11, 10],
  [12, 10],
  [13, 10],
  [10, 11],
  [12, 11],
  [13, 11],
  [10, 12],
  [11, 12],
  [12, 12],
  [13, 12],
  [10, 13], // feet, mid-stride
  [12, 13],
];

const PIXELS: Px[] = [
  ...cursor.map(([x, y]): Px => [x, y, C.cream]),
  ...chaser.map(([x, y]): Px => [x, y, C.amber]),
  [11, 11, C.ink], // the eye, looking at the cursor
  [14, 14, C.faded], // one px of dust behind it
];

const r = (n: number) => Number(n.toFixed(2));

/** the mark, scaled into the 64-view with a uniform inset on every side. */
function mark(inset: number): string {
  const unit = (VIEW - inset * 2) / GRID;
  return PIXELS.map(
    ([x, y, color]) =>
      `<rect x="${r(inset + x * unit)}" y="${r(inset + y * unit)}" width="${r(unit)}" height="${r(unit)}" fill="${color}"/>`,
  ).join("");
}

function svg(body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW} ${VIEW}" width="${VIEW}" height="${VIEW}" shape-rendering="crispEdges">${body}</svg>`;
}

/** rounded dark tile — the browser-tab favicon. */
export function faviconSvg(): string {
  return svg(
    `<rect width="${VIEW}" height="${VIEW}" rx="12" fill="${C.ink}"/>${mark(2)}`,
  );
}

/** full-bleed square — apple-touch + standard PWA icons (the OS rounds it). */
export function solidSvg(): string {
  return svg(
    `<rect width="${VIEW}" height="${VIEW}" fill="${C.ink}"/>${mark(6)}`,
  );
}

/** full-bleed with a generous safe zone for android maskable icons. */
export function maskableSvg(): string {
  return svg(
    `<rect width="${VIEW}" height="${VIEW}" fill="${C.ink}"/>${mark(12)}`,
  );
}
