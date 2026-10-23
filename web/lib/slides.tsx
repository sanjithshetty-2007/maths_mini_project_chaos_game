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
import { Chip, CodeBlock, Counter, Kicker, Matrix, Reveal, Title } from "@/components/ui";

// Put your names here.
export const SPEAKERS = ["Speaker 1", "Speaker 2", "Speaker 3", "Speaker 4"];
export const PART_TITLES = ["Opening & the problem", "How the code solves it", "Variations & the questions", "Fern, our app & closing"];

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
  part: 1 | 2 | 3 | 4;
  name: string;
  tasks?: number[];
  steps: number;
  layout?: "left" | "center";
  scene: (step: number, d: Deck, live: Live) => SceneState;
  view: (ctx: SlideCtx) => ReactNode;
  /** speaker script for the slide; merged slides give the lines for the current step */
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
const FAR: CameraShot = { pos: [-2.4, 0.3, 6.5], target: [-1.6, 0, 0], dur: 2.4 };

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

const code = (d: Deck, id: number) => d.project.tasks[id - 1]?.code ?? "";

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

const POP: V2[] = Array.from({ length: 9 }, (_, k) => [-0.55 + k * 0.29, -0.85 + 0.2 * 1.3 ** k]);

// ---------- slides ----------
// Written one idea per slide; SLIDES at the bottom merges related ones.

