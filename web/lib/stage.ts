// The 3D stage behind every slide (three.js + GSAP).
//
// One GPU particle system holds up to MAX_POINTS dots. Each dot has a "from"
// and a "to" position/colour/alpha; a single uniform (uProgress) moves every
// dot between them inside the shader, each with its own delay. That makes
// morphs between fractals smooth even with 15,000 points.
//
// Slides describe what they want with a SceneState; apply() works out what
// changed and animates only that.

import * as THREE from "three";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import gsap from "gsap";
import type { V2 } from "./data";

export const MAX_POINTS = 16000;

export type V3 = [number, number, number];

export type CameraShot = { pos: V3; target: V3; dur?: number };

export type ParticleTarget = {
  /** same key = nothing to do */
  key: string;
  xy: Float32Array;
  /** one colour for all, or rgb triples per point */
  colors: string | Float32Array;
  mode?: "morph" | "iterate" | "grow" | "burst" | "rise";
  duration?: number;
  /** iterate: points before this index are already in place */
  startAt?: number;
  size?: number;
  /** random depth spread (z) */
  depth?: number;
  /** a depth (z) for every point, for real 3D shapes */
  z?: Float32Array;
  /** pull each copy onto its own layer in z */
  layers?: { copy: Int16Array; copies: number; gap: number };
  /** burst: where the dots fly out from */
  origin?: V2;
};

export type Marker = { at: V2; shape: "star" | "ring" | "dot"; color: string; size: number };

export type SceneState = {
  camera: CameraShot;
  particles?: ParticleTarget | null;
  markers?: { key: string; items: Marker[] } | null;
  outline?: { key: string; pts: V2[]; color?: string; closed?: boolean; opacity?: number; draw?: number } | null;
  jumps?: { key: string; from: V2[]; to: V2[]; color?: string; times: number[] } | null;
  labels?: { key: string; items: { text: string; at: V2 | V3; cls?: string }[] } | null;
  plane?: { key: string; phase: number; r: number; v: V2; x: V2; tri: V2[] } | null;
  grid?: { key: string; scale: number; square?: boolean } | null;
  circle?: { key: string; radius: number } | null;
  /** gentle idle drift of every dot */
  wobble?: number;
};

// ---------- shaders ----------

const particleVertex = /* glsl */ `
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute vec3 aColFrom;
  attribute vec3 aColTo;
  attribute vec2 aAlpha;
  attribute float aDelay;
  attribute float aSeed;
  uniform float uProgress;
  uniform float uSpread;
  uniform float uWindow;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uWobble;
  uniform float uArc;
  varying vec3 vColor;
  varying float vAlpha;

  float ease(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }

  void main() {
    float lp = clamp((uProgress * (uSpread + uWindow) - aDelay * uSpread) / uWindow, 0.0, 1.0);
    float e = ease(lp);
    vec3 pos = mix(aFrom, aTo, e);
    pos.z += sin(e * 3.14159) * uArc * (aSeed - 0.5) * 2.0;
    pos.z += sin(uTime * 0.8 + aSeed * 40.0) * uWobble;
    pos.xy += vec2(sin(uTime * 0.6 + aSeed * 20.0), cos(uTime * 0.5 + aSeed * 30.0)) * uWobble * 0.25;
    vColor = mix(aColFrom, aColTo, e);
    vAlpha = mix(aAlpha.x, aAlpha.y, e);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (3.0 / -mv.z);
  }
`;

const particleFragment = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    float a = pow(core, 1.5) * vAlpha * uOpacity;
    gl_FragColor = vec4(vColor * (0.55 + 0.9 * core), a);
  }
`;

const markerVertex = /* glsl */ `
  attribute vec3 color;
  attribute float aShape;
  attribute float aSize;
  uniform float uPixelRatio;
  uniform float uTime;
  varying vec3 vColor;
  varying float vShape;
  void main() {
    vColor = color;
    vShape = aShape;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float pulse = aShape > 0.5 && aShape < 1.5 ? 1.0 + 0.12 * sin(uTime * 3.0) : 1.0;
    gl_PointSize = aSize * pulse * uPixelRatio * (3.0 / -mv.z);
  }
