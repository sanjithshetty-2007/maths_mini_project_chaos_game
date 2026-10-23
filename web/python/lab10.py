# Project 10: Discrete dynamical systems, linear transformations of the plane,
# and the Chaos Game
#
# Goal: To use matrix mappings of the plane R^2 in the form of a Chaos Game in
# order to produce fractals.
#
# The code in every cell below is copied from the project PDF without changes.
# Each cell starts with "# %%" so it can be run on its own (VS Code, Spyder,
# Jupyter), and lab10_gui.py reads the cells from this file to run them.

import numpy as np
import matplotlib.pyplot as plt

# %% Task 1: Sierpinski Triangle
# MATLAB version from the PDF:
#   clear; t=linspace(0,2*pi,4);
#   t(4)=[]; v=[cos(t); sin(t)];
# Variables: t,v
# Q1: What does the command t[3] do?
import numpy as np

# Generate linearly spaced values
t = np.linspace(0, 2 * np.pi, 4)
# Remove the fourth element
t = np.delete(t, 3)

# Define the vertices of the equilateral triangle
v = np.array([np.cos(t), np.sin(t)])

# %% Task 2: Starting point and matrix of the linear transformation
# Variables: T,x
import numpy as np

# Define the linear transformation matrix
T = np.array([[0.5, 0], [0, 0.5]])

# Define the starting point with random values between -0.5 and 0.5
x = np.random.rand(2, 1) - 0.5

# %% Task 3: Plot the vertices and select the number of iterations
# Variables: Num
import numpy as np
import matplotlib.pyplot as plt

# Define the vertices of the triangle
t = np.linspace(0, 2 * np.pi, 4)[:-1]  # Generate t and remove the last element
v = np.array([np.cos(t), np.sin(t)])

# Define the linear transformation matrix
T = np.array([[0.5, 0], [0, 0.5]])

# Define the starting point
x = np.random.rand(2, 1) - 0.5

# Number of iterations
Num = 10000

# Create an array to store all points
points = np.zeros((2, Num))

# Initial point
current_point = x

# Iterative process
for i in range(Num):
    # Store the current point
    points[:, i] = current_point.flatten()
    # Choose a random vertex
    vertex = v[:, np.random.choice(3)]
    # Apply the linear transformation and update the point
    current_point = T @ (current_point + vertex.reshape(2, 1))

# Plot the vertices of the triangle
plt.plot(v[0, :], v[1, :], 'k*', label='Vertices')
# Plot the starting point
plt.plot(x[0, 0], x[1, 0], 'b.', label='Starting Point')

# Plot all the points obtained during the iterations
plt.plot(points[0, :], points[1, :], 'r.', markersize=1, label='Points')

plt.axis('equal')
plt.legend()
plt.show()

# %% Task 4: Create the iterated points and plot them
# Variables: x
import numpy as np
import matplotlib.pyplot as plt

# Define the vertices of the triangle
t = np.linspace(0, 2 * np.pi, 4)[:-1]  # Generate t and remove the last element
v = np.array([np.cos(t), np.sin(t)])

# Define the linear transformation matrix
T = np.array([[0.5, 0], [0, 0.5]])

# Define the starting point
x = np.random.rand(2, 1) - 0.5

# Number of iterations
Num = 10000

# Create an array to store all points
points = np.zeros((2, Num + 1))

# Initial point
points[:, 0] = x.flatten()

# Iterative process
for j in range(Num):
    k = np.random.randint(0, 3)  # Random integer from 0 to 2
    # Perform the transformation
    current_point = points[:, j]  # Get the current point
    transformed_point = T @ (current_point - v[:, k]) + v[:, k]
    points[:, j + 1] = transformed_point

# Plot the points
plt.plot(points[0, :], points[1, :], 'b.', markersize=1)
plt.axis('equal')
plt.title('Sierpinski Triangle')
plt.show()

# %% Task 5: Sierpinski triangle with a change of ratio
# Define the vertices of the triangle
t = np.linspace(0, 2 * np.pi, 4)[:-1]  # Generate t and remove the last element
v = np.array([np.cos(t), np.sin(t)])

# Define the new linear transformation matrix with a ratio of 1/3
T = np.array([[1/3, 0], [0, 1/3]])

# Define the starting point
x = np.random.rand(2, 1) - 0.5

# Number of iterations
Num = 10000

# Create an array to store all points
points = np.zeros((2, Num + 1))

# Initial point
points[:, 0] = x.flatten()

# Iterative process
for j in range(Num):
    k = np.random.randint(0, 3)  # Random integer from 0 to 2
    # Perform the transformation
    current_point = points[:, j]  # Get the current point
    transformed_point = T @ (current_point - v[:, k]) + v[:, k]
    points[:, j + 1] = transformed_point

