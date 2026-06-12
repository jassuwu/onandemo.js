import type { FrameMap } from "onandemo";

/** a whole creature, URL-shaped (ADR-0011). the fragment never reaches a server. */
export interface MintPayload {
  v: 1;
  /** the sheet as a data url */
  sheet: string;
  frameMap: FrameMap;
}

function toB64(bytes: Uint8Array): string {
  let bin = "";
  const CHUNK = 0x8000; // String.fromCharCode arg limits
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

export function mint(payload: MintPayload): string {
  return toB64(new TextEncoder().encode(JSON.stringify(payload)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

export function unmint(fragment: string): MintPayload | null {
  try {
    const b64 = fragment.replaceAll("-", "+").replaceAll("_", "/");
    const json = new TextDecoder().decode(
      Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)),
    );
    const p = JSON.parse(json) as MintPayload;
    if (p && p.v === 1 && typeof p.sheet === "string" && p.frameMap) return p;
    return null;
  } catch {
    return null;
  }
}
