/**
 * the script-tag entry: the IIFE build auto-initialises from data-* attributes
 * on its own <script> tag (the six knobs of ADR-0009, kebab-cased).
 */
import { onandemo, type FrameMap, type OnandemoOptions } from "./index.ts";

const script = document.currentScript as HTMLScriptElement | null;

/** numeric knobs are validated at the boundary: a typo is one warning, never NaN. */
function knob(name: string, raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const n = Number(raw);
  if (Number.isFinite(n)) return n;
  console.warn(`onandemo: ignoring data-${name}="${raw}" — not a number`);
  return undefined;
}

async function init(): Promise<void> {
  const d = script?.dataset ?? {};
  const options: OnandemoOptions = {};
  const speed = knob("speed", d["speed"]);
  if (speed !== undefined) options.speed = speed;
  const restRadius = knob("rest-radius", d["restRadius"]);
  if (restRadius !== undefined) options.restRadius = restRadius;
  const scale = knob("scale", d["scale"]);
  if (scale !== undefined) options.scale = scale;
  const zIndex = knob("z-index", d["zIndex"]);
  if (zIndex !== undefined) options.zIndex = zIndex;
  if (d["persist"] !== undefined) options.persist = d["persist"] !== "false";

  if (d["frameMap"] !== undefined) {
    // bring-your-own: data-frame-map points at a bare frame map or at a
    // preset-shaped { sheet, frameMap } file (the playground exports those)
    const mapUrl = new URL(d["frameMap"], document.baseURI);
    const res = await fetch(mapUrl);
    if (!res.ok) {
      throw new Error(
        `onandemo: could not fetch frame map ${d["frameMap"]} (${res.status})`,
      );
    }
    const json = (await res.json()) as
      | FrameMap
      | { sheet?: string; frameMap: FrameMap };
    const wrapped = "frameMap" in json ? json : null;
    options.frameMap = wrapped ? wrapped.frameMap : (json as FrameMap);
    if (d["sheet"] !== undefined) {
      // an explicit sheet resolves against the page, like any asset it names
      options.sheet = new URL(d["sheet"], document.baseURI).href;
    } else if (wrapped?.sheet) {
      // a sheet named by the file resolves next to the file
      options.sheet = new URL(wrapped.sheet, mapUrl).href;
    } else {
      console.warn("onandemo: the frame map names no sheet — add data-sheet");
      return;
    }
  } else if (d["sheet"] !== undefined) {
    console.warn("onandemo: data-sheet needs a data-frame-map");
    return;
  } else if (d["preset"] !== undefined && d["preset"] !== "neko") {
    // package presets resolve relative to the script itself (ADR-0006): the
    // same unpkg/jsdelivr/self-hosted copy serves its own preset files
    const name = d["preset"];
    if (!/^[a-z0-9-]+$/.test(name)) {
      console.warn(
        `onandemo: ignoring data-preset="${name}" — not a preset name`,
      );
      return;
    }
    const jsonUrl = new URL(
      `../presets/${name}.json`,
      script?.src ?? document.baseURI,
    );
    const res = await fetch(jsonUrl);
    if (!res.ok) {
      throw new Error(
        `onandemo: no preset \`${name}\` at ${jsonUrl.href} (${res.status})`,
      );
    }
    const preset = (await res.json()) as { sheet: string; frameMap: FrameMap };
    options.sheet = new URL(preset.sheet, jsonUrl).href;
    options.frameMap = preset.frameMap;
  }
  // no attributes at all: the neko homage, zero config
  onandemo(options);
}

// every failure lands as the library's one clear warning, never an unhandled rejection
init().catch((e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.warn(msg.startsWith("onandemo") ? msg : `onandemo: ${msg}`);
});
