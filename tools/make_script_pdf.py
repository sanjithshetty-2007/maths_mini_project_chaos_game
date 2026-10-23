# Turns PRESENTATION_SCRIPT.md into a printable PDF: a cover page with the
# running order, then one section per speaker (each starting on a new page),
# then the checklist and likely questions.
#
# Run from the project folder:  py tools\make_script_pdf.py

import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table,
                                TableStyle)

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "PRESENTATION_SCRIPT.md"
OUTPUT = ROOT / "Presentation_Script_4_Speakers.pdf"

# Segoe UI covers π, −, ½, ², θ, → and the other symbols the script uses.
FONTS = Path("C:/Windows/Fonts")
pdfmetrics.registerFont(TTFont("Body", str(FONTS / "segoeui.ttf")))
pdfmetrics.registerFont(TTFont("Body-Bold", str(FONTS / "segoeuib.ttf")))
pdfmetrics.registerFont(TTFont("Body-Italic", str(FONTS / "segoeuii.ttf")))
pdfmetrics.registerFont(TTFont("Body-BoldItalic", str(FONTS / "segoeuiz.ttf")))
pdfmetrics.registerFont(TTFont("Code", str(FONTS / "consola.ttf")))
pdfmetrics.registerFontFamily("Body", normal="Body", bold="Body-Bold", italic="Body-Italic", boldItalic="Body-BoldItalic")

INK = colors.HexColor("#1b2133")
MUTED = colors.HexColor("#5b6478")
SPEAKER_COLORS = [colors.HexColor(c) for c in ("#2563eb", "#7c3aed", "#d97706", "#059669")]
DEMO_BG = colors.HexColor("#ecfdf5")
DEMO_LINE = colors.HexColor("#10b981")

styles = {
    "title": ParagraphStyle("title", fontName="Body-Bold", fontSize=26, leading=31, textColor=INK, spaceAfter=4),
    "subtitle": ParagraphStyle("subtitle", fontName="Body", fontSize=12, leading=16, textColor=MUTED, spaceAfter=14),
    "h1": ParagraphStyle("h1", fontName="Body-Bold", fontSize=20, leading=25, textColor=colors.white),
    "h1meta": ParagraphStyle("h1meta", fontName="Body", fontSize=11, leading=14, textColor=colors.white),
    "h2": ParagraphStyle("h2", fontName="Body-Bold", fontSize=15, leading=19, textColor=INK, spaceBefore=10, spaceAfter=6),
    "h3": ParagraphStyle("h3", fontName="Body-Bold", fontSize=13.5, leading=18, textColor=colors.HexColor("#1e3a8a"), spaceBefore=12, spaceAfter=4, keepWithNext=1),
    "body": ParagraphStyle("body", fontName="Body", fontSize=12, leading=18, textColor=INK, spaceBefore=4, spaceAfter=8, alignment=TA_LEFT),
    "list": ParagraphStyle("list", fontName="Body", fontSize=12, leading=17, textColor=INK, leftIndent=18, bulletIndent=4, spaceAfter=4),
    "formula": ParagraphStyle("formula", fontName="Body-Bold", fontSize=15, leading=20, textColor=INK, leftIndent=14, spaceBefore=4, spaceAfter=10),
    "demo": ParagraphStyle("demo", fontName="Body-Bold", fontSize=11, leading=15, textColor=colors.HexColor("#065f46")),
    "small": ParagraphStyle("small", fontName="Body", fontSize=10, leading=13, textColor=MUTED),
    "cell": ParagraphStyle("cell", fontName="Body", fontSize=10.5, leading=13.5, textColor=INK),
    "cellb": ParagraphStyle("cellb", fontName="Body-Bold", fontSize=10.5, leading=13.5, textColor=INK),
}


def inline(text):
    """Markdown bold/italic/code → reportlab markup."""
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"&lt;(/?sub)&gt;", r"<\1>", text)  # keep x<sub>k</sub> subscripts
    text = re.sub(r"`([^`]+)`", r'<font name="Code">\1</font>', text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    # Demo cues inside a sentence stand out in green.
    text = re.sub(r"<b>\[DEMO\]\s*(.+?)</b>", r'<font color="#047857"><b>[DEMO › \1]</b></font>', text)
    text = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<i>\1</i>", text)
    text = re.sub(r"\[([^\]]+)\]\((?:[^)]+)\)", r"\1", text)  # drop link targets
    return text


def demo_box(text):
    table = Table([[Paragraph(text, styles["demo"])]], colWidths=[170 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), DEMO_BG),
        ("LINEBEFORE", (0, 0), (0, -1), 3, DEMO_LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


def speaker_header(title, meta, color):
    table = Table([[Paragraph(title, styles["h1"])], [Paragraph(meta, styles["h1meta"])]], colWidths=[170 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), color),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (0, 0), 12),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 12),
        ("ROUNDEDCORNERS", [8, 8, 8, 8]),
    ]))
    return table


