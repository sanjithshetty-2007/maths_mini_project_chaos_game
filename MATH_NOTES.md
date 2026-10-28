# Project 10 — The Chaos Game: Maths Notes and Viva Questions

## 1. The big picture

Project 10 asks one question in many forms: **what happens when you apply a simple matrix mapping of the plane over and over, choosing the map at random each time?**

- Each step takes a point **x** in the plane R² and moves it a fraction *r* of the way toward a randomly chosen corner **v** of a polygon.
- That step is an **affine map**: a linear transformation (a matrix) plus a shift.
- Repeating it is a **discrete dynamical system**: x<sub>k+1</sub> = f(x<sub>k</sub>).
- The points do not stay random. They are pulled onto one fixed shape, the **attractor**, which is often a **fractal**: a shape made of smaller copies of itself.

The whole project is the study of how the attractor changes when we change the matrix (ratio, rotation), the polygon (triangle, square, pentagon, hexagon), the rule for choosing corners, or the probabilities (the fern).

## 2. Discrete dynamical systems

### Definition

A **dynamical system** is a rule that gives the next state from the current one. If we only look at it at whole-number times k = 0, 1, 2, … it is **discrete**:

> x<sub>k+1</sub> = f(x<sub>k</sub>),  starting from x<sub>0</sub>

- The list x<sub>0</sub>, x<sub>1</sub>, x<sub>2</sub>, … is called the **orbit** (or trajectory) of x<sub>0</sub>.
- Example: a population that grows by 30% a year, p<sub>k+1</sub> = 1.3 p<sub>k</sub>, so p<sub>k</sub> = 1.3<sup>k</sup> p<sub>0</sub>.

### Fixed points

A **fixed point** is a state that the rule does not change: f(x*) = x*. If the orbit starts there, it stays there.

- A fixed point is **attracting** if nearby orbits move toward it. For a linear map x ↦ r x, the origin is attracting exactly when |r| < 1.

### What is special in the Chaos Game

In the Chaos Game the rule f is not fixed: at each step we pick one of several maps at random. The state is still a point in the plane, but which map is applied is decided by a random number. That is why it is called a *random* (or stochastic) dynamical system.

## 3. Points, vectors and matrices in the plane

- A point of the plane is a column vector **x** = [x<sub>1</sub> ; x<sub>2</sub>] in R².
- A 2×2 matrix A acts on it by matrix multiplication: A**x**.
- A map T is **linear** if T(a**u** + b**w**) = aT(**u**) + bT(**w**) for all vectors and scalars. Every linear map of R² is multiplication by a 2×2 matrix, and its columns are the images of [1 ; 0] and [0 ; 1].
- A linear map always fixes the origin: T(**0**) = **0**.
- The **determinant** tells how areas change: a region of area S is mapped to a region of area |det A|·S.

### The three matrices we use

| Matrix | Formula | What it does | Determinant |
|---|---|---|---|
| Scaling | [ r 0 ; 0 r ] = r·I | shrinks every vector by r toward the origin | r² |
| Rotation | R(θ) = [ cos θ  −sin θ ; sin θ  cos θ ] | turns the plane by θ, keeps lengths | 1 |
| Scale and rotate | r·R(θ) | shrinks by r *and* turns by θ | r² |

- In Task 2 and Task 4, T = ½·I, so every jump halves distances and quarters areas.
- In Task 6, T = ½·R(π/18): θ = π/18 = 10°, so each jump shrinks by half and turns by 10°.
- The order does not matter here because r·I commutes with every matrix: r·R(θ) = R(θ)·(r·I).

## 4. The Chaos Game map

### The formula

For a corner **v** and a matrix T, one jump is

> T(**x**) = T·(**x** − **v**) + **v**

Read it in three moves:

1. **x − v**: translate the plane so that the corner **v** sits at the origin.
2. **T ·**: apply the linear map (shrink, and maybe rotate) about the origin.
3. **+ v**: translate back.

So the jump is "shrink the plane toward **v**". With T = ½·I it is literally "move halfway to the corner":

> T(**x**) = ½(**x** − **v**) + **v** = ½**x** + ½**v**, the midpoint of **x** and **v**.