`;

const markerFragment = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vShape;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = 0.0;
    if (vShape < 0.5) {
      // five-pointed star
      float ang = atan(c.y, c.x);
      float r = 0.5 * (0.55 + 0.45 * pow(abs(cos(2.5 * ang)), 3.0));
      a = smoothstep(r, r - 0.06, d) + 0.35 * smoothstep(0.5, 0.0, d);
    } else if (vShape < 1.5) {
      // ring
      a = smoothstep(0.08, 0.0, abs(d - 0.36)) + 0.25 * smoothstep(0.5, 0.0, d);
    } else {
      a = smoothstep(0.5, 0.15, d);
    }
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a * uOpacity);
  }
`;

// ---------- helpers ----------

const easeCPU = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function hexToRgb(hex: string): [number, number, number] {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b];
}

function setOpacity(obj: THREE.Object3D, value: number) {
  obj.traverse((child) => {
    if (child instanceof CSS2DObject) {
      child.element.style.opacity = String(value);
      return;
    }
    const material = (child as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    if (!material) return;
    for (const m of Array.isArray(material) ? material : [material]) {
      const base = (m.userData.baseOpacity as number | undefined) ?? 1;
      const shader = m as THREE.ShaderMaterial;
      if (shader.uniforms?.uOpacity) shader.uniforms.uOpacity.value = value * base;
      else m.opacity = value * base;
    }
  });
}

function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if (child instanceof CSS2DObject) child.element.remove();
    const mesh = child as THREE.Mesh;
    mesh.geometry?.dispose();
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (material) (Array.isArray(material) ? material : [material]).forEach((m) => m.dispose());
  });
}

function lineMaterial(color: string, opacity: number) {
  const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
  m.userData.baseOpacity = opacity;
  return m;
}

/** A polyline split into many short pieces so it can be "drawn on" smoothly. */
function densePolyline(pts: V2[], closed: boolean, perEdge = 48): THREE.BufferGeometry {
  const path = closed ? [...pts, pts[0]] : pts;
  const out: number[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const [x0, y0] = path[i];
    const [x1, y1] = path[i + 1];
    for (let s = 0; s < perEdge; s++) {
      const t = s / perEdge;
      out.push(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 0);
    }
  }
  const last = path[path.length - 1];
  out.push(last[0], last[1], 0);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(out, 3));
  return g;
}

function makeLabel(text: string, cls = "") {
  const div = document.createElement("div");
  div.className = `stage-label ${cls}`;
  div.innerHTML = text;
  return new CSS2DObject(div);
}

type Slot = { key: string; obj: THREE.Object3D };

// ---------- the stage ----------

export class Stage {
  private renderer: THREE.WebGLRenderer;
  private labelRenderer: CSS2DRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private camTarget = new THREE.Vector3(0, 0, 0);
  private camBase = new THREE.Vector3(0, 0, 4);
  private pointer = new THREE.Vector2();
  private pointerSmooth = new THREE.Vector2();
  private startTime = performance.now();
  private frame = 0;
  private disposed = false;

  private geometry = new THREE.BufferGeometry();
  private material: THREE.ShaderMaterial;
  private from = new Float32Array(MAX_POINTS * 3);
  private to = new Float32Array(MAX_POINTS * 3);
  private colFrom = new Float32Array(MAX_POINTS * 3);
  private colTo = new Float32Array(MAX_POINTS * 3);
  private alpha = new Float32Array(MAX_POINTS * 2);
  private delay = new Float32Array(MAX_POINTS);
  private seed = new Float32Array(MAX_POINTS);
  private particleKey = "";
  private markerUniforms = { uPixelRatio: { value: 1 }, uTime: { value: 0 } };

  private slots: Record<string, Slot | undefined> = {};
  private stars: THREE.Points;
  private planeGroup: THREE.Group | null = null;
  private gridGroup: THREE.Group | null = null;

