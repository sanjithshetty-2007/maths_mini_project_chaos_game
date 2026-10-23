# Project 10 — The Chaos Game: Presentation Script

**Length:** about 6 minutes (5 to 7 allowed)  ·  **Speakers:** 4  ·  **Demo:** the web presentation (`start_presentation.bat` or the Vercel link), already open in full screen
Speaking pace is about 130 words a minute. Each part says how long it should take; **[DEMO]** lines are where to press → (next) while you talk.

| Part | Speaker | Topic | Time |
|---|---|---|---|
| 1 | Speaker 1 | Opening + the problem | 0:00 – 1:30 |
| 2 | Speaker 2 | How the code solves it (first fractal) | 1:30 – 3:00 |
| 3 | Speaker 3 | Variations + the three questions | 3:00 – 4:40 |
| 4 | Speaker 4 | Barnsley fern, our app, closing | 4:40 – 6:10 |

---

## About the project

### What the assignment asks

Project 10 is from *Applied projects for an introductory linear algebra class* (Anna Zemlyanova): **"Discrete dynamical systems, linear transformations of the plane, and the Chaos Game."** The goal is to use matrix mappings of the plane R² in the form of a Chaos Game to produce fractals. There are 13 tasks and 3 questions, and the deliverable is one Python file, `lab10.py`.

### The idea in one paragraph

A **dynamical system** is a rule that gives the next state from the current one. When we only look at it in steps (k = 0, 1, 2, …) it is a **discrete** dynamical system: x<sub>k+1</sub> = f(x<sub>k</sub>). The **Chaos Game** (Michael Barnsley, *Fractals Everywhere*) is such a system on the plane: start at a random point, pick a corner of a polygon at random, jump a fraction *r* of the way toward it, and repeat. Thousands of random jumps do not give a random cloud. They settle onto one fixed shape, often a fractal.

### The mathematics

Each jump is a linear transformation of the plane followed by a shift:

> **T(x) = T · (x − v) + v**,  with T = [ r 0 ; 0 r ]

- **x − v** moves the chosen corner *v* to the origin.
- **T ·** shrinks the whole plane by the ratio *r* (in Task 6, T also rotates it by θ = π/18).
- **+ v** moves it back. The corner *v* itself never moves, so it is the fixed point of that map.

Each corner gives one map, and each map sends the whole shape onto a smaller copy of itself next to that corner. The final picture (the **attractor**) is exactly the union of those shrunken copies. That is why the result is **self-similar**, and why it looks the same on every run even though every jump is random.

- If the copies overlap or exactly cover the shape (the square with r = ½), the points just fill the area and there is **no fractal**.
- If the copies leave gaps (ratio 1/3, or the corner rules), the gaps repeat at every scale and a **fractal** appears.

The **Barnsley fern** (Task 11) uses the same idea with four different maps y = T<sub>j</sub> x + Q<sub>j</sub>, chosen with probabilities 85%, 7%, 7% and 1%.

### The 13 tasks and what each one shows

1. **Task 1:** triangle corners from `np.linspace(0, 2π, 4)`; the last angle is deleted (Q1).
2. **Task 2:** the matrix T = ½·I ("jump halfway") and a random start point.
3. **Task 3:** plot the corners, the start point and Num = 10,000 points with one `plt.plot`.
4. **Task 4:** the loop T @ (x − v) + v gives the **Sierpinski triangle**.
5. **Task 5:** ratio 1/3, so the three copies separate with gaps.
6. **Task 6:** shrink by ½ *and* rotate by π/18, so the triangle twists.
7. **Task 7:** a square with ratio ½ gives **no fractal**; the four copies tile the square.
8. **Task 8:** the square with ratio 1/3 gives a fractal (Q2).
9. **Task 9:** the square where a corner can't be picked twice in a row.
10. **Task 10:** the square where the next corner can't be opposite the previous one.
11. **Task 11:** the **Barnsley fern**, four maps with unequal probabilities.
12. **Task 12:** a hexagon with ratio ¼; experiment with the ratio (Q3).
13. **Task 13:** a pentagon with ratio 2/5 where a corner can't repeat, giving a snowflake.