### It is an affine map

Expanding gives T(**x**) = T**x** + (I − T)**v**: a linear part T**x** plus a constant shift (I − T)**v**. A map of the form A**x** + **b** is called **affine**. It is not linear (it does not fix the origin), but it maps lines to lines and keeps ratios along a line.

### The corner is the fixed point

- Put **x** = **v**: T(**v**) = T·**0** + **v** = **v**. The corner never moves.
- It is the *only* fixed point when I − T is invertible (for T = r·I this means r ≠ 1): solving T(**x**) = **x** gives (I − T)(**x** − **v**) = **0**, so **x** = **v**.

### It is a contraction

For two points **x** and **y**: T(**x**) − T(**y**) = T(**x** − **y**). With T = r·I (or r·R(θ)), distances shrink by exactly r:

> | T(**x**) − T(**y**) | = r · | **x** − **y** |

Applied to **y** = **v**, after k jumps toward the same corner the distance to it is r<sup>k</sup> times the starting distance. With r = ½, ten jumps cut the distance by a factor of about 1000. This is why the starting point does not matter: after a handful of jumps every point is as close to the attractor as the screen can show.

## 5. Iterated function systems and the attractor

### Several maps at once

A triangle gives three maps T<sub>1</sub>, T<sub>2</sub>, T<sub>3</sub> (one per corner). A family of contracting maps like this is called an **iterated function system (IFS)**.

### The attractor

For any shape S, apply all the maps and take the union:

> H(S) = T<sub>1</sub>(S) ∪ T<sub>2</sub>(S) ∪ … ∪ T<sub>N</sub>(S)

Because every map is a contraction, repeating H from any starting shape converges to one unique shape A with

> A = T<sub>1</sub>(A) ∪ T<sub>2</sub>(A) ∪ … ∪ T<sub>N</sub>(A)

This shape is the **attractor** of the IFS. (The uniqueness comes from the Banach fixed-point theorem: H itself is a contraction on shapes.)

### Why random jumps draw it

- Each jump applies one T<sub>i</sub> to the current point. If the point is on A, it stays on A, because T<sub>i</sub>(A) ⊂ A.
- If it is not on A yet, its distance to A shrinks by r at every jump, so it reaches A almost immediately.
- Choosing the maps at random visits every part of A, so 10,000 points sketch the whole shape. That is why every run gives the same picture even though every run is different.

### Self-similarity

The equation A = ∪ T<sub>i</sub>(A) says the attractor is made of N smaller copies of itself, each shrunk by r. Each copy is again made of N smaller copies, and so on forever. This is **self-similarity**, the defining property of the fractals in this project.

## 6. Fractal or no fractal? Counting copies

### The area test

Each copy has area r² times the area of the whole. If there are N copies:

- **N r² = 1** and the copies fit edge to edge: they tile the shape and the points fill it in. **No fractal.**
- **N r² < 1**: the copies cannot cover the shape. Gaps appear and repeat at every level; after k levels the area left is (N r²)<sup>k</sup> → 0. **Fractal.**

| Shape | N | r | N r² | Result |
|---|---|---|---|---|
| Triangle (Task 4) | 3 | ½ | 3/4 | Sierpinski triangle |
| Triangle (Task 5) | 3 | 1/3 | 1/3 | separated copies, wide gaps |
| Square (Task 7) | 4 | ½ | 1 | **filled square, no fractal** |
| Square (Task 8) | 4 | 1/3 | 4/9 | fractal (Q2: yes) |
| Hexagon (Task 12) | 6 | ¼ | 3/8 | six separate hexagons |

For the triangle with r = ½, the area left after k levels is (3/4)<sup>k</sup>: about 5.6% after 10 levels and 0.3% after 20. The Sierpinski triangle has **zero area** but infinitely many points.

### Similarity dimension

A fractal made of N copies, each scaled by r, has **similarity dimension**

> D = log N / log(1/r)

