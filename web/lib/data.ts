// Turns what the Python backend returns into point sets the 3D stage can draw.
// Nothing here re-computes the Chaos Game: the points always come from lab10.py.
// The only derived values are which corner (or which fern map) produced each
// point, read back from consecutive points so the slides can colour the copies.

import type { TaskRun } from "./api";

export type V2 = [number, number];

export type PointSet = {
  /** x, y pairs in scene units */
  xy: Float32Array;
  n: number;
  /** colour of the cell's own plot, mapped to the presentation palette */
  color: string;
  /** index of the copy (corner or fern map) each point belongs to, -1 if unknown */
  copy: Int16Array;
  copies: number;
  vertices: V2[];
  start: V2 | null;
  title: string;
  /** scale + offset used to fit the set on screen (1 and 0 for unit shapes) */
  fit: { scale: number; dx: number; dy: number };
};

// Matplotlib colours in lab10.py → presentation palette
const PALETTE: Record<string, string> = {
  "#0000ff": "#5cc8ff", // 'b'
  "#ff0000": "#ff6b6b", // 'r'
  "#000000": "#ffffff", // 'k'
};
export const themeColor = (hex: string) => PALETTE[hex.toLowerCase()] ?? hex;

/** Colours for the shrunk copies (one per corner / fern map). */
export const COPY_COLORS = ["#5cc8ff", "#ff6b6b", "#fbbf24", "#34d399", "#a78bfa", "#f472b6"];

type M2 = [[number, number], [number, number]];

function asMatrix(value: unknown): M2 | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const [a, b] = value as number[][];
  if (!Array.isArray(a) || !Array.isArray(b)) return null;
  return [[a[0], a[1]], [b[0], b[1]]];
}

function asVector(value: unknown): V2 | null {
  if (!Array.isArray(value)) return null;
  const flat = (value as unknown[]).flat(2) as number[];
  return flat.length >= 2 ? [flat[0], flat[1]] : null;
}

/** Corner v that sends x to y under y = T(x − v) + v, i.e. v = (I − T)⁻¹(y − T x). */
function cornerFor(T: M2, x: V2, y: V2): V2 | null {
  const rx = y[0] - (T[0][0] * x[0] + T[0][1] * x[1]);
  const ry = y[1] - (T[1][0] * x[0] + T[1][1] * x[1]);
  const a = 1 - T[0][0], b = -T[0][1], c = -T[1][0], d = 1 - T[1][1];
  const det = a * d - b * c;
  if (Math.abs(det) < 1e-9) return null;
  return [(d * rx - b * ry) / det, (-c * rx + a * ry) / det];
}

function clusterCorners(estimates: (V2 | null)[], minShare = 0.03): V2[] {
  const counts = new Map<string, { sum: V2; count: number }>();
  for (const v of estimates) {
    if (!v) continue;
    const key = `${Math.round(v[0] * 50)},${Math.round(v[1] * 50)}`;
    const entry = counts.get(key) ?? { sum: [0, 0] as V2, count: 0 };
    entry.sum[0] += v[0];
    entry.sum[1] += v[1];
    entry.count += 1;
    counts.set(key, entry);
  }
  const total = estimates.length;
  return [...counts.values()]
    .filter((e) => e.count >= total * minShare)
    .map((e) => [e.sum[0] / e.count, e.sum[1] / e.count] as V2)
    .sort((p, q) => Math.atan2(p[1], p[0]) - Math.atan2(q[1], q[0]));
}

