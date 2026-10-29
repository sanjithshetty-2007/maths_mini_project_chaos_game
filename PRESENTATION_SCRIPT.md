# Project 10 — The Chaos Game: Presentation Script

**Length:** about 6½ minutes (5 to 7 allowed)  ·  **Speakers:** 5  ·  **Demo:** the presentation (`start_presentation.bat`), already open in full screen
Speaking pace is about 130 words a minute. Each part says how long it should take; **[DEMO]** lines are where to press → (next) while you talk. The whole deck is 12 slides and 29 presses.

| Part | Speaker | Topic | Time |
|---|---|---|---|
| 1 | Saathvik | Opening, dynamical systems, the Chaos Game | 0:00 – 1:10 |
| 2 | Sammedh | The matrix mapping and the Sierpinski triangle | 1:10 – 2:40 |
| 3 | Sanjith | Changing the map: ratio, rotation, square (Q2) | 2:40 – 3:40 |
| 4 | Samarth R K | Corner rules and the hexagon (Q3) | 3:40 – 4:50 |
| 5 | Shashank | Barnsley fern, real-world applications, closing | 4:50 – 6:25 |

---

## About the project

### What the assignment asks

Project 10 is from *Applied projects for an introductory linear algebra class* (Anna Zemlyanova): **"Discrete dynamical systems, linear transformations of the plane, and the Chaos Game."** The goal is to use matrix mappings of the plane R² in the form of a Chaos Game to produce fractals. There are 13 tasks and 3 questions, and the deliverable is one Python file, `lab10.py`, written with the Python libraries **NumPy** (vectors, matrices and random numbers) and **Matplotlib** (plotting).

### The idea in one paragraph

A **dynamical system** is a rule that gives the next state from the current one. When we only look at it in steps (k = 0, 1, 2, …) it is a **discrete** dynamical system: x<sub>k+1</sub> = f(x<sub>k</sub>). The **Chaos Game** (Michael Barnsley, *Fractals Everywhere*) is such a system on the plane: start at a random point, pick a corner of a polygon at random, jump a fraction *r* of the way toward it, and repeat. Thousands of random jumps do not give a random cloud. They settle onto one fixed shape, often a fractal.

### The mathematics

Each jump is a linear transformation of the plane followed by a shift:

> **T(x) = T · (x − v) + v**,  with T = [ r 0 ; 0 r ]

- **x − v** moves the chosen corner *v* to the origin.
- **T ·** shrinks the whole plane by the ratio *r* (in Task 6, T also rotates it by θ = π/18).
- **+ v** moves it back. The corner *v* itself never moves, so it is the **fixed point** of that map.

Each corner gives one map, and each map sends the whole shape onto a smaller copy of itself next to that corner. The final picture (the **attractor**) is exactly the union of those shrunken copies. That is why the result is **self-similar**, and why it looks the same on every run even though every jump is random.

- If the copies overlap or exactly cover the shape (the square with r = ½), the points just fill the area and there is **no fractal**.
- If the copies leave gaps (ratio 1/3, or the corner rules), the gaps repeat at every scale and a **fractal** appears.

The **Barnsley fern** (Task 11) uses the same idea with four different maps y = T<sub>j</sub> x + Q<sub>j</sub>, chosen with probabilities 85%, 7%, 7% and 1%.

### Real-world applications

- **Computer graphics and procedural generation:** fractal geometry generates vegetation, textures, mountains and landscapes for video games, simulations and visual effects; repeated rules create the detail. *Connection:* the Chaos Game builds complex patterns from simple repeated transformations.
- **Terrain and landscape modelling:** fractal and procedural methods generate realistic mountains, coastlines and rough terrain. *Connection:* our experiments show repeated mathematical operations producing complex geometric structures.

### The 13 tasks and what each one shows

1. **Task 1:** triangle corners from `np.linspace(0, 2π, 4)`; the last angle is deleted (Q1).
2. **Task 2:** the matrix T = ½·I ("jump halfway") and a random start point.
3. **Task 3:** plot the corners, the start point and 10,000 points.
4. **Task 4:** the jump T(x − v) + v repeated 10,000 times gives the **Sierpinski triangle**.
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

### Two things we noticed in the assignment's code

