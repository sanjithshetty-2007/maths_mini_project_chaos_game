// Everything the slides need, loaded from the Python backend once at start.

import { getProject, runTask, type Project, type TaskRun } from "./api";
import { COPY_COLORS, pointSetFromRun, randomCloud, textPoints, type PointSet } from "./data";
import * as THREE from "three";

/** Extra runs fetched up front so every click is instant during the talk. */
export const HEX_RATIOS = [0.3, 0.33, 0.36];
export const hexKey = (r: number) => `12@${r.toFixed(2)}`;

export type Deck = {
  project: Project;
  runs: Record<string, TaskRun>;
  sets: Record<string, PointSet>;
  /** bumps when a set is re-run live, so the stage morphs to the new points */
  version: Record<string, number>;
  cloud: Float32Array;
  title: Float32Array;
  copyColors: (key: string) => Float32Array;
};

const copyColorCache = new WeakMap<PointSet, Float32Array>();
const RGB = COPY_COLORS.map((hex) => {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b];
});

export function makeCopyColors(set: PointSet): Float32Array {
  const cached = copyColorCache.get(set);
  if (cached) return cached;
  const out = new Float32Array(set.n * 3);
  for (let i = 0; i < set.n; i++) {
    const c = set.copy[i];
    out.set(c >= 0 ? RGB[c % RGB.length] : [0.8, 0.8, 0.9], i * 3);
  }
  copyColorCache.set(set, out);
  return out;
}

export async function loadDeck(onProgress: (done: number, total: number) => void): Promise<Deck> {
  const project = await getProject();
  const jobs: [string, () => Promise<TaskRun>][] = [
    ...project.tasks.map((t) => [String(t.id), () => runTask(t.id)] as [string, () => Promise<TaskRun>]),
    ["4b", () => runTask(4)],
    ...HEX_RATIOS.map((r) => [hexKey(r), () => runTask(12, r)] as [string, () => Promise<TaskRun>]),
  ];
  const runs: Record<string, TaskRun> = {};
  let done = 0;
  // The backend runs one cell at a time anyway, so go in order.
  for (const [key, job] of jobs) {
    runs[key] = await job();
    onProgress(++done, jobs.length);
  }
  const sets: Record<string, PointSet> = {};
  for (const [key, run] of Object.entries(runs)) {
    const set = pointSetFromRun(run);
    if (set) sets[key] = set;
  }
  return withSets({
    project,
    runs,
    sets,
    version: {},
    cloud: randomCloud(6000, 2.6, 1.5),
    title: textPoints(["CHAOS", "GAME"], 9000, 3.0),
    copyColors: () => new Float32Array(),
  });
}

/** Rebind helpers after the sets change. */
export function withSets(deck: Deck): Deck {
  return { ...deck, copyColors: (key: string) => makeCopyColors(deck.sets[key]) };
}

export async function rerun(deck: Deck, key: string, task: number, ratio?: number): Promise<Deck> {
  const run = await runTask(task, ratio);
  const set = pointSetFromRun(run);
  const next: Deck = {
    ...deck,
    runs: { ...deck.runs, [key]: run },
    sets: set ? { ...deck.sets, [key]: set } : deck.sets,
    version: { ...deck.version, [key]: (deck.version[key] ?? 0) + 1 },
  };
  return withSets(next);
}
