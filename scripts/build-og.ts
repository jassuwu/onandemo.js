/**
 * the OG card is a screenshot of the desktop (ADR-0010): 50% dither, one
 * window, the mark loose in the corner. pure SVG -> resvg; byte-stable —
 * no dates, no randomness, fonts pinned in scripts/fonts/.
 */
import { Resvg } from "@resvg/resvg-js";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { C, markAt } from "./art";

const W = 1200;
const H = 630;

// the one window on the desktop
const win = { x: 150, y: 88, w: 900, h: 424 };
const TITLE_H = 48;
const PAD = 56;
const bodyX = win.x + PAD;
const bodyY = win.y + TITLE_H;

// system 7 grammar, drawn by hand: ink frame, 4px offset shadow,
// pinstriped title bar with a close box left and a centered paper chip.
function windowChrome(): string {
  const chipW = 188;
  const chipH = 28;
  const chipX = win.x + (win.w - chipW) / 2;
  const chipY = win.y + (TITLE_H - chipH) / 2;
  const boxS = 22;
  const boxX = win.x + 14;
  const boxY = win.y + (TITLE_H - boxS) / 2;
  return [
    // shadow, then frame, then interior
    `<rect x="${win.x + 4}" y="${win.y + 4}" width="${win.w}" height="${win.h}" fill="${C.ink}"/>`,
    `<rect x="${win.x}" y="${win.y}" width="${win.w}" height="${win.h}" fill="${C.ink}"/>`,
    `<rect x="${win.x + 2}" y="${win.y + 2}" width="${win.w - 4}" height="${win.h - 4}" fill="${C.paper}"/>`,
    // pinstriped title bar + its 2px rule
    `<rect x="${win.x + 2}" y="${win.y + 2}" width="${win.w - 4}" height="${TITLE_H - 2}" fill="url(#pinstripe)"/>`,
    `<rect x="${win.x + 2}" y="${win.y + TITLE_H}" width="${win.w - 4}" height="2" fill="${C.ink}"/>`,
    // close box, left
    `<rect x="${boxX}" y="${boxY}" width="${boxS}" height="${boxS}" fill="${C.ink}"/>`,
    `<rect x="${boxX + 3}" y="${boxY + 3}" width="${boxS - 6}" height="${boxS - 6}" fill="${C.paper}"/>`,
    // title chip
    `<rect x="${chipX}" y="${chipY}" width="${chipW}" height="${chipH}" fill="${C.paper}"/>`,
    `<text x="${W / 2}" y="${chipY + chipH / 2 + 8}" text-anchor="middle" font-family="DotGothic16" font-size="22" fill="${C.ink}">onandemo.js</text>`,
  ].join("");
}

// the summon row: amber belongs to creature affordances, even in a screenshot.
function summonButtons(): string {
  const y = bodyY + 258;
  const h = 52;
  const gap = 16;
  const widths: [string, number][] = [
    ["neko", 116],
    ["soldier", 168],
    ["slime", 134],
  ];
  let x = bodyX;
  const out: string[] = [];
  for (const [name, w] of widths) {
    out.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.ink}"/>`,
      `<rect x="${x + 3}" y="${y + 3}" width="${w - 6}" height="${h - 6}" fill="${C.amber}"/>`,
      `<text x="${x + w / 2}" y="${y + h / 2 + 9}" text-anchor="middle" font-family="DotGothic16" font-size="26" fill="${C.ink}">${name}</text>`,
    );
    x += w + gap;
  }
  return out.join("");
}

function ogSvg(): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" shape-rendering="crispEdges">`,
    `<defs>`,
    // the classic 50% checker, 4px cells — mirrors .desktop in global.css
    `<pattern id="dither" width="4" height="4" patternUnits="userSpaceOnUse">`,
    `<rect width="4" height="4" fill="${C.paper}"/>`,
    `<rect x="2" width="2" height="2" fill="${C.ink}"/>`,
    `<rect y="2" width="2" height="2" fill="${C.ink}"/>`,
    `</pattern>`,
    // 1px ink lines every 4px — mirrors .window-title
    `<pattern id="pinstripe" width="4" height="4" patternUnits="userSpaceOnUse">`,
    `<rect width="4" height="4" fill="${C.paper}"/>`,
    `<rect width="4" height="1" fill="${C.ink}"/>`,
    `</pattern>`,
    `</defs>`,
    `<rect width="${W}" height="${H}" fill="url(#dither)"/>`,
    windowChrome(),
    // wordmark + tagline, on paper
    `<text x="${bodyX}" y="${bodyY + 136}" font-family="DotGothic16" font-size="96" fill="${C.ink}">onandemo.js</text>`,
    `<text x="${bodyX}" y="${bodyY + 200}" font-family="DotGothic16" font-size="32" fill="${C.ink}">oneko.js, but anything chases your cursor.</text>`,
    summonButtons(),
    // the mark, on the page itself — cursor and chaser on clean paper
    markAt(884, 368, 8),
    `</svg>`,
  ].join("");
}

const fontFile = fileURLToPath(
  new URL("./fonts/DotGothic16-Regular.ttf", import.meta.url),
);
const out = fileURLToPath(
  new URL("../apps/site/public/og.png", import.meta.url),
);

const resvg = new Resvg(ogSvg(), {
  font: {
    fontFiles: [fontFile],
    loadSystemFonts: false,
    defaultFontFamily: "DotGothic16",
  },
});
await writeFile(out, Buffer.from(resvg.render().asPng()));

console.log("✓ og.png (1200×630)");