export function pointSetFromRun(run: TaskRun): PointSet | null {
  const plot = run.plot;
  if (!plot) return null;
  const main = plot.lines.reduce((a, b) => (b.x.length > a.x.length ? b : a));
  const starLine = plot.lines.find((l) => l.marker === "*");
  const startLine = plot.lines.find((l) => l.label === "Starting Point");
  const n = main.x.length;

  const raw: V2[] = main.x.map((x, i) => [x, main.y[i]]);
  let vertices: V2[] = starLine ? starLine.x.map((x, i) => [x, starLine.y[i]] as V2) : [];
  const start: V2 | null = startLine ? [startLine.x[0], startLine.y[0]] : raw[0] ?? null;

  // Which copy (corner / fern map) produced each point
  const copy = new Int16Array(n).fill(-1);
  let copies = 0;
  const vars = run.variables;
  if (run.id === 11) {
    const maps = [1, 2, 3, 4].map((k) => ({ T: asMatrix(vars[`T${k}`]), Q: asVector(vars[`Q${k}`]) }));
    if (maps.every((m) => m.T && m.Q)) {
      copies = 4;
      for (let j = 1; j < n; j++) {
        const [x0, y0] = raw[j - 1];
        let best = 0, bestErr = Infinity;
        maps.forEach((m, k) => {
          const T = m.T!, Q = m.Q!;
          const ex = T[0][0] * x0 + T[0][1] * y0 + Q[0] - raw[j][0];
          const ey = T[1][0] * x0 + T[1][1] * y0 + Q[1] - raw[j][1];
          const err = ex * ex + ey * ey;
          if (err < bestErr) { bestErr = err; best = k; }
        });
        copy[j] = best;
      }
      copy[0] = copy[1];
    }
  } else {
    const T = asMatrix(vars.T);
    if (T) {
      const estimates = raw.map((p, j) => (j === 0 ? null : cornerFor(T, raw[j - 1], p)));
      if (!vertices.length) vertices = clusterCorners(estimates);
      copies = vertices.length;
      let last = -1;
      for (let j = 1; j < n; j++) {
        const v = estimates[j];
        let best = -1, bestDist = 0.05 * 0.05;
        if (v) {
          vertices.forEach((c, k) => {
            const d = (c[0] - v[0]) ** 2 + (c[1] - v[1]) ** 2;
            if (d < bestDist) { bestDist = d; best = k; }
          });
        }
        copy[j] = best >= 0 ? best : last;
        if (best >= 0) last = best;
      }
      copy[0] = copy[1];
    }
  }

  // Fit tall shapes (the fern) into the same space as the unit polygons
  let fit = { scale: 1, dx: 0, dy: 0 };
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of raw) {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  if (maxY - minY > 3 || maxX - minX > 3) {
    const scale = 2.5 / Math.max(maxX - minX, maxY - minY);
    fit = { scale, dx: -((minX + maxX) / 2) * scale, dy: -((minY + maxY) / 2) * scale };
  }
  const place = ([x, y]: V2): V2 => [x * fit.scale + fit.dx, y * fit.scale + fit.dy];

  const xy = new Float32Array(n * 2);
  raw.forEach((p, i) => {
    const [x, y] = place(p);
    xy[i * 2] = x;
    xy[i * 2 + 1] = y;
  });

  return {
    xy,
    n,
    color: themeColor(main.color),
    copy,
    copies,
    vertices: vertices.map(place),
    start: start ? place(start) : null,
    title: plot.title,
    fit,
  };
}

/** The first `count` points of a set (for slow, step-by-step jumps). */
export function firstPoints(set: PointSet, count: number): Float32Array {
  return set.xy.slice(0, Math.min(count, set.n) * 2);
}

/** Corner each of the first `count` jumps went toward. */
export function jumpCorners(set: PointSet, count: number): V2[] {
  const out: V2[] = [];
  for (let j = 1; j < Math.min(count, set.n); j++) {
    const k = set.copy[j];
    if (k >= 0 && set.vertices[k]) out.push(set.vertices[k]);
  }
  return out;
}

/** Random dots in a box — the "random dots" of the opening question (visual only). */
export function randomCloud(n: number, w = 2.4, h = 1.6, seed = 7): Float32Array {
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const out = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    out[i * 2] = (rand() - 0.5) * 2 * w;
    out[i * 2 + 1] = (rand() - 0.5) * 2 * h;
  }
  return out;
}

/** Sample points from text drawn on a canvas, so dots can spell a title. */
export function textPoints(lines: string[], n: number, width = 3.2): Float32Array {
  const canvas = document.createElement("canvas");
  const W = 1400, lineH = 220;
  canvas.width = W;
  canvas.height = lineH * lines.length + 40;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "800 190px 'Space Grotesk', 'Segoe UI', sans-serif";
  lines.forEach((line, i) => ctx.fillText(line, W / 2, lineH * i + lineH / 2 + 20));
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const filled: V2[] = [];
  for (let y = 0; y < canvas.height; y += 3) {
    for (let x = 0; x < W; x += 3) {
      if (data[(y * W + x) * 4 + 3] > 128) filled.push([x, y]);
    }
  }
  const scale = width / W;
  const out = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const [x, y] = filled[Math.floor((i / n) * filled.length)] ?? [W / 2, canvas.height / 2];
    out[i * 2] = (x - W / 2) * scale + (Math.random() - 0.5) * 0.004;
    out[i * 2 + 1] = -(y - canvas.height / 2) * scale + (Math.random() - 0.5) * 0.004;
  }
  return out;
}