  constructor(private container: HTMLElement) {
    // Animations follow the real clock: if the browser drops frames (or the
    // tab is in the background), they still finish on time instead of crawling.
    gsap.ticker.lagSmoothing(0);
    const { clientWidth: w, clientHeight: h } = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.setClearColor("#04050a");
    container.appendChild(this.renderer.domElement);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(w, h);
    this.labelRenderer.domElement.className = "stage-labels";
    container.appendChild(this.labelRenderer.domElement);

    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 200);
    this.camera.position.copy(this.camBase);

    // particles
    for (let i = 0; i < MAX_POINTS; i++) this.seed[i] = Math.random();
    const attr = (name: string, array: Float32Array, size: number) =>
      this.geometry.setAttribute(name, new THREE.BufferAttribute(array, size).setUsage(THREE.DynamicDrawUsage));
    attr("position", new Float32Array(MAX_POINTS * 3), 3); // unused, keeps three.js happy
    attr("aFrom", this.from, 3);
    attr("aTo", this.to, 3);
    attr("aColFrom", this.colFrom, 3);
    attr("aColTo", this.colTo, 3);
    attr("aAlpha", this.alpha, 2);
    attr("aDelay", this.delay, 1);
    attr("aSeed", this.seed, 1);
    this.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);
    this.material = new THREE.ShaderMaterial({
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uProgress: { value: 1 },
        uSpread: { value: 0.3 },
        uWindow: { value: 1 },
        uTime: { value: 0 },
        uSize: { value: 4 },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uWobble: { value: 0.01 },
        uArc: { value: 0 },
        uOpacity: { value: 1 },
      },
    });
    const points = new THREE.Points(this.geometry, this.material);
    points.frustumCulled = false;
    this.scene.add(points);

    this.stars = this.makeStarfield();
    this.scene.add(this.stars);

    window.addEventListener("resize", this.onResize);
    window.addEventListener("pointermove", this.onPointer);
    this.loop();
  }

  // ---------- public ----------

  apply(state: SceneState) {
    this.moveCamera(state.camera);
    if (state.particles === null) this.hideParticles();
    else if (state.particles) this.setParticles(state.particles);
    gsap.to(this.material.uniforms.uWobble, { value: state.wobble ?? 0.008, duration: 1.2 });

    this.swap("markers", state.markers?.key, () => this.makeMarkers(state.markers!.items));
    this.swap("outline", state.outline?.key, () => this.makeOutline(state.outline!));
    this.swap("jumps", state.jumps?.key, () => this.makeJumps(state.jumps!));
    this.swap("labels", state.labels?.key, () => this.makeLabels(state.labels!.items));
    this.swap("circle", state.circle?.key, () => this.makeCircle(state.circle!.radius));
    this.applyGrid(state.grid ?? null);
    this.applyPlane(state.plane ?? null);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointermove", this.onPointer);
    gsap.killTweensOf(this.material.uniforms.uProgress);
    this.scene.traverse((o) => disposeObject(o));
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.labelRenderer.domElement.remove();
  }

  // ---------- camera ----------

  private moveCamera(shot: CameraShot) {
    const dur = shot.dur ?? 1.8;
    gsap.to(this.camBase, { x: shot.pos[0], y: shot.pos[1], z: shot.pos[2], duration: dur, ease: "power3.inOut", overwrite: true });
    gsap.to(this.camTarget, { x: shot.target[0], y: shot.target[1], z: shot.target[2], duration: dur, ease: "power3.inOut", overwrite: true });
  }

  // ---------- particles ----------

  /** Where every dot is right now (mid-animation included), so a new morph starts from there. */
  private snapshot() {
    const u = this.material.uniforms;
    const p = u.uProgress.value as number, S = u.uSpread.value as number, W = u.uWindow.value as number;
    const pos = new Float32Array(MAX_POINTS * 3);
    const col = new Float32Array(MAX_POINTS * 3);
    const alp = new Float32Array(MAX_POINTS);
    for (let i = 0; i < MAX_POINTS; i++) {
      const lp = Math.min(1, Math.max(0, (p * (S + W) - this.delay[i] * S) / W));
      const e = easeCPU(lp);
      for (let k = 0; k < 3; k++) {
        pos[i * 3 + k] = this.from[i * 3 + k] + (this.to[i * 3 + k] - this.from[i * 3 + k]) * e;
        col[i * 3 + k] = this.colFrom[i * 3 + k] + (this.colTo[i * 3 + k] - this.colFrom[i * 3 + k]) * e;
      }
      alp[i] = this.alpha[i * 2] + (this.alpha[i * 2 + 1] - this.alpha[i * 2]) * e;
    }
    return { pos, col, alp };
  }

  private flush() {
    for (const name of ["aFrom", "aTo", "aColFrom", "aColTo", "aAlpha", "aDelay"]) {
      (this.geometry.getAttribute(name) as THREE.BufferAttribute).needsUpdate = true;
    }
  }

  private hideParticles() {
    if (this.particleKey === "__hidden") return;
    this.particleKey = "__hidden";
    const now = this.snapshot();
    this.from.set(now.pos);
    this.to.set(now.pos);
    this.colFrom.set(now.col);
    this.colTo.set(now.col);
    for (let i = 0; i < MAX_POINTS; i++) {
      this.alpha[i * 2] = now.alp[i];
      this.alpha[i * 2 + 1] = 0;
      this.delay[i] = this.seed[i];
    }
    this.flush();
    this.run(1.0, 0.3, 1, 0);
  }

  private setParticles(t: ParticleTarget) {
    if (t.key === this.particleKey) return;
    this.particleKey = t.key;
    const now = this.snapshot();
    const n = Math.min(t.xy.length / 2, MAX_POINTS);
    const mode = t.mode ?? "morph";
    const single = typeof t.colors === "string" ? hexToRgb(t.colors) : null;
    const depth = t.depth ?? 0.04;

    let minY = Infinity, maxY = -Infinity;
    if (mode === "grow" || mode === "rise") {
      for (let i = 0; i < n; i++) {
        minY = Math.min(minY, t.xy[i * 2 + 1]);
        maxY = Math.max(maxY, t.xy[i * 2 + 1]);
      }
    }
    const startAt = Math.max(0, Math.min(t.startAt ?? 0, n));

    for (let i = 0; i < MAX_POINTS; i++) {
      const src = i < n ? i : Math.floor(this.seed[i] * n); // extra dots hide inside the shape
      const x = t.xy[src * 2] ?? 0;
      const y = t.xy[src * 2 + 1] ?? 0;
      let z = (this.seed[i] - 0.5) * depth;
      if (t.z) z += t.z[src] ?? 0;
      if (t.layers && i < n) {
        const c = t.layers.copy[i];
        if (c >= 0) z += (c - (t.layers.copies - 1) / 2) * t.layers.gap;
      }
      this.to[i * 3] = x;
      this.to[i * 3 + 1] = y;
      this.to[i * 3 + 2] = z;

      const rgb = single ?? [t.colors[src * 3] as number, t.colors[src * 3 + 1] as number, t.colors[src * 3 + 2] as number];
      this.colTo.set(rgb, i * 3);

      // where each dot starts
      let fx = now.pos[i * 3], fy = now.pos[i * 3 + 1], fz = now.pos[i * 3 + 2];
      let alphaFrom = now.alp[i];
      if (mode === "iterate" && i < n) {
        if (i < startAt) {
          fx = x; fy = y; fz = z; alphaFrom = 1;
        } else {
          const prev = Math.max(0, i - 1);
          fx = t.xy[prev * 2]; fy = t.xy[prev * 2 + 1]; fz = z;
          alphaFrom = 0;
        }
      } else if (mode === "grow" && i < n) {
        fx = 0; fy = minY; fz = 0; alphaFrom = 0;
      } else if (mode === "rise" && i < n) {
        fx = x; fy = minY; fz = z; alphaFrom = 0;
      } else if (mode === "burst" && i < n) {
        fx = t.origin?.[0] ?? 0; fy = t.origin?.[1] ?? 0; fz = 0; alphaFrom = 0;
      }
      this.from[i * 3] = fx;
      this.from[i * 3 + 1] = fy;
      this.from[i * 3 + 2] = fz;
      this.colFrom.set(mode === "iterate" && i >= startAt ? rgb : [now.col[i * 3], now.col[i * 3 + 1], now.col[i * 3 + 2]], i * 3);
      this.alpha[i * 2] = alphaFrom;
      this.alpha[i * 2 + 1] = i < n ? 1 : 0;

      // when each dot moves
      if (mode === "iterate") {
        this.delay[i] = i < startAt ? 0 : i < n ? (i - startAt) / Math.max(1, n - startAt) : 0;
      } else if (mode === "rise") {
        const yn = (y - minY) / Math.max(1e-6, maxY - minY);
        this.delay[i] = Math.min(1, this.seed[i] * 0.55 + yn * 0.45);
      } else if (mode === "grow") {
        const yn = (y - minY) / Math.max(1e-6, maxY - minY);
        this.delay[i] = Math.min(1, yn * 0.85 + this.seed[i] * 0.15);
      } else {
        this.delay[i] = this.seed[i];
      }
    }
    this.flush();

    const count = n - startAt;
    if (mode === "iterate") {
      const window = Math.max(0.002, Math.min(0.9, 0.8 / Math.max(1, count)));
      this.run(t.duration ?? 4, 1, window, 0.0);
    } else if (mode === "grow") {
      this.run(t.duration ?? 4.5, 1, 0.25, 0.15);
    } else if (mode === "rise") {
      this.run(t.duration ?? 4, 0.6, 0.5, 0);
    } else if (mode === "burst") {
      this.run(t.duration ?? 2.2, 0.4, 1, 0.6);
    } else {
      this.run(t.duration ?? 2.0, 0.35, 1, 0.35);
    }
    gsap.to(this.material.uniforms.uSize, { value: t.size ?? 3, duration: 1.2, ease: "power2.inOut" });
  }

  private run(duration: number, spread: number, window: number, arc: number) {
    const u = this.material.uniforms;
    gsap.killTweensOf(u.uProgress);
    u.uSpread.value = spread;
    u.uWindow.value = window;
    u.uArc.value = arc;
    u.uProgress.value = 0;
    gsap.to(u.uProgress, { value: 1, duration, ease: window < 0.05 ? "none" : "power1.inOut" });
  }

  // ---------- layers that cross-fade in and out ----------

  private swap(slot: string, key: string | undefined, make: () => THREE.Object3D) {
    const current = this.slots[slot];
    if (current?.key === key) return;
    if (current) {
      const old = current.obj;
      const fade = { v: 1 };
      gsap.to(fade, {
        v: 0, duration: 0.6, ease: "power2.out",
        onUpdate: () => setOpacity(old, fade.v),
        onComplete: () => { this.scene.remove(old); disposeObject(old); },
      });
    }
    this.slots[slot] = undefined;
    if (!key) return;
    const obj = make();
    setOpacity(obj, 0);
    this.scene.add(obj);
    this.slots[slot] = { key, obj };
    const fade = { v: 0 };
    gsap.to(fade, { v: 1, duration: 0.9, delay: 0.25, ease: "power2.out", onUpdate: () => setOpacity(obj, fade.v) });
  }

  private makeMarkers(items: Marker[]) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(items.flatMap((m) => [m.at[0], m.at[1], 0.01]), 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(items.flatMap((m) => hexToRgb(m.color)), 3));
    g.setAttribute("aShape", new THREE.Float32BufferAttribute(items.map((m) => ({ star: 0, ring: 1, dot: 2 })[m.shape]), 1));
    g.setAttribute("aSize", new THREE.Float32BufferAttribute(items.map((m) => m.size), 1));
    const material = new THREE.ShaderMaterial({
      vertexShader: markerVertex,
      fragmentShader: markerFragment,
      transparent: true,
      depthWrite: false,
      uniforms: { ...this.markerUniforms, uOpacity: { value: 1 } },
    });
    const p = new THREE.Points(g, material);
    p.frustumCulled = false;
    p.renderOrder = 2;
    return p;
  }

  private makeOutline(o: NonNullable<SceneState["outline"]>) {
    const geometry = densePolyline(o.pts, o.closed ?? true);
    const line = new THREE.Line(geometry, lineMaterial(o.color ?? "#ffffff", o.opacity ?? 0.35));
    const total = geometry.getAttribute("position").count;
    const draw = { c: 0 };
    geometry.setDrawRange(0, 0);
    gsap.to(draw, { c: total, duration: o.draw ?? 1.4, ease: "power2.inOut", delay: 0.2, onUpdate: () => geometry.setDrawRange(0, Math.floor(draw.c)) });
    return line;
  }

  private makeJumps(j: NonNullable<SceneState["jumps"]>) {
    const group = new THREE.Group();
    j.from.forEach((a, i) => {
      const b = j.to[i];
      const geometry = densePolyline([a, b], false, 30);
      const line = new THREE.Line(geometry, lineMaterial(j.color ?? "#fbbf24", 0.75));
      geometry.setDrawRange(0, 0);
      const total = geometry.getAttribute("position").count;
      const draw = { c: 0 };
      gsap.to(draw, { c: total, duration: 0.45, delay: j.times[i] ?? 0, ease: "power2.out", onUpdate: () => geometry.setDrawRange(0, Math.floor(draw.c)) });
      group.add(line);
    });
    return group;
  }

  private makeLabels(items: { text: string; at: V2 | V3; cls?: string }[]) {
    const group = new THREE.Group();
    for (const item of items) {
      const label = makeLabel(item.text, item.cls);
      label.position.set(item.at[0], item.at[1], item.at[2] ?? 0);
      group.add(label);
    }
    return group;
  }

  private makeCircle(radius: number) {
    const pts: V2[] = [];
    for (let i = 0; i < 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push([Math.cos(a) * radius, Math.sin(a) * radius]);
    }
    const geometry = densePolyline(pts, true, 2);
    return new THREE.Line(geometry, lineMaterial("#8ea4ff", 0.35));
  }

  // ---------- grid that a matrix shrinks (Task 2) ----------

  private applyGrid(grid: SceneState["grid"] | null) {
    if (!grid) {
      if (this.gridGroup) {
        const old = this.gridGroup;
        this.gridGroup = null;
        const fade = { v: 1 };
        gsap.to(fade, { v: 0, duration: 0.6, onUpdate: () => setOpacity(old, fade.v), onComplete: () => { this.scene.remove(old); disposeObject(old); } });
      }
      return;
    }
    if (!this.gridGroup) {
      this.gridGroup = this.makeGrid(1.25, 0.25, grid.square ?? true);
      setOpacity(this.gridGroup, 0);
      this.scene.add(this.gridGroup);
      const fade = { v: 0 };
      const g = this.gridGroup;
      gsap.to(fade, { v: 1, duration: 0.9, onUpdate: () => setOpacity(g, fade.v) });
    }
    gsap.to(this.gridGroup.scale, { x: grid.scale, y: grid.scale, duration: 1.8, ease: "power3.inOut" });
  }

  private makeGrid(extent: number, step: number, square: boolean) {
    const group = new THREE.Group();
    const pts: number[] = [];
    for (let v = -extent; v <= extent + 1e-6; v += step) {
      pts.push(-extent, v, 0, extent, v, 0, v, -extent, 0, v, extent, 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    group.add(new THREE.LineSegments(g, lineMaterial("#3b4a7a", 0.45)));
    const axes = new THREE.BufferGeometry();
    axes.setAttribute("position", new THREE.Float32BufferAttribute([-extent, 0, 0, extent, 0, 0, 0, -extent, 0, 0, extent, 0], 3));
    group.add(new THREE.LineSegments(axes, lineMaterial("#8ea4ff", 0.6)));
    if (square) {
      const sq = densePolyline([[0, 0], [1, 0], [1, 1], [0, 1]], true, 2);
      group.add(new THREE.Line(sq, lineMaterial("#fbbf24", 0.95)));
    }
    return group;
  }

  // ---------- the T(x) = T(x − v) + v demo ----------

  private applyPlane(plane: SceneState["plane"] | null) {
    if (!plane) {
      if (this.planeGroup) {
        const old = this.planeGroup;
        this.planeGroup = null;
        const fade = { v: 1 };
        gsap.to(fade, { v: 0, duration: 0.6, onUpdate: () => setOpacity(old, fade.v), onComplete: () => { this.scene.remove(old); disposeObject(old); } });
      }
      return;
    }
    if (!this.planeGroup) {
      const group = new THREE.Group();
      group.add(this.makeGrid(1.75, 0.25, false));
      group.add(new THREE.Line(densePolyline(plane.tri, true, 2), lineMaterial("#ffffff", 0.55)));
      group.add(this.makeMarkers([
        { at: plane.x, shape: "dot", color: "#5cc8ff", size: 34 },
        { at: plane.v, shape: "star", color: "#fbbf24", size: 46 },
      ]));
      const lx = makeLabel("x", "math");
      lx.position.set(plane.x[0] + 0.08, plane.x[1] + 0.1, 0);
      const lv = makeLabel("v", "math gold");
      lv.position.set(plane.v[0] + 0.1, plane.v[1] + 0.12, 0);
      group.add(lx, lv);
      setOpacity(group, 0);
      this.scene.add(group);
      this.planeGroup = group;
      const fade = { v: 0 };
      gsap.to(fade, { v: 1, duration: 0.9, onUpdate: () => setOpacity(group, fade.v) });
    }
    // phase 0: as is · 1: x − v · 2: T(x − v) · 3: T(x − v) + v
    const { phase, r, v } = plane;
    const scale = phase >= 2 ? r : 1;
    const pos: V2 = phase === 0 ? [0, 0] : phase === 1 ? [-v[0], -v[1]] : phase === 2 ? [-v[0] * r, -v[1] * r] : [v[0] - v[0] * r, v[1] - v[1] * r];
    gsap.to(this.planeGroup.position, { x: pos[0], y: pos[1], duration: 1.6, ease: "power3.inOut" });
    gsap.to(this.planeGroup.scale, { x: scale, y: scale, duration: 1.6, ease: "power3.inOut" });
  }

  // ---------- background ----------

  private makeStarfield() {
    const n = 2200;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 14 + Math.random() * 40;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      pos[i * 3 + 2] = r * Math.cos(ph) - 10;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ color: "#7f8fbf", size: 0.08, sizeAttenuation: true, transparent: true, opacity: 0.55, depthWrite: false });
    return new THREE.Points(g, m);
  }

  // ---------- loop ----------

  private onResize = () => {
    const { clientWidth: w, clientHeight: h } = this.container;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.labelRenderer.setSize(w, h);
    const ratio = Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(ratio);
    this.material.uniforms.uPixelRatio.value = ratio;
    this.markerUniforms.uPixelRatio.value = ratio;
  };

  private onPointer = (e: PointerEvent) => {
    this.pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  };

  private loop = () => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.loop);
    const t = (performance.now() - this.startTime) / 1000;
    this.material.uniforms.uTime.value = t;
    this.markerUniforms.uTime.value = t;
    this.markerUniforms.uPixelRatio.value = this.material.uniforms.uPixelRatio.value;

    // drift + a little mouse parallax keeps the scene alive between clicks
    this.pointerSmooth.lerp(this.pointer, 0.04);
    this.camera.position.set(
      this.camBase.x + Math.sin(t * 0.21) * 0.04 + this.pointerSmooth.x * 0.12,
      this.camBase.y + Math.cos(t * 0.17) * 0.03 - this.pointerSmooth.y * 0.08,
      this.camBase.z,
    );
    this.camera.lookAt(this.camTarget);
    this.stars.rotation.y = t * 0.006;
    this.stars.rotation.x = Math.sin(t * 0.05) * 0.02;

    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  };
}
