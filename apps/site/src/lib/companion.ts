import { onandemo, type FrameMap, type OnandemoOptions } from "onandemo";

export type PresetName = "neko" | "soldier" | "slime";

declare global {
  interface Window {
    companion: {
      summon: (name: PresetName) => Promise<void>;
      preview: (sheet: string, frameMap: FrameMap, scale?: number) => void;
      who: () => string;
    };
  }
}

let destroy: (() => void) | null = null;
let current = "neko";

function mount(options?: OnandemoOptions): void {
  destroy?.();
  destroy = onandemo(options);
  document.dispatchEvent(new CustomEvent("companion", { detail: current }));
}

/** swap the live companion to a bundled preset. */
export async function summon(name: PresetName): Promise<void> {
  current = name;
  if (name === "neko") {
    mount();
    return;
  }
  const jsonUrl = new URL(`/presets/${name}.json`, location.href);
  const res = await fetch(jsonUrl);
  if (!res.ok) {
    console.warn(`onandemo site: no preset ${name}`);
    return;
  }
  const preset = (await res.json()) as { sheet: string; frameMap: FrameMap };
  mount({
    sheet: new URL(preset.sheet, jsonUrl).href,
    frameMap: preset.frameMap,
  });
}

/** the playground's hook: chase with whatever the visitor just made. */
export function preview(
  sheet: string,
  frameMap: FrameMap,
  scale?: number,
): void {
  current = "custom";
  mount(scale === undefined ? { sheet, frameMap } : { sheet, frameMap, scale });
}

export function who(): string {
  return current;
}
