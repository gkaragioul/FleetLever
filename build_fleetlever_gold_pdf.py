import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer


SOURCE = Path("docs/fleetlever-gold-version-development-plan.md")
OUTPUT = Path.home() / "Desktop" / "FleetLever_Gold_Version_Development_Plan_2026-05-29.pdf"


def esc(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def inline(text: str) -> str:
    text = esc(text)
    text = re.sub(r"`([^`]+)`", r"<font name='Courier'>\1</font>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    return text


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#667085"))
    canvas.drawString(1.55 * cm, 1.0 * cm, "FleetLever Gold Version Development Plan - 29 May 2026")
    canvas.drawRightString(19.45 * cm, 1.0 * cm, f"Page {doc.page}")
    canvas.restoreState()


def styles():
    s = getSampleStyleSheet()
    s.add(ParagraphStyle(
        name="CoverTitle",
        parent=s["Title"],
        fontName="Helvetica-Bold",
        fontSize=27,
        leading=32,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#102A43"),
        spaceAfter=12,
    ))
    s.add(ParagraphStyle(
        name="CoverSub",
        parent=s["Normal"],
        fontName="Helvetica",
        fontSize=12.5,
        leading=17,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#425466"),
        spaceAfter=10,
    ))
    s.add(ParagraphStyle(
        name="H1",
        parent=s["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=15.5,
        leading=19,
        textColor=colors.HexColor("#17324D"),
        spaceBefore=9,
        spaceAfter=6,
    ))
    s.add(ParagraphStyle(
        name="H2",
        parent=s["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11.2,
        leading=14,
        textColor=colors.HexColor("#24506F"),
        spaceBefore=7,
        spaceAfter=4,
    ))
    s.add(ParagraphStyle(
        name="Body",
        parent=s["BodyText"],
        fontName="Helvetica",
        fontSize=8.8,
        leading=12.5,
        textColor=colors.HexColor("#26323F"),
        spaceAfter=5,
    ))
    s.add(ParagraphStyle(
        name="GoldBullet",
        parent=s["BodyText"],
        fontName="Helvetica",
        fontSize=8.55,
        leading=11.7,
        leftIndent=13,
        firstLineIndent=-8,
        textColor=colors.HexColor("#26323F"),
        spaceAfter=2.8,
    ))
    s.add(ParagraphStyle(
        name="Quote",
        parent=s["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=9.4,
        leading=13.4,
        textColor=colors.HexColor("#17324D"),
        backColor=colors.HexColor("#EAF2F8"),
        borderColor=colors.HexColor("#B8D3EA"),
        borderWidth=0.5,
        borderPadding=7,
        leftIndent=3,
        rightIndent=3,
        spaceBefore=5,
        spaceAfter=8,
    ))
    s.add(ParagraphStyle(
        name="GoldCode",
        parent=s["BodyText"],
        fontName="Courier",
        fontSize=7,
        leading=9,
        textColor=colors.HexColor("#1F2933"),
        backColor=colors.HexColor("#F3F6FA"),
        borderColor=colors.HexColor("#D8E0EA"),
        borderWidth=0.35,
        borderPadding=5,
        spaceBefore=4,
        spaceAfter=6,
    ))
    s.add(ParagraphStyle(
        name="Meta",
        parent=s["BodyText"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#566574"),
        alignment=TA_LEFT,
        spaceAfter=4,
    ))
    return s


def build_story(md: str):
    st = styles()
    story = []

    lines = md.splitlines()
    title = lines[0].lstrip("# ").strip()

    story.append(Spacer(1, 2.1 * cm))
    story.append(Paragraph(esc(title), st["CoverTitle"]))
    story.append(Paragraph("Production-Grade Product, UX, Architecture, AI, Security, and Implementation Blueprint", st["CoverSub"]))
    story.append(Paragraph("Prepared for George Karagioules - 29 May 2026", st["CoverSub"]))
    story.append(Spacer(1, 0.55 * cm))
    story.append(Paragraph(
        "Gold Version means FleetLever is no longer just a demo. It is the serious commercial SaaS version that Greek fleet, crane, construction, tourism, rental, and equipment-heavy companies can trust as their daily operations readiness system.",
        st["Quote"],
    ))
    story.append(Spacer(1, 0.25 * cm))
    story.append(Paragraph("Core thesis: do not become a bloated ERP. Build the gold-standard operations readiness product: assets, documents, compliance, expirations, maintenance, issues, AI, imports, notifications, reports, security, and auditability.", st["Body"]))
    story.append(PageBreak())

    in_code = False
    code_lines = []
    para_lines = []

    def flush_para():
        nonlocal para_lines
        if para_lines:
            text = " ".join(x.strip() for x in para_lines if x.strip())
            if text:
                story.append(Paragraph(inline(text), st["Body"]))
            para_lines = []

    def flush_code():
        nonlocal code_lines
        if code_lines:
            text = "<br/>".join(esc(x) for x in code_lines)
            story.append(Paragraph(text, st["GoldCode"]))
            code_lines = []

    for raw in lines[1:]:
        line = raw.rstrip()

        if line.startswith("```"):
            if in_code:
                flush_code()
                in_code = False
            else:
                flush_para()
                in_code = True
            continue

        if in_code:
            code_lines.append(line)
            continue

        if not line.strip():
            flush_para()
            continue

        if line.startswith("## "):
            flush_para()
            story.append(Spacer(1, 0.12 * cm))
            story.append(Paragraph(inline(line[3:].strip()), st["H1"]))
            continue

        if line.startswith("### "):
            flush_para()
            story.append(Paragraph(inline(line[4:].strip()), st["H2"]))
            continue

        if line.startswith("> "):
            flush_para()
            story.append(Paragraph(inline(line[2:].strip()), st["Quote"]))
            continue

        if line.startswith("- "):
            flush_para()
            story.append(Paragraph("- " + inline(line[2:].strip()), st["GoldBullet"]))
            continue

        if re.match(r"^\d+\. ", line):
            flush_para()
            story.append(Paragraph(inline(line.strip()), st["GoldBullet"]))
            continue

        if line.endswith(":") and len(line) < 80:
            flush_para()
            story.append(Paragraph(f"<b>{inline(line)}</b>", st["Body"]))
            continue

        if line.startswith("Status:") or line.startswith("Target:") or line.startswith("Prepared:"):
            flush_para()
            story.append(Paragraph(inline(line), st["Meta"]))
            continue

        para_lines.append(line)

    flush_para()
    flush_code()
    return story


def main():
    md = SOURCE.read_text(encoding="utf-8")
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=1.55 * cm,
        rightMargin=1.55 * cm,
        topMargin=1.35 * cm,
        bottomMargin=1.55 * cm,
        title="FleetLever Gold Version Development Plan",
        author="Codex",
    )
    doc.build(build_story(md), onFirstPage=header_footer, onLaterPages=header_footer)
    print(OUTPUT)


if __name__ == "__main__":
    main()
