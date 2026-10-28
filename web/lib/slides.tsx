"use client";

// The slides, in the order of PRESENTATION_SCRIPT.md.
// Each slide has a number of steps; every click on "next" moves one step and
// the 3D stage animates to that step's scene. All points come from lab10.py
// through the Python backend.

import type { ReactNode } from "react";
import type { Deck } from "./deck";
import { hexKey } from "./deck";
import type { CameraShot, Marker, ParticleTarget, SceneState } from "./stage";
import { COPY_COLORS, firstPoints, type PointSet, type V2 } from "./data";
import { forest, terrain } from "./procedural";
import { Chip, Counter, Kicker, Matrix, Reveal, Title } from "@/components/ui";

// Put your names here.
export const SPEAKERS = ["Speaker 1", "Speaker 2", "Speaker 3", "Speaker 4", "Speaker 5"];
export const PART_TITLES = ["The question & the game", "The math of one jump", "Changing the map", "Corner rules & Q3", "Fern & conclusion"];

export type Live = {
  rerun: (key: string, task: number, ratio?: number) => Promise<void>;
  busy: string | null;
  hexRatio: number;
  setHexRatio: (r: number) => void;
  hexLive: boolean;
};

export type SlideCtx = { step: number; d: Deck; live: Live };

export type Slide = {
  id: string;
  part: 1 | 2 | 3 | 4 | 5;
  name: string;
  tasks?: number[];
  steps: number;
  layout?: "left" | "center";
  scene: (step: number, d: Deck, live: Live) => SceneState;
  view: (ctx: SlideCtx) => ReactNode;
  /** speaker script for the slide, per step */
  notes: string | ((step: number) => string);
};

// ---------- camera shots ----------

const RIGHT: CameraShot = { pos: [-0.95, 0, 3.8], target: [-0.95, 0, 0] };
const RIGHT_NEAR: CameraShot = { pos: [-0.9, 0.05, 3.3], target: [-0.9, 0.05, 0] };
const RIGHT_TILT: CameraShot = { pos: [-0.2, -2.6, 2.7], target: [-0.85, 0.15, 0] };
const RIGHT_SIDE: CameraShot = { pos: [1.9, -0.9, 3.0], target: [-0.7, 0.05, 0] };
const RIGHT_HIGH: CameraShot = { pos: [-1.6, 2.4, 2.9], target: [-0.9, -0.1, 0] };
const CENTER: CameraShot = { pos: [0, 0, 3.6], target: [0, 0, 0] };
const CENTER_LOW: CameraShot = { pos: [0, 0.4, 4.1], target: [0, 0.4, 0] };

// ---------- helpers ----------

const ver = (d: Deck, key: string) => d.version[key] ?? 0;

function plot(d: Deck, key: string, extra: Partial<ParticleTarget> = {}): ParticleTarget {
  const s = d.sets[key];
  return {
    key: `${key}#${ver(d, key)}|plot|${extra.mode ?? "morph"}|${extra.layers ? "L" : ""}|${extra.startAt ?? ""}|${s.n}`,
    xy: s.xy,
    colors: s.color,
    size: 2.4,
    ...extra,
  };
}

function copies(d: Deck, key: string, extra: Partial<ParticleTarget> = {}): ParticleTarget {
  const s = d.sets[key];
  return {
    key: `${key}#${ver(d, key)}|copies|${extra.mode ?? "morph"}|${extra.layers ? "L" : ""}`,
    xy: s.xy,
    colors: d.copyColors(key),
    size: 2.4,
    ...extra,
  };
}

const layers = (s: PointSet, gap = 0.35) => ({ copy: s.copy, copies: s.copies, gap });

const starMarkers = (key: string, pts: V2[], color = "#ffffff", size = 30) => ({
  key,
  items: pts.map((at) => ({ at, shape: "star", color, size }) as Marker),
});

const fmt = (v: number, digits = 3) => {
  const r = Math.round(v * 10 ** digits) / 10 ** digits;
  return Object.is(r, -0) ? "0" : String(r);
};

/** Times (s) at which jump j starts when points [startAt, n) are revealed in order over `duration`. */
function jumpTimes(startAt: number, n: number, duration: number) {
  const count = n - startAt;
  const window = Math.max(0.002, Math.min(0.9, 0.8 / Math.max(1, count)));
  return Array.from({ length: count }, (_, i) => (i / count) * (1 / (1 + window)) * duration);
}

function jumpLines(set: PointSet, from: number, to: number) {
  const a: V2[] = [], b: V2[] = [];
  for (let j = from; j < to; j++) {
    const k = set.copy[j];
    if (k < 0) continue;
    a.push([set.xy[(j - 1) * 2], set.xy[(j - 1) * 2 + 1]]);
    b.push(set.vertices[k]);
  }
  return { a, b };
}

/** Shows a different block for each group of steps; the new block fades in when it changes. */
const Phase = ({ id, children }: { id: string; children: ReactNode }) => (
  <div key={id} className="sub-enter h-full">{children}</div>
);

