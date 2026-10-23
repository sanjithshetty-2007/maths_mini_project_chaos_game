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