| Shape | D | Meaning |
|---|---|---|
| Sierpinski triangle (N = 3, r = ½) | log 3 / log 2 ≈ 1.585 | more than a curve, less than a surface |
| Square with r = ½ (N = 4) | log 4 / log 2 = 2 | a full 2-D region: no fractal |
| Square with r = 1/3 (N = 4) | log 4 / log 3 ≈ 1.262 | a fractal |
| Triangle with r = 1/3 (N = 3) | log 3 / log 3 = 1 | a "dust" of dimension 1 |

A dimension of exactly 2 is the mathematical reason the square at ½ shows no fractal.

## 7. The tasks, step by step

### Task 1: the corners (and Q1)

`np.linspace(0, 2π, 4)` gives the four equally spaced angles 0, 2π/3, 4π/3, 2π. The corners are (cos t, sin t), points on the unit circle. Since cos and sin repeat every 2π, the angle 2π gives the same point as 0. Deleting t[3] (the 4th angle) leaves three different corners: an equilateral triangle. For a polygon with n corners, `linspace(0, 2π, n + 1)` with the last angle removed gives the n vertices of a regular n-gon.

### Tasks 2–4: the Sierpinski triangle

- T = ½·I and a random start point **x** in the square [−0.5, 0.5]².
- 10,000 times: pick a corner k at random (each with probability 1/3), and apply **x** ← T(**x** − **v**<sub>k</sub>) + **v**<sub>k</sub>.
- Plot all 10,001 points at once. The result is the **Sierpinski triangle**: three half-size copies of itself.

### Task 5: ratio 1/3

T = (1/3)·I. Each copy is a third of the size, so N r² = 1/3. Large gaps open up between the copies, and the same gaps appear inside each copy.

### Task 6: rotation

T = ½·R(π/18). Each jump shrinks by ½ and turns by 10° about the chosen corner. Each copy is a rotated half-size copy of the whole, so the twist repeats at every level and the fractal spirals. The eigenvalues of r·R(θ) are complex, r·e<sup>±iθ</sup>, which is the algebraic sign of "shrink and turn".

### Task 7: the square with r = ½ (no fractal)

Four corners, four half-size copies, N r² = 4·¼ = 1. The copies are the four quarters of the square and tile it exactly, so the points fill the whole square evenly.

### Task 8: the square with r = 1/3 (Q2)

N r² = 4/9 < 1. The four copies sit in the corners with a cross-shaped gap between them, and the gap repeats in every copy: **yes, it is a fractal** (dimension ≈ 1.262).

### Tasks 9 and 10: rules with memory

The corner is no longer chosen independently; it depends on the previous corner. The system is now a **Markov chain** on the corners combined with the maps.

- **Task 9 (not the same corner twice):** forbidding a repeat removes every "copy inside the same copy", so some regions can never be reached and a new pattern appears. In the assignment's code, the pick k in 0–3 is shifted by one when k ≥ previous corner, and (k + 1) mod 4 wraps 3 round to 0. So corner 0 gets an extra chance and is picked more often (about 40% of the time in our runs), which makes the picture lopsided. We kept the code as given.
- **Task 10 (not the opposite corner):** a corner directly opposite the previous one is rejected. Same square, same ratio, a completely different pattern. This shows that the *rule for choosing maps* is as important as the maps themselves.

### Task 11: the Barnsley fern

Four affine maps y = T<sub>j</sub>x + Q<sub>j</sub>, chosen with probabilities P<sub>j</sub>:

| Map | T<sub>j</sub> | Q<sub>j</sub> | P<sub>j</sub> | Role |
|---|---|---|---|---|
| 1 | [ 0.85 0.04 ; −0.04 0.85 ] | [ 0 ; 1.64 ] | 0.85 | the whole fern, slightly smaller and turned: builds the leaf |
| 2 | [ −0.15 0.28 ; 0.26 0.24 ] | [ −0.028 ; 1.05 ] | 0.07 | one of the two lowest leaves (det < 0: it flips) |
| 3 | [ 0.2 −0.26 ; 0.23 0.22 ] | [ 0 ; 1.6 ] | 0.07 | the other lowest leaf |
| 4 | [ 0 0 ; 0 0.16 ] | [ 0 ; 0 ] | 0.01 | squashes everything onto a line: the stem |

