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

  if (d["sheet"] !== undefined || d["frameMap"] !== undefined) {
    if (d["sheet"] === undefined || d["frameMap"] === undefined) {
      console.warn("onandemo: data-sheet and data-frame-map come together");
      return;
    }
    // bring-your-own paths resolve against the page, like any asset it names
    options.sheet = new URL(d["sheet"], document.baseURI).href;
    const res = await fetch(new URL(d["frameMap"], document.baseURI));
    if (!res.ok) {
      throw new Error(
        `onandemo: could not fetch frame map ${d["frameMap"]} (${res.status})`,
      );
    }
    options.frameMap = (await res.json()) as FrameMap;
  } else if (d["preset"] !== undefined) {
    options.preset = d["preset"];
  }
  // no attributes at all: the neko homage, zero config
  onandemo(options);
}

// every failure lands as the library's one clear warning, never an unhandled rejection
init().catch((e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.warn(msg.startsWith("onandemo") ? msg : `onandemo: ${msg}`);
});
