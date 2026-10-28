// Procedural scenes for the real-world applications slide: the same kind of
// repeated random rules as the Chaos Game, used the way games and films use
// them. A forest of fractal trees (every branch splits into smaller, turned copies
// of itself) and a fractal mountain range (repeated midpoint displacement). Visual only: lab10.py is not involved.

export type Scene3D = { xy: Float32Array; z: Float32Array; colors: Float32Array; n: number };

/** Small seeded random generator so the scenes look the same every time. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hex = (h: string): [number, number, number] => {
  const v = parseInt(h.slice(1), 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
};

const mix = (a: number[], b: number[], t: number) => a.map((x, i) => x + (b[i] - x) * t);

// ---------- forest ----------

let forestCache: Scene3D | null = null;

type Branch = { x: number; y: number; z: number; dx: number; dy: number; dz: number; len: number; level: number };

/**
 * One fractal tree from one repeated rule: every branch ends by splitting into
 * smaller copies of itself, each scaled by about 0.72 and turned (a rotation
 * matrix) by about ±25°. Dots are scattered along the branches, and the last
 * level gets leaves.
 */
function tree(x0: number, z0: number, height: number, levels: number, rand: () => number) {
  const wood: [number, number, number][] = [];
  const leaves: [number, number, number][] = [];
  const stack: Branch[] = [{ x: x0, y: 0, z: z0, dx: 0, dy: 1, dz: 0, len: height * 0.36, level: 0 }];
  while (stack.length) {
    const b = stack.pop()!;
    const ex = b.x + b.dx * b.len, ey = b.y + b.dy * b.len, ez = b.z + b.dz * b.len;
    const dots = Math.max(2, Math.round(b.len * (b.level < 3 ? 900 : 380) * (1 - b.level / (levels + 2))));
    for (let k = 0; k < dots; k++) {
      const t = rand();
      wood.push([b.x + (ex - b.x) * t, b.y + (ey - b.y) * t, b.z + (ez - b.z) * t]);
    }
    if (b.level === levels) {
      for (let k = 0; k < 7; k++) leaves.push([ex + (rand() - 0.5) * 0.06, ey + (rand() - 0.5) * 0.05, ez + (rand() - 0.5) * 0.06]);
      continue;
    }
    const kids = rand() < 0.3 ? 3 : 2;
    for (let c = 0; c < kids; c++) {
      const turn = (kids === 2 ? (c === 0 ? -1 : 1) : c - 1) * (0.26 + rand() * 0.16) + (rand() - 0.5) * 0.12;
      const cos = Math.cos(turn), sin = Math.sin(turn);
      // rotate the direction (a 2×2 rotation matrix), lean a little in depth, then normalise
      let dx = cos * b.dx - sin * b.dy, dy = sin * b.dx + cos * b.dy + 0.35; // + a pull upward, toward the light
      let dz = b.dz + (rand() - 0.5) * 0.5;
      const m = Math.hypot(dx, dy, dz);
      dx /= m; dy /= m; dz /= m;
      stack.push({ x: ex, y: ey, z: ez, dx, dy: Math.max(dy, 0.25), dz, len: b.len * (0.7 + rand() * 0.08), level: b.level + 1 });
    }
  }
  return { wood, leaves };
}

export function forest(total = 15500): Scene3D {
  if (forestCache) return forestCache;
  const rand = rng(11);
  const ground = -0.95;
  const trees = [
    { x: 0.05, z: 0.1, h: 1.6, hue: 0 },
    { x: -0.6, z: -0.35, h: 1.15, hue: 1 },
    { x: 0.7, z: -0.3, h: 1.25, hue: 2 },
    { x: -0.9, z: 0.35, h: 0.8, hue: 2 },
    { x: 1.05, z: 0.3, h: 0.85, hue: 1 },
    { x: 0.35, z: -0.8, h: 0.8, hue: 0 },
    { x: -0.3, z: -0.85, h: 0.75, hue: 1 },
  ];
  const greens = [["#22c55e", "#bef264"], ["#10b981", "#86efac"], ["#65a30d", "#d9f99d"]].map((g) => g.map(hex));
  const bark = [hex("#b07a44"), hex("#e0b07a")];
  const xy = new Float32Array(total * 2), z = new Float32Array(total), colors = new Float32Array(total * 3);
  let i = 0;
  const put = (x: number, y: number, d: number, c: number[]) => {
    if (i >= total) return;
    xy[i * 2] = x; xy[i * 2 + 1] = y; z[i] = d; colors.set(c, i * 3); i++;
  };

  for (let k = 0; k < 1500; k++) {
    put((rand() - 0.5) * 2.6, ground + rand() * 0.015, (rand() - 0.5) * 2.0, mix(hex("#14532d"), hex("#3f8f4f"), rand()));
  }
  const grown = trees.map((t) => ({ t, ...tree(t.x, t.z, t.h, 7, rand) }));
  const want = grown.reduce((s, g) => s + g.wood.length + g.leaves.length, 0);
  const keep = Math.min(1, (total - i) / want);
  for (const g of grown) {
    for (const [x, y, d] of g.wood) if (rand() < keep) put(x, ground + y, d, mix(bark[0], bark[1], rand()));
    for (const [x, y, d] of g.leaves) {
      if (rand() < keep) put(x, ground + y, d, mix(greens[g.t.hue][0], greens[g.t.hue][1], rand()));
    }
  }
  forestCache = { xy, z, colors, n: i };
  return forestCache;
}

