# Phase 2 backend: a small FastAPI server that runs the cells of lab10.py and
# returns what each cell plotted as JSON, for the Next.js presentation in web/.
#
# The API does no math of its own. It runs the PDF's code from lab10.py exactly
# as written and reads the points back out of the Matplotlib figure.
#
# Run with:  py -m uvicorn api:app --port 8000

import time

import numpy as np
from fastapi import FastAPI, HTTPException
from matplotlib.colors import to_hex
from pydantic import BaseModel, Field

import lab10_text
from lab10_runner import read_cells, run_cell, run_lock

app = FastAPI(title="Project 10 — Chaos Game API")

# Variables each task reports back, beyond its plot. Tasks 1–3 are the ones the
# PDF lists under "Variables:"; Task 11's maps let the slides colour the fern.
REPORTED_VARIABLES = {
    1: ["t", "v"],
    2: ["T", "x"],
    3: ["t", "v", "T", "x", "Num"],
    4: ["T", "Num"],
    5: ["T", "Num"],
    6: ["T", "theta", "Num"],
    7: ["T", "Num"],
    8: ["T", "Num"],
    9: ["T", "Num"],
    10: ["T", "Num"],
    11: ["T1", "T2", "T3", "T4", "Q1", "Q2", "Q3", "Q4", "P1", "P2", "P3", "P4", "Num"],
    12: ["T", "Num"],
    13: ["T", "Num"],
}

# Task 12's matrix line in lab10.py. Q3 asks to experiment with this ratio, so
# it is the only part of any cell the API lets a caller change.
TASK12_MATRIX = "T = np.array([[0.25, 0], [0, 0.25]])"


class RunRequest(BaseModel):
    ratio: float | None = Field(default=None, gt=0, lt=1, description="Task 12 only: the hexagon ratio")


def to_json(value):
    """Turn NumPy values into plain JSON (complex numbers become [re, im])."""
    if isinstance(value, np.ndarray):
        if np.iscomplexobj(value):
            return [[round(float(z.real), 6), round(float(z.imag), 6)] for z in value.ravel()]
        return np.round(value.astype(float), 6).tolist()
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating, float)):
        return round(float(value), 6)
    return value


def figure_to_json(figure):
    """Read every plotted line back out of the Matplotlib figure."""
    if figure is None:
        return None
    ax = figure.axes[0]
    lines = []
    for line in ax.get_lines():
        x = np.asarray(line.get_xdata(), dtype=float).ravel()
        y = np.asarray(line.get_ydata(), dtype=float).ravel()
        label = line.get_label()
        lines.append({
            "label": None if label.startswith("_") else label,
            "color": to_hex(line.get_color()),
            "marker": line.get_marker(),
            "markersize": line.get_markersize(),
            "x": np.round(x, 4).tolist(),
            "y": np.round(y, 4).tolist(),
        })
    return {"title": ax.get_title(), "lines": lines}


def task_meta(number, cells):
    task = lab10_text.TASKS[number - 1]
    return {
        "id": number,
        "title": task["title"],
        "text": task["text"],
        "question": task["question"],
        "variables": task["variables"],
        "code": cells.get(number, ""),
    }


@app.get("/api/health")
def health():
    _, cells = read_cells()
    return {"ok": True, "cells": len(cells)}


@app.get("/api/project")
def project():
    _, cells = read_cells()
    return {
        "title": lab10_text.TITLE,
        "goals": lab10_text.GOALS,
        "introduction": lab10_text.INTRODUCTION,
        "commands": lab10_text.COMMANDS,
        "submit": lab10_text.SUBMIT,
        "tasks": [task_meta(n, cells) for n in range(1, len(lab10_text.TASKS) + 1)],
    }


@app.post("/api/tasks/{number}/run")
def run_task(number: int, request: RunRequest | None = None):
    header, cells = read_cells()
    if number not in cells:
        raise HTTPException(status_code=404, detail=f"Task {number} was not found in lab10.py")
    code = cells[number]
    ratio = request.ratio if request else None
    if ratio is not None:
        if number != 12:
            raise HTTPException(status_code=400, detail="Only Task 12 takes a ratio (Q3)")
        r = round(ratio, 4)
        code = code.replace(TASK12_MATRIX, f"T = np.array([[{r}, 0], [0, {r}]])")

    with run_lock:
        start = time.perf_counter()
        try:
            namespace, printed, figure = run_cell(header, code)
        except Exception as error:  # report the cell's own error to the page
            raise HTTPException(status_code=500, detail=f"Task {number} failed: {error!r}")
        elapsed = time.perf_counter() - start
        plot = figure_to_json(figure)

    variables = {name: to_json(namespace[name])
                 for name in REPORTED_VARIABLES.get(number, []) if name in namespace}
    return {
        "id": number,
        "ratio": ratio,
        "seconds": round(elapsed, 4),
        "printed": printed,
        "variables": variables,
        "plot": plot,
    }