def render_lines(lines):
    """Render the body of one section (paragraphs, lists, formulas, demo cues)."""
    out = []
    paragraph = []

    def flush():
        if paragraph:
            out.append(Paragraph(inline(" ".join(paragraph)), styles["body"]))
            paragraph.clear()

    for raw in lines:
        line = raw.rstrip()
        stripped = line.strip()
        if not stripped or stripped == "---":
            flush()
            continue
        if stripped.startswith("### "):
            flush()
            out.append(Paragraph(inline(stripped[4:]), styles["h3"]))
            continue
        demo = re.match(r"^\*\*\[DEMO\]([^*]*)\*\*(.*)$", stripped)
        if demo:
            flush()
            out.append(Spacer(1, 2))
            out.append(demo_box("DEMO › " + inline(demo.group(1).strip())))
            out.append(Spacer(1, 6))
            if demo.group(2).strip():
                paragraph.append(demo.group(2).strip())
            continue
        if stripped.startswith(">"):
            flush()
            out.append(Paragraph(inline(stripped.lstrip("> ").strip()), styles["formula"]))
            continue
        numbered = re.match(r"^(\d+)\.\s+(.*)$", stripped)
        bullet = re.match(r"^[-*]\s+(.*)$", stripped)
        if numbered:
            flush()
            out.append(Paragraph(inline(numbered.group(2)), styles["list"], bulletText=numbered.group(1) + "."))
            continue
        if bullet:
            flush()
            indent = (len(line) - len(line.lstrip())) // 2
            style = ParagraphStyle("sub", parent=styles["list"], leftIndent=18 + 16 * indent, bulletIndent=4 + 16 * indent)
            out.append(Paragraph(inline(bullet.group(1)), style, bulletText="•"))
            continue
        paragraph.append(stripped)
    flush()
    return out


def parse_sections(text):
    """Split the script into (heading, lines) pairs on '## ' headings."""
    sections = []
    current = None
    for line in text.splitlines():
        if line.startswith("## "):
            current = (line[3:].strip(), [])
            sections.append(current)
        elif current is not None:
            current[1].append(line)
    return sections


def main():
    text = SOURCE.read_text(encoding="utf-8")
    sections = parse_sections(text)
    parts = [s for s in sections if s[0].startswith("Part ")]
    about = [s for s in sections if s[0].startswith("About")]
    extras = [s for s in sections if not s[0].startswith("Part ") and s not in about]

    story = []
    # ---- cover ----
    story.append(Paragraph("Project 10: The Chaos Game", styles["title"]))
    story.append(Paragraph("Presentation script for 4 speakers · about 6 minutes (5 to 7 allowed)", styles["subtitle"]))
    rows = [[Paragraph("Part", styles["cellb"]), Paragraph("Speaker", styles["cellb"]),
             Paragraph("Topic", styles["cellb"]), Paragraph("Time", styles["cellb"])]]
    for heading, _ in parts:
        bits = [b.strip() for b in heading.split("·")]
        name = bits[0].split("—", 1)
        rows.append([Paragraph(name[0].strip(), styles["cell"]), Paragraph(bits[1] if len(bits) > 1 else "", styles["cell"]),
                     Paragraph(name[1].strip() if len(name) > 1 else "", styles["cell"]),
                     Paragraph(bits[2].lstrip("~") if len(bits) > 2 else "", styles["cell"])])
    table = Table(rows, colWidths=[22 * mm, 30 * mm, 92 * mm, 26 * mm])
    style = [
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d5dae6")),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eef1f8")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]
    for i in range(1, len(rows)):
        style.append(("LINEBEFORE", (0, i), (0, i), 4, SPEAKER_COLORS[(i - 1) % 4]))
    table.setStyle(TableStyle(style))
    story += [table, Spacer(1, 14)]
    story.append(Paragraph(
        "Green <b>DEMO ›</b> cues are the moments to press → in the presentation while you keep talking. "
        "Speaking pace is about 130 words a minute.", styles["small"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "Live presentation: start_presentation.bat on the laptop, or the Vercel link. Press F for full screen, "
        "→ for the next animation, N to show these lines on screen.", styles["small"]))
    story.append(Spacer(1, 18))
    story.append(Paragraph("Contents", styles["h3"]))
    contents = ["About the project: the assignment, the mathematics, the 13 tasks, the answers and what we built"]
    contents += [f"{h.split('·')[1].strip()}: {h.split('·')[0].split('—', 1)[-1].strip()}" for h, _ in parts]
    contents += [h for h, _ in extras]
    for n, line in enumerate(contents, start=1):
        story.append(Paragraph(inline(line), styles["list"], bulletText=f"{n}."))

    # ---- the project explained ----
    for heading, lines in about:
        story.append(PageBreak())
        story.append(speaker_header(inline(heading), "The whole project, before the script", colors.HexColor("#1e293b")))
        story.append(Spacer(1, 6))
        story += render_lines(lines)

    # ---- one section per speaker ----
    for i, (heading, lines) in enumerate(parts):
        story.append(PageBreak())
        bits = [b.strip() for b in heading.split("·")]
        title = bits[0]
        meta = " · ".join(b.replace("~", "about ") for b in bits[1:])
        story.append(speaker_header(inline(title), inline(meta), SPEAKER_COLORS[i % 4]))
        story.append(Spacer(1, 12))
        story += render_lines(lines)

    # ---- checklist + questions ----
    story.append(PageBreak())
    for heading, lines in extras:
        story.append(KeepTogether([Paragraph(inline(heading), styles["h2"])] + render_lines(lines)[:1]))
        story += render_lines(lines)[1:]

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Body", 9)
        canvas.setFillColor(MUTED)
        canvas.drawString(20 * mm, 12 * mm, "Project 10 · The Chaos Game · presentation script")
        canvas.drawRightString(190 * mm, 12 * mm, f"Page {doc.page}")
        canvas.restoreState()

    doc = SimpleDocTemplate(str(OUTPUT), pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm,
                            topMargin=18 * mm, bottomMargin=20 * mm,
                            title="Project 10 – Presentation Script", author="Project 10 team")
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print("Wrote", OUTPUT)


if __name__ == "__main__":
    main()