// ---------- terrain ----------

let terrainCache: Scene3D | null = null;

/** Fractal height map: repeat "split every square and nudge the midpoints by a random amount that halves each level". */
function diamondSquare(size: number, rough: number, rand: () => number) {
  const n = size + 1;
  const h = new Float32Array(n * n);
  const at = (x: number, y: number) => h[y * n + x];
  const set = (x: number, y: number, v: number) => { h[y * n + x] = v; };
  let amp = 1;
  for (let step = size; step > 1; step >>= 1, amp *= rough) {
    const half = step >> 1;
    for (let y = half; y < n; y += step)
      for (let x = half; x < n; x += step)
        set(x, y, (at(x - half, y - half) + at(x + half, y - half) + at(x - half, y + half) + at(x + half, y + half)) / 4 + (rand() - 0.5) * amp);
    for (let y = 0; y < n; y += half)
      for (let x = (y / half) % 2 === 0 ? half : 0; x < n; x += step) {
        let sum = 0, c = 0;
        for (const [dx, dy] of [[-half, 0], [half, 0], [0, -half], [0, half]]) {
          const xx = x + dx, yy = y + dy;
          if (xx >= 0 && xx < n && yy >= 0 && yy < n) { sum += at(xx, yy); c++; }
        }
        set(x, y, sum / c + (rand() - 0.5) * amp);
      }
  }
  let lo = Infinity, hi = -Infinity;
  for (const v of h) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  for (let k = 0; k < h.length; k++) h[k] = (h[k] - lo) / (hi - lo);
  return { h, n };
}

export function terrain(total = 15500): Scene3D {
  if (terrainCache) return terrainCache;
  const rand = rng(5);
  const { h, n } = diamondSquare(128, 0.55, rand);
  const sample = (u: number, v: number) => {
    const x = u * (n - 1), y = v * (n - 1);
    const x0 = Math.min(n - 2, Math.floor(x)), y0 = Math.min(n - 2, Math.floor(y));
    const fx = x - x0, fy = y - y0;
    const g = (a: number, b: number) => h[b * n + a];
    return (g(x0, y0) * (1 - fx) + g(x0 + 1, y0) * fx) * (1 - fy) + (g(x0, y0 + 1) * (1 - fx) + g(x0 + 1, y0 + 1) * fx) * fy;
  };
  const sea = 0.3;
  const stops: [number, string][] = [[0.3, "#4ade80"], [0.46, "#22c55e"], [0.6, "#c08a4a"], [0.74, "#cbd5e1"], [0.84, "#ffffff"]];
  const shade = (t: number) => {
    for (let k = 0; k < stops.length - 1; k++) {
      if (t <= stops[k + 1][0]) return mix(hex(stops[k][1]), hex(stops[k + 1][1]), (t - stops[k][0]) / (stops[k + 1][0] - stops[k][0]));
    }
    return hex(stops[stops.length - 1][1]);
  };

  const xy = new Float32Array(total * 2), z = new Float32Array(total), colors = new Float32Array(total * 3);
  for (let i = 0; i < total; i++) {
    const u = rand(), v = rand();
    const t = sample(u, v);
    const water = t < sea;
    const height = water ? sea : t;
    // light from the left: brighter on slopes that face it
    const slope = sample(Math.max(0, u - 0.01), v) - sample(Math.min(1, u + 0.01), v);
    const light = Math.max(0.45, Math.min(1.3, 0.9 + slope * 6));
    const base = water ? mix(hex("#2563eb"), hex("#7dd3fc"), rand() * 0.7) : shade(t).map((c) => Math.min(1, c * light));
    xy[i * 2] = (u - 0.5) * 2.7;
    xy[i * 2 + 1] = -0.95 + (height - sea) * 1.7;
    z[i] = (v - 0.5) * 2.0;
    colors.set(base, i * 3);
  }
  terrainCache = { xy, z, colors, n: total };
  return terrainCache;
}