- **Task 3** writes the jump as T @ (x + v) instead of T @ (x − v) + v. With r = ½ both give ½x + ½v, so the result is the same Sierpinski triangle.
- **Task 9's** corner rule picks from all 4 corners and then shifts the pick to avoid the last one, so one corner comes up about 40% of the time and the shape is lopsided. As the assignment's code, we kept it exactly as given.

---

## Part 1 — Opening and the Chaos Game  ·  Saathvik  ·  ~1:10

Good morning everyone. We're presenting Project 10: *Discrete dynamical systems, linear transformations of the plane, and the Chaos Game.*

**[DEMO] press →: the dots burst out.** Let's start with a question: if you place dots completely at random, can you end up with a perfect pattern? Most people would say no. By the end you'll see the answer is yes, and that the reason is linear algebra.

**[DEMO] press →.** A **dynamical system** is one where the next state depends on the current state, like a population that grows once a year. Since we only look at it in steps, k = 0, 1, 2 and so on, it's a **discrete** dynamical system: x<sub>k+1</sub> = f(x<sub>k</sub>).

**[DEMO] press →: the jumps.** The **Chaos Game**, by Michael Barnsley, is exactly that, in the plane. Take the corners of a triangle and a random starting point. Choose a random corner and jump halfway toward it. Then choose again, and again.

**[DEMO] press →: 10,000 points.** Repeat that ten thousand times, and instead of a random cloud we get this. Over to Sammedh to explain why.

---

## Part 2 — The math of one jump  ·  Sammedh  ·  ~1:30

**[DEMO] press →: the formula.** Thanks. So what is one jump, mathematically? It's a **matrix mapping**:

> **T(x) = T · (x − v) + v**,  where T = [ r 0 ; 0 r ]

**[DEMO] press → three times, one per piece.** Subtracting the corner *v* moves that corner to the origin. The matrix then shrinks the whole plane by the ratio *r*, here one half. Adding *v* moves it back. The corner itself never moves, so it is the **fixed point** of this map. Every step of the game is a linear transformation of the plane plus a shift.

**[DEMO] press →: the circle.** To build the triangle we first need its corners. We split the angles from 0 to 2π and take cosine and sine to get points on the unit circle. *That's Question 1:* why delete the last angle? Because 2π is the same point as 0, so we'd have the same corner twice. We did all of this in Python, with **NumPy** for the vectors and matrices and **Matplotlib** for the plots.

**[DEMO] press →: the triangle fills in.** With T = ½ times the identity and ten thousand random jumps, we get the **Sierpinski triangle**.

**[DEMO] press →: the copies separate.** Why this shape? Each corner's map squeezes the whole picture into a half-size copy next to that corner, so the triangle is exactly three smaller copies of itself: it's **self-similar**. Every map pulls points toward this same shape, called the **attractor**, so random jumps give the same picture every time. Over to Sanjith.

---

## Part 3 — Changing the map  ·  Sanjith  ·  ~1:00

Thanks. Now we change one thing at a time in the matrix.

**[DEMO] press →: Task 5.** First the **ratio**. With r = 1/3, each copy is a third of the size. Three of them no longer fill the triangle, so gaps open up, and those gaps repeat inside every copy.

**[DEMO] press →: Task 6.** Next, **rotation**. We multiply by a rotation matrix with θ = π/18, so every jump shrinks *and* turns the plane. Each copy is rotated inside the next, so the whole fractal twists.

**[DEMO] press →: Task 7.** Now a **square**: four corners, r = 1/2. Surprise: there's **no fractal**. The four half-size copies cover the square exactly, so the points just fill it in.

**[DEMO] press →: Task 8.** *Question 2: is there a fractal with ratio 1/3?* **Yes.** Four copies a third of the size can't cover the square, so the gaps stay, at every level. Over to Samarth R K.

---

## Part 4 — Corner rules and the hexagon  ·  Samarth R K  ·  ~1:10

Thanks. So far we changed the matrix. Now we keep the matrix and change **which corners are allowed**.

**[DEMO] press →: Task 9.** If the new corner can't be the same as the previous one, the square makes a new pattern. The assignment's version of this rule picks one corner more often, which is why it looks lopsided.

**[DEMO] press →: Task 10.** If the next corner can't be **opposite** the previous one, the same square and the same ratio give a completely different pattern.

**[DEMO] press →: Task 13.** And a **pentagon** with ratio 2/5, where no corner repeats, gives a snowflake made of five smaller snowflakes.

