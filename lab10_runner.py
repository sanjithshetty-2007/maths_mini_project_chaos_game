# Runs the "# %%" cells of lab10.py exactly as written.
# Used by both the desktop GUI (lab10_gui.py) and the web API (api.py), so the
# PDF's code in lab10.py stays the only place the math lives.

import contextlib
import io
import re
import threading
from pathlib import Path

import matplotlib
matplotlib.use("Agg")  # cells draw off-screen; the GUI / web page shows the result
import matplotlib.pyplot as plt

LAB_FILE = Path(__file__).with_name("lab10.py")

# pyplot keeps global state, so only one cell may run at a time.
run_lock = threading.Lock()


def read_cells(path=LAB_FILE):
    """Split lab10.py into its header (imports) and one code string per task."""
    source = path.read_text(encoding="utf-8")
    parts = re.split(r"^# %%", source, flags=re.MULTILINE)
    header = parts[0]
    cells = {}
    for part in parts[1:]:
        first_line, _, body = part.partition("\n")
        match = re.match(r"\s*Task (\d+)", first_line)
        if match:
            cells[int(match.group(1))] = "# %%" + first_line + "\n" + body.strip("\n") + "\n"
    return header, cells


def run_cell(header, code):
    """Run one cell in a fresh namespace (like the PDF's `clear`).

    Returns (namespace, printed output, figure or None). Callers that run cells
    from several threads must hold run_lock while calling this and while
    reading the figure.
    """
    plt.close("all")
    namespace = {"__name__": "lab10_cell"}
    output = io.StringIO()
    real_show = plt.show
    plt.show = lambda *args, **kwargs: None  # the caller shows the figure instead
    try:
        with contextlib.redirect_stdout(output):
            exec(compile(header, str(LAB_FILE), "exec"), namespace)
            exec(compile(code, str(LAB_FILE), "exec"), namespace)
    finally:
        plt.show = real_show
    numbers = plt.get_fignums()
    figure = plt.figure(numbers[-1]) if numbers else None
    return namespace, output.getvalue(), figure
