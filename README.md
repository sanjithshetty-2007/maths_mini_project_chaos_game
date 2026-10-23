# Project 10: The Chaos Game

Discrete dynamical systems, linear transformations of the plane, and the Chaos Game.

| File | What it is |
|---|---|
| `lab10.py` | The project deliverable: every task's code from the PDF, one `# %%` cell per task |
| `lab10_gui.py` | Desktop window that runs each cell and shows its plot (`run_gui.bat`) |
| `api.py` | FastAPI backend that runs the cells and returns the plotted points |
| `web/` | Next.js + three.js presentation that draws those points (`start_presentation.bat`) |
| `PRESENTATION_SCRIPT.md` | The 4-speaker script; `Presentation_Script_4_Speakers.pdf` is the printable version |

## Run it on a laptop

- Desktop app: double-click `run_gui.bat`
- Presentation: double-click `start_presentation.bat`, then open http://localhost:3000

## Deployed on Vercel

Vercel builds the `web/` folder from the `main` branch. The Python backend runs as a
Vercel function (`web/api/index.py`) using copies of the Python files in `web/python/`.

After changing `lab10.py`, `lab10_text.py`, `lab10_runner.py` or `api.py`, update the copies,
then commit and push:

```bash
py tools\sync_python_to_web.py
```

To rebuild the script PDF after editing `PRESENTATION_SCRIPT.md`:

```bash
py tools\make_script_pdf.py
```
