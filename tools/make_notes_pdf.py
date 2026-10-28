# Turns MATH_NOTES.md into a printable PDF: a cover with the contents, then
# each section with its formulas, tables and the viva questions and answers.
#
# Run from the project folder:  py tools\make_notes_pdf.py

import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

import make_script_pdf as base
from make_script_pdf import MUTED, parse_sections, render_lines, speaker_header, styles

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "MATH_NOTES.md"
OUTPUT = ROOT / "Maths_Notes_and_Viva_Questions.pdf"

SECTION_COLORS = [colors.HexColor(c) for c in ("#2563eb", "#7c3aed", "#d97706", "#059669", "#db2777", "#0e7490")]
Q_BG = colors.HexColor("#eef2ff")
Q_LINE = colors.HexColor("#4f46e5")

q_style = ParagraphStyle("q", parent=styles["body"], fontName="Body-Bold", textColor=colors.HexColor("#1e1b4b"), spaceBefore=0, spaceAfter=0)
a_style = ParagraphStyle("a", parent=styles["body"], spaceBefore=4, spaceAfter=10, leftIndent=10)

_inline = base.inline


# Set symbols that Segoe UI has no glyph for.
pdfmetrics.registerFont(TTFont("Symbols", "C:/Windows/Fonts/seguisym.ttf"))
SYMBOLS = "∪⊂↦"


def inline(text):
    """The script's inline markup, plus superscripts (r<sup>k</sup>) and set symbols."""
    text = re.sub(r"&lt;(/?sup)&gt;", r"<\1>", _inline(text))
    return re.sub(f"([{SYMBOLS}])", r'<font name="Symbols">\1</font>', text)


base.inline = inline  # render_lines looks it up at call time


def table_flowable(rows):
    cells = [[c.strip() for c in row.strip().strip("|").split("|")] for row in rows]
    cells = [r for r in cells if not all(set(c) <= set("-: ") for c in r)]  # drop the |---| line
    data = [[Paragraph(inline(c), styles["cellb" if i == 0 else "cell"]) for c in r] for i, r in enumerate(cells)]
    # share 170 mm between the columns by how much text each holds
    longest = [max(len(re.sub(r"<[^>]+>|\*", "", r[c])) for r in cells) for c in range(len(cells[0]))]
    weights = [max(6, n) ** 0.85 for n in longest]
    widths = [170 * mm * w / sum(weights) for w in weights]
    table = Table(data, colWidths=widths, repeatRows=1)
    table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d5dae6")),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eef1f8")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return [Spacer(1, 4), table, Spacer(1, 10)]


def qa_flowable(question, answer):
    box = Table([[Paragraph(inline(question), q_style)]], colWidths=[170 * mm])
    box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), Q_BG),
        ("LINEBEFORE", (0, 0), (0, -1), 3, Q_LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return [KeepTogether([box, Paragraph(inline(answer), a_style)])]


def render(lines):
    """Like render_lines, but also handles | tables | and Q: / A: pairs."""
    out, plain, i = [], [], 0

    def flush():
        if plain:
            out.extend(render_lines(plain))
            plain.clear()

    while i < len(lines):
        line = lines[i].strip()
        if line.startswith("|"):
            flush()
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                rows.append(lines[i])
                i += 1
            out.extend(table_flowable(rows))
            continue
        if line.startswith("Q: "):
            flush()
            answer = lines[i + 1].strip() if i + 1 < len(lines) else ""
            out.extend(qa_flowable("Q. " + line[3:], answer[3:] if answer.startswith("A: ") else answer))
            i += 2
            continue
        if line.startswith("### "):
            flush()
            # keep a sub-heading on the same page as what follows it
            head = Paragraph(inline(line[4:]), styles["h3"])
            out.append(head)
            i += 1
            continue
        plain.append(lines[i])
        i += 1
    flush()
    return out


def main():
    text = SOURCE.read_text(encoding="utf-8")
    title = text.splitlines()[0].lstrip("# ").strip()
    sections = parse_sections(text)

    story = [
        Paragraph("Project 10: The Chaos Game", styles["title"]),
        Paragraph("Maths notes and viva questions · the concepts behind all 13 tasks", styles["subtitle"]),
        Paragraph(
            "Discrete dynamical systems, linear transformations of the plane, and the Chaos Game. "
            "These notes explain the mathematics behind every task, work through the three questions in full, "
            "and end with likely viva questions and model answers.", styles["body"]),
        Spacer(1, 10),
        Paragraph("Contents", styles["h3"]),
    ]
    for heading, _ in sections:
        num, _, name = heading.partition(". ")
        story.append(Paragraph(inline(name), styles["list"], bulletText=f"{num}."))

    for n, (heading, lines) in enumerate(sections):
        # the big sections start on a new page; short ones flow on
        if n == 0 or heading.startswith(("4.", "5.", "7.", "11.")):
            story.append(PageBreak())
        else:
            story.append(Spacer(1, 14))
        num, _, name = heading.partition(". ")
        header = speaker_header(inline(name), f"Section {num}", SECTION_COLORS[n % len(SECTION_COLORS)])
        body = render(lines)
        story.append(KeepTogether([header, Spacer(1, 8)] + body[:2]))
        story += body[2:]

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Body", 9)
        canvas.setFillColor(MUTED)
        canvas.drawString(20 * mm, 12 * mm, "Project 10 · The Chaos Game · maths notes and viva questions")
        canvas.drawRightString(190 * mm, 12 * mm, f"Page {doc.page}")
        canvas.restoreState()

    doc = SimpleDocTemplate(str(OUTPUT), pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm,
                            topMargin=18 * mm, bottomMargin=20 * mm, title=title, author="Project 10 team")
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print("Wrote", OUTPUT)


if __name__ == "__main__":
    main()
