/**
 * the playground: slice a dropped image into a sheet of cells, deal cells to
 * states, and hand the finished frame map to the live companion.
 * pure helpers up top; initPlayground() wires the page.
 */

import type { Cell, FrameMap } from "onandemo";

/** the eight run directions, in chip order. */
const DIRECTIONS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

/** reserved state names — every other name is an antic. */
const RESERVED = new Set<string>(["idle", "alert", ...DIRECTIONS]);

const ANTIC_NAME = /^[a-z][a-z0-9-]*$/;
const ACCEPT = new Set(["image/png", "image/gif", "image/webp"]);
const MIN_CELL = 4;

interface Model {
  file: File | null;
  url: string | null;
  imgW: number;
  imgH: number;
  zoom: number;
  cellW: number;
  cellH: number;
  scale: number;
  active: string;
  states: Map<string, Cell[]>;
}

/** the divisor of n in [8, 128] nearest 32 — pixel-art cells live there. */
export function guessCell(n: number): number {
  let best = n;
  let bestDist = Infinity;
  for (let d = 8; d <= Math.min(n, 128); d++) {
    if (n % d !== 0) continue;
    const dist = Math.abs(d - 32);
    if (dist < bestDist) {
      best = d;
      bestDist = dist;
    }
  }
  return best;
}

/** what the two-state minimum (ADR-0007) still wants from these states. */
export function missingStates(states: ReadonlyMap<string, Cell[]>): string[] {
  const has = (name: string): boolean => (states.get(name)?.length ?? 0) > 0;
  const out: string[] = [];
  if (!has("idle")) out.push("idle");
  if (!DIRECTIONS.some(has)) out.push("a run direction");
  return out;
}

/** only non-empty states ride along; square cells collapse to one number. */
export function buildFrameMap(
  cellW: number,
  cellH: number,
  scale: number,
  states: ReadonlyMap<string, Cell[]>,
): FrameMap {
  const out: Record<string, Cell[]> = {};
  for (const [name, cells] of states) {
    if (cells.length > 0) out[name] = cells.map(([c, r]) => [c, r]);
  }
  return {
    cellSize: cellW === cellH ? cellW : [cellW, cellH],
    scale,
    states: out,
  };
}

/** the sidecar json — preset-shaped, meant to sit next to the image. */
export function formatExport(imageName: string, map: FrameMap): string {
  const rows = Object.entries(map.states).map(
    ([name, cells]) =>
      `      "${name}": [${cells.map(([c, r]) => `[${c},${r}]`).join(", ")}]`,
  );
  const states = rows.length > 0 ? `{\n${rows.join(",\n")}\n    }` : "{}";
  const cellSize = Array.isArray(map.cellSize)
    ? `[${map.cellSize[0]}, ${map.cellSize[1]}]`
    : String(map.cellSize);
  return [
    "{",
    `  "sheet": "./${imageName}",`,
    '  "frameMap": {',
    `    "cellSize": ${cellSize},`,
    `    "scale": ${map.scale ?? 1},`,
    `    "states": ${states}`,
    "  }",
    "}",
  ].join("\n");
}

function el<T extends HTMLElement>(id: string, ctor: new () => T): T {
  const node = document.getElementById(id);
  if (!(node instanceof ctor)) {
    throw new Error(`playground: missing #${id}`);
  }
  return node;
}

