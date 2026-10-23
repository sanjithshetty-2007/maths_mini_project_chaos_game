# GUI for Project 10 (the Chaos Game).
#
# The GUI does no math of its own: it reads the "# %%" cells from lab10.py,
# runs the selected cell exactly as written, and shows the figure that cell
# draws inside the window.
#
# Run with:  python lab10_gui.py

import time
import traceback
import tkinter as tk
from tkinter import ttk
from tkinter.scrolledtext import ScrolledText

import numpy as np
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg, NavigationToolbar2Tk

import lab10_text
from lab10_runner import LAB_FILE, read_cells, run_cell


def describe(name, value):
    """Format a variable the way the PDF lists them under 'Variables:'."""
    if isinstance(value, np.ndarray):
        text = np.array2string(value, precision=4, suppress_small=True, threshold=20)
        return f"{name}  (shape {value.shape}) =\n{text}"
    return f"{name} = {value!r}"


class Lab10App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Project 10 — The Chaos Game")
        self.geometry("1400x900")
        self.minsize(1000, 650)
        try:
            self.state("zoomed")  # open maximised so the plot gets as much room as possible
        except tk.TclError:
            pass

        self.header, self.cells = read_cells(LAB_FILE)
        self.current_task = None
        self.plot_canvas = None
        self.plot_toolbar = None

        self._build_styles()
        self._build_layout()
        self.task_list.selection_set(0)
        self.show_introduction()

    # ---------- layout ----------

    def _build_styles(self):
        style = ttk.Style(self)
        style.configure("Title.TLabel", font=("Segoe UI", 15, "bold"))
        style.configure("Question.TLabel", font=("Segoe UI", 11, "bold"), foreground="#1a4f8b")
        style.configure("Hint.TLabel", font=("Segoe UI", 9), foreground="#666666")
        style.configure("Run.TButton", font=("Segoe UI", 11, "bold"), padding=(16, 6))

    def _build_layout(self):
        outer = ttk.PanedWindow(self, orient=tk.HORIZONTAL)
        outer.pack(fill=tk.BOTH, expand=True, padx=8, pady=8)

        # Left: task list
        left = ttk.Frame(outer, padding=(0, 0, 6, 0))
        ttk.Label(left, text="Tasks", font=("Segoe UI", 11, "bold")).pack(anchor="w", pady=(0, 4))
        self.task_list = tk.Listbox(left, font=("Segoe UI", 10), activestyle="none",
                                    exportselection=False, width=44)
        self.task_list.insert(tk.END, "Introduction")
        for number, task in enumerate(lab10_text.TASKS, start=1):
            self.task_list.insert(tk.END, f"{number}. {task['title']}")
        self.task_list.pack(fill=tk.BOTH, expand=True)
        self.task_list.bind("<<ListboxSelect>>", self.on_select)
        outer.add(left, weight=0)

        # Right: description on top, code + plot in the middle, output at the bottom
        right = ttk.PanedWindow(outer, orient=tk.VERTICAL)
        outer.add(right, weight=1)

        top = ttk.Frame(right, padding=(6, 0, 0, 6))
        self.title_label = ttk.Label(top, style="Title.TLabel", wraplength=1000, justify="left")
        self.title_label.pack(anchor="w")
        self.description = ScrolledText(top, wrap=tk.WORD, height=5, font=("Segoe UI", 10),
                                        relief=tk.FLAT, background=self.cget("background"))
        self.description.pack(fill=tk.BOTH, expand=True, pady=(4, 0))
        self.question_label = ttk.Label(top, style="Question.TLabel", wraplength=1000, justify="left")
        self.question_label.pack(anchor="w", pady=(4, 0))
        right.add(top, weight=0)

        middle = ttk.PanedWindow(right, orient=tk.HORIZONTAL)
        right.add(middle, weight=4)
        # Start with the code on the left (45%) and the plot on the right.
        self.after(200, lambda: middle.sashpos(0, int(middle.winfo_width() * 0.45)))

        code_frame = ttk.Frame(middle, padding=(6, 0, 6, 0))
        code_bar = ttk.Frame(code_frame)
        code_bar.pack(fill=tk.X, pady=(0, 4))
        ttk.Label(code_bar, text="Code (from lab10.py)", font=("Segoe UI", 10, "bold")).pack(side=tk.LEFT)
        self.run_button = ttk.Button(code_bar, text="▶ Run cell", style="Run.TButton", command=self.on_run)
        self.run_button.pack(side=tk.RIGHT)
        self.code = ScrolledText(code_frame, wrap=tk.NONE, font=("Consolas", 10), undo=True, width=40)
        self.code.pack(fill=tk.BOTH, expand=True)
        ttk.Label(code_frame, style="Hint.TLabel",
                  text="You can edit the code and run it again. Edits are not saved to lab10.py; "
                       "selecting the task again reloads it from the file.").pack(anchor="w", pady=(4, 0))
        middle.add(code_frame, weight=1)

        self.plot_frame = ttk.Frame(middle, padding=(6, 0, 0, 0))
        middle.add(self.plot_frame, weight=1)
        self.plot_placeholder = ttk.Label(self.plot_frame, anchor="center", font=("Segoe UI", 11),
                                          foreground="#777777")
        self.plot_placeholder.pack(fill=tk.BOTH, expand=True)

        bottom = ttk.Frame(right, padding=(6, 6, 0, 0))
        ttk.Label(bottom, text="Output", font=("Segoe UI", 10, "bold")).pack(anchor="w")
        self.output = ScrolledText(bottom, wrap=tk.NONE, height=5, font=("Consolas", 9))
        self.output.pack(fill=tk.BOTH, expand=True)
        right.add(bottom, weight=0)

    # ---------- helpers ----------

    def _set_text(self, widget, text, editable=False):
        widget.configure(state=tk.NORMAL)
        widget.delete("1.0", tk.END)
        widget.insert("1.0", text)
        if not editable:
            widget.configure(state=tk.DISABLED)

    def _clear_plot(self, message):
        if self.plot_toolbar is not None:
            self.plot_toolbar.destroy()
            self.plot_toolbar = None
        if self.plot_canvas is not None:
            self.plot_canvas.get_tk_widget().destroy()
            self.plot_canvas = None
        self.plot_placeholder.configure(text=message)
        self.plot_placeholder.pack(fill=tk.BOTH, expand=True)

    def _show_figure(self, figure):
        self._clear_plot("")
        self.plot_placeholder.pack_forget()
        self.plot_canvas = FigureCanvasTkAgg(figure, master=self.plot_frame)
        self.plot_toolbar = NavigationToolbar2Tk(self.plot_canvas, self.plot_frame, pack_toolbar=False)
        self.plot_toolbar.update()
        self.plot_toolbar.pack(side=tk.BOTTOM, fill=tk.X)
        self.plot_canvas.get_tk_widget().pack(side=tk.TOP, fill=tk.BOTH, expand=True)
        self.plot_canvas.draw()

    # ---------- views ----------

    def show_introduction(self):
        self.current_task = None
        self.title_label.configure(text=lab10_text.TITLE)
        intro = (f"Goals: {lab10_text.GOALS}\n\n"
                 f"Python commands used: {lab10_text.COMMANDS}\n\n"
                 f"What you have to submit: {lab10_text.SUBMIT}\n\n"
                 f"INTRODUCTION\n\n{lab10_text.INTRODUCTION}")
        self._set_text(self.description, intro)
        self.question_label.configure(text="")
        self._set_text(self.code, self.header.strip() + "\n")
        self.run_button.state(["disabled"])
        self._clear_plot("Select a task on the left and press “Run cell”.")
        self._set_text(self.output, "")

    def show_task(self, number):
        self.current_task = number
        task = lab10_text.TASKS[number - 1]
        self.title_label.configure(text=f"Task {number}: {task['title']}")
        text = task["text"]
        if task["variables"]:
            text += "\n\nVariables: " + ", ".join(task["variables"])
        self._set_text(self.description, text)
        self.question_label.configure(text=task["question"] or "")
        self._set_text(self.code, self.cells.get(number, "# This cell was not found in lab10.py\n"),
                       editable=True)
        self.run_button.state(["!disabled"])
        self._clear_plot("Press “Run cell” to run this task.")
        self._set_text(self.output, "")

    # ---------- events ----------

    def on_select(self, _event):
        selection = self.task_list.curselection()
        if not selection:
            return
        index = selection[0]
        # Reload the file so changes made to lab10.py in an editor show up.
        self.header, self.cells = read_cells(LAB_FILE)
        if index == 0:
            self.show_introduction()
        else:
            self.show_task(index)

    def on_run(self):
        if self.current_task is None:
            return
        task = lab10_text.TASKS[self.current_task - 1]
        code = self.code.get("1.0", tk.END)
        self.run_button.state(["disabled"])
        self.configure(cursor="watch")
        self.update_idletasks()
        lines = []
        try:
            start = time.perf_counter()
            namespace, printed, figure = run_cell(self.header, code)
            elapsed = time.perf_counter() - start
            lines.append(f"Task {self.current_task} ran in {elapsed:.2f} s.")
            if printed:
                lines.append(printed.rstrip())
            for name in task["variables"]:
                if name in namespace:
                    lines.append(describe(name, namespace[name]))
            if figure is not None:
                self._show_figure(figure)
            else:
                self._clear_plot("This cell defines variables only and draws no plot.\n"
                                 "See the Output box below.")
        except Exception:
            lines.append("Error while running the cell:\n" + traceback.format_exc())
            self._clear_plot("The cell stopped with an error. See the Output box below.")
        finally:
            self.configure(cursor="")
            self.run_button.state(["!disabled"])
        self._set_text(self.output, "\n\n".join(lines))


if __name__ == "__main__":
    try:  # sharp text and plots on Windows displays with scaling above 100%
        import ctypes
        ctypes.windll.shcore.SetProcessDpiAwareness(1)
    except Exception:
        pass
    Lab10App().mainloop()
