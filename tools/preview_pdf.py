# Renders each page of the script PDF to a PNG in tools\pdf_preview\ for a quick look.
from pathlib import Path

import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parent.parent
out = ROOT / "tools" / "pdf_preview"
out.mkdir(exist_ok=True)
pdf = pdfium.PdfDocument(str(ROOT / "Presentation_Script_4_Speakers.pdf"))
for i, page in enumerate(pdf):
    page.render(scale=1.1).to_pil().save(out / f"page{i + 1}.png")
print("pages:", len(pdf))
