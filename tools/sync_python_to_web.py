# Copies the Python files from the project folder into web/python/ so the
# Vercel deployment (which builds from web/) has them. The files in the
# project folder stay the originals; run this after changing any of them,
# then commit and push.
#
# Run from the project folder:  py tools\sync_python_to_web.py

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / "web" / "python"
FILES = ["lab10.py", "lab10_text.py", "lab10_runner.py", "api.py"]

TARGET.mkdir(exist_ok=True)
for name in FILES:
    shutil.copy2(ROOT / name, TARGET / name)
    print("copied", name, "->", TARGET.relative_to(ROOT) / name)