### Answers to the three questions

- **Q1. What does deleting t[3] do?** `linspace(0, 2π, 4)` gives 0, 2π/3, 4π/3 and 2π. The angle 2π is the same point as 0, so deleting it stops the triangle from having the same corner twice.
- **Q2. Does the square with ratio 1/3 make a fractal?** **Yes.** With ½ the four copies cover the square exactly; with 1/3 they leave gaps, and the gaps repeat at every level.
- **Q3. Largest hexagon ratio where the little hexagons don't touch?** Neighbouring corners are 1 apart and each copy reaches *r* toward its neighbour, so they touch when 2r = 1 − r, i.e. r = 1/3. Our answer is **about 0.33**.

### What we built

- **`lab10.py`:** the deliverable. Every task's code from the PDF, copied without changes, one `# %%` cell per task.
- **Desktop app (`run_gui.bat`):** a window that lists the 13 tasks, shows each one's code, runs it and draws its plot.
- **Python backend (`api.py`, FastAPI):** runs any cell of `lab10.py` and sends back the points it plotted.
- **Web presentation (`web/`, Next.js + Tailwind + three.js):** the 3D slides we present with. It does no math itself; every dot it draws comes from running `lab10.py` on the Python backend.

### Two things we noticed in the PDF's code

- **Task 3** writes the jump as T @ (x + v) instead of T @ (x − v) + v. With r = ½ both give ½x + ½v, so the result is the same Sierpinski triangle.
- **Task 9's** corner rule picks from all 4 corners and then shifts the pick to avoid the last one, so one corner comes up about half the time and the shape is lopsided. As the assignment's code, we kept it exactly as given.

---

## Part 1 — Opening and the problem  ·  Speaker 1  ·  ~1:30

Good morning everyone. We're presenting Project 10: *Discrete dynamical systems, linear transformations of the plane, and the Chaos Game.*

Let's start with a question: if you place dots completely at random, can you end up with a perfect pattern? Most people would say no. We'll show you the answer is yes, and that the reason is linear algebra.

A **dynamical system** is one where the next state depends on the current state, like a population that grows once a year. Since we only look at it in steps, it's a **discrete** dynamical system.

The **Chaos Game**, by Michael Barnsley, is exactly that. The rules:
1. Take the corners of a shape, say a triangle.
2. Pick a random starting point.
3. Choose a random corner and jump part of the way toward it, by a ratio *r*.
4. Repeat thousands of times.

The key idea is that this jump is a **matrix mapping**:

> **T(x) = T · (x − v) + v**,  where T = [ r 0 ; 0 r ]

Subtracting the corner *v* moves it to the origin, the matrix shrinks everything by *r*, and adding *v* moves it back. Every step is a linear transformation of the plane.

Over to [Speaker 2] to show how we did it in Python.

---

## Part 2 — How the code solves it  ·  Speaker 2  ·  ~1:30

Thanks. Our code is one Python file, `lab10.py`, using NumPy for the math and Matplotlib for plots. Four steps.

**One: the corners.** `np.linspace(0, 2π, 4)` gives four angles, and we delete the last one. *That's Question 1:* the last angle, 2π, is the same point as 0, so deleting it avoids a duplicate corner. Cosine and sine then give three corners on a circle of radius 1.

**Two: the matrix.** T is `[[0.5, 0], [0, 0.5]]`, meaning "jump halfway", and the start point is random.

**Three: the loop.** 10,000 times, `np.random.randint` picks a corner *k*, and we apply
`T @ (current_point − v[:, k]) + v[:, k]`.
Each new point goes into one 2 × 10,001 array.

**Four: plot once.** We draw everything at the end with a single `plt.plot`, because plotting every point separately is far too slow.