const ALL: Slide[] = [
  // ======================= PART 1 =======================
  {
    id: "title",
    part: 1,
    name: "Title",
    steps: 2,
    layout: "center",
    scene: (step, d) => ({
      camera: step === 0 ? { pos: [0, 0, 5.2], target: [0, 0, 0], dur: 2.5 } : CENTER,
      particles:
        step === 0
          ? { key: "cloud-title", xy: d.cloud, colors: "#a9c8ff", mode: "burst", size: 3.6, depth: 1.4, duration: 3 }
          : { key: "title-text", xy: d.title, colors: "#cfe6ff", size: 2.4, depth: 0.08, duration: 2.6 },
      wobble: step === 0 ? 0.05 : 0.012,
    }),
    view: ({ step, d }) => (
      <div className="flex h-full flex-col items-center justify-end pb-[11vh] text-center">
        <Reveal step={step} at={0}>
          <Kicker>Applied linear algebra · Project 10</Kicker>
        </Reveal>
        <Reveal step={step} at={1} delay={900}>
          <p className="mx-auto mt-4 max-w-3xl text-[clamp(16px,1.5vw,24px)] leading-snug text-white/75">{d.project.title.replace("Project 10: ", "")}</p>
          <p className="mt-6 text-sm tracking-[0.3em] text-white/45 uppercase">{SPEAKERS.join("  ·  ")}</p>
        </Reveal>
      </div>
    ),
    notes: "Good morning everyone. We're presenting Project 10: Discrete dynamical systems, linear transformations of the plane, and the Chaos Game.",
  },
  {
    id: "hook",
    part: 1,
    name: "The question",
    steps: 3,
    layout: "center",
    scene: (step, d) => ({
      camera: step < 2 ? CENTER : CENTER_LOW,
      particles:
        step === 0
          ? { key: "one-dot", xy: new Float32Array([0, 0]), colors: "#ffffff", size: 34, duration: 1.6 }
          : step === 1
            ? { key: "hook-cloud", xy: d.cloud, colors: "#b4d0ff", mode: "burst", origin: [0, 0], size: 3.6, depth: 0.6, duration: 2.4 }
            : { ...plot(d, "4"), size: 2.4, duration: 2.6 },
      wobble: step === 1 ? 0.03 : 0.008,
    }),
    view: ({ step }) => (
      <div className="flex h-full flex-col items-center pt-[9vh] text-center">
        <Reveal step={step} at={0}>
          <p className="big-question">If you place dots <em>completely at random</em>…</p>
        </Reveal>
        <Reveal step={step} at={1} delay={500}>
          <p className="big-question mt-2">…can you end up with a <span className="text-gradient">perfect pattern?</span></p>
        </Reveal>
        <Reveal step={step} at={2} delay={1400}>
          <p className="mt-5 text-[clamp(16px,1.4vw,22px)] text-white/70">Yes, and the reason is <b className="text-white">linear algebra</b>.</p>
        </Reveal>
      </div>
    ),
    notes: "Let's start with a question: if you place dots completely at random, can you end up with a perfect pattern? Most people would say no. We'll show you the answer is yes, and that the reason is linear algebra.",
  },
  {
    id: "dynamical",
    part: 1,
    name: "Dynamical systems",
    steps: 2,
    scene: (step) => ({
      camera: RIGHT,
      particles: { key: "pop", xy: new Float32Array(POP.flat()), colors: "#5cc8ff", mode: "iterate", size: 16, duration: 4.5, depth: 0 },
      outline: { key: "pop-line", pts: POP, closed: false, color: "#5cc8ff", opacity: 0.3, draw: 4.5 },
      labels:
        step >= 1
          ? {
              key: "pop-labels",
              items: [
                ...POP.map((p, k) => ({ text: `k=${k}`, at: [p[0], -1.12] as V2, cls: "tiny" })),
                { text: "x<sub>k</sub>", at: [POP[3][0] - 0.05, POP[3][1] + 0.16] as V2, cls: "math" },
                { text: "x<sub>k+1</sub> = f(x<sub>k</sub>)", at: [POP[4][0] + 0.12, POP[4][1] + 0.18] as V2, cls: "math gold" },
              ],
            }
          : null,
    }),
    view: ({ step }) => (
      <>
        <Kicker>What is a dynamical system?</Kicker>
        <Title>The next state depends on the current state</Title>
        <Reveal step={step} at={0} delay={300}>
          <p className="body">Like a population that grows once a year: next year&apos;s number comes from this year&apos;s.</p>
        </Reveal>
        <Reveal step={step} at={1}>
          <div className="card mt-6">
            <div className="math-lg">x<sub>k+1</sub> = f(x<sub>k</sub>)</div>
            <p className="body mt-2">We only look at it in steps k = 0, 1, 2, …, so it&apos;s a <b className="text-white">discrete</b> dynamical system.</p>
          </div>
        </Reveal>
      </>
    ),
    notes: "A dynamical system is one where the next state depends on the current state, like a population that grows once a year. Since we only look at it in steps, it's a discrete dynamical system.",
  },
  {
    id: "rules",
    part: 1,
    name: "The Chaos Game",
    tasks: [4],
    steps: 5,
    scene: (step, d) => {
      const s = d.sets["4b"];
      const start = s.start ?? [0, 0];
      const base: SceneState = {
        camera: step < 4 ? RIGHT_NEAR : RIGHT,
        markers: {
          key: `rules-m${step >= 1 && step < 4 ? 1 : 0}`,
          items: [
            ...s.vertices.map((at) => ({ at, shape: "star", color: "#ffffff", size: 34 }) as Marker),
            ...(step >= 1 && step < 4 ? [{ at: start, shape: "ring", color: "#5cc8ff", size: 44 } as Marker] : []),
          ],
        },
        outline: { key: "rules-tri", pts: s.vertices, opacity: 0.18 },
      };
      if (step === 0) return { ...base, particles: null };
      if (step === 1) {
        return {
          ...base,
          particles: { key: "rules-start", xy: firstPoints(s, 1), colors: "#5cc8ff", size: 16 },
          labels: { key: "rules-x0", items: [{ text: "x<sub>0</sub>", at: [start[0] + 0.1, start[1] + 0.12], cls: "math" }] },
        };
      }
      if (step === 2) {
        const { a, b } = jumpLines(s, 1, 2);
        return {
          ...base,
          particles: { key: "rules-j1", xy: firstPoints(s, 2), colors: "#5cc8ff", size: 16, mode: "iterate", startAt: 1, duration: 1.6 },
          jumps: { key: "rules-jump1", from: a, to: b, times: [0.1] },
        };
      }
      if (step === 3) {
        const n = 10;
        const { a, b } = jumpLines(s, 1, n);
        const later = jumpTimes(2, n, 6);
        return {
          ...base,
          particles: { key: "rules-j9", xy: firstPoints(s, n), colors: "#5cc8ff", size: 14, mode: "iterate", startAt: 2, duration: 6 },
          jumps: { key: "rules-jump9", from: a, to: b, times: [0, ...later] },
        };
      }
      return { ...base, particles: { ...plot(d, "4b", { mode: "iterate", startAt: 10, duration: 6 }) }, jumps: null };
    },
    view: ({ step }) => {
      const rules = [
        "Take the corners of a shape, say a triangle.",
        "Pick a random starting point.",
        <>Choose a random corner and jump part of the way toward it, by a ratio <i>r</i>.</>,
        <>Choose again… and again… <span className="text-white/50">(r = ½ here)</span></>,
        "Repeat thousands of times.",
      ];
      return (
        <>
          <Kicker>The Chaos Game · Michael Barnsley</Kicker>
          <Title>Four simple rules</Title>
          <ol className="rules">
            {rules.map((rule, i) => (
              <Reveal key={i} step={step} at={i} className={i === 3 ? "pl-8" : ""}>
                <li className={step === i ? "active" : ""}>
                  {i !== 3 && <span className="rule-num">{i < 3 ? i + 1 : 4}</span>}
                  <span>{rule}</span>
                </li>
              </Reveal>
            ))}
          </ol>
          <Reveal step={step} at={4} delay={600}>
            <p className="body mt-4">10,000 random jumps later… a pattern.</p>
          </Reveal>
        </>
      );
    },
    notes: "The Chaos Game, by Michael Barnsley, is exactly that. The rules: 1. Take the corners of a shape, say a triangle. 2. Pick a random starting point. 3. Choose a random corner and jump part of the way toward it, by a ratio r. 4. Repeat thousands of times.",
  },
  {
    id: "mapping",
    part: 1,
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
        <Kicker>The key idea</Kicker>
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
          <Reveal step={step} at={2}><p className="step-line"><Chip tone="violet">T ·</Chip> shrinks everything by r</p></Reveal>
          <Reveal step={step} at={3}><p className="step-line"><Chip tone="green">+ v</Chip> moves it back: one linear transformation of the plane</p></Reveal>
        </div>
      </>
    ),
    notes: "The key idea is that this jump is a matrix mapping: T(x) = T·(x − v) + v, where T = [r 0; 0 r]. Subtracting the corner v moves it to the origin, the matrix shrinks everything by r, and adding v moves it back. Every step is a linear transformation of the plane. Over to Speaker 2 to show how we did it in Python.",
  },

  // ======================= PART 2 =======================
  {
    id: "part2",
    part: 2,
    name: "lab10.py",
    steps: 1,
    scene: (_step, d) => ({
      camera: RIGHT_TILT,
      particles: copies(d, "4", { layers: layers(d.sets["4"], 0.45), size: 2.4, duration: 2.4 }),
      wobble: 0.01,
    }),
    view: ({ step, d }) => (
      <>
        <Kicker>Part 2 · {SPEAKERS[1]}</Kicker>
        <Title>How the code solves it</Title>
        <p className="body">One Python file, <code className="inline-code">lab10.py</code>: NumPy for the math, Matplotlib for the plots. {d.project.tasks.length} cells, one per task.</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {["The corners", "The matrix", "The loop", "Plot once"].map((s, i) => (
            <Reveal key={s} step={step} at={0} delay={300 + i * 150}>
              <div className="mini-card"><span className="rule-num">{i + 1}</span>{s}</div>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-sm text-white/40">Every dot in this presentation comes from running those cells on the Python backend.</p>
      </>
    ),
    notes: "Thanks. Our code is one Python file, lab10.py, using NumPy for the math and Matplotlib for plots. Four steps.",
  },
  {
    id: "corners",
    part: 2,
    name: "1 · The corners",
    tasks: [1],
    steps: 4,
    scene: (step, d) => {
      const t = (d.runs["1"].variables.t as number[]) ?? [0, 2.0944, 4.1888];
      const v = d.runs["1"].variables.v as number[][];
      const angles = [...t, Math.PI * 2];
      const at = (a: number): V2 => [Math.cos(a), Math.sin(a)];
      const names = ["0", "2π/3", "4π/3", "2π"];
      const corners: V2[] = v ? v[0].map((x, i) => [x, v[1][i]]) : angles.slice(0, 3).map(at);
      const dots = (upto: number) =>
        angles.slice(0, upto).map((a, i) => ({ at: at(a), shape: "dot", color: i === 3 ? "#ff6b6b" : "#8ea4ff", size: i === 3 ? 26 : 22 }) as Marker);
      const angleLabels = (upto: number) =>
        angles.slice(0, upto).map((a, i) => {
          const p = at(a);
          const off: V2 = i === 3 ? [0.22, -0.2] : [p[0] * 0.28, p[1] * 0.22];
          return { text: `t<sub>${i}</sub> = ${names[i]}`, at: [p[0] + off[0], p[1] + off[1]] as V2, cls: i === 3 ? "math red" : "math" };
        });
      if (step <= 1) {
        return {
          camera: RIGHT,
          particles: null,
          circle: { key: "unit", radius: 1 },
          markers: { key: `c-m${step}`, items: [...dots(4), ...(step === 1 ? [{ at: at(0), shape: "ring", color: "#ff6b6b", size: 56 } as Marker] : [])] },
          labels: { key: `c-l${step}`, items: [...angleLabels(4), ...(step === 1 ? [{ text: "same point!", at: [1.25, 0.25] as V2, cls: "tiny red" }] : [])] },
        };
      }
      if (step === 2) {
        return {
          camera: RIGHT,
          particles: null,
          circle: { key: "unit", radius: 1 },
          markers: { key: "c-m2", items: dots(3) },
          labels: { key: "c-l2", items: angleLabels(3) },
        };
      }
      return {
        camera: RIGHT_NEAR,
        particles: null,
        circle: { key: "unit", radius: 1 },
        markers: starMarkers("c-stars", corners, "#ffffff", 40),
        outline: { key: "c-tri", pts: corners, opacity: 0.5 },
        labels: {
          key: "c-l3",
          items: corners.map((p, i) => ({ text: `v<sub>${i + 1}</sub> = (${fmt(p[0])}, ${fmt(p[1])})`, at: [p[0] * 1.32 + (i === 0 ? 0.12 : 0), p[1] * 1.22] as V2, cls: "math" })),
        },
      };
    },
    view: ({ step, d }) => (
      <>
        <Kicker>Part 2 · {SPEAKERS[1]} · Task 1 · Step one</Kicker>
        <Title>The corners</Title>
        <CodeBlock
          code={code(d, 1)}
          highlight={step <= 1 ? ["np.linspace"] : step === 2 ? ["np.delete"] : ["np.array([np.cos"]}
          className="mt-4 max-h-[34vh]"
        />
        <Reveal step={step} at={1} until={3}>
          <div className="card mt-4">
            <p className="q-label">Q1 · What does deleting t[3] do?</p>
            <Reveal step={step} at={2}>
              <p className="body">The last angle, <b className="text-white">2π</b>, is the same point as <b className="text-white">0</b>, so deleting it avoids a duplicate corner.</p>
            </Reveal>
          </div>
        </Reveal>
        <Reveal step={step} at={3}>
          <p className="body mt-4">cos and sin of the 3 angles → three corners on a circle of radius 1.</p>
        </Reveal>
      </>
    ),
    notes: "Thanks. Our code is one Python file, lab10.py, using NumPy for the math and Matplotlib for plots. Four steps. One: the corners. np.linspace(0, 2π, 4) gives four angles, and we delete the last one. That's Question 1: the last angle, 2π, is the same point as 0, so deleting it avoids a duplicate corner. Cosine and sine then give three corners on a circle of radius 1.",
  },
  {
    id: "matrix",
    part: 2,
    name: "2 · The matrix",
    tasks: [2],
    steps: 3,
    scene: (step, d) => {
      const x = d.runs["2"].variables.x as number[][];
      const start: V2 = x ? [x[0][0], x[1][0]] : [0.1, 0.2];
      return {
        camera: step === 0 ? RIGHT : RIGHT_NEAR,
        particles: null,
        grid: { key: "grid", scale: step === 0 ? 1 : 0.5 },
        markers: step === 2 ? { key: "m-start", items: [{ at: start, shape: "ring", color: "#5cc8ff", size: 46 }] } : null,
        labels:
          step === 2
            ? { key: "l-start", items: [{ text: `x = (${fmt(start[0])}, ${fmt(start[1])})`, at: [start[0] + 0.12, start[1] + 0.16], cls: "math" }] }
            : step === 1
              ? { key: "l-half", items: [{ text: "½ × every vector", at: [0.62, 0.62], cls: "tiny gold" }] }
              : null,
      };
    },
    view: ({ step, d }) => {
      const T = (d.runs["2"].variables.T as number[][]) ?? [[0.5, 0], [0, 0.5]];
      return (
        <>
          <Kicker>Task 2 · Step two</Kicker>
          <Title>The matrix</Title>
          <div className="card mt-2 flex items-center gap-4">
            <span className="math-md">T =</span>
            <Matrix m={T} />
            <span className="body">means “jump halfway”</span>
          </div>
          <CodeBlock code={code(d, 2)} highlight={step < 2 ? ["T = np.array"] : ["x = np.random"]} className="mt-4" />
          <Reveal step={step} at={2}>
            <p className="body mt-4">…and the start point is random, somewhere in [−0.5, 0.5]².</p>
          </Reveal>
        </>
      );
    },
    notes: "Two: the matrix. T is [[0.5, 0], [0, 0.5]], meaning \"jump halfway\", and the start point is random.",
  },
  {
    id: "loop",
    part: 2,
    name: "3 · The loop",
    tasks: [4],
    steps: 2,
    scene: (step, d) => {
      const s = d.sets["4"];
      return {
        camera: step === 0 ? RIGHT_NEAR : RIGHT,
        markers: {
          key: `loop-m${step}`,
          items: [
            ...s.vertices.map((at) => ({ at, shape: "star", color: "#ffffff", size: 32 }) as Marker),
            ...(step === 0 && s.start ? [{ at: s.start, shape: "ring", color: "#5cc8ff", size: 44 } as Marker] : []),
          ],
        },
        particles: step === 0 ? { key: "loop-start", xy: firstPoints(s, 1), colors: s.color, size: 14 } : plot(d, "4", { mode: "iterate", startAt: 1, duration: 6 }),
      };
    },
    view: ({ step, d }) => {
      const num = (d.runs["4"].variables.Num as number) ?? 10000;
      return (
        <>
          <Kicker>Task 4 · Step three</Kicker>
          <Title>The loop</Title>
          <CodeBlock
            code={code(d, 4)}
            highlight={step === 0 ? ["for j in range(Num)"] : ["np.random.randint", "transformed_point = T @", "points[:, j + 1]"]}
            className="mt-2 max-h-[38vh]"
          />
          <div className="mt-4 flex items-baseline gap-3">
            <Counter to={num} duration={6} run={step === 1} className="counter" />
            <span className="body">of {num.toLocaleString()} points, stored in one 2 × {(num + 1).toLocaleString()} array</span>
          </div>
        </>
      );
    },
    notes: "Three: the loop. 10,000 times, np.random.randint picks a corner k, and we apply T @ (current_point − v[:, k]) + v[:, k]. Each new point goes into one 2 × 10,001 array.",
  },
  {
    id: "plot",
    part: 2,
    name: "4 · Plot once",
    tasks: [3, 4],
    steps: 3,
    scene: (step, d) => {
      const s3 = d.sets["3"];
      if (step === 0) {
        return {
          camera: RIGHT,
          particles: plot(d, "3", { duration: 1.2 }),
          markers: {
            key: "plot3-m",
            items: [
              ...s3.vertices.map((at) => ({ at, shape: "star", color: "#ffffff", size: 32 }) as Marker),
              ...(s3.start ? [{ at: s3.start, shape: "ring", color: "#5cc8ff", size: 40 } as Marker] : []),
            ],
          },
          labels: { key: "plot3-l", items: [{ text: "one plt.plot call", at: [0.25, -1.12], cls: "tiny" }] },
        };
      }
      const key = step === 1 ? "4" : "4b";
      return {
        camera: step === 1 ? { pos: [-1.3, 0.6, 3.4], target: [-0.9, 0, 0], dur: 2.2 } : RIGHT,
        particles: plot(d, key, { duration: 2.2 }),
        markers: null,
        labels: { key: `plot-title-${key}`, items: [{ text: d.sets[key].title, at: [0, 1.12], cls: "plot-title" }] },
      };
    },
    view: ({ step, d, live }) => (
      <>
        <Kicker>Tasks 3 & 4 · Step four</Kicker>
        <Title>Plot once</Title>
        <p className="body">We draw everything at the end with a single <code className="inline-code">plt.plot</code>; plotting every point separately is far too slow.</p>
        <CodeBlock code={code(d, step === 0 ? 3 : 4)} highlight={["plt.plot(points"]} className="mt-4 max-h-[26vh]" />
        <Reveal step={step} at={1}>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Chip tone="green">DEMO</Chip>
            <span className="body">Here it is: the <b className="text-white">Sierpinski triangle</b>.</span>
            <button className="run-btn" disabled={!!live.busy} onClick={() => live.rerun("4", 4)}>
              {live.busy === "4" ? "Running…" : "▶ Run cell again"}
            </button>
          </div>
        </Reveal>
        <Reveal step={step} at={2}>
          <p className="body mt-3">A different run means different random jumps, but <b className="text-white">the same shape every run</b>.</p>
        </Reveal>
        <Reveal step={step} at={1}>
          <p className="mt-3 text-xs text-white/35">Python ran Task {step === 2 ? "4 (again)" : "4"} in {Math.round((d.runs[step === 2 ? "4b" : "4"]?.seconds ?? 0) * 1000)} ms</p>
        </Reveal>
      </>
    ),
    notes: "Four: plot once. We draw everything at the end with a single plt.plot, because plotting every point separately is far too slow. [DEMO] Here it is: the Sierpinski triangle, built from random jumps, and the same shape every run. Over to Speaker 3.",
  },

  // ======================= PART 3 =======================
  {
    id: "part3",
    part: 3,
    name: "Variations",
    steps: 1,
    scene: (_s, d) => ({
      camera: RIGHT_SIDE,
      particles: copies(d, "4", { layers: layers(d.sets["4"], 0.25), duration: 2 }),
    }),
    view: () => (
      <>
        <Kicker>Part 3 · {SPEAKERS[2]}</Kicker>
        <Title>Change one thing at a time</Title>
        <div className="mt-6 flex flex-wrap gap-2">
          {["Ratio", "Rotation", "Square", "Corner rules", "Pentagon", "Hexagon"].map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </div>
        <p className="body mt-6">Each colour is one shrunk copy of the whole shape, one copy per corner.</p>
      </>
    ),
    notes: "Thanks. Now we change one thing at a time.",
  },
  {
    id: "ratio",
    part: 3,
    name: "Ratio 1/3",
    tasks: [5],
    steps: 2,
    scene: (step, d) => ({
      camera: step === 0 ? RIGHT : RIGHT_TILT,
      particles: step === 0 ? plot(d, "5") : copies(d, "5", { layers: layers(d.sets["5"], 0.4) }),
    }),
    view: ({ step, d }) => (
      <>
        <Kicker>Part 3 · {SPEAKERS[2]} · Task 5</Kicker>
        <Title>Change the ratio</Title>
        <div className="card mt-2 flex items-center gap-4">
          <span className="math-md">T =</span>
          <Matrix m={d.runs["5"].variables.T as number[][]} />
        </div>
        <p className="body mt-4">With <b className="text-white">r = 1/3</b>, the small triangles separate, with gaps between them.</p>
        <Reveal step={step} at={1}>
          <p className="body mt-3">Pulled apart in 3D: three copies, each 1/3 the size, and they no longer touch.</p>
        </Reveal>
      </>
    ),
    notes: "Thanks. Now we change one thing at a time. Ratio. [DEMO Task 5] With r = 1/3, the small triangles separate with gaps.",
  },
  {
    id: "rotation",
    part: 3,
    name: "Rotation",
    tasks: [6],
    steps: 2,
    scene: (step, d) => ({
      camera: step === 0 ? { pos: [-1.6, -0.3, 3.6], target: [-0.95, 0, 0] } : RIGHT_HIGH,
      particles: step === 0 ? plot(d, "6", { duration: 2.4 }) : copies(d, "6", { layers: layers(d.sets["6"], 0.3) }),
    }),
    view: ({ step, d }) => {
      const theta = (d.runs["6"].variables.theta as number) ?? Math.PI / 18;
      return (
        <>
          <Kicker>Task 6</Kicker>
          <Title>Add a rotation</Title>
          <div className="card mt-2">
            <div className="flex items-center gap-4">
              <span className="math-md">T = ½ ·</span>
              <Matrix m={[[Math.cos(theta), -Math.sin(theta)], [Math.sin(theta), Math.cos(theta)]]} />
            </div>
            <p className="mt-2 text-sm text-white/50">θ = π/18 = {fmt((theta * 180) / Math.PI, 1)}°</p>
          </div>
          <p className="body mt-4">Each step now shrinks <b className="text-white">and</b> turns the plane, so the fractal twists.</p>
          <Reveal step={step} at={1}><p className="body mt-3">Every copy is rotated a little, again and again inside itself.</p></Reveal>
        </>
      );
    },
    notes: "Rotation. [DEMO Task 6] Multiplying by a rotation matrix with θ = π/18 makes each step shrink and turn, so the fractal twists.",
  },
  {
    id: "square",
    part: 3,
    name: "Square",
    tasks: [7],
    steps: 2,
    scene: (step, d) => {
      const s = d.sets["7"];
      return {
        camera: RIGHT,
        particles: step === 0 ? plot(d, "7") : copies(d, "7"),
        markers: starMarkers("sq-stars", s.vertices, "#ffffff", 30),
        outline: step === 1 ? { key: "sq-out", pts: s.vertices, opacity: 0.3 } : null,
      };
    },
    view: ({ step }) => (
      <>
        <Kicker>Task 7</Kicker>
        <Title>Switch to a square</Title>
        <p className="body">Four corners, r = ½. Surprise:</p>
        <p className="big-answer mt-3">no fractal.</p>
        <Reveal step={step} at={1}>
          <p className="body mt-4">The four half-size copies <b className="text-white">cover the square exactly</b>, so it just fills in.</p>
        </Reveal>
      </>
    ),
    notes: "Square. [DEMO Task 7] Surprise: with four corners and r = 1/2 there's no fractal. The four half-size copies cover the square exactly, so it just fills in.",
  },
  {
    id: "q2",
    part: 3,
    name: "Q2 · Square, ratio 1/3",
    tasks: [8],
    steps: 2,
    scene: (step, d) => ({
      camera: step === 0 ? RIGHT : RIGHT_TILT,
      particles: step === 0 ? plot(d, "8") : copies(d, "8", { layers: layers(d.sets["8"], 0.3) }),
      markers: step === 0 ? starMarkers("q2-stars", d.sets["8"].vertices, "#ffffff", 30) : null,
    }),
    view: ({ step }) => (
      <>
        <Kicker>Task 8</Kicker>
        <div className="card">
          <p className="q-label">Q2 · Is there a fractal with ratio 1/3?</p>
          <Reveal step={step} at={1}>
            <p className="big-answer">Yes.</p>
          </Reveal>
        </div>
        <Reveal step={step} at={1} delay={300}>
          <p className="body mt-4">The copies no longer cover the square, so the gaps stay, at every level.</p>
        </Reveal>
      </>
    ),
    notes: "[DEMO Task 8] Question 2: is there a fractal with ratio 1/3? Yes. The copies no longer cover the square, so the gaps stay.",
  },
  {
    id: "notsame",
    part: 3,
    name: "Not the same corner",
    tasks: [9],
    steps: 2,
    scene: (step, d) => ({
      camera: RIGHT,
      particles: step === 0 ? plot(d, "9", { size: 2.8 }) : copies(d, "9", { size: 2.8 }),
      markers: starMarkers("ns-stars", d.sets["9"].vertices, "#ffffff", 30),
    }),
    view: ({ step, d }) => {
      const s = d.sets["9"];
      const counts = Array.from({ length: s.copies }, (_, k) => s.copy.reduce((n, c) => n + (c === k ? 1 : 0), 0));
      const total = counts.reduce((a, b) => a + b, 0) || 1;
      return (
        <>
          <Kicker>Task 9 · Corner rules</Kicker>
          <Title>The new corner can&apos;t be the previous one</Title>
          <CodeBlock code={code(d, 9)} highlight={["if k >= k1", "k = (k + 1) % 4"]} className="mt-2 max-h-[24vh]" />
          <Reveal step={step} at={1}>
            <div className="mt-4 space-y-1.5">
              {counts.map((c, k) => (
                <div key={k} className="flex items-center gap-3 text-sm">
                  <span className="w-16 text-white/60">corner {k}</span>
                  <span className="bar" style={{ width: `${(c / total) * 260}px`, background: COPY_COLORS[k] }} />
                  <span className="tabular-nums text-white/70">{Math.round((c / total) * 100)}%</span>
                </div>
              ))}
              <p className="pt-2 text-xs text-white/40">The PDF&apos;s code favours one corner, so the shape is lopsided. We kept the code exactly as given.</p>
            </div>
          </Reveal>
        </>
      );
    },
    notes: "Corner rules. (Task 9, shown for completeness.) If the same corner can't be picked twice in a row, the square makes a new pattern. The PDF's version of this rule favours one corner, which is why it looks lopsided; we kept it as given.",
  },
  {
    id: "notopposite",
    part: 3,
    name: "Not the opposite corner",
    tasks: [10],
    steps: 2,
    scene: (step, d) => ({
      camera: step === 0 ? RIGHT : { pos: [-0.4, 1.8, 3.2], target: [-0.9, 0, 0] },
      particles: step === 0 ? plot(d, "10", { size: 2.8 }) : copies(d, "10", { size: 2.8, layers: layers(d.sets["10"], 0.22) }),
      markers: starMarkers("no-stars", d.sets["10"].vertices, "#ffffff", 30),
    }),
    view: ({ step, d }) => (
      <>
        <Kicker>Task 10 · Corner rules</Kicker>
        <Title>…can&apos;t be opposite the previous one</Title>
        <CodeBlock code={code(d, 10)} highlight={["(k != (k1 + 2) % 4)", "points[:, j + 1] = points[:, j]"]} className="mt-2 max-h-[26vh]" />
        <Reveal step={step} at={0} delay={400}>
          <p className="body mt-4">Same square, same ratio, one new rule, and a completely different pattern.</p>
        </Reveal>
      </>
    ),
    notes: "If the next corner can't be opposite the previous one, the same square gives a completely different pattern.",
  },
  {
    id: "pentagon",
    part: 3,
    name: "Pentagon",
    tasks: [13],
    steps: 2,
    scene: (step, d) => ({
      camera: step === 0 ? RIGHT : RIGHT_TILT,
      particles: step === 0 ? plot(d, "13", { duration: 2.4 }) : copies(d, "13", { layers: layers(d.sets["13"], 0.3) }),
      markers: step === 0 ? starMarkers("pent-stars", d.sets["13"].vertices, "#ffffff", 30) : null,
    }),
    view: ({ step, d }) => (
      <>
        <Kicker>Task 13</Kicker>
        <Title>A pentagon</Title>
        <div className="card mt-2 flex items-center gap-4">
          <span className="math-md">T =</span>
          <Matrix m={d.runs["13"].variables.T as number[][]} />
          <span className="body">ratio 2/5</span>
        </div>
        <p className="body mt-4">The same corner can&apos;t be picked twice in a row, and the result is this <b className="text-white">snowflake</b> shape.</p>
        <Reveal step={step} at={1}><p className="body mt-3">Five copies, each one a smaller snowflake.</p></Reveal>
      </>
    ),
    notes: "[DEMO Task 13] A pentagon with ratio 2/5, where the same corner can't be picked twice in a row, gives this snowflake shape.",
  },
  {
    id: "q3",
    part: 3,
    name: "Q3 · Hexagon",
    tasks: [12],
    steps: 5,
    scene: (step, d, live) => {
      const keys = ["12", hexKey(0.3), hexKey(0.33), hexKey(0.36), hexKey(0.33)];
      const key = live.hexLive && d.sets.hexLive ? "hexLive" : keys[step];
      return {
        camera: step === 3 ? RIGHT_NEAR : RIGHT,
        particles: copies(d, key, { size: 2.1, duration: 1.8 }),
        markers: starMarkers("hex-stars", d.sets["12"].vertices, "#ffffff", 26),
      };
    },
    view: ({ step, d, live }) => {
      const ratios = [0.25, 0.3, 0.33, 0.36, 0.33];
      const r = live.hexLive ? live.hexRatio : ratios[step];
      const shown = code(d, 12).replace("[[0.25, 0], [0, 0.25]]", `[[${r}, 0], [0, ${r}]]`);
      return (
        <>
          <Kicker>Task 12 · Question 3</Kicker>
          <Title>The hexagon</Title>
          <div className="card mt-1">
            <p className="q-label">Q3 · Largest ratio where the little hexagons don&apos;t touch?</p>
            <div className="mt-2 flex items-center gap-4">
              <span className="ratio-big">r = {r.toFixed(2)}</span>
              <span className="text-sm text-white/50">{step === 3 && !live.hexLive ? "they overlap" : step === 2 || step === 4 ? "just about touching" : ""}</span>
            </div>
          </div>
          <CodeBlock code={shown} highlight={["T = np.array"]} className="mt-3 max-h-[16vh]" />
          <Reveal step={step} at={4}>
            <div className="card mt-3">
              <p className="body">Neighbouring corners are 1 apart; each copy reaches r toward its neighbour:</p>
              <p className="math-lg mt-1">2r = 1 − r  →  r = 1/3</p>
              <p className="mt-1 text-white">Our answer: <b className="text-gradient text-xl">about 0.33</b></p>
            </div>
          </Reveal>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="range" min={0.1} max={0.6} step={0.01} value={live.hexRatio}
              onChange={(e) => live.setHexRatio(Number(e.target.value))}
              onKeyDown={(e) => e.stopPropagation()}
              className="slider"
            />
            <button className="run-btn" disabled={!!live.busy} onClick={() => live.rerun("hexLive", 12, live.hexRatio)}>
              {live.busy === "hexLive" ? "Running…" : `▶ Run with ${live.hexRatio.toFixed(2)}`}
            </button>
          </div>
        </>
      );
    },
    notes: "Question 3: the hexagon. [DEMO Task 12, change 0.25 to 0.33, Run] What's the largest ratio where the little hexagons don't touch? Neighbouring corners are 1 apart and each copy reaches r toward its neighbour, so they touch when 2r = 1 − r, which is r = 1/3. Our answer is about 0.33. Over to Speaker 4.",
  },

  // ======================= PART 4 =======================
  {
    id: "fern",
    part: 4,
    name: "Barnsley fern",
    tasks: [11],
    steps: 3,
    scene: (step, d) => ({
      camera: step === 0 ? { pos: [-0.95, -0.4, 3.9], target: [-0.95, 0, 0], dur: 2 } : step === 1 ? RIGHT : RIGHT_SIDE,
      particles:
        step === 0
          ? { ...plot(d, "11", { mode: "grow", duration: 4.5 }), colors: "#5ee6a8" }
          : copies(d, "11", step === 2 ? { layers: layers(d.sets["11"], 0.35) } : {}),
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
          <Kicker>Part 4 · {SPEAKERS[3]} · Task 11</Kicker>
          <Title>The Barnsley fern</Title>
          <p className="body">The same idea, with two changes: four different maps <span className="math-md">y = T<sub>j</sub> x + Q<sub>j</sub></span>, and they aren&apos;t chosen equally.</p>
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
          </Reveal>
          <Reveal step={step} at={2}>
            <p className="body mt-5">Four 2×2 matrices and four probabilities make a whole fern.</p>
          </Reveal>
        </>
      );
    },
    notes: "Thanks. [DEMO Task 11] This is the Barnsley fern. It uses the same idea with two changes: four different maps, y = Tj x + Qj, where Qj shifts the point; and they're not chosen equally. One map, picked 85% of the time, builds the leaf; two maps at 7% each make the side leaves; and one at 1% draws the stem. Four 2×2 matrices and four probabilities make a whole fern.",
  },
  {
    id: "app",
    part: 4,
    name: "Our app",
    steps: 3,
    scene: (_step, d) => ({
      camera: FAR,
      particles: copies(d, "11", { layers: layers(d.sets["11"], 0.35) }),
    }),
    view: ({ step, d }) => {
      const nodes = [
        { title: "lab10.py", sub: "the PDF's code, unchanged · NumPy + Matplotlib", tone: "gold" },
        { title: "api.py · FastAPI", sub: `runs a cell, reads the plotted points back out · Task 4 took ${Math.round((d.runs["4"]?.seconds ?? 0) * 1000)} ms`, tone: "violet" },
        { title: "Next.js + three.js", sub: "this page: draws the points it gets back", tone: "blue" },
      ];
      return (
        <>
          <Kicker>Our app</Kicker>
          <Title>It does no math itself</Title>
          <div className="pipeline mt-6">
            {nodes.map((n, i) => (
              <Reveal key={n.title} step={step} at={i}>
                <div className={`pipe-node pipe-${n.tone}`}>
                  <div className="font-semibold text-white">{n.title}</div>
                  <div className="text-sm text-white/55">{n.sub}</div>
                </div>
                {i < nodes.length - 1 && <div className="pipe-arrow">↓</div>}
              </Reveal>
            ))}
          </div>
          <Reveal step={step} at={2} delay={300}>
            <p className="body mt-4">What you saw is exactly the code we submit.</p>
          </Reveal>
        </>
      );
    },
    notes: "About our app: it does no math itself. It reads each task straight from lab10.py, runs it, and shows the plot, so what you saw is exactly the code we submit.",
  },
  {
    id: "learned",
    part: 4,
    name: "What we learned",
    steps: 3,
    scene: (step, d) => ({
      camera: step === 1 ? RIGHT : RIGHT_TILT,
      particles: step === 0 ? copies(d, "13", { layers: layers(d.sets["13"], 0.3) }) : step === 1 ? copies(d, "7") : copies(d, "4", { layers: layers(d.sets["4"], 0.4) }),
    }),
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
              <Reveal key={i} step={step} at={i}>
                <li className={step === i ? "active" : ""}>
                  <span className="rule-num">{i + 1}</span>
                  <span>{p}</span>
                </li>
              </Reveal>
            ))}
          </ol>
        </>
      );
    },
    notes: "Three things we learned: 1. One matrix mapping, repeated thousands of times, can create very complicated shapes. 2. Small changes to the ratio, a rotation or the corner rule completely change the result, and sometimes, like the square at 1/2, there's no fractal at all. 3. Randomness plus linear algebra gives order, not chaos.",
  },
  {
    id: "closing",
    part: 4,
    name: "Back to the question",
    steps: 2,
    layout: "center",
    scene: (step, d) => ({
      camera: step === 0 ? CENTER : CENTER_LOW,
      particles:
        step === 0
          ? { key: "one-dot-end", xy: new Float32Array([0, 0]), colors: "#ffffff", size: 34, duration: 2 }
          : copies(d, "4", { mode: "burst", origin: [0, 0], duration: 3 }),
      wobble: 0.006,
    }),
    view: ({ step }) => (
      <div className="flex h-full flex-col items-center pt-[9vh] text-center">
        <Reveal step={step} at={0}>
          <p className="big-question">Can random dots make a perfect pattern?</p>
        </Reveal>
        <Reveal step={step} at={1} delay={1600}>
          <p className="big-question mt-2">With the right <span className="text-gradient">matrix</span>, yes.</p>
        </Reveal>
      </div>
    ),
    notes: "So, back to our opening question: can random dots make a perfect pattern? With the right matrix, yes.",
  },
  {
    id: "thanks",
    part: 4,
    name: "Thank you",
    steps: 1,
    layout: "center",
    scene: (_s, d) => ({
      camera: { pos: [0, -2.6, 3.6], target: [0, -0.55, 0], dur: 3 },
      particles: copies(d, "13", { layers: layers(d.sets["13"], 0.3), duration: 2.6 }),
      wobble: 0.015,
    }),
    view: () => (
      <div className="flex h-full flex-col items-center justify-end pb-[12vh] text-center">
        <p className="thanks">Thank you</p>
        <p className="mt-3 text-[clamp(16px,1.6vw,26px)] text-white/70">Questions?</p>
        <p className="mt-6 text-sm tracking-[0.3em] text-white/40 uppercase">{SPEAKERS.join("  ·  ")}</p>
      </div>
    ),
    notes: "Thank you for listening. We're happy to take questions.",
  },
];