# Plot the points
plt.plot(points[0, :], points[1, :], 'b.', markersize=1)
plt.axis('equal')
plt.title('Sierpinski Triangle with Ratio 1/3')
plt.show()

# %% Task 6: Sierpinski triangle with rotation
# Define the vertices of the triangle
t = np.linspace(0, 2 * np.pi, 4)[:-1]  # Generate t and remove the last element
v = np.array([np.cos(t), np.sin(t)])

# Define the rotation angle and transformation matrix T
theta = np.pi / 18
T = 0.5 * np.array([[np.cos(theta), -np.sin(theta)],
                    [np.sin(theta),  np.cos(theta)]])

# Define the starting point
x = np.random.rand(2, 1) - 0.5

# Number of iterations
Num = 10000

# Create an array to store all points
points = np.zeros((2, Num + 1))

# Initial point
points[:, 0] = x.flatten()

# Iterative process
for j in range(Num):
    k = np.random.randint(0, 3)  # Random integer from 0 to 2
    # Perform the transformation
    current_point = points[:, j]  # Get the current point
    transformed_point = T @ (current_point - v[:, k]) + v[:, k]
    points[:, j + 1] = transformed_point

# Plot the points
plt.plot(points[0, :], points[1, :], 'b.', markersize=1)
plt.axis('equal')
plt.title('Sierpinski Triangle with Rotation')
plt.show()

# %% Task 7: Square
# Define the vertices of the square
t = np.linspace(0, 2 * np.pi, 5)[:-1]  # Generate t and remove the last element
v = np.array([np.cos(t), np.sin(t)])

# Define the linear transformation matrix
T = np.array([[0.5, 0], [0, 0.5]])

# Define the starting point
x = np.random.rand(2, 1) - 0.5

# Number of iterations
Num = 10000

# Create an array to store all points
points = np.zeros((2, Num + 1))

# Initial point
points[:, 0] = x.flatten()

# Iterative process
for j in range(Num):
    k = np.random.randint(0, 4)  # Random integer from 0 to 3 (for 4 vertices)
    # Perform the transformation
    current_point = points[:, j]  # Get the current point
    transformed_point = T @ (current_point - v[:, k]) + v[:, k]
    points[:, j + 1] = transformed_point

# Plot the points
plt.figure()
plt.plot(points[0, :], points[1, :], 'b.', markersize=1)
plt.axis('equal')
plt.title('Fractal with Square Vertices')
plt.show()

# %% Task 8: Square with different ratio
# Q2: Does the code generate a fractal this time?
# Define the vertices of the square
t = np.linspace(0, 2 * np.pi, 5)[:-1]  # Generate t and remove the last element
v = np.array([np.cos(t), np.sin(t)])

# Define the new linear transformation matrix with a ratio of 1/3
T = np.array([[1/3, 0], [0, 1/3]])

# Define the starting point
x = np.random.rand(2, 1) - 0.5

# Number of iterations
Num = 10000

# Create an array to store all points
points = np.zeros((2, Num + 1))

# Initial point
points[:, 0] = x.flatten()

# Iterative process
for j in range(Num):
    k = np.random.randint(0, 4)  # Random integer from 0 to 3 (for 4 vertices)
    # Perform the transformation
    current_point = points[:, j]  # Get the current point
    transformed_point = T @ (current_point - v[:, k]) + v[:, k]
    points[:, j + 1] = transformed_point

# Plot the points
plt.figure()
plt.plot(points[0, :], points[1, :], 'b.', markersize=1)
plt.axis('equal')
plt.title('Fractal with Square Vertices and Ratio 1/3')
plt.show()

# %% Task 9: Square with vertex preference (the new vertex cannot be the same as the previous)
# Define the vertices of the square using complex exponentials
t = np.linspace(0, 2 * np.pi, 5)[:-1]  # Generate t and remove the last element
v = np.exp(1j * t)  # Complex exponential for the vertices

# Define the linear transformation matrix
T = np.array([[0.5, 0], [0, 0.5]])

# Define the starting point
x = np.random.rand(2, 1) - 0.5

# Number of iterations
Num = 5000

# Create an array to store all points
points = np.zeros((2, Num + 1))

# Initial point
points[:, 0] = x.flatten()

# Variable to keep track of the previous vertex index
k1 = -1