export function initPlayground(): void {
  // 1 · the sheet
  const drop = el("pg-drop", HTMLButtonElement);
  const dropHint = el("pg-drop-hint", HTMLSpanElement);
  const filePick = el("pg-file", HTMLInputElement);
  const viewer = el("pg-viewer", HTMLDivElement);
  const sheetName = el("pg-name", HTMLSpanElement);
  const sheetDims = el("pg-dims", HTMLSpanElement);
  const swap = el("pg-swap", HTMLButtonElement);
  const zoomGroup = el("pg-zoom", HTMLSpanElement);
  const frame = el("pg-frame", HTMLDivElement);
  const img = el("pg-img", HTMLImageElement);
  const overlay = el("pg-overlay", HTMLDivElement);
  const marks = el("pg-marks", HTMLDivElement);
  const cursor = el("pg-cursor", HTMLDivElement);
  const readout = el("pg-readout", HTMLSpanElement);
  // 2 · cell size
  const cellWInput = el("pg-cell-w", HTMLInputElement);
  const cellHInput = el("pg-cell-h", HTMLInputElement);
  const suggest = el("pg-suggest", HTMLDivElement);
  const auto = el("pg-auto", HTMLButtonElement);
  // 3 · states
  const chipBox = el("pg-states", HTMLDivElement);
  const anticName = el("pg-antic-name", HTMLInputElement);
  const anticAdd = el("pg-antic-add", HTMLButtonElement);
  const anticErr = el("pg-antic-err", HTMLParagraphElement);
  // 4-6 · scale, validity, chase
  const scaleGroup = el("pg-scale", HTMLDivElement);
  const validity = el("pg-valid", HTMLParagraphElement);
  const chase = el("pg-chase", HTMLButtonElement);
  // 7 · export
  const jsonCode = el("pg-json", HTMLElement);
  const exportName = el("pg-export-name", HTMLSpanElement);
  const copyBtn = el("pg-copy", HTMLButtonElement);
  const downloadBtn = el("pg-download", HTMLButtonElement);
  const serve = el("pg-serve", HTMLParagraphElement);

  const defaultHint = dropHint.textContent ?? "";

  const model: Model = {
    file: null,
    url: null,
    imgW: 0,
    imgH: 0,
    zoom: 2,
    cellW: 32,
    cellH: 32,
    scale: 1,
    active: "idle",
    states: new Map<string, Cell[]>([
      ["idle", []],
      ["alert", []],
      ...DIRECTIONS.map((d): [string, Cell[]] => [d, []]),
    ]),
  };

  const cols = (): number => Math.floor(model.imgW / model.cellW);
  const rows = (): number => Math.floor(model.imgH / model.cellH);
  const cw = (): number => model.cellW * model.zoom;
  const ch = (): number => model.cellH * model.zoom;
  const base = (): string =>
    model.file ? model.file.name.replace(/\.[^.]+$/, "") : "sheet";

  /** cells that fell off the grid after a resize don't linger in any state. */
  function prune(): void {
    const c = cols();
    const r = rows();
    for (const cells of model.states.values()) {
      for (let i = cells.length - 1; i >= 0; i--) {
        const cell = cells[i];
        if (cell && (cell[0] >= c || cell[1] >= r)) cells.splice(i, 1);
      }
    }
  }

  function pressGroup(group: HTMLElement, attr: string, value: number): void {
    const buttons = group.querySelectorAll<HTMLButtonElement>(`[data-${attr}]`);
    for (const b of buttons) {
      b.setAttribute("aria-pressed", String(Number(b.dataset[attr]) === value));
    }
  }

  function renderViewer(): void {
    const loaded = model.url !== null;
    drop.classList.toggle("hidden", loaded);
    viewer.classList.toggle("hidden", !loaded);
    auto.disabled = !loaded;
    if (!loaded) return;
    const w = model.imgW * model.zoom;
    const h = model.imgH * model.zoom;
    img.style.width = `${w}px`;
    img.style.height = `${h}px`;
    frame.style.width = `${w}px`;
    frame.style.height = `${h}px`;
    overlay.style.width = `${cols() * cw()}px`;
    overlay.style.height = `${rows() * ch()}px`;
    overlay.style.backgroundImage =
      "linear-gradient(to right, var(--color-line) 1px, transparent 1px), " +
      "linear-gradient(to bottom, var(--color-line) 1px, transparent 1px)";
    overlay.style.backgroundSize = `${cw()}px ${ch()}px`;
    sheetName.textContent = model.file?.name ?? "";
    sheetDims.textContent = `${model.imgW}×${model.imgH}px · ${cols()}×${rows()} cells`;
    pressGroup(zoomGroup, "zoom", model.zoom);
  }

  function renderCellInputs(): void {
    if (document.activeElement !== cellWInput) {
      cellWInput.value = String(model.cellW);
    }
    if (document.activeElement !== cellHInput) {
      cellHInput.value = String(model.cellH);
    }
  }

  function renderMarks(): void {
    marks.replaceChildren();
    if (model.url === null) return;
    const w = cw();
    const h = ch();
    const place = (m: HTMLElement, c: number, r: number): void => {
      m.style.left = `${c * w}px`;
      m.style.top = `${r * h}px`;
      m.style.width = `${w}px`;
      m.style.height = `${h}px`;
    };
    const active = model.states.get(model.active) ?? [];
    const activeKeys = new Set(active.map(([c, r]) => `${c},${r}`));
    // cells already dealt to other states: a faint claim
    const seen = new Set<string>();
    for (const [name, cells] of model.states) {
      if (name === model.active) continue;
      for (const [c, r] of cells) {
        const key = `${c},${r}`;
        if (seen.has(key) || activeKeys.has(key)) continue;
        seen.add(key);
        const m = document.createElement("div");
        m.className = "absolute";
        m.style.boxShadow = "inset 0 0 0 1px rgb(179 163 132 / 0.5)";
        m.style.background = "rgb(179 163 132 / 0.08)";
        place(m, c, r);
        marks.appendChild(m);
      }
    }
    // the active state's cells, numbered in deal order
    active.forEach(([c, r], i) => {
      const m = document.createElement("div");
      m.className = "absolute";
      m.style.boxShadow = "inset 0 0 0 2px var(--color-amber)";
      m.style.background = "rgb(255 179 71 / 0.16)";
      place(m, c, r);
      const badge = document.createElement("span");
      badge.className =
        "absolute top-0 left-0 bg-amber px-1 font-pixel text-[10px] leading-4 text-ink";
      badge.textContent = String(i + 1);
      m.appendChild(badge);
      marks.appendChild(m);
    });
  }

  function renderChips(): void {
    chipBox.replaceChildren();
    for (const [name, cells] of model.states) {
      const isActive = name === model.active;
      const isAntic = !RESERVED.has(name);
      const wrap = document.createElement("span");
      wrap.className = "inline-flex";
      const pick = document.createElement("button");
      pick.type = "button";
      pick.className = isActive
        ? "cursor-pointer border-2 border-amber bg-amber/10 px-2 py-1.5 font-pixel text-[11px] leading-none text-amber"
        : "cursor-pointer border-2 border-line bg-soot px-2 py-1.5 font-pixel text-[11px] leading-none text-faded hover:border-faded hover:text-cream";
      pick.setAttribute("aria-pressed", String(isActive));
      const label = document.createElement("span");
      label.textContent = name;
      const count = document.createElement("span");
      count.className =
        cells.length === 0
          ? "ml-1.5 opacity-50"
          : isActive
            ? "ml-1.5 text-cream"
            : "ml-1.5 text-amber";
      count.textContent = String(cells.length);
      pick.append(label, count);
      pick.addEventListener("click", () => {
        model.active = name;
        renderChips();
        renderMarks();
      });
      const clearBtn = document.createElement("button");
      clearBtn.type = "button";
      clearBtn.className =
        "cursor-pointer border-2 border-l-0 border-line bg-soot px-1.5 font-pixel text-[11px] leading-none text-faded hover:border-ember hover:text-ember";
      clearBtn.textContent = "×";
      const verb = isAntic ? "remove" : "clear";
      clearBtn.title = `${verb} ${name}`;
      clearBtn.setAttribute("aria-label", `${verb} ${name}`);
      clearBtn.addEventListener("click", () => {
        if (isAntic) {
          model.states.delete(name);
          if (model.active === name) model.active = "idle";
        } else {
          model.states.set(name, []);
        }
        renderAll();
      });
      wrap.append(pick, clearBtn);
      chipBox.appendChild(wrap);
    }
  }

  function renderValidity(): void {
    const miss = missingStates(model.states);
    const legal = miss.length === 0;
    if (model.url === null) {
      validity.className = "font-pixel text-xs text-faded";
      validity.textContent =
        "waiting on a sheet — idle plus one run direction makes a companion (ADR-0007).";
    } else if (!legal) {
      validity.className = "font-pixel text-xs text-ember";
      validity.textContent = `not legal yet — missing ${miss.join(" and ")} (ADR-0007).`;
    } else {
      validity.className = "font-pixel text-xs text-amber";
      validity.textContent =
        "legal — idle plus a run direction. missing directions resolve down the ladder.";
    }
    chase.disabled = !(legal && model.url !== null);
  }

  function renderExport(): void {
    const map = buildFrameMap(
      model.cellW,
      model.cellH,
      model.scale,
      model.states,
    );
    const json = formatExport(model.file?.name ?? "your-sheet.png", map);
    jsonCode.textContent = json;
    exportName.textContent = `${base()}.json`;
    const ready = model.file !== null;
    copyBtn.disabled = !ready;
    downloadBtn.disabled = !ready;
    if (ready) {
      copyBtn.dataset["copy"] = json;
    } else {
      delete copyBtn.dataset["copy"];
    }
    serve.textContent = model.file
      ? `serve ${base()}.json next to ${model.file.name} and point data-frame-map at it.`
      : "serve the json next to the image and point data-frame-map at it.";
  }

  function renderAll(): void {
    renderViewer();
    renderCellInputs();
    renderChips();
    renderMarks();
    pressGroup(scaleGroup, "scale", model.scale);
    renderValidity();
    renderExport();
  }

  // -- the sheet ------------------------------------------------------------

  function loadFile(f: File): void {
    if (!ACCEPT.has(f.type)) {
      dropHint.textContent = "png / gif / webp only — that wasn't one.";
      return;
    }
    const url = URL.createObjectURL(f);
    const probe = new Image();
    probe.onload = () => {
      const sameDims =
        model.url !== null &&
        model.imgW === probe.naturalWidth &&
        model.imgH === probe.naturalHeight;
      // old object urls stay alive on purpose: the companion may still wear one
      model.file = f;
      model.url = url;
      model.imgW = probe.naturalWidth;
      model.imgH = probe.naturalHeight;
      if (sameDims) {
        prune();
      } else {
        for (const key of model.states.keys()) model.states.set(key, []);
        model.active = "idle";
        model.cellW = guessCell(model.imgW);
        model.cellH = guessCell(model.imgH);
      }
      dropHint.textContent = defaultHint;
      img.src = url;
      renderAll();
    };
    probe.onerror = () => {
      URL.revokeObjectURL(url);
      dropHint.textContent = "couldn't decode that image.";
    };
    probe.src = url;
  }

  drop.addEventListener("click", () => filePick.click());
  swap.addEventListener("click", () => filePick.click());
  filePick.addEventListener("change", () => {
    const f = filePick.files?.[0];
    if (f) loadFile(f);
    filePick.value = "";
  });

  for (const target of [drop, viewer]) {
    target.addEventListener("dragover", (e) => {
      e.preventDefault();
      target.style.borderColor = "var(--color-amber)";
    });
    target.addEventListener("dragleave", () => {
      target.style.borderColor = "";
    });
    target.addEventListener("drop", (e) => {
      e.preventDefault();
      target.style.borderColor = "";
      const f = e.dataTransfer?.files[0];
      if (f) loadFile(f);
    });
  }

  zoomGroup.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-zoom]");
    if (!btn) return;
    const z = Number(btn.dataset["zoom"]);
    if (!Number.isFinite(z)) return;
    model.zoom = z;
    renderViewer();
    renderMarks();
  });

  // -- the grid -------------------------------------------------------------

  function cellAt(e: MouseEvent): Cell | null {
    if (cw() <= 0 || ch() <= 0) return null;
    const rect = overlay.getBoundingClientRect();
    const c = Math.floor((e.clientX - rect.left) / cw());
    const r = Math.floor((e.clientY - rect.top) / ch());
    if (c < 0 || r < 0 || c >= cols() || r >= rows()) return null;
    return [c, r];
  }

  overlay.addEventListener("click", (e) => {
    const cell = cellAt(e);
    if (!cell) return;
    const cells = model.states.get(model.active);
    if (!cells) return;
    const i = cells.findIndex(([c, r]) => c === cell[0] && r === cell[1]);
    if (i >= 0) cells.splice(i, 1);
    else cells.push(cell);
    renderMarks();
    renderChips();
    renderValidity();
    renderExport();
  });

  overlay.addEventListener("mousemove", (e) => {
    const cell = cellAt(e);
    if (!cell) {
      cursor.classList.add("hidden");
      readout.textContent = "hover a cell";
      return;
    }
    cursor.classList.remove("hidden");
    cursor.style.left = `${cell[0] * cw()}px`;
    cursor.style.top = `${cell[1] * ch()}px`;
    cursor.style.width = `${cw()}px`;
    cursor.style.height = `${ch()}px`;
    const labels: string[] = [];
    for (const [name, cells] of model.states) {
      const i = cells.findIndex(([c, r]) => c === cell[0] && r === cell[1]);
      if (i >= 0) labels.push(`${name} ${i + 1}/${cells.length}`);
    }
    readout.textContent = `[${cell[0]}, ${cell[1]}] — ${labels.length > 0 ? labels.join(" · ") : "unmapped"}`;
  });

  overlay.addEventListener("mouseleave", () => {
    cursor.classList.add("hidden");
    readout.textContent = "hover a cell";
  });

  // -- cell size ------------------------------------------------------------

  function commitCell(input: HTMLInputElement, axis: "w" | "h"): void {
    const v = Math.floor(Number(input.value));
    if (!Number.isFinite(v) || v < MIN_CELL) return;
    const limit = axis === "w" ? model.imgW : model.imgH;
    const next = limit > 0 ? Math.min(v, limit) : v;
    if (axis === "w") model.cellW = next;
    else model.cellH = next;
    prune();
    renderAll();
  }

  cellWInput.addEventListener("input", () => commitCell(cellWInput, "w"));
  cellHInput.addEventListener("input", () => commitCell(cellHInput, "h"));
  cellWInput.addEventListener("change", () => {
    cellWInput.value = String(model.cellW);
  });
  cellHInput.addEventListener("change", () => {
    cellHInput.value = String(model.cellH);
  });

  suggest.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-cell]");
    if (!btn) return;
    const n = Number(btn.dataset["cell"]);
    if (!Number.isFinite(n) || n < MIN_CELL) return;
    model.cellW = model.imgW > 0 ? Math.min(n, model.imgW) : n;
    model.cellH = model.imgH > 0 ? Math.min(n, model.imgH) : n;
    prune();
    renderAll();
  });

  auto.addEventListener("click", () => {
    if (model.imgW <= 0 || model.imgH <= 0) return;
    model.cellW = guessCell(model.imgW);
    model.cellH = guessCell(model.imgH);
    prune();
    renderAll();
  });

  // -- states ---------------------------------------------------------------

  function addAntic(): void {
    const raw = anticName.value.trim();
    if (raw.length === 0) return;
    if (!ANTIC_NAME.test(raw)) {
      anticErr.textContent =
        "lowercase letters, digits, dashes — starting with a letter.";
      return;
    }
    if (RESERVED.has(raw)) {
      anticErr.textContent = `\`${raw}\` is reserved — antics get their own names.`;
      return;
    }
    if (model.states.has(raw)) {
      anticErr.textContent = `\`${raw}\` is already in the map.`;
      return;
    }
    anticErr.textContent = "";
    model.states.set(raw, []);
    model.active = raw;
    anticName.value = "";
    renderChips();
    renderMarks();
    renderExport();
  }

  anticAdd.addEventListener("click", addAntic);
  anticName.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addAntic();
    }
  });
  anticName.addEventListener("input", () => {
    anticName.value = anticName.value.toLowerCase();
    anticErr.textContent = "";
  });

  // -- scale + chase ---------------------------------------------------------

  scaleGroup.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-scale]");
    if (!btn) return;
    const n = Number(btn.dataset["scale"]);
    if (!Number.isFinite(n)) return;
    model.scale = n;
    pressGroup(scaleGroup, "scale", model.scale);
    renderExport();
  });

  chase.addEventListener("click", () => {
    if (model.url === null) return;
    const map = buildFrameMap(
      model.cellW,
      model.cellH,
      model.scale,
      model.states,
    );
    window.companion.preview(model.url, map, model.scale);
    const was = chase.textContent;
    chase.textContent = "it's loose";
    setTimeout(() => {
      chase.textContent = was;
    }, 900);
  });

  // -- export ----------------------------------------------------------------

  downloadBtn.addEventListener("click", () => {
    if (model.file === null) return;
    const map = buildFrameMap(
      model.cellW,
      model.cellH,
      model.scale,
      model.states,
    );
    const json = formatExport(model.file.name, map);
    const blobUrl = URL.createObjectURL(
      new Blob([`${json}\n`], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${base()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  });

  renderAll();
}