const POP: V2[] = Array.from({ length: 9 }, (_, k) => [-0.55 + k * 0.29, -0.85 + 0.2 * 1.3 ** k]);

// ---------- slides ----------

export const SLIDES: Slide[] = [
  // ======================= PART 1 · the question and the game =======================
  {
    id: "intro",
    part: 1,
    name: "Title & the question",
    steps: 2,
    layout: "center",
    scene: (step, d) => ({
      camera: step === 0 ? { pos: [0, 0, 5.2], target: [0, 0, 0], dur: 2.5 } : CENTER_LOW,
      particles:
        step === 0
          ? { key: "title-text", xy: d.title, colors: "#cfe6ff", size: 2.4, depth: 0.08, duration: 2.6 }
          : copies(d, "4", { mode: "burst", origin: [0, 0], duration: 3.2 }),
      wobble: step === 0 ? 0.012 : 0.008,
    }),
    view: ({ step, d }) =>
      step === 0 ? (
        <Phase key="title" id="title">
          <div className="flex h-full flex-col items-center justify-end pb-[11vh] text-center">
            <Kicker>Applied linear algebra · Project 10</Kicker>
            <Reveal step={step} at={0} delay={1200}>
              <p className="mx-auto mt-4 max-w-3xl text-[clamp(16px,1.5vw,24px)] leading-snug text-white/75">{d.project.title.replace("Project 10: ", "")}</p>
              <p className="mt-6 text-sm tracking-[0.3em] text-white/45 uppercase">{SPEAKERS.join("  ·  ")}</p>
            </Reveal>
          </div>
        </Phase>
      ) : (
        <Phase key="question" id="question">
          <div className="flex h-full flex-col items-center pt-[8vh] text-center">
            <p className="big-question">If you place dots <em>completely at random</em>…</p>
            <p className="big-question mt-2">…can you end up with a <span className="text-gradient">perfect pattern?</span></p>
            <Reveal step={step} at={1} delay={2600}>
              <p className="mt-5 text-[clamp(16px,1.4vw,22px)] text-white/70">Yes, and the reason is <b className="text-white">linear algebra</b>.</p>
            </Reveal>
          </div>
        </Phase>
      ),
    notes: (step) =>
      step === 0
        ? "Good morning everyone. We're presenting Project 10: Discrete dynamical systems, linear transformations of the plane, and the Chaos Game."
        : "Let's start with a question: if you place dots completely at random, can you end up with a perfect pattern? Most people would say no. By the end you'll see the answer is yes, and that the reason is linear algebra.",
  },
  {
    id: "game",
    part: 1,
    name: "The Chaos Game",
    tasks: [4],
    steps: 3,
    scene: (step, d) => {
      if (step === 0) {
        return {
          camera: RIGHT,
          particles: { key: "pop", xy: new Float32Array(POP.flat()), colors: "#5cc8ff", mode: "iterate", size: 16, duration: 4.5, depth: 0 },
          outline: { key: "pop-line", pts: POP, closed: false, color: "#5cc8ff", opacity: 0.3, draw: 4.5 },
          labels: {
            key: "pop-labels",
            items: [
              ...POP.map((p, k) => ({ text: `k=${k}`, at: [p[0], -1.12] as V2, cls: "tiny" })),
              { text: "x<sub>k+1</sub> = f(x<sub>k</sub>)", at: [POP[4][0] + 0.12, POP[4][1] + 0.18] as V2, cls: "math gold" },
            ],
          },
        };
      }
      const s = d.sets["4b"];
      const start = s.start ?? [0, 0];
      const base: SceneState = {
        camera: step === 1 ? RIGHT_NEAR : RIGHT,
        markers: {
          key: `game-m${step}`,
          items: [
            ...s.vertices.map((at) => ({ at, shape: "star", color: "#ffffff", size: 34 }) as Marker),
            ...(step === 1 ? [{ at: start, shape: "ring", color: "#5cc8ff", size: 44 } as Marker] : []),
          ],
        },
        outline: { key: "game-tri", pts: s.vertices, opacity: 0.18 },
        labels: step === 1 ? { key: "game-x0", items: [{ text: "x<sub>0</sub>", at: [start[0] + 0.1, start[1] + 0.12], cls: "math" }] } : null,
      };
      if (step === 1) {
        const n = 10;
        const { a, b } = jumpLines(s, 1, n);
        return {
          ...base,
          particles: { key: "game-j9", xy: firstPoints(s, n), colors: "#5cc8ff", size: 14, mode: "iterate", startAt: 1, duration: 6 },
          jumps: { key: "game-jumps", from: a, to: b, times: jumpTimes(1, n, 6) },
        };
      }
      return { ...base, particles: plot(d, "4b", { mode: "iterate", startAt: 10, duration: 6 }), jumps: null };
    },
    view: ({ step }) => {
      if (step === 0) {
        return (
          <Phase key="dyn" id="dyn">
            <Kicker>What is a dynamical system?</Kicker>
            <Title>The next state depends on the current state</Title>
            <p className="body">Like a population that grows once a year: next year&apos;s number comes from this year&apos;s.</p>
            <Reveal step={step} at={0} delay={900}>
              <div className="card mt-6">
                <div className="math-lg">x<sub>k+1</sub> = f(x<sub>k</sub>)</div>
                <p className="body mt-2">We only look at it in steps k = 0, 1, 2, …, so it&apos;s a <b className="text-white">discrete</b> dynamical system.</p>
              </div>
            </Reveal>
          </Phase>
        );
      }
      const rules = [
        "Take the corners of a shape, say a triangle.",
        "Pick a random starting point.",
        <>Choose a random corner and jump a fraction <i>r</i> of the way toward it.</>,
        "Repeat thousands of times.",
      ];
      return (
        <Phase key="rules" id="rules">
          <Kicker>The Chaos Game · Michael Barnsley</Kicker>
          <Title>Four simple rules</Title>
          <ol className="rules">
            {rules.map((rule, i) => (
              <Reveal key={i} step={step} at={1} delay={i * 450}>
                <li className={(step === 1 && i < 3) || (step === 2 && i === 3) ? "active" : ""}>
                  <span className="rule-num">{i + 1}</span>
                  <span>{rule}</span>
                </li>
              </Reveal>
            ))}
          </ol>
          <Reveal step={step} at={2} delay={2500}>
            <p className="body mt-4">10,000 random jumps later… not a mess, but a pattern.</p>
          </Reveal>
        </Phase>
      );
    },
    notes: (step) =>
      [
        "A dynamical system is one where the next state depends on the current state, like a population that grows once a year. Since we only look at it in steps, it's a discrete dynamical system: x(k+1) = f(x(k)).",
        "The Chaos Game, by Michael Barnsley, is exactly that, in the plane. Take the corners of a triangle and a random starting point. Choose a random corner and jump halfway toward it. Then choose again, and again.",
        "Repeat that ten thousand times, and instead of a random cloud we get this. Over to Speaker 2 to explain why.",
      ][step],
  },

  // ======================= PART 2 · the math of one jump =======================
  {
    id: "mapping",
    part: 2,
    name: "The matrix mapping",
    steps: 4,
    scene: (step, d) => {
      const s = d.sets["4b"];
      const v = s.vertices[1] ?? [-0.5, 0.866];
      const x: V2 = [0.35, -0.25];
      const r = 0.5;
      const tx: V2 = [r * (x[0] - v[0]) + v[0], r * (x[1] - v[1]) + v[1]];
      return {
        camera: step === 0 ? RIGHT : { pos: [-0.6, -1.1, 3.6], target: [-0.9, 0, 0] },
        particles: null,
        plane: { key: "plane", phase: step, r, v, x, tri: s.vertices },
        markers: {
          key: `map-m${step}`,
          items: [
            ...(step === 1 || step === 2 ? [{ at: [0, 0] as V2, shape: "ring", color: "#ffffff", size: 30 } as Marker] : []),
            ...(step === 3 ? [{ at: tx, shape: "ring", color: "#34d399", size: 48 } as Marker] : []),
          ],
        },
        labels:
          step === 1 || step === 2
            ? { key: `map-l${step}`, items: [{ text: "origin", at: [0.08, -0.14], cls: "tiny" }] }
            : step === 3
              ? { key: "map-l3", items: [{ text: "T(x)", at: [tx[0] + 0.12, tx[1] - 0.12], cls: "math green" }] }
              : null,
      };
    },
    view: ({ step }) => (
      <>
        <Kicker>Part 2 · {SPEAKERS[1]} · The key idea</Kicker>
        <Title>Every jump is a matrix mapping</Title>
        <div className="card mt-6">
          <div className="math-xl">
            T(x) ={" "}
            <span className={step === 2 ? "hl-violet" : ""}>T</span> ·{" "}
            <span className={step === 1 ? "hl-gold" : ""}>(x − v)</span>{" "}
            <span className={step === 3 ? "hl-green" : ""}>+ v</span>
          </div>
          <div className="mt-3 flex items-center gap-3 text-white/60">
            <span className="math-md">T =</span>
            <Matrix m={[[0.5, 0], [0, 0.5]]} />
            <span className="text-sm">r = ½ for the triangle</span>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          <Reveal step={step} at={1}><p className="step-line"><Chip tone="gold">x − v</Chip> moves the corner v to the origin</p></Reveal>
          <Reveal step={step} at={2}><p className="step-line"><Chip tone="violet">T ·</Chip> shrinks the whole plane by r</p></Reveal>
          <Reveal step={step} at={3}><p className="step-line"><Chip tone="green">+ v</Chip> <span>moves it back. The corner v never moves: it is the <b className="text-white">fixed point</b>.</span></p></Reveal>
        </div>
      </>
    ),
    notes: (step) =>
      [
        "Thanks. So what is one jump, mathematically? It's a matrix mapping: T(x) = T times (x − v), plus v, where T is the matrix [r 0; 0 r].",
        "Subtracting the corner v moves that corner to the origin.",
        "The matrix then shrinks the whole plane by the ratio r, here one half.",
        "Adding v moves it back. The corner itself never moves, so it's the fixed point of this map. Every step of the game is one linear transformation of the plane plus a shift.",
      ][step],
  },
  {
    id: "triangle",
    part: 2,
    name: "The Sierpinski triangle",
    tasks: [1, 2, 3, 4],
    steps: 3,
    scene: (step, d) => {
      if (step === 0) {
        const t = (d.runs["1"].variables.t as number[]) ?? [0, 2.0944, 4.1888];
        const angles = [...t, Math.PI * 2];
        const at = (a: number): V2 => [Math.cos(a), Math.sin(a)];
        const names = ["0", "2π/3", "4π/3", "2π"];
        return {
          camera: RIGHT,
          particles: null,
          circle: { key: "unit", radius: 1 },
          markers: {
            key: "tri-angles",
            items: [
              ...angles.map((a, i) => ({ at: at(a), shape: "dot", color: i === 3 ? "#ff6b6b" : "#8ea4ff", size: i === 3 ? 26 : 22 }) as Marker),
              { at: at(0), shape: "ring", color: "#ff6b6b", size: 56 },
            ],
          },
          labels: {
            key: "tri-angle-labels",
            items: [
              ...angles.map((a, i) => {
                const p = at(a);
                const off: V2 = i === 3 ? [0.22, -0.2] : [p[0] * 0.28, p[1] * 0.22];
                return { text: `t<sub>${i}</sub> = ${names[i]}`, at: [p[0] + off[0], p[1] + off[1]] as V2, cls: i === 3 ? "math red" : "math" };
              }),
              { text: "same point!", at: [1.25, 0.25] as V2, cls: "tiny red" },
            ],
          },
        };
      }
      const s = d.sets["4"];
      if (step === 1) {
        return {
          camera: RIGHT,
          circle: null,
          markers: starMarkers("tri-stars", s.vertices, "#ffffff", 32),
          labels: null,
          particles: plot(d, "4", { mode: "iterate", startAt: 1, duration: 6 }),
        };
      }
      return {
        camera: RIGHT_TILT,
        markers: null,
        particles: copies(d, "4", { layers: layers(s, 0.45), duration: 2.4 }),
        wobble: 0.01,
      };
    },
    view: ({ step, d }) => {
      if (step === 0) {
        return (
          <Phase key="corners" id="corners">
            <Kicker>Tasks 1–2 · The corners</Kicker>
            <Title>Corners on a circle</Title>
            <p className="body">Split 0 to 2π into equal angles; cos and sin of each angle give a corner on the unit circle.</p>
            <div className="card mt-5">
              <p className="q-label">Q1 · Why delete the last angle, t[3]?</p>
              <Reveal step={step} at={0} delay={1200}>
                <p className="body">The last angle, <b className="text-white">2π</b>, lands on the same point as <b className="text-white">0</b>. Deleting it avoids counting that corner twice.</p>
              </Reveal>
            </div>
            <p className="mt-6 text-sm text-white/45">Written in Python with <b className="text-white/70">NumPy</b> (vectors, matrices, random numbers) and <b className="text-white/70">Matplotlib</b> (the plots).</p>
          </Phase>
        );
      }
      const num = (d.runs["4"].variables.Num as number) ?? 10000;
      return (
        <Phase key="sierpinski" id="sierpinski">
          <Kicker>Tasks 3–4 · The first fractal</Kicker>
          <Title>The Sierpinski triangle</Title>
          <div className="card mt-2 flex items-center gap-4">
            <span className="math-md">T =</span>
            <Matrix m={[[0.5, 0], [0, 0.5]]} />
            <span className="body">jump halfway to a random corner</span>
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <Counter to={num} duration={6} run={step >= 1} className="counter" />
            <span className="body">random jumps</span>
          </div>
          <Reveal step={step} at={2}>
            <div className="card mt-4">
              <p className="body">Each map squeezes the whole shape into a half-size copy at its corner. The picture is exactly <b className="text-white">three copies of itself</b>: it is <b className="text-white">self-similar</b>.</p>
              <p className="body mt-2">Every map pulls points onto this same shape (the <b className="text-white">attractor</b>), so every run gives the same picture.</p>
            </div>
          </Reveal>
        </Phase>
      );
    },
    notes: (step) =>
      [
        "To build it, we first need the corners. We split the angles from 0 to 2π and take cosine and sine to get points on the unit circle. That's Question 1: why delete the last angle? Because 2π is the same point as 0, so we'd have the same corner twice. We did all of this in Python, with NumPy for the vectors and matrices and Matplotlib for the plots.",
        "Now take T = one half times the identity, start at a random point, and apply the map with a random corner ten thousand times. The result is the Sierpinski triangle.",
        "Why this shape? Each corner's map squeezes the whole picture into a half-size copy next to that corner, so the triangle is exactly three smaller copies of itself: it's self-similar. Every map pulls points toward this same shape, called the attractor, so the random jumps give the same picture every time. Over to Speaker 3.",
      ][step],
  },

  // ======================= PART 3 · changing the map =======================
  {
    id: "ratio-rotation",
    part: 3,
    name: "Ratio & rotation",
    tasks: [5, 6],
    steps: 2,
    scene: (step, d) =>
      step === 0
        ? { camera: RIGHT, particles: copies(d, "5", { size: 2.8 }) }
        : { camera: RIGHT_HIGH, particles: copies(d, "6", { layers: layers(d.sets["6"], 0.25), duration: 2.4 }) },
    view: ({ step, d }) => {
      if (step === 0) {
        return (
          <Phase key="ratio" id="ratio">
            <Kicker>Part 3 · {SPEAKERS[2]} · Task 5</Kicker>
            <Title>Change the ratio</Title>
            <div className="card mt-2 flex items-center gap-4">
              <span className="math-md">T =</span>
              <Matrix m={d.runs["5"].variables.T as number[][]} />
              <span className="body">r = 1/3</span>
            </div>
            <p className="body mt-4">Each copy is now only a third of the size. Three thirds don&apos;t fill the triangle, so <b className="text-white">gaps open up</b>, and repeat inside every copy.</p>
          </Phase>
        );
      }
      const theta = (d.runs["6"].variables.theta as number) ?? Math.PI / 18;
      return (
        <Phase key="rotation" id="rotation">
          <Kicker>Task 6</Kicker>
          <Title>Add a rotation</Title>
          <div className="card mt-2">
            <div className="flex items-center gap-4">
              <span className="math-md">T = ½ ·</span>
              <Matrix m={[[Math.cos(theta), -Math.sin(theta)], [Math.sin(theta), Math.cos(theta)]]} />
            </div>
            <p className="mt-2 text-sm text-white/50">θ = π/18 = {fmt((theta * 180) / Math.PI, 1)}°</p>
          </div>
          <p className="body mt-4">Now each jump shrinks <b className="text-white">and</b> turns the plane. Every copy is rotated a little, again and again inside itself, so the fractal twists.</p>
        </Phase>
      );
    },
    notes: (step) =>
      [
        "Thanks. Now we change one thing at a time in the matrix. First the ratio: with r = 1/3 each copy is a third of the size, the three copies no longer fill the triangle, and the gaps repeat at every level.",
        "Next, rotation. We multiply by a rotation matrix with θ = π/18, so each step shrinks and turns the plane. Each copy is rotated inside the next, so the whole fractal twists.",
      ][step],
  },
  {
    id: "square",
    part: 3,
    name: "Square & Q2",
    tasks: [7, 8],
    steps: 2,
    scene: (step, d) =>
      step === 0
        ? {
            camera: RIGHT,
            particles: copies(d, "7"),
            markers: starMarkers("sq-stars", d.sets["7"].vertices, "#ffffff", 30),
            outline: { key: "sq-out", pts: d.sets["7"].vertices, opacity: 0.3 },
          }
        : { camera: RIGHT_TILT, particles: copies(d, "8", { layers: layers(d.sets["8"], 0.3) }), markers: null, outline: null },
    view: ({ step }) =>
      step === 0 ? (
        <Phase key="sq" id="sq">
          <Kicker>Task 7</Kicker>
          <Title>Switch to a square</Title>
          <p className="body">Four corners, r = ½. Surprise:</p>
          <p className="big-answer mt-3">no fractal.</p>
          <Reveal step={step} at={0} delay={1400}>
            <p className="body mt-4">The four half-size copies <b className="text-white">cover the square exactly</b>, with no gaps, so the points just fill it in.</p>
          </Reveal>
        </Phase>
      ) : (
        <Phase key="q2" id="q2">
          <Kicker>Task 8</Kicker>
          <div className="card">
            <p className="q-label">Q2 · Is there a fractal with ratio 1/3?</p>
            <Reveal step={step} at={1} delay={900}>
              <p className="big-answer">Yes.</p>
            </Reveal>
          </div>
          <Reveal step={step} at={1} delay={1300}>
            <p className="body mt-4">Four copies of size 1/3 can&apos;t cover the square, so the gaps stay, at every level.</p>
          </Reveal>
        </Phase>
      ),
    notes: (step) =>
      [
        "Now a square, four corners, with r = 1/2. Surprise: there's no fractal. The four half-size copies cover the square exactly, so the points just fill it in.",
        "Question 2: is there a fractal with ratio 1/3? Yes. Four copies a third of the size can't cover the square, so the gaps stay, at every level. Over to Speaker 4.",
      ][step],
  },

  // ======================= PART 4 · corner rules and Q3 =======================
  {
    id: "corner-rules",
    part: 4,
    name: "Corner rules",
    tasks: [9, 10, 13],
    steps: 3,
    scene: (step, d) =>
      step === 0
        ? { camera: RIGHT, particles: copies(d, "9", { size: 2.8 }), markers: starMarkers("cr-sq", d.sets["9"].vertices, "#ffffff", 30) }
        : step === 1
          ? { camera: { pos: [-0.4, 1.8, 3.2], target: [-0.9, 0, 0] }, particles: copies(d, "10", { size: 2.8, layers: layers(d.sets["10"], 0.22) }), markers: starMarkers("cr-sq", d.sets["10"].vertices, "#ffffff", 30) }
          : { camera: RIGHT_TILT, particles: copies(d, "13", { layers: layers(d.sets["13"], 0.3), duration: 2.4 }), markers: null },
    view: ({ step, d }) => {
      if (step === 0) {
        const s = d.sets["9"];
        const counts = Array.from({ length: s.copies }, (_, k) => s.copy.reduce((n, c) => n + (c === k ? 1 : 0), 0));
        const total = counts.reduce((a, b) => a + b, 0) || 1;
        return (
          <Phase key="notsame" id="notsame">
            <Kicker>Part 4 · {SPEAKERS[3]} · Task 9</Kicker>
            <Title>Rule: not the same corner twice</Title>
            <p className="body">Same square, same ratio ½. We only change <b className="text-white">which corners are allowed</b>.</p>
            <div className="mt-5 space-y-1.5">
              {counts.map((c, k) => (
                <div key={k} className="flex items-center gap-3 text-sm">
                  <span className="w-16 text-white/60">corner {k}</span>
                  <span className="bar" style={{ width: `${(c / total) * 260}px`, background: COPY_COLORS[k] }} />
                  <span className="tabular-nums text-white/70">{Math.round((c / total) * 100)}%</span>
                </div>
              ))}
              <p className="pt-2 text-xs text-white/40">The assignment&apos;s rule picks one corner more often, so the shape is lopsided. We kept it as given.</p>
            </div>
          </Phase>
        );
      }
      if (step === 1) {
        return (
          <Phase key="notopp" id="notopp">
            <Kicker>Task 10</Kicker>
            <Title>Rule: not the opposite corner</Title>
            <p className="body">If the next corner can&apos;t be opposite the previous one, the same square gives a <b className="text-white">completely different pattern</b>.</p>
          </Phase>
        );
      }
      return (
        <Phase key="pentagon" id="pentagon">
          <Kicker>Task 13</Kicker>
          <Title>A pentagon snowflake</Title>
          <div className="card mt-2 flex items-center gap-4">
            <span className="math-md">T =</span>
            <Matrix m={d.runs["13"].variables.T as number[][]} />
            <span className="body">ratio 2/5</span>
          </div>
          <p className="body mt-4">Five corners, no corner twice in a row: a <b className="text-white">snowflake</b> made of five smaller snowflakes.</p>
        </Phase>
      );
    },
    notes: (step) =>
      [
        "Thanks. So far we changed the matrix. Now we keep the matrix and change which corners are allowed. In Task 9, the new corner can't be the same as the previous one. The assignment's version of this rule favours one corner, which is why it looks lopsided.",
        "In Task 10, the next corner can't be opposite the previous one. Same square, same ratio, one new rule, and a completely different pattern.",
        "And in Task 13, a pentagon with ratio 2/5, where no corner repeats, gives this snowflake: five smaller snowflakes.",
      ][step],
  },
  {
    id: "q3",
    part: 4,
    name: "Q3 · Hexagon",
    tasks: [12],
    steps: 3,
    scene: (step, d, live) => {
      const keys = ["12", hexKey(0.36), hexKey(0.33)];
      const key = live.hexLive && d.sets.hexLive ? "hexLive" : keys[step];
      return {
        camera: step === 1 ? RIGHT_NEAR : RIGHT,
        particles: copies(d, key, { size: 2.1, duration: 1.8 }),
        markers: starMarkers("hex-stars", d.sets["12"].vertices, "#ffffff", 26),
      };
    },
    view: ({ step, live }) => {
      const ratios = [0.25, 0.36, 0.33];
      const r = live.hexLive ? live.hexRatio : ratios[step];
      return (
        <>
          <Kicker>Task 12 · Question 3</Kicker>
          <Title>The hexagon</Title>
          <div className="card mt-1">
            <p className="q-label">Q3 · Largest ratio where the little hexagons don&apos;t touch?</p>
            <div className="mt-2 flex items-center gap-4">
              <span className="ratio-big">r = {r.toFixed(2)}</span>
              <span className="text-sm text-white/50">{live.hexLive ? "" : ["six separate copies", "too big: they overlap", "just touching"][step]}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="range" min={0.1} max={0.6} step={0.01} value={live.hexRatio}
              onChange={(e) => live.setHexRatio(Number(e.target.value))}
              onKeyDown={(e) => e.stopPropagation()}
              className="slider"
            />
            <button className="run-btn" disabled={!!live.busy} onClick={() => live.rerun("hexLive", 12, live.hexRatio)}>
              {live.busy === "hexLive" ? "Drawing…" : `▶ Try r = ${live.hexRatio.toFixed(2)}`}
            </button>
          </div>
          <Reveal step={step} at={2}>
            <div className="card mt-3">
              <p className="body">Neighbouring corners are 1 apart. Each copy reaches r toward its neighbour, so they touch when</p>
              <p className="math-lg mt-1">2r = 1 − r  →  r = 1/3</p>
              <p className="mt-1 text-white">Our answer: <b className="text-gradient text-xl">about 0.33</b></p>
            </div>
          </Reveal>
        </>
      );
    },
    notes: (step) =>
      [
        "Question 3 uses a hexagon. With ratio 0.25 we get six separate little hexagons. What's the largest ratio where they still don't touch?",
        "At 0.36 they're too big and overlap.",
        "Neighbouring corners are 1 apart and each copy reaches r toward its neighbour, so they touch when 2r = 1 − r, which is r = 1/3. Our answer is about 0.33. Over to Speaker 5.",
      ][step],
  },

  // ======================= PART 5 · fern and conclusion =======================
  {
    id: "fern",
    part: 5,
    name: "Barnsley fern",
    tasks: [11],
    steps: 2,
    scene: (step, d) => ({
      camera: step === 0 ? { pos: [-0.95, -0.4, 3.9], target: [-0.95, 0, 0], dur: 2 } : RIGHT_SIDE,
      particles: step === 0 ? { ...plot(d, "11", { mode: "grow", duration: 4.5 }), colors: "#5ee6a8" } : copies(d, "11", { layers: layers(d.sets["11"], 0.35) }),
    }),
    view: ({ step, d }) => {
      const v = d.runs["11"].variables;
      const maps = [
        { name: "T1", p: v.P1 as number, what: "builds the leaf" },
        { name: "T2", p: v.P2 as number, what: "a side leaf" },
        { name: "T3", p: v.P3 as number, what: "the other side leaf" },
        { name: "T4", p: v.P4 as number, what: "draws the stem" },
      ];
      return (
        <>
          <Kicker>Part 5 · {SPEAKERS[4]} · Task 11</Kicker>
          <Title>The Barnsley fern</Title>
          <p className="body">The same idea, with two changes: four different maps <span className="math-md">y = T<sub>j</sub> x + Q<sub>j</sub></span> (Q<sub>j</sub> shifts the point), and they aren&apos;t chosen equally.</p>
          <Reveal step={step} at={1}>
            <div className="mt-5 space-y-2">
              {maps.map((m, i) => (
                <div key={m.name} className="flex items-center gap-3">
                  <span className="legend-dot" style={{ background: COPY_COLORS[i] }} />
                  <span className="w-10 font-mono text-white">{m.name}</span>
                  <span className="bar" style={{ width: `${Math.max(6, m.p * 220)}px`, background: COPY_COLORS[i] }} />
                  <span className="w-12 tabular-nums text-white">{Math.round(m.p * 100)}%</span>
                  <span className="text-sm text-white/55">{m.what}</span>
                </div>
              ))}
            </div>
            <p className="body mt-5">Four 2×2 matrices and four probabilities make a whole fern.</p>
          </Reveal>
        </>
      );
    },
    notes: (step) =>
      [
        "Thanks. The last task is the Barnsley fern. It's the same idea with two changes: four different maps, y = Tj x + Qj, where Qj shifts the point, and they're not chosen equally.",
        "One map, picked 85% of the time, builds the leaf; two maps at 7% each make the side leaves; and one at 1% draws the stem. Four 2×2 matrices and four probabilities make a whole fern.",
      ][step],
  },
  {
    id: "applications",
    part: 5,
    name: "Real-world applications",
    steps: 2,
    scene: (step) => {
      const s = step === 0 ? forest() : terrain();
      return {
        camera: step === 0 ? { pos: [-0.85, 0.15, 4.3], target: [-0.85, -0.15, 0], dur: 2.4 } : { pos: [-0.85, 1.55, 3.7], target: [-0.85, -0.55, 0], dur: 2.6 },
        particles: {
          key: step === 0 ? "forest" : "terrain",
          xy: s.xy.subarray(0, s.n * 2),
          z: s.z,
          colors: s.colors,
          mode: "rise",
          duration: step === 0 ? 4.5 : 4,
          size: step === 0 ? 2.6 : 3.2,
          depth: 0,
        },
        wobble: 0.004,
      };
    },
    view: ({ step }) => {
      const uses = [
        {
          title: "Computer graphics & procedural generation",
          text: "Fractal geometry generates vegetation, textures, mountains and landscapes for games, simulations and visual effects. Repeated rules create the detail, so no one has to design every element by hand.",
          link: "Each tree here is one repeated rule: every branch splits into smaller copies of itself, scaled and turned by a rotation matrix.",
        },
        {
          title: "Terrain & landscape modelling",
          text: "Fractal and procedural methods produce realistic mountains, coastlines and rough terrain for computer-generated environments, games and simulations.",
          link: "These mountains come from one repeated rule: split every square and nudge its midpoint up or down by a random amount that halves each time.",
        },
      ];
      return (
        <>
          <Kicker>Beyond the classroom</Kicker>
          <Title>Real-world applications</Title>
          <div className="mt-4 space-y-3">
            {uses.map((u, i) => (
              <Reveal key={u.title} step={step} at={i} delay={i === 0 ? 500 : 300}>
                <div className={`card transition-opacity duration-700 ${step === i ? "" : "opacity-50"}`}>
                  <p className="text-[clamp(16px,1.3vw,21px)] font-semibold text-white">{u.title}</p>
                  <p className="body mt-1">{u.text}</p>
                  <p className="mt-2 text-sm text-[#5ee6a8]">↳ {u.link}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </>
      );
    },
    notes: (step) =>
      [
        "Where is this used outside the classroom? First, computer graphics and procedural generation: fractal geometry generates vegetation, textures, mountains and landscapes for video games, simulations and visual effects. Repeated rules create the detail, so nobody designs every element by hand. Each tree in this forest is one repeated rule: every branch splits into smaller copies of itself, scaled down and turned by a rotation matrix, the same shrink-and-rotate idea as our Task 6.",
        "Second, terrain and landscape modelling: fractal methods generate realistic mountains, coastlines and rough terrain. These mountains come from one repeated rule: split every square and nudge its midpoint by a random amount that halves at each level. Like our experiments, repeated mathematical operations produce complex geometric structures.",
      ][step],
  },
  {
    id: "learned",
    part: 5,
    name: "What we learned",
    steps: 1,
    scene: (_step, d) => ({ camera: RIGHT_TILT, particles: copies(d, "13", { layers: layers(d.sets["13"], 0.3) }) }),
    view: ({ step }) => {
      const points = [
        "One matrix mapping, repeated thousands of times, can create very complicated shapes.",
        "Small changes to the ratio, a rotation or the corner rule completely change the result, and sometimes, like the square at ½, there's no fractal at all.",
        "Randomness plus linear algebra gives order, not chaos.",
      ];
      return (
        <>
          <Kicker>To wrap up</Kicker>
          <Title>Three things we learned</Title>
          <ol className="rules mt-4">
            {points.map((p, i) => (
              <Reveal key={i} step={step} at={0} delay={500 + i * 1100}>
                <li className="active">
                  <span className="rule-num">{i + 1}</span>
                  <span>{p}</span>
                </li>
              </Reveal>
            ))}
          </ol>
        </>
      );
    },
    notes: "Three things we learned. One: one matrix mapping, repeated thousands of times, can create very complicated shapes. Two: small changes to the ratio, a rotation or the corner rule completely change the result, and sometimes, like the square at 1/2, there's no fractal at all. Three: randomness plus linear algebra gives order, not chaos.",
  },
  {
    id: "ending",
    part: 5,
    name: "Back to the question",
    steps: 2,
    layout: "center",
    scene: (step, d) => ({
      camera: step === 0 ? CENTER : { pos: [0, -0.38, 5.9], target: [0, -0.38, 0], dur: 2.4 },
      particles:
        step === 0
          ? { key: "one-dot-end", xy: new Float32Array([0, 0]), colors: "#ffffff", size: 34, duration: 2 }
          : copies(d, "4", { mode: "burst", origin: [0, 0], duration: 3 }),
      wobble: 0.006,
    }),
    view: ({ step }) => (
      <div className="flex h-full flex-col items-center pt-[8vh] text-center">
        <p className="big-question">Can random dots make a perfect pattern?</p>
        <Reveal step={step} at={1} delay={1800}>
          <p className="big-question mt-2">With the right <span className="text-gradient">matrix</span>, yes.</p>
        </Reveal>
        <div className="flex-1" />
        <Reveal step={step} at={1} delay={3400} className="pb-[10vh]">
          <p className="thanks">Thank you</p>
          <p className="mt-3 text-[clamp(16px,1.6vw,26px)] text-white/70">Questions?</p>
          <p className="mt-5 text-sm tracking-[0.3em] text-white/40 uppercase">{SPEAKERS.join("  ·  ")}</p>
        </Reveal>
      </div>
    ),
    notes: (step) =>
      step === 0
        ? "So, back to our opening question: can random dots make a perfect pattern?"
        : "With the right matrix, yes. Thank you for listening. We're happy to take questions.",
  },
];