# Iterative process
for j in range(Num):
    k = np.random.randint(0, 4)  # Random integer from 0 to 3
    # Ensure the same vertex is not selected twice in a row
    if k >= k1:
        k = (k + 1) % 4  # Move to the next vertex if k >= k1

    # Get the current vertex
    w = np.array([np.real(v[k]), np.imag(v[k])])

    # Perform the transformation
    current_point = points[:, j]  # Get the current point
    transformed_point = T @ (current_point - w) + w
    points[:, j + 1] = transformed_point

    # Update the previous vertex index
    k1 = k

# Plot the vertices and the points
plt.figure()
plt.plot(np.real(v), np.imag(v), 'k*', label='Vertices')  # Plot vertices
plt.plot(points[0, :], points[1, :], 'b.', markersize=1, label='Fractal Points')  # Plot points
plt.axis('equal')
plt.title('Fractal with Vertex Preference')
plt.legend()
plt.show()

# %% Task 10: Square with vertex preference (the new vertex cannot be opposite of the previous)
# MATLAB version from the PDF:
#   # Square with vertex preference (new vertex cannot be opposite of the previous):
#   clear;
#   T=[1/2 0; 0 1/2];
#   t=linspace(0,2*pi,5);
#   t(5)=[]; v=exp(1i*t);
#   x(:,1)=[rand-0.5; rand-0.5];
#   plot(real(v),imag(v),'k*',x(1,1),x(2,1),'b.'); axis equal; hold
#   on; Num=5000;
#   w=[real(v(1));imag(v(1))]; k1=0;
#   for j=1:Num k=randi(4) if
#   (k~=k1+2)&&(k1~=k+2)
#   w=[real(v(k));imag(v(k))];
#   x(:,j+1)=T*(x(:,j)-w)+w; k1=k;
#   else x(:,j+1)=x(:,j);
#   end;
#   end; plot(x(1,:),x(2,:),'b.'); hold off;

# Define the vertices of the square using complex exponentials
t = np.linspace(0, 2 * np.pi, 5)[:-1]  # Generate t and remove the last element
v = np.exp(1j * t)  # Complex exponential for the vertices

# Define the linear transformation matrix
T = np.array([[0.5, 0], [0, 0.5]])

# Define the starting point
x = np.random.rand(2, 1) - 0.5

# Number of iterations
Num = 5000

# Create an array to store all points
points = np.zeros((2, Num + 1))

# Initial point
points[:, 0] = x.flatten()

# Variable to keep track of the previous vertex index
k1 = 0
w = np.array([np.real(v[k1]), np.imag(v[k1])])

# Iterative process
for j in range(Num):
    k = np.random.randint(0, 4)  # Random integer from 0 to 3

    # Ensure the new vertex is not opposite to the previous one
    if (k != (k1 + 2) % 4) and ((k1 != (k + 2) % 4)):
        w = np.array([np.real(v[k]), np.imag(v[k])])
        transformed_point = T @ (points[:, j] - w) + w
        points[:, j + 1] = transformed_point
        k1 = k  # Update the previous vertex index
    else:
        points[:, j + 1] = points[:, j]  # If opposite, repeat the current point

# Plot the vertices and the points
plt.figure()
plt.plot(np.real(v), np.imag(v), 'k*', label='Vertices')  # Plot vertices
plt.plot(points[0, :], points[1, :], 'b.', markersize=1, label='Fractal Points')  # Plot points
plt.axis('equal')
plt.title('Fractal with Vertex Preference (No Opposite Vertex)')
plt.legend()
plt.show()

# %% Task 11: Barnsley fern
# MATLAB version from the PDF:
#   # Barnsley fern clear;
#   T1=[0.85,0.04;-0.04,0.85];
#   T2=[-0.15,0.28;0.26,0.24];
#   T3=[0.2,-0.26;0.23,0.22];
#   T4=[0,0;0,0.16];
#   Q1=[0;1.64];
#   Q2=[-0.028;1.05];
#   Q3=[0;1.6];
#   Q4=[0,0];
#   P1=0.85;
#   P2=0.07;
#   P3=0.07;
#   P4=0.01;
#   Num=15000; x(:,1)=rand(2,1);
#   plot(x(1,1),x(2,:),'b.') axis equal; hold
#   on; for j=1:Num r=rand; if r<=P1
#   x(:,j+1)=T1*x(:,j)+Q1;
#   elseif r<=P1+P2 x(:,j+1)=T2*x(:,j)+Q2;
#   elseif r<=P1+P2+P3 x(:,j+1)=T3*x(:,j)+Q3;
#   else x(:,j+1)=T4*x(:,j)+Q4;
#   end
#   end plot(x(1,:),x(2,:),'b.');
#   hold off;

