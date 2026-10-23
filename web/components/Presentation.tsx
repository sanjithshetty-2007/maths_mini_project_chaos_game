"use client";

// Full-screen presentation: a three.js stage behind, slide content in front.
// → / Space / click "next" moves one step; ← goes back; F toggles full screen;
// N shows the speaker's script for the slide.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getHealth } from "@/lib/api";
import { loadDeck, rerun, type Deck } from "@/lib/deck";
import { PART_TITLES, SLIDES, SPEAKERS, type Live } from "@/lib/slides";
import { Stage } from "@/lib/stage";

type Position = { slide: number; step: number };

function readHash(): Position {
  const m = /^#(\d+)(?:\.(\d+))?$/.exec(typeof window === "undefined" ? "" : window.location.hash);
  if (!m) return { slide: 0, step: 0 };
  const slide = Math.min(SLIDES.length - 1, Math.max(0, Number(m[1]) - 1));
  const step = Math.min(SLIDES[slide].steps - 1, Math.max(0, Number(m[2] ?? 1) - 1));
  return { slide, step };
}

export default function Presentation() {
  const stageBox = useRef<HTMLDivElement>(null);
  const stage = useRef<Stage | null>(null);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState({ done: 0, total: 1 });
  const [error, setError] = useState<string | null>(null);
  const [pos, setPos] = useState<Position>({ slide: 0, step: 0 });
  const [leaving, setLeaving] = useState<number | null>(null);
  const [notes, setNotes] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [hexRatio, setHexRatio] = useState(0.33);
  const [hexLive, setHexLive] = useState(false);
  const [cells, setCells] = useState<number | null>(null);
  const [idle, setIdle] = useState(false);

  // ---- load everything from the Python backend ----
  const fetchDeck = useCallback(() => {
    loadDeck((done, total) => setLoading({ done, total }))
      .then((d) => {
        setDeck(d);
        setPos(readHash());
      })
      .catch((e: Error) => setError(e.message));
    getHealth().then((h) => setCells(h.cells)).catch(() => setCells(null));
  }, []);

  useEffect(() => {
    fetchDeck();
  }, [fetchDeck]);

  const retry = () => {
    setError(null);
    setLoading({ done: 0, total: 1 });
    fetchDeck();
  };

  // ---- three.js stage ----
  useEffect(() => {
    if (!stageBox.current) return;
    const s = new Stage(stageBox.current);
    stage.current = s;
    return () => {
      s.dispose();
      stage.current = null;
    };
  }, []);

  const live: Live = useMemo(
    () => ({
      busy,
      hexRatio,
      setHexRatio,
      hexLive,
      rerun: async (key, task, ratio) => {
        if (!deck) return;
        setBusy(key);
        try {
          const next = await rerun(deck, key, task, ratio);
          setDeck(next);
          if (key === "hexLive") setHexLive(true);
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(null);
        }
      },
    }),
    [busy, hexRatio, hexLive, deck],
  );

  // ---- apply the scene for the current step ----
  const slide = SLIDES[pos.slide];
  useEffect(() => {
    if (!deck || !stage.current) return;
    stage.current.apply(slide.scene(pos.step, deck, live));
  }, [deck, pos, slide, live]);

  useEffect(() => {
    if (deck) window.history.replaceState(null, "", `#${pos.slide + 1}.${pos.step + 1}`);
  }, [pos, deck]);

  // ---- navigation ----
  // (a live Q3 run only lasts until the next click)
  const go = useCallback((dir: 1 | -1) => {
    setHexLive(false);
    setPos((p) => {
      const s = SLIDES[p.slide];
      if (dir === 1) {
        if (p.step < s.steps - 1) return { ...p, step: p.step + 1 };
        if (p.slide < SLIDES.length - 1) {
          setLeaving(p.slide);
          return { slide: p.slide + 1, step: 0 };
        }
        return p;
      }
      if (p.step > 0) return { ...p, step: p.step - 1 };
      if (p.slide > 0) {
        setLeaving(p.slide);
        return { slide: p.slide - 1, step: SLIDES[p.slide - 1].steps - 1 };
      }
      return p;
    });
  }, []);

  const jump = (slideIndex: number) => {
    setHexLive(false);
    setLeaving(pos.slide);
    setPos({ slide: slideIndex, step: 0 });
  };

  useEffect(() => {
    if (leaving === null) return;
    const t = setTimeout(() => setLeaving(null), 650);
    return () => clearTimeout(t);
  }, [leaving, pos.slide]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); go(1); }
      else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); go(-1); }
      else if (e.key === "f" || e.key === "F") toggleFullscreen();
      else if (e.key === "n" || e.key === "N") setNotes((v) => !v);
      else if (e.key === "Home") jump(0);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // hide the controls when the mouse is still
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const wake = () => {
      setIdle(false);
      clearTimeout(t);
      t = setTimeout(() => setIdle(true), 2600);
    };
    wake();
    window.addEventListener("pointermove", wake);
    return () => { window.removeEventListener("pointermove", wake); clearTimeout(t); };
  }, []);

  // ---- render ----
  const totalSteps = SLIDES.reduce((n, s) => n + s.steps, 0);
  const doneSteps = SLIDES.slice(0, pos.slide).reduce((n, s) => n + s.steps, 0) + pos.step + 1;

  const renderSlide = (index: number, className: string) => {
    const s = SLIDES[index];
    const step = index === pos.slide ? pos.step : s.steps - 1;
    return (
      <div key={s.id} className={`slide ${s.layout === "center" ? "slide-center" : "slide-left"} ${className}`}>
        {s.layout === "center" ? s.view({ step, d: deck!, live }) : <div className="slide-panel">{s.view({ step, d: deck!, live })}</div>}
      </div>
    );
  };

  return (
    <main className="deck">
      <div ref={stageBox} className="stage" />
      <div className="vignette" />

      {deck && (
        <>
          {/* top bar */}
          <header className={`topbar ${idle ? "idle" : ""}`}>
            <div className="brand">
              <span className="brand-mark">P10</span>
              <span className="hidden md:inline">The Chaos Game</span>
            </div>
            <nav className="parts">
              {PART_TITLES.map((t, i) => {
                const first = SLIDES.findIndex((s) => s.part === i + 1);
                const active = slide.part === i + 1;
                return (
                  <button key={t} className={`part ${active ? "active" : ""}`} onClick={() => jump(first)}>
                    <span className="part-n">{i + 1}</span>
                    <span className="part-t">{SPEAKERS[i]} · {t}</span>
                  </button>
                );
              })}
            </nav>
            <div className="flex items-center gap-2">
              {slide.tasks?.map((t) => <span key={t} className="task-chip">Task {t}</span>)}
              <span className="backend-chip" title="Python backend (FastAPI)">
                <span className={`live-dot ${cells ? "on" : ""}`} />
                Python{cells ? ` · ${cells} cells` : ""}
              </span>
            </div>
          </header>

          {/* slide content */}
          {leaving !== null && leaving !== pos.slide && renderSlide(leaving, "slide-leave")}
          {renderSlide(pos.slide, "slide-enter")}

          {/* bottom controls */}
          <footer className={`bottombar ${idle ? "idle" : ""}`}>
            <div className="counter-text">
              {String(pos.slide + 1).padStart(2, "0")} <span className="text-white/30">/ {SLIDES.length}</span>
              <span className="ml-3 text-white/40">{slide.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="step-dots">
                {Array.from({ length: slide.steps }, (_, i) => (
                  <span key={i} className={i <= pos.step ? "on" : ""} />
                ))}
              </div>
              <button className="nav-btn" onClick={() => setNotes((v) => !v)} title="Speaker script (N)">N</button>
              <button className="nav-btn" onClick={toggleFullscreen} title="Full screen (F)">⛶</button>
              <button className="nav-btn" onClick={() => go(-1)} aria-label="Previous">←</button>
              <button className="nav-btn nav-next" onClick={() => go(1)} aria-label="Next">→</button>
            </div>
          </footer>
          <div className="progress"><div style={{ width: `${(doneSteps / totalSteps) * 100}%` }} /></div>

          {notes && (
            <aside className="notes">
              <div className="mb-1 text-xs uppercase tracking-widest text-white/40">
                Part {slide.part} · {SPEAKERS[slide.part - 1]} · script
              </div>
              <p>{typeof slide.notes === "string" ? slide.notes : slide.notes(pos.step)}</p>
            </aside>
          )}
        </>
      )}

      {/* loading / error */}
      {!deck && (
        <div className="loader">
          {error ? (
            <div className="max-w-xl text-center">
              <p className="text-2xl font-semibold text-white">Can&apos;t reach the Python backend</p>
              <p className="mt-3 text-white/60">{error}</p>
              <p className="mt-5 text-white/60">Start it from the project folder, then try again:</p>
              <pre className="mt-2 rounded-lg bg-white/5 px-4 py-3 text-left text-sm text-[#5cc8ff]">py -m uvicorn api:app --port 8000</pre>
              <button className="run-btn mt-6" onClick={retry}>Try again</button>
            </div>
          ) : (
            <div className="text-center">
              <p className="kicker">Project 10 · The Chaos Game</p>
              <p className="mt-3 text-white/70">Running lab10.py on the Python backend… {loading.done}/{loading.total}</p>
              <div className="loader-bar"><div style={{ width: `${(loading.done / loading.total) * 100}%` }} /></div>
            </div>
          )}
        </div>
      )}
      {deck && error && (
        <div className="toast" onClick={() => setError(null)}>{error} · click to dismiss</div>
      )}
    </main>
  );
}
