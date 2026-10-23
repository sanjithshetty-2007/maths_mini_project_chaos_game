"use client";

// Small building blocks for the slide overlays.

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Fades/slides content in once the presentation reaches step `at`. */
export function Reveal({ step, at = 0, until, children, className = "", delay = 0 }: {
  step: number; at?: number; until?: number; children: ReactNode; className?: string; delay?: number;
}) {
  const shown = step >= at && (until === undefined || step < until);
  return (
    <div
      className={`reveal ${shown ? "reveal-in" : "reveal-out"} ${className}`}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
      aria-hidden={!shown}
    >
      {children}
    </div>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  return <div className="kicker">{children}</div>;
}

export function Title({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={`slide-title ${className}`}>{children}</h2>;
}

const KEYWORDS = new Set(["import", "as", "for", "in", "range", "if", "else", "elif", "while", "and", "or", "not", "def", "return"]);

function highlightLine(line: string) {
  const out: ReactNode[] = [];
  const re = /(#.*$)|('[^']*'|"[^"]*")|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)|(\s+)|(.)/g;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(line))) {
    const [text, comment, str, num, word] = m;
    let cls = "";
    if (comment) cls = "tok-comment";
    else if (str) cls = "tok-string";
    else if (num) cls = "tok-number";
    else if (word && KEYWORDS.has(word)) cls = "tok-keyword";
    else if (word === "np" || word === "plt") cls = "tok-module";
    out.push(cls ? <span key={i++} className={cls}>{text}</span> : text);
  }
  return out;
}

/** Python code from lab10.py, with the lines being talked about lit up. */
export function CodeBlock({ code, highlight = [], maxLines, className = "" }: {
  code: string; highlight?: string[]; maxLines?: number; className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  let lines = code.replace(/\s+$/, "").split("\n");
  if (maxLines) lines = lines.slice(0, maxLines);
  const lit = lines.map((l) => highlight.some((h) => h && l.includes(h)));

  useEffect(() => {
    const el = box.current?.querySelector<HTMLElement>(".code-line.lit");
    const container = box.current;
    if (!el || !container) return;
    const top = el.offsetTop - container.clientHeight / 3;
    container.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, [highlight.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`code-block ${className}`}>
      <div className="code-bar">
        <span className="dot bg-[#ff5f57]" />
        <span className="dot bg-[#febc2e]" />
        <span className="dot bg-[#28c840]" />
        <span className="ml-3 text-white/45">lab10.py</span>
      </div>
      <div ref={box} className="code-scroll">
        {lines.map((line, i) => (
          <div key={i} className={`code-line ${lit[i] ? "lit" : highlight.length ? "dim" : ""}`}>
            <span className="code-num">{i + 1}</span>
            <span>{highlightLine(line) }</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Counts up while the dots are being drawn. */
export function Counter({ to, duration, run, className = "" }: { to: number; duration: number; run: boolean; className?: string }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      setValue(Math.round(t * to));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run, to, duration]);
  return <span className={`tabular-nums ${className}`}>{(run ? value : 0).toLocaleString()}</span>;
}

/** A 2×2 matrix in brackets. */
export function Matrix({ m, digits = 3 }: { m: number[][]; digits?: number }) {
  const fmt = (v: number) => {
    const r = Math.round(v * 10 ** digits) / 10 ** digits;
    return Object.is(r, -0) ? "0" : String(r);
  };
  return (
    <span className="matrix">
      <span className="matrix-grid">
        {m.flat().map((v, i) => (
          <span key={i}>{fmt(v)}</span>
        ))}
      </span>
    </span>
  );
}

export function Chip({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "gold" | "red" | "green" | "violet" }) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}