- The random choice uses one number r in [0, 1): r ≤ 0.85 picks map 1, the next 0.07 picks map 2, and so on.
- Map 4 has determinant 0: it collapses the plane onto a vertical segment, which is why the stem is a thin line.
- The probabilities do not change the *shape* of the attractor, only how fast each part fills in. They are chosen roughly in proportion to how much area each map covers (map 1 has det ≈ 0.72, the largest), so the fern fills evenly.

### Task 12: the hexagon (Q3)

Six corners on the unit circle; neighbouring corners are exactly 1 apart (the side of a regular hexagon equals its radius).

- The copy at corner **v**<sub>i</sub> is the hexagon shrunk by r toward **v**<sub>i</sub>. Its centre moves from 0 to (1 − r)**v**<sub>i</sub>, and its radius is r.
- The centres of two neighbouring copies are (1 − r)·1 = 1 − r apart.
- The direction from one centre to the next points at a corner of each little hexagon, so each copy reaches a distance r toward its neighbour.
- They touch when r + r = 1 − r, so **2r = 1 − r, r = 1/3**.
- Below 1/3 there is a gap between them; above 1/3 they overlap. Our answer: **about 0.33**. (At r = 0.25: gap. At r = 0.36: overlap. At r = 0.33: just touching.)

### Task 13: the pentagon snowflake

Five corners, ratio 2/5, and no corner twice in a row. Check the area test without the rule: 5·(2/5)² = 4/5 < 1, so the copies leave gaps. The no-repeat rule removes even more, giving a snowflake made of five smaller snowflakes.

## 8. Python libraries we used

- **NumPy** (numerical arrays and linear algebra):
  - `np.linspace` for the angles, `np.cos` and `np.sin` for the corners, `np.delete` (or slicing) to drop the duplicate angle.
  - `np.array` for matrices and vectors, and `@` for matrix multiplication.
  - `np.random.rand` for the start point, `np.random.randint` to pick a corner, `np.zeros` for the 2 × 10,001 array of points.
- **Matplotlib** (plotting): `plt.plot` draws all the points in one call at the end, which is much faster than plotting each point inside the loop.

## 9. Real-world applications

- **Computer graphics and procedural generation.** Fractal geometry helps generate complex visual patterns, including vegetation, textures, mountains and landscapes used in video games, simulations and visual effects. Repeated mathematical rules create detailed structures without anyone designing every element by hand. *Connection to our project:* the Chaos Game uses repeated transformations to generate complex patterns from simple geometric rules.
- **Terrain and landscape modelling.** Fractal and procedural methods can generate realistic-looking mountains, coastlines and rough terrain for computer-generated environments, games and simulations. *Connection to our project:* our experiments show how repeated mathematical operations can produce complex geometric structures.

### How the two particle scenes in our presentation are made

- **The forest (a fractal tree):** start with a trunk. At its end, the branch splits into two (sometimes three) smaller copies of itself: each new direction is the old one multiplied by a rotation matrix R(θ) with θ ≈ ±25°, and each new length is about 0.72 times the old one. Repeat this rule 7 times and put leaves on the last branches. It is the same "shrink and rotate" map as Task 6, applied to branches instead of points, so every tree is self-similar: each branch looks like a small tree.
- **The mountains (midpoint displacement):** start with a square of heights. Split it into four smaller squares; each new midpoint gets the average height of its neighbours plus a random nudge. Repeat on every smaller square, halving (roughly) the size of the nudge each time. Big bumps at the first level become mountains, smaller bumps become ridges and rocks: the rough surface looks the same at every scale, which is why real coastlines and mountains look this way too. Heights below a "sea level" are drawn as water.

## 10. Key formulas at a glance

> One jump: T(**x**) = T(**x** − **v**) + **v** = T**x** + (I − T)**v**

> Halfway jump (r = ½): T(**x**) = ½(**x** + **v**)

> Rotation: R(θ) = [ cos θ −sin θ ; sin θ cos θ ],  θ = π/18 = 10°

> Contraction: |T(**x**) − T(**y**)| = r·|**x** − **y**|

> Attractor: A = T<sub>1</sub>(A) ∪ … ∪ T<sub>N</sub>(A)

> Area test: N r² = 1 fills the shape; N r² < 1 gives a fractal

