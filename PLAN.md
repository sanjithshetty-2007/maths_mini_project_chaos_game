# Project 10 — Chaos Game: Analysis & Plan

Source of truth: *maths project-PROEJCT 10.pdf* (Zemlyanova, "Applied projects for an introductory linear algebra class", Project 10: Discrete dynamical systems, linear transformations of the plane, and the Chaos Game).
Status: **Phase 1 built:** `lab10.py` (all PDF code, unchanged) + `lab10_gui.py` (Tkinter GUI). Per your instruction, every cell uses the PDF code exactly as written; fixes wait until something breaks. Web (Phase 2) is on hold.

**Approach:** all the math lives in **Python** (`lab10.py`, which is the PDF's own deliverable). Later, a **Next.js + Tailwind** web page is connected to that Python code through a thin API. The browser only displays results; it never computes fractals itself.

---

## 1. What the project is

**Goal (from the PDF):** use matrix mappings of the plane R² in the form of a Chaos Game to produce fractals.

**Algorithm:**
1. Pick n points on the plane (vertices of a regular n-gon) and a ratio r, 0 < r < 1.
2. Pick a random starting point inside the polygon.
3. Repeat: pick a vertex v at random, move to the point a fraction r of the way from the current point to v.

**As a linear mapping:** `T(x) = T·(x − v) + v`, where `T = [[r, 0], [0, r]]` (or r × a rotation matrix in Task 6).
The Barnsley fern (Task 11) uses a different form: `y = Tj·x + Qj`, with map j chosen by probability Pj.

**Common setup used by almost every task:**
- Vertices: `t = np.linspace(0, 2π, n+1)` with the last element removed, `v = [cos t; sin t]` → regular n-gon, circumradius 1, first vertex on the x-axis.
- Start point: `x = np.random.rand(2,1) − 0.5` (random in [−0.5, 0.5]²).
- All points stored in a 2 × (Num+1) array, plotted **once** at the end (the PDF explicitly says plotting each point individually is too slow).
- Plot with `plt.axis('equal')`, tiny blue dots (`'b.'`, `markersize=1`).

**PDF's Python commands:** `np.linspace`, `for … in range`, `np.random.rand`, `np.random.randint`, `plt.plot`, `np.cos`, `np.sin`.
**Deliverable (from the PDF):** the file `lab10.py`, modified during the lab.

---

## 2. Task-by-task breakdown (the full scope — 13 tasks, 3 questions)

| # | Cell title in PDF | Vertices | Matrix T | Num | Vertex rule | Output |
|---|---|---|---|---|---|---|
| 1 | Sierpinski Triangle (setup) | triangle (n=3) | — | — | — | defines `t`, `v`; **Q1** |
| 2 | (setup, same cell) | triangle | `[[1/2,0],[0,1/2]]` | — | — | defines `T`, start `x` |
| 3 | (setup, same cell) | triangle | 1/2 | 10000 | — | plot vertices + start point, set `Num` |
| 4 | (same cell — iteration) | triangle | 1/2 | 10000 | any vertex | **Sierpinski triangle** (Fig. 13) |
| 5 | Sierpinski triangle with a change of ratio | triangle | 1/3 | 10000 | any | triangle fractal, ratio 1/3 |
| 6 | Sierpinski triangle with rotation | triangle | `½·[[cos θ, −sin θ],[sin θ, cos θ]]`, θ = π/18 | 10000 | any | rotated Sierpinski |
| 7 | Square | square (n=4) | 1/2 | 10000 | any | **no fractal** (square fills in) |
| 8 | Square with different ratio | square | 1/3 | 10000 | any | **Q2** |
| 9 | Square with vertex preference (not same as previous) | square | 1/2 | 5000 | new ≠ previous | fractal |
| 10 | Square with vertex preference (not opposite of previous) | square | 1/2 | 5000 | new not opposite previous; if rejected, point repeats | fractal |
| 11 | Barnsley fern | — | T1..T4 + Q1..Q4, probs 0.85/0.07/0.07/0.01 | 15000 | probabilistic | **Barnsley fern** (Fig. 14) |
| 12 | Hexagon | hexagon (n=6) | 1/4 | 15000 | any | Fig. 15 (first image); **Q3** |
| 13 | Pentagon | pentagon (n=5) | 2/5 | 10000 | new ≠ previous | Fig. 15 (second image) |

### Fern constants (Task 11, from the PDF)
```
T1=[0.85, 0.04; -0.04, 0.85]   Q1=[0; 1.64]      P1=0.85
T2=[-0.15, 0.28; 0.26, 0.24]   Q2=[-0.028; 1.05] P2=0.07
T3=[0.2, -0.26; 0.23, 0.22]    Q3=[0; 1.6]       P3=0.07
T4=[0, 0; 0, 0.16]             Q4=[0; 0]         P4=0.01
start x = np.random.rand(2)  (in [0,1]², not shifted by −0.5)
```

### The three questions
- **Q1 — What does `t(4)=[]` (Python: `np.delete(t, 3)`) do?** It removes the 4th value of `t`, which is 2π — the same angle as 0 — so the triangle doesn't get a duplicate vertex.
- **Q2 — Does the square with ratio 1/3 give a fractal?** Yes. With 1/2 the four shrunk copies exactly tile the square (it just fills in); with 1/3 they leave gaps, so you get a fractal (a "Cantor dust" made of squares).
- **Q3 — Largest hexagon ratio where the little hexagons don't touch (two decimals)?** Neighbouring vertices are 1 apart and each copy reaches r toward its neighbour, so they touch when 2r = 1 − r, i.e. r = 1/3. The expected answer is just under that, **≈ 0.33**. The ratio must be changeable for Task 12, because the task says to *experiment*.

---

## 3. Problems found in the PDF (need a decision before building)

The PDF is a MATLAB book converted to Python, and some parts didn't convert cleanly:

1. ~~**Task 3 code uses the wrong formula.**~~ **Not a bug (checked while building).** With r = 1/2, `T(x + v) = ½x + ½v = T(x − v) + v`, so both give the same Sierpinski triangle. Task 3 runs the PDF code as written.
2. **Task 9 vertex rule is biased.** The Python draws `randint(0,4)` and then shifts with `if k >= k1: k = (k+1) % 4`. That does block repeats, but vertex 0 gets picked half the time, so the picture is distorted. (The MATLAB original drew from 3 values and then shifted, which is uniform.)
   → **Recommendation:** use `np.random.randint(0, 3)` and then shift, which picks evenly from the 3 other vertices and matches the task's own description.
3. **Equations that were images are missing from the text** (the T(x) formula, Task 2's T, Task 6's matrix, Task 12's T). The code next to each one gives the values, so the table above uses those: 1/2, ½·rotation(π/18), 1/4.
4. **Leftover MATLAB snippets** in Tasks 10 and 11 (`clear;`, `hold on`, `plot(x(1,1),x(2,:))`) are ignored; the Python versions are used.
5. **Task 10 keeps rejected steps:** when an opposite vertex is drawn, the point is repeated rather than redrawn, so fewer than 5000 distinct points appear. This is the PDF's behaviour and will be kept as is.
6. **`plt.hold`** appears in the PDF's command list but no longer exists in Matplotlib; plotting several things on one figure already works without it.

---

## 4. Scope

### In scope (only what the PDF asks for)
- The 13 tasks as `lab10.py` cells, in order, with the parameters (vertices, T, Num, vertex rule) given in the PDF.
- Plots that match the PDF: equal axes, small blue points, black stars for vertices where the PDF plots them, the start point in Task 3, and the PDF's titles and legends.
- Q1, Q2 and Q3 answered where they appear (as comments in `lab10.py`; as text in the UI).
- **Task 12 only:** the ratio can be changed, because Q3 says "experiment with the ratio" (two decimals).
- **Web UI (phase 2):** shows the same 13 tasks, with a Run button per task that asks Python to rerun it with a new random start (the PDF's "don't forget to `clear`").

### Out of scope (not in the PDF — will not be added)
- Custom polygons, extra fractals, colour themes, animation/step-through, zoom/pan, exporting images, saving runs, accounts, a database, deployment.
- Ratio controls on any task other than 12. Tasks 5 and 8 have their ratios fixed by the PDF.

---

## 5. Architecture

```
project10/
├── python/                     ← PHASE 1: the main code (all the math)
│   ├── lab10.py                # the PDF deliverable: functions + one "# %%" cell per task
│   ├── api.py                  # PHASE 2: thin web API that calls lab10.py's functions
│   ├── test_lab10.py           # sanity checks for the math
│   └── requirements.txt        # numpy, matplotlib (+ fastapi, uvicorn for phase 2)
└── web/                        ← PHASE 2: Next.js + Tailwind (display only)
    ├── app/page.tsx            # intro + 13 task cards
    ├── components/TaskCell.tsx
    ├── components/PlotCanvas.tsx
    ├── components/MatrixView.tsx
    ├── lib/api.ts              # fetch() calls to the Python API
    └── next.config.ts          # rewrite /api/* → Python server (no CORS setup needed)
```

**Data flow:** Next.js page → `fetch('/api/tasks/4/run')` → Next.js rewrite → Python API → calls `lab10.py` → NumPy computes the points → JSON → the page draws the points on a `<canvas>`.

**One source of truth:** `lab10.py` holds every formula. `api.py` only imports its functions and returns their results as JSON. The UI holds no math.

---

## 6. Phase 1 — Python core (`lab10.py`)

Laid out like the PDF: one `# %%` cell per task, with the PDF's cell titles, so it runs cell by cell in VS Code / Spyder / Jupyter, and also top to bottom with `python lab10.py`.

### Reusable functions (top of the file)
Each task is the same algorithm with different settings, so the shared parts become functions that both the cells and the API use:

| Function | What it does (from the PDF) |
|---|---|
| `polygon_vertices(n)` | `t = np.linspace(0, 2π, n+1)`, drop the last value, return `np.array([np.cos(t), np.sin(t)])` |
| `scale_matrix(r)` | `[[r, 0], [0, r]]` |
| `rotation_scale_matrix(r, theta)` | `r · [[cos θ, −sin θ], [sin θ, cos θ]]` (Task 6) |
| `random_start()` | `np.random.rand(2) − 0.5` |
| `chaos_game(v, T, num, rule="any")` | Stores 2 × (num+1) points; step `x[:, j+1] = T @ (x[:, j] − w) + w`; `rule` is `"any"`, `"not_same"` (Tasks 9, 13) or `"not_opposite"` (Task 10); returns points and the start point |
| `barnsley_fern(num)` | The 4 maps and probabilities from Task 11; returns the points |
| `plot_result(points, v=None, start=None, title=…, legend=…)` | `plt.figure()`, `'b.'` with `markersize=1`, `'k*'` vertices, `axis('equal')`, title, legend, `plt.show()` |

### Cells
| Cell | Content |
|---|---|
| `# %% Sierpinski Triangle` | Tasks 1–4: `t`, `v` (+ Q1 comment), `T`, `x`, `Num = 10000`, plot vertices + start (Task 3), then iterate and plot (Task 4) |
| `# %% Sierpinski triangle with a change of ratio` | Task 5: T = 1/3 |
| `# %% Sierpinski triangle with rotation` | Task 6: θ = π/18 |
| `# %% Square` | Task 7 |
| `# %% Square with different ratio` | Task 8 + Q2 comment |
| `# %% Square with vertex preference (the new vertex cannot be the same as the previous)` | Task 9, Num = 5000 |
| `# %% Square with vertex preference (the new vertex cannot be opposite of the previous)` | Task 10, Num = 5000 |
| `# %% Barnsley fern` | Task 11, Num = 15000 |
| `# %% Hexagon` | Task 12, ratio variable at the top of the cell + Q3 comment |
| `# %% Pentagon` | Task 13, T = 2/5, not-same rule |

The cells sit under `if __name__ == "__main__":`, so `api.py` can import the functions without opening any plot windows.

### Checks (`test_lab10.py`)
- `polygon_vertices(3)` gives 3 points 1 unit from the origin, the first one at (1, 0).
- After the first few steps, every chaos-game point lies inside the polygon.
- The "not_same" rule never repeats a vertex; the "not_opposite" rule never moves toward the vertex opposite the previous one.
- The fern stays within about x ∈ [−2.2, 2.7], y ∈ [0, 10].
- The Task 9 rule picks each of the other 3 vertices about equally often.

---

## 7. Phase 2 — connecting the Next.js UI

### Python API (`api.py`, FastAPI)
FastAPI is chosen because it's small, validates inputs automatically, and runs with one command (`uvicorn api:app`).

| Endpoint | Returns |
|---|---|
| `GET /api/tasks` | The 13 tasks: id, title, instruction text, parameters (n, T, Num, rule), question text |
| `POST /api/tasks/{id}/run` | One fresh run: `{ points: {x: [...], y: [...]}, vertices, start, title, legend }` |
| body for Task 12 only | `{ "ratio": 0.33 }`, checked to be 0 < r < 1; ignored for every other task |

- Tasks 1–2 return the computed values (`t`, `v`, `T`, `x`) instead of points, since in the PDF they only define variables.
- Coordinates are rounded to 4 decimals, so the largest reply (15,001 points) stays around 250 KB.
- The task settings live in a single Python dict, so the UI and `lab10.py` can never disagree.

### Next.js + Tailwind (`web/`)
- **Page:** one scrolling page that works like the lab notebook: a header with the goal, algorithm and T(x) formula, then one card per task. A small task index (1–13) for jumping between cards.
- **TaskCell:** the instruction text, a parameter readout (matrix shown with `MatrixView`), a Run button with a loading state, the plot, and the question/answer box where the PDF has one. Task 12 also has the ratio input.
- **PlotCanvas:** draws the returned points on an HTML `<canvas>` with equal axes, small blue dots, black-star vertices, the title and the legend, matching the Matplotlib output. No chart library needed.
- **Connection:** `next.config.ts` rewrites `/api/*` to `http://localhost:8000`, so the browser only talks to Next.js and no CORS setup is needed.
- **Errors:** if the Python server isn't running, the card shows "Python server not reachable" instead of a blank plot.

### Running it (development)
```bash
cd python && uvicorn api:app --port 8000
```
```bash
cd web && npm run dev
```

---

## 8. Build order (once approved)
1. **Phase 1:** `lab10.py` functions → cells → `test_lab10.py`. Check each plot against Figs. 13–15 and the expected results (Task 7: no fractal; Q2: fractal; Q3: ≈ 0.33). *At this point the PDF's deliverable is complete on its own.*
2. **Phase 2a:** `api.py`, then test each endpoint directly.
3. **Phase 2b:** scaffold Next.js + Tailwind → `PlotCanvas` → `TaskCell` → page → connect to the API.
4. Final check: every UI plot matches the Matplotlib plot for the same task.

---

## 9. Open decisions for you
1. **Task 3 formula:** follow the task text and Task 4's correct formula *(recommended)*, or copy the PDF's `T(x+v)` code exactly?
2. **Task 9 rule:** uniform "not the same vertex" *(recommended)*, or copy the PDF's biased code exactly?
3. **Question answers:** answers to Q1–Q3 filled in, or left blank for you to write?
4. **Python code in the UI:** show each task's Python code next to its plot (read-only), or leave it out?
5. **API framework:** FastAPI *(recommended)* or Flask?
