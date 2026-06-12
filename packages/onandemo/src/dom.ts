import { createState, tick, TICK_MS } from "./engine.ts";
import type { ResolvedFrameMap } from "./frame-map.ts";

export interface MountOptions {
  sheet: string;
  map: ResolvedFrameMap;
  zIndex: number;
  persist: boolean;
}

const STORAGE_KEY = "onandemo";

function restore(persist: boolean): [number, number] {
  if (persist) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { x?: number; y?: number };
        if (typeof saved.x === "number" && typeof saved.y === "number") {
          return [saved.x, saved.y];
        }
      }
    } catch {
      // storage can be denied (sandboxed iframes); the companion just starts fresh
    }
  }
  return [32, 32]; // oneko's birthplace
}

/** the one impure file: everything that touches the document lives here. */
export function mount(o: MountOptions): () => void {
  if (typeof window === "undefined") return () => {};
  // manners (ADR-0009): reduced motion means no element, no listeners, nothing
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  const { map } = o;
  const w = map.cellW * map.scale;
  const h = map.cellH * map.scale;
  const state = createState(...restore(o.persist));
  let mouseX = state.x;
  let mouseY = state.y; // until the mouse speaks, the companion rests

  const el = document.createElement("div");
  el.id = "onandemo";
  el.setAttribute("aria-hidden", "true");
  const idleCell = map.idle[0]!;
  Object.assign(el.style, {
    width: `${w}px`,
    height: `${h}px`,
    position: "fixed",
    // painted in place from the very first frame — no corner flash
    left: `${state.x - w / 2}px`,
    top: `${state.y - h / 2}px`,
    backgroundPosition: `${-idleCell[0] * map.cellW * map.scale}px ${-idleCell[1] * map.cellH * map.scale}px`,
    pointerEvents: "none",
    imageRendering: "pixelated",
    zIndex: String(o.zIndex),
    backgroundImage: `url(${o.sheet})`,
  });

  const onMove = (e: MouseEvent) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  };
  // pagehide over beforeunload: keeps pages bfcache-eligible and fires on mobile
  const onPageHide = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ x: state.x, y: state.y }),
      );
    } catch {
      // nothing to do; the companion forgets
    }
  };

  let raf = 0;
  let last = 0;
  let destroyed = false;

  // teardown is total: DOM removal (the self-cleanup manner) and destroy()
  // both release every listener, never just the loop
  const teardown = () => {
    destroyed = true;
    cancelAnimationFrame(raf);
    document.removeEventListener("mousemove", onMove);
    window.removeEventListener("pagehide", onPageHide);
    el.remove();
  };

  const loop = (ts: number) => {
    if (!el.isConnected) {
      teardown();
      return;
    }
    if (ts - last > TICK_MS) {
      last = ts;
      const r = tick(
        state,
        {
          mouseX,
          mouseY,
          minX: w / 2,
          minY: h / 2,
          maxX: window.innerWidth - w / 2,
          maxY: window.innerHeight - h / 2,
        },
        map,
      );
      el.style.left = `${r.x - w / 2}px`;
      el.style.top = `${r.y - h / 2}px`;
      el.style.backgroundPosition = `${-r.cell[0] * map.cellW * map.scale}px ${-r.cell[1] * map.cellH * map.scale}px`;
      el.style.transform = r.flip ? "scaleX(-1)" : "";
    }
    raf = requestAnimationFrame(loop);
  };

  // the sheet must load before anything shows — or attaches: a bad URL costs
  // one clear warning, never a leaked listener or an invisible div
  const img = new Image();
  img.onload = () => {
    if (destroyed) return;
    el.style.backgroundSize = `${img.naturalWidth * map.scale}px ${img.naturalHeight * map.scale}px`;
    document.addEventListener("mousemove", onMove);
    if (o.persist) window.addEventListener("pagehide", onPageHide);
    // body can be null when a head-placed script loads a cached sheet
    (document.body ?? document.documentElement).appendChild(el);
    raf = requestAnimationFrame(loop);
  };
  img.onerror = () => {
    console.warn(`onandemo: could not load sheet ${o.sheet}`);
  };
  img.src = o.sheet;

  return teardown;
}
