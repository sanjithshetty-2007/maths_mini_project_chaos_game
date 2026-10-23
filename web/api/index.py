# Vercel entry point for the Python backend.
#
# On Vercel every request to /api/* lands here and is served by the same
# FastAPI app as api.py in the project folder, which runs the cells of
# lab10.py. Locally you don't need this file: start_presentation.bat runs
# api.py directly.

import importlib.util
import os
import sys
from pathlib import Path

# Matplotlib needs a writable folder for its cache; only /tmp is writable on Vercel.
os.environ.setdefault("MPLCONFIGDIR", "/tmp/matplotlib")

here = Path(__file__).resolve().parent
# Deployed: the Python files are copied next to the website in python/.
# Locally: they live in the project folder, two levels up.
for folder in (here.parent / "python", here.parent.parent):
    if (folder / "lab10.py").exists():
        break
sys.path.insert(0, str(folder))

spec = importlib.util.spec_from_file_location("chaos_api", folder / "api.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
app = module.app