> Dimension: D = log N / log(1/r)

> Hexagon (Q3): 2r = 1 − r, so r = 1/3

## 11. Viva questions and answers

### Basics

Q: What is a discrete dynamical system?
A: A rule x<sub>k+1</sub> = f(x<sub>k</sub>) that gives the next state from the current one, looked at in whole steps k = 0, 1, 2, … The sequence of states is the orbit.

Q: What is the Chaos Game?
A: Start at a random point, choose a corner of a polygon at random, jump a fraction r of the way toward it, and repeat many times. The points settle onto a fixed shape, often a fractal. It was popularised by Michael Barnsley.

Q: Write the map used for one jump and explain each part.
A: T(x) = T(x − v) + v. Subtracting v moves the corner to the origin, the matrix T shrinks (and maybe rotates) the plane about the origin, and adding v moves it back. The net effect is to shrink the plane toward the corner v.

Q: Is that map linear?
A: No, it is affine: T(x) = Tx + (I − T)v, a linear map plus a shift. It does not fix the origin, so it is not linear (unless v = 0).

Q: What does the matrix [0.5 0 ; 0 0.5] do?
A: It multiplies every vector by ½: it halves distances and quarters areas (determinant ¼). In the game it means "jump halfway to the corner".

Q: What is a fractal?
A: A shape with detail at every scale, usually self-similar (made of smaller copies of itself) and with a non-whole-number dimension, such as the Sierpinski triangle with dimension ≈ 1.585.

### The questions in the assignment

Q: (Q1) What does deleting t[3] do?
A: linspace(0, 2π, 4) gives 0, 2π/3, 4π/3 and 2π. The angle 2π gives the same point as 0, so deleting it removes a duplicate corner and leaves the three vertices of an equilateral triangle.

Q: (Q2) Does the square with ratio 1/3 make a fractal?
A: Yes. Four copies of size 1/3 have total area 4/9 of the square, so they cannot cover it. The gaps repeat inside every copy. With ratio ½ the copies have total area 1 and tile the square, so there is no fractal.

Q: (Q3) What is the largest ratio for which the little hexagons don't touch?
A: About 1/3. Neighbouring corners are 1 apart, the copies' centres are 1 − r apart, and each copy reaches r toward its neighbour, so they touch when 2r = 1 − r, i.e. r = 1/3.

### Concepts

Q: What is a fixed point, and what is it here?
A: A point with f(x*) = x*. For the jump toward v, T(v) = T(0) + v = v, so the corner itself is the fixed point, and it is the only one when r ≠ 1.

Q: Why do we get the same picture every time even though the jumps are random?
A: Every map is a contraction, so all the maps together have one unique attractor A = T₁(A) ∪ … ∪ T<sub>N</sub>(A). Any starting point is pulled onto A within a few jumps, and random choices visit all of A. Different runs give different points on the same shape.

Q: Why doesn't the starting point matter?
A: Distances shrink by the factor r at every jump. With r = ½, after 10 jumps the start's influence has shrunk about 1000 times, which is smaller than a pixel.

Q: What is self-similarity, and why does it happen here?
A: A shape is self-similar if it is made of smaller copies of itself. The attractor satisfies A = ∪ T<sub>i</sub>(A): each map makes a shrunken copy of the whole attractor at its corner, and the copies together make the attractor.

Q: Why does the square with r = ½ not make a fractal?
A: The four half-size copies are exactly the four quarters of the square: total area 4·(½)² = 1, edge to edge, no gaps. Its similarity dimension is log 4 / log 2 = 2, the dimension of an ordinary area.

Q: What is the area of the Sierpinski triangle?
A: Zero. Each level keeps 3/4 of the area of the previous one, so after k levels (3/4)<sup>k</sup> remains, which tends to 0.

Q: What is the dimension of the Sierpinski triangle?
A: D = log 3 / log 2 ≈ 1.585, from N = 3 copies each scaled by r = ½ (N r<sup>D</sup> = 1).

Q: What does the rotation in Task 6 do?
A: T = ½·R(π/18) shrinks by half and turns by 10° each jump. Each copy is a rotated version of the whole, so the twist repeats at every scale. R(θ) has determinant 1 and preserves lengths; r·R(θ) has complex eigenvalues r·e<sup>±iθ</sup>.