**[DEMO] Press → on the "Plot once" slide: the dots become the Sierpinski triangle.**

Here it is: the **Sierpinski triangle**, built from random jumps, and the same shape every run. Over to [Speaker 3].

---

## Part 3 — Variations and the questions  ·  Speaker 3  ·  ~1:40

Thanks. Now we change one thing at a time.

**Ratio.** **[DEMO] Task 5, press →.** With r = 1/3, the small triangles separate with gaps.

**Rotation.** **[DEMO] Task 6, press →.** Multiplying by a rotation matrix with θ = π/18 makes each step shrink *and* turn, so the fractal twists.

**Square.** **[DEMO] Task 7, press →.** Surprise: with four corners and r = 1/2 there's **no fractal**. The four half-size copies cover the square exactly, so it just fills in.

**[DEMO] Task 8, press →.** *Question 2: is there a fractal with ratio 1/3?* **Yes.** The copies no longer cover the square, so the gaps stay.

**Corner rules.** **[DEMO] Task 13, press →.** A pentagon with ratio 2/5, where the same corner can't be picked twice in a row, gives this snowflake shape.

**Question 3: the hexagon.** **[DEMO] Task 12, press → to step the ratio 0.25 → 0.30 → 0.33.** What's the largest ratio where the little hexagons don't touch? Neighbouring corners are 1 apart and each copy reaches *r* toward its neighbour, so they touch when 2r = 1 − r, which is r = 1/3. Our answer is **about 0.33**.

Over to [Speaker 4].

---

## Part 4 — Barnsley fern, our app, and closing  ·  Speaker 4  ·  ~1:30

Thanks. **[DEMO] Task 11, press →: the fern grows.**

This is the **Barnsley fern**. It uses the same idea with two changes: four different maps, *y = Tⱼ x + Qⱼ*, where *Qⱼ* shifts the point; and they're not chosen equally. One map, picked 85% of the time, builds the leaf; two maps at 7% each make the side leaves; and one at 1% draws the stem. Four 2×2 matrices and four probabilities make a whole fern.

**About our app:** it does no math itself. It reads each task straight from `lab10.py`, runs it, and shows the plot, so what you saw is exactly the code we submit.

**Three things we learned:**
1. One matrix mapping, repeated thousands of times, can create very complicated shapes.
2. Small changes to the ratio, a rotation or the corner rule completely change the result, and sometimes, like the square at 1/2, there's no fractal at all.
3. Randomness plus linear algebra gives order, not chaos.

So, back to our opening question: can random dots make a perfect pattern? With the right matrix, yes.

Thank you for listening. We're happy to take questions.

---

## Before you present
- Open the presentation **before** you start (`start_presentation.bat`, or the Vercel link), wait for it to finish loading, and press **F** for full screen.
- Do a full practice run with a timer. The script is about 6 minutes, including clicking and waiting for the animations.
  - **Running long?** Drop the rotation demo (Task 6), which saves about 15 seconds.
  - **Running short?** Add Task 10 to Part 3: "If the next corner can't be opposite the previous one, the same square gives a completely different pattern."
- Task 12 demo: the hexagon slide steps through the ratios by itself as you press →. To try another ratio live, use the slider and the green **Run** button on that slide.
- Each run gives a slightly different picture, which is normal; the overall shape stays the same.
- Press **N** at any time to see your lines for the current slide on screen.

## Possible questions from the class
- **Why does randomness give the same picture every time?** Every map pulls points toward the same shape (the "attractor"), so wherever you start, after a few steps you're on it.
- **Why not plot each point inside the loop?** Each `plt.plot` call is slow; plotting 10,000 times would take far longer than plotting once at the end.
- **What does `@` mean?** It's matrix multiplication in Python.
- **Task 9 looks lopsided. Why?** The PDF's code picks from all 4 corners and then shifts the pick to avoid the last corner. That shift lands on the right-hand corner (corner 0) twice as often, so it's chosen about half the time. We kept the PDF's code exactly as given.