**[DEMO] press →: Task 12.** *Question 3* uses a **hexagon**. With ratio 0.25 we get six separate little hexagons. What's the largest ratio where they still don't touch?

**[DEMO] press →: r = 0.36.** At 0.36 they're too big and overlap.

**[DEMO] press →: r = 0.33.** Neighbouring corners are 1 apart and each copy reaches *r* toward its neighbour, so they touch when 2r = 1 − r, which is r = 1/3. Our answer is **about 0.33**. Over to Shashank.

---

## Part 5 — Fern, applications and closing  ·  Shashank  ·  ~1:35

**[DEMO] press →: the fern grows.** Thanks. The last task is the **Barnsley fern**. It's the same idea with two changes: four different maps, *y = Tⱼ x + Qⱼ*, where *Qⱼ* shifts the point; and they're not chosen equally.

**[DEMO] press →.** One map, picked 85% of the time, builds the leaf; two maps at 7% each make the side leaves; and one at 1% draws the stem. Four 2×2 matrices and four probabilities make a whole fern.

**[DEMO] press →: a forest grows out of the ground.** Where is this used outside the classroom?

1. **Computer graphics and procedural generation.** Fractal geometry helps generate complex visual patterns, including vegetation, textures, mountains and landscapes used in video games, simulations and visual effects. Repeated mathematical rules create detailed structures without anyone designing every element by hand. *Connection to our project:* the Chaos Game uses repeated transformations to generate complex patterns from simple geometric rules. *On screen (optional, if time allows):* each tree in this forest is one repeated rule: every branch splits into smaller copies of itself, scaled down and turned by a rotation matrix, the same shrink-and-rotate idea as our Task 6.

**[DEMO] press →: mountains rise up.**

2. **Terrain and landscape modelling.** Fractal and procedural methods can generate realistic-looking mountains, coastlines and rough terrain for computer-generated environments, games and simulations. *Connection to our project:* our experiments show how repeated mathematical operations can produce complex geometric structures. *On screen (optional, if time allows):* these mountains come from one repeated rule: split every square and nudge its midpoint up or down by a random amount that halves at each level.

**[DEMO] press →.** **Three things we learned:**
1. One matrix mapping, repeated thousands of times, can create very complicated shapes.
2. Small changes to the ratio, a rotation or the corner rule completely change the result, and sometimes, like the square at 1/2, there's no fractal at all.
3. Randomness plus linear algebra gives order, not chaos.

**[DEMO] press →.** So, back to our opening question: can random dots make a perfect pattern?

**[DEMO] press →: the dot bursts into the triangle.** With the right matrix, yes.

Thank you for listening. We're happy to take questions.

---

## Before you present
- Open the presentation **before** you start (`start_presentation.bat`), wait for it to finish loading, and press **F** for full screen.
- Do a full practice run with a timer. The script is about 6½ minutes, including clicking and waiting for the animations.
  - **Running long?** Samarth R K can skip the Task 10 sentence and just press → past it (saves about 10 seconds), and Shashank can say only the first sentence of each application (saves about 15 seconds).
  - **Running short?** On the hexagon slide, drag the slider and press the green **Try r =** button to show another ratio live.
- Wait for each animation to finish before you press → again; the longest ones (the jumps, the fern) take about 6 seconds.
- Each run gives a slightly different picture, which is normal; the overall shape stays the same.
- Press **N** at any time to see your lines for the current slide on screen.

## Possible questions from the class
- **Why does randomness give the same picture every time?** Every map pulls points toward the same shape (the "attractor"), so wherever you start, after a few steps you're on it.
- **Why is it called a fixed point?** T(v) = T(v − v) + v = v, so the corner is the one point the map doesn't move.
- **Why does the square at ½ not make a fractal?** Four copies of side ½ have total area 4 × ¼ = 1, the whole square, and they fit edge to edge, so there are no gaps to repeat.
- **What do the NumPy and Matplotlib libraries do here?** NumPy stores the corners and points as arrays, multiplies by the matrix and picks the random corners; Matplotlib draws the points.
- **Task 9 looks lopsided. Why?** The assignment's code picks from all 4 corners and then shifts the pick to avoid the last corner, so one corner gets chosen more often. We kept the code exactly as given.