Q: Why do the corner rules (Tasks 9, 10, 13) change the picture without changing the matrix?
A: The attractor is built from sequences of maps. Forbidding some pairs of consecutive corners removes the copies that those sequences would draw, so whole regions are never reached, at every scale. The system becomes a Markov chain on the corners.

Q: Why is Task 9's picture lopsided?
A: The code shifts the pick by one when k ≥ previous corner, and (k + 1) mod 4 wraps corner 3 round to corner 0. Corner 0 gets an extra way to be chosen, so it comes up more often than the others.

Q: What makes the Barnsley fern different from the triangle?
A: Four different affine maps y = T<sub>j</sub>x + Q<sub>j</sub> instead of one shrink per corner, with unequal probabilities 0.85, 0.07, 0.07 and 0.01. Map 1 makes the whole fern slightly smaller and higher (each leaf is a copy of the fern), maps 2 and 3 make the two lowest leaves, and map 4 makes the stem.

Q: Why is map 4 of the fern the stem?
A: T₄ = [0 0 ; 0 0.16] has determinant 0: it sends every point to the vertical line x = 0, squeezing its height to 16%. That draws a thin segment, the stem.

Q: Do the fern's probabilities change its shape?
A: No, the attractor depends only on the maps. The probabilities control how densely each part is filled; they are chosen roughly in proportion to each map's area so the fern fills evenly with 10,000 points.

Q: What happens if r is greater than 1?
A: The map is no longer a contraction: points are pushed away from the corners and the orbit runs off to infinity, so there is no attractor.

Q: What happens if r = 1?
A: T(x) = x: the point never moves, every point is fixed, and nothing is drawn.

### Python

Q: Which Python libraries did you use, and for what?
A: NumPy for the arrays, the matrices, matrix multiplication (@) and the random numbers; Matplotlib to plot the points.

Q: What does @ mean in the code?
A: Matrix multiplication in Python (NumPy), so T @ (x − v) is the matrix T times the vector x − v.

Q: Why plot all the points at the end instead of inside the loop?
A: Each plt.plot call has a fixed cost. One call with 10,001 points is fast; 10,000 separate calls would be very slow.

Q: How is the corner chosen?
A: np.random.randint(0, n) returns a random integer from 0 to n − 1, each equally likely, which is the index of the corner.

### Applications

Q: Where are these ideas used in the real world?
A: In computer graphics and procedural generation (vegetation, textures, mountains and landscapes in games, simulations and visual effects) and in terrain and landscape modelling (realistic mountains, coastlines and rough terrain). In both, simple rules repeated many times create complex structures, just as in the Chaos Game.

Q: How is the forest in your presentation made?
A: With one repeated rule: every branch splits into smaller copies of itself, each scaled by about 0.72 and turned by a rotation matrix of about ±25°, repeated 7 times. It is the shrink-and-rotate map of Task 6 applied to branches, so each branch is a small copy of the whole tree.

Q: How are the mountains made?
A: By repeated midpoint displacement: split every square into four, set each new midpoint to the average of its neighbours plus a random nudge, and halve the nudge at each level. Large nudges make mountains, small ones make ridges and rocks, so the surface is rough at every scale, like a fractal.

## 12. Glossary

- **Affine map:** a linear map followed by a shift, x ↦ Ax + b.
- **Attractor:** the unique shape A with A = T₁(A) ∪ … ∪ T<sub>N</sub>(A); every orbit is pulled onto it.
- **Contraction:** a map that shrinks every distance by at least a fixed factor r < 1.
- **Determinant:** the factor by which a matrix scales areas.
- **Fixed point:** a point the map does not move, f(x*) = x*.
- **Fractal:** a shape with detail at every scale, usually self-similar with a non-integer dimension.
- **Iterated function system (IFS):** a finite family of contractions applied repeatedly.
- **Orbit:** the sequence x₀, x₁, x₂, … produced by a dynamical system.
- **Self-similar:** made of smaller copies of itself.
- **Similarity dimension:** D = log N / log(1/r) for N copies scaled by r.