// ---------- merging ----------

const byId = (id: string) => {
  const slide = ALL.find((s) => s.id === id);
  if (!slide) throw new Error(`No slide "${id}"`);
  return slide;
};

/** Play several slides one after another as a single slide (their steps run back to back). */
function combine(id: string, name: string, ids: string[]): Slide {
  const parts = ids.map(byId);
  const locate = (step: number) => {
    let local = step;
    for (const part of parts) {
      if (local < part.steps) return { part, local };
      local -= part.steps;
    }
    const last = parts[parts.length - 1];
    return { part: last, local: last.steps - 1 };
  };
  return {
    id,
    name,
    part: parts[0].part,
    tasks: [...new Set(parts.flatMap((p) => p.tasks ?? []))],
    steps: parts.reduce((n, p) => n + p.steps, 0),
    layout: parts[0].layout,
    scene: (step, d, live) => {
      const { part, local } = locate(step);
      return part.scene(local, d, live);
    },
    view: (ctx) => {
      const { part, local } = locate(ctx.step);
      // keyed by the inner slide, so its content fades in when the next one starts
      return (
        <div key={part.id} className="sub-enter h-full">
          {part.view({ ...ctx, step: local })}
        </div>
      );
    },
    notes: (step) => {
      const { part, local } = locate(step);
      return typeof part.notes === "string" ? part.notes : part.notes(local);
    },
  };
}

export const SLIDES: Slide[] = [
  combine("intro", "Title & the question", ["title", "hook"]),
  byId("dynamical"),
  byId("rules"),
  byId("mapping"),
  combine("corners-matrix", "1–2 · Corners & matrix", ["corners", "matrix"]),
  combine("loop-plot", "3–4 · Loop & plot once", ["loop", "plot"]),
  combine("ratio-rotation", "Ratio & rotation", ["ratio", "rotation"]),
  combine("square-q2", "Square & Q2", ["square", "q2"]),
  combine("corner-rules", "Corner rules", ["notsame", "notopposite"]),
  byId("pentagon"),
  byId("q3"),
  byId("fern"),
  byId("app"),
  byId("learned"),
  combine("ending", "Back to the question", ["closing", "thanks"]),
];