# Define the transformation matrices and translation vectors
T1 = np.array([[0.85, 0.04], [-0.04, 0.85]])
T2 = np.array([[-0.15, 0.28], [0.26, 0.24]])
T3 = np.array([[0.2, -0.26], [0.23, 0.22]])
T4 = np.array([[0, 0], [0, 0.16]])

Q1 = np.array([0, 1.64])
Q2 = np.array([-0.028, 1.05])
Q3 = np.array([0, 1.6])
Q4 = np.array([0, 0])

P1 = 0.85
P2 = 0.07
P3 = 0.07
P4 = 0.01

Num = 15000

# Initialize the starting point
x = np.zeros((2, Num + 1))
x[:, 0] = np.random.rand(2)  # Starting point

# Plot the initial point
plt.figure()
plt.plot(x[0, 0], x[1, 0], 'b.')

# Iterative process to generate the fern
for j in range(Num):
    r = np.random.rand()
    if r <= P1:
        x[:, j + 1] = T1 @ x[:, j] + Q1
    elif r <= P1 + P2:
        x[:, j + 1] = T2 @ x[:, j] + Q2
    elif r <= P1 + P2 + P3:
        x[:, j + 1] = T3 @ x[:, j] + Q3
    else:
        x[:, j + 1] = T4 @ x[:, j] + Q4

# Plot the fractal
plt.plot(x[0, :], x[1, :], 'b.', markersize=1)
plt.axis('equal')
plt.title('Barnsley Fern')
plt.show()

# %% Task 12: Fractal based on a regular hexagon
# Q3: Experiment with the ratio. What is the largest ratio you can find such
# that the little hexagons don't touch (two digits after the decimal point are
# sufficient)?
import numpy as np
import matplotlib.pyplot as plt

# Define the vertices of a regular hexagon
t = np.linspace(0, 2 * np.pi, 7)[:-1]  # Generate 6 vertices and remove the last point
v = np.array([np.cos(t), np.sin(t)])    # Calculate vertices

# Define the linear transformation matrix
T = np.array([[0.25, 0], [0, 0.25]])

# Define the number of iterations
Num = 15000

# Initialize the starting point
x = np.zeros((2, Num + 1))
x[:, 0] = np.random.rand(2) - 0.5  # Random starting point

# Create an array to store all points
points = np.zeros((2, Num + 1))
points[:, 0] = x[:, 0]

# Iterative process to generate the fractal
for j in range(Num):
    k = np.random.randint(0, 6)  # Randomly choose one of the 6 vertices
    points[:, j + 1] = T @ (points[:, j] - v[:, k]) + v[:, k]

# Plot the vertices and the points
plt.figure()
plt.plot(v[0, :], v[1, :], 'k*', label='Vertices')  # Plot vertices of hexagon
plt.plot(points[0, :], points[1, :], 'b.', markersize=1, label='Fractal Points')  # Plot fractal points
plt.axis('equal')
plt.title('Fractal Based on Regular Hexagon')
plt.legend()
plt.show()

# %% Task 13: Pentagon with the restriction that each new vertex cannot be the same as the previous one
# Define the vertices of a regular pentagon
t = np.linspace(0, 2 * np.pi, 6)[:-1]  # Generate 5 vertices
v = np.array([np.cos(t), np.sin(t)])    # Calculate vertices

# Define the linear transformation matrix
T = np.array([[2/5, 0], [0, 2/5]])

# Define the number of iterations
Num = 10000

# Initialize the starting point
x = np.zeros((2, Num + 1))
x[:, 0] = np.random.rand(2) - 0.5  # Random starting point

# Create an array to store all points
points = np.zeros((2, Num + 1))
points[:, 0] = x[:, 0]

# Initialize previous vertex index
prev_vertex_index = np.random.randint(0, 5)

# Iterative process to generate the fractal
for j in range(Num):
    # Randomly choose one of the 5 vertices but not the same as the previous one
    current_vertex_index = prev_vertex_index
    while current_vertex_index == prev_vertex_index:
        current_vertex_index = np.random.randint(0, 5)

    # Apply the transformation
    w = v[:, current_vertex_index]
    points[:, j + 1] = T @ (points[:, j] - w) + w

    # Update the previous vertex index
    prev_vertex_index = current_vertex_index

# Plot the vertices and the points
plt.figure()
plt.plot(v[0, :], v[1, :], 'k*', label='Vertices')  # Plot vertices of pentagon
plt.plot(points[0, :], points[1, :], 'b.', markersize=1, label='Fractal Points')  # Plot fractal points
plt.axis('equal')
plt.title('Fractal Based on Regular Pentagon with Vertex Restriction')
plt.legend()
plt.show()
