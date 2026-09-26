from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


OUTPUT = str(Path.home() / "Desktop" / "FleetLever_Greece_Advanced_Market_Analysis_2026-05-29.pdf")


def p(txt, style):
    return Paragraph(txt, style)


def clean(txt):
    return txt.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def para(txt, style):
    return Paragraph(clean(txt), style)


def bullet(txt, styles):
    return Paragraph("- " + clean(txt), styles["ReportBullet"])


def rows(data, styles, header=True):
    out = []
    for idx, row in enumerate(data):
        cell_style = styles["TableHeader"] if header and idx == 0 else styles["TableCell"]
        out.append([Paragraph(clean(str(cell)), cell_style) for cell in row])
    return out


def make_table(data, styles, widths=None, header=True, font_size=8):
    table = Table(rows(data, styles, header=header), colWidths=widths, hAlign="LEFT", repeatRows=1 if header else 0)
    commands = [
        ("BOX", (0, 0), (-1, -1), 0.4, colors.HexColor("#C9D3DF")),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#DDE4EC")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    if header:
        commands.extend([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#17324D")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ])
    for r in range(1 if header else 0, len(data)):
        if r % 2 == 0:
            commands.append(("BACKGROUND", (0, r), (-1, r), colors.HexColor("#F7F9FC")))
    table.setStyle(TableStyle(commands))
    return table


def add_section(story, title, styles):
    story.append(Spacer(1, 0.25 * cm))
    story.append(Paragraph(clean(title), styles["ReportH1"]))
    story.append(Spacer(1, 0.08 * cm))


def add_subsection(story, title, styles):
    story.append(Spacer(1, 0.16 * cm))
    story.append(Paragraph(clean(title), styles["ReportH2"]))
    story.append(Spacer(1, 0.05 * cm))


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#6B7684"))
    canvas.drawString(1.6 * cm, 1.0 * cm, "FleetLever Greece market analysis - prepared 29 May 2026")
    canvas.drawRightString(19.4 * cm, 1.0 * cm, f"Page {doc.page}")
    canvas.restoreState()


def build():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="TitleMain",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=26,
        leading=31,
        textColor=colors.HexColor("#102A43"),
        alignment=TA_CENTER,
        spaceAfter=12,
    ))
    styles.add(ParagraphStyle(
        name="Subtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=17,
        textColor=colors.HexColor("#425466"),
        alignment=TA_CENTER,
        spaceAfter=18,
    ))
    styles.add(ParagraphStyle(
        name="Lead",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=16,
        textColor=colors.HexColor("#17324D"),
        backColor=colors.HexColor("#EAF2F8"),
        borderColor=colors.HexColor("#B9D3EA"),
        borderWidth=0.6,
        borderPadding=8,
        spaceBefore=8,
        spaceAfter=10,
    ))
    styles.add(ParagraphStyle(
        name="Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.2,
        leading=13.5,
        textColor=colors.HexColor("#25313D"),
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name="Small",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#425466"),
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="ReportBullet",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.8,
        leading=12,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=4,
        textColor=colors.HexColor("#25313D"),
    ))
    styles.add(ParagraphStyle(
        name="ReportH1",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=19,
        textColor=colors.HexColor("#17324D"),
        spaceBefore=6,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name="ReportH2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11.2,
        leading=14,
        textColor=colors.HexColor("#254B6F"),
        spaceBefore=4,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="TableCell",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=9.6,
        textColor=colors.HexColor("#25313D"),
    ))
    styles.add(ParagraphStyle(
        name="TableHeader",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9.6,
        textColor=colors.white,
    ))

    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=A4,
        leftMargin=1.55 * cm,
        rightMargin=1.55 * cm,
        topMargin=1.4 * cm,
        bottomMargin=1.55 * cm,
        title="FleetLever Greece Advanced Market Analysis",
        author="Codex",
    )
    story = []

    story.append(Spacer(1, 2.2 * cm))
    story.append(Paragraph("FleetLever", styles["TitleMain"]))
    story.append(Paragraph("Advanced Greece Market Analysis, Positioning, Pricing, and GTM Strategy", styles["Subtitle"]))
    story.append(Paragraph("Prepared for George Karagioules - 29 May 2026", styles["Subtitle"]))
    story.append(Spacer(1, 0.6 * cm))

    top_cards = [
        ["Verdict", "Best First Wedge", "Planning SAM", "Best Sales Promise"],
        [
            "Proceed, but narrow",
            "Crane/lifting + construction machinery operators with 10-80 assets",
            "EUR 7M-36M ARR in Greece, depending on reachable adoption",
            "Every morning, know what asset, document, certificate, inspection, or maintenance issue needs attention.",
        ],
    ]
    story.append(make_table(top_cards, styles, widths=[4.1 * cm, 5.0 * cm, 3.6 * cm, 4.2 * cm]))
    story.append(Spacer(1, 0.5 * cm))
    story.append(Paragraph(
        "Core answer: FleetLever should be sold in Greece as an operations and compliance readiness system for mixed fleets and equipment, not as generic AI and not as GPS/telematics. AI is the daily assistant layer, but the thing customers buy is fewer missed renewals, fewer lost documents, less inspection panic, and clearer maintenance accountability.",
        styles["Lead"],
    ))
    story.append(Spacer(1, 0.7 * cm))
    story.append(Paragraph("Confidence: medium-high for a profitable Greece-first niche SaaS; medium for regional scale; low if the product expands into a generic fleet/ERP suite before proving paid pilots.", styles["Body"]))
    story.append(PageBreak())

    add_section(story, "1. Executive Summary", styles)
    for item in [
        "FleetLever has a real Greece-market opportunity because Greek field businesses manage old vehicles, mixed equipment, documents, inspections, insurance, KTEO, operator credentials, service tasks, and scattered files with Excel, WhatsApp, memory, accountants, and paper folders.",
        "The strongest angle is not 'fleet management software'. That category is crowded and usually means GPS, driver behavior, routing, fuel, and telematics. The strongest angle is 'compliance readiness and operational memory for vehicles and equipment'.",
        "The first customer should not be a pure logistics company that expects GPS. The best early wedge is crane/lifting, construction machinery, and equipment-heavy operators, because certificates, inspections, maintenance records, and operator readiness are high-stakes and recurring.",
        "The AI copilot should be presented as a practical daily control room: 'What needs attention this week?', 'What expires this month?', 'Which machines are not ready?', and 'What documents are missing?'",
        "The product should be service-assisted SaaS at first. Greek SMBs will not reliably clean, import, and structure messy records alone. Concierge import and setup can become a trust-builder and a revenue line.",
        "The first commercial target should be 3 paid pilots, then 10 paying customers, then one vertical case study before adding GPS, ERP, fuel, route planning, dispatch, or accounting.",
    ]:
        story.append(bullet(item, styles))

    add_subsection(story, "Best possible Greek-market angle", styles)
    story.append(Paragraph(
        "Position FleetLever as: 'The AI operations desk for Greek companies with vehicles, cranes, machinery, certificates, inspections, maintenance, and deadlines.' The customer outcome is not 'more data'; it is operational calm before an inspection, renewal, breakdown, audit, rental handover, or seasonal rush.",
        styles["Lead"],
    ))

    add_section(story, "2. Evidence Base and Market Anchors", styles)
    story.append(para(
        "The market is validated by five overlapping signals: a large commercial vehicle base, very old fleet age, a broad set of Greek businesses with transport/construction/tourism exposure, legally required inspection categories, and active digitalization pressure. None of these alone proves willingness to pay; together they justify paid pilot validation.",
        styles["Body"],
    ))
    evidence = [
        ["Anchor", "Latest evidence used", "Strategic implication"],
        ["Commercial vehicle base", "ACEA reports 878,046 vans, 195,728 trucks, and 27,713 buses on Greek roads in 2024.", "About 1.1M commercial vans/trucks/buses before counting machinery, trailers, cranes, forklifts, and other equipment."],
        ["Aging assets", "ACEA 2026 says Greece had the oldest EU truck fleet at 22.9 years; vans averaged 21.2 years; buses 17.2 years.", "Older fleets create more service, inspection, repair, document, and reliability burden."],
        ["Relevant enterprises", "ELSTAT SBR 2023: 72,631 active construction enterprises, 66,538 transportation/storage, 108,413 accommodation/food service, 26,908 admin/support.", "Large top-of-funnel, but only a small subset has enough assets and urgency to buy SaaS."],
        ["Road freight", "ELSTAT 2024 road freight: 258,995.0 thousand tonnes carried and 20,626,727.5 thousand tonne-km by Greek-registered road freight vehicles.", "Transport activity is material, but pure logistics buyers may expect GPS and routing."],
        ["Construction momentum", "ELSTAT private building activity 2024: 30,678 permits, +14.9% permits, +16.5% surface, +8.7% volume versus 2023.", "Construction and equipment utilization remain attractive demand contexts."],
        ["Tourism activity", "Bank of Greece 2025: inbound travellers +6.4%, travel receipts +9.4%, receipts EUR 23.6B.", "Tourism transfer/bus fleets are a seasonal secondary wedge with strong readiness pressure."],
        ["SME digital readiness", "European Commission says Greek SME digitalization is improving but business tech uptake remains challenging; Eurostat reports only 53% of Greek SMEs had at least basic digital intensity.", "The product must reduce setup friction and feel operational, not technical."],
        ["Mandatory equipment inspections", "TUV Austria Hellas states lifting/work machinery periodic inspections in Greece are compulsory, with 1-5 year intervals based on risk category and fines for missing certificates.", "This is the sharpest compliance wedge for cranes, forklifts, lifts, platforms, and construction equipment."],
    ]
    story.append(make_table(evidence, styles, widths=[3.2 * cm, 7.0 * cm, 6.6 * cm]))

    add_section(story, "3. Market Definition", styles)
    story.append(para(
        "FleetLever should define its category as 'AI-assisted fleet and equipment operations compliance' rather than broad fleet management. The category sits between fleet software, CMMS, document management, compliance reminders, and operations dashboards.",
        styles["Body"],
    ))
    scope = [
        ["In scope for MVP", "Out of scope until proof"],
        ["Vehicles, cranes, buses, machinery, forklifts, trailers, excavators, aerial platforms, equipment records.", "GPS tracking, hardware, live telematics, OBD, CANBUS, dashcams."],
        ["KTEO, insurance, inspection certificates, operator licenses, permits, lifting certificates, document upload, expiration alerts.", "Route optimization, dispatch, proof of delivery, fuel cards, tachograph analytics."],
        ["Maintenance schedules, service logs, issue reports, overdue tasks, daily risk summary.", "ERP, invoicing, payroll, accounting, inventory management, procurement."],
        ["AI chat over structured asset/document/maintenance data with cited source records.", "Unverified legal advice, autonomous compliance decisions, predictive maintenance from sensors."],
    ]
    story.append(make_table(scope, styles, widths=[8.4 * cm, 8.4 * cm]))

    add_section(story, "4. Segment Prioritization", styles)
    story.append(para(
        "The best early segment is not the largest segment; it is the segment with urgent pain, visible consequences, reachable buyers, and a simple demo. Below is the recommended priority order for Greece.",
        styles["Body"],
    ))
    segments = [
        ["Rank", "Segment", "Attractiveness", "Why it matters", "Best sales angle"],
        ["1", "Crane and lifting equipment companies", "Very high", "Mandatory periodic inspections, operator readiness, high cost of missing certificates, many asset/document types.", "Never discover a missing certificate when the job or inspector is already waiting."],
        ["2", "Construction machinery and contractors", "Very high", "Mixed assets, job-site pressure, old equipment, maintenance chaos, decentralised documents.", "One morning dashboard for every machine, truck, document, service, and inspection risk."],
        ["3", "Equipment rental firms", "High", "Readiness, handover documents, damage/service history, certificates before rental.", "Do not rent out equipment with missing documents or hidden maintenance issues."],
        ["4", "Tourism bus and transfer fleets", "High seasonal", "Season starts create readiness pressure for KTEO, insurance, bus condition, driver/operator docs.", "Before the season starts, know exactly what expires, what is missing, and what is risky."],
        ["5", "Small logistics/transport firms", "Medium-high", "Vehicle maintenance and permits matter, but many buyers ask for GPS/fuel/route features.", "No-hardware control layer for documents, deadlines, and maintenance."],
        ["6", "Municipal/public fleets", "Later", "Large fleets and clear needs, but tenders, procurement, integrations, and politics slow early learning.", "Approach after private-sector proof and references."],
    ]
    story.append(make_table(segments, styles, widths=[1.0 * cm, 3.3 * cm, 2.2 * cm, 5.3 * cm, 5.0 * cm]))

    add_subsection(story, "Primary ICP", styles)
    story.append(para(
        "Owner-operated Greek business with 10-80 operational assets, including vehicles and/or machinery, recurring inspections, insurance/KTEO/certificates, a spreadsheet or folder-based process, and no internal systems team. The practical buyer is usually the owner, operations manager, fleet manager, office administrator, safety/compliance responsible person, or the family member who keeps the paperwork from collapsing.",
        styles["Body"],
    ))

    add_section(story, "5. Jobs To Be Done and Pain Map", styles)
    jobs = [
        ["Job", "Current workaround", "Pain signal", "FleetLever response"],
        ["Know what needs attention this week", "Memory, Excel filters, calendar reminders, WhatsApp", "Owner asks the same question repeatedly; admin manually checks dates.", "Daily AI summary + risk board."],
        ["Avoid expired documents/certificates", "Folders, filenames, accountant reminders", "Panic before inspection/job; missing PDF; old certificate version.", "Document vault linked to assets + expiration logic."],
        ["Keep machines and vehicles service-ready", "Mechanic notes, WhatsApp photos, notebook, service invoices", "Overdue service discovered late; unclear history.", "Maintenance schedule, issue log, service history."],
        ["Prepare for inspection, rental, job, or season", "Manual checklist, calls to drivers/operators", "Many items must be checked in a short period.", "Readiness checklist by asset and vertical."],
        ["Answer owner questions quickly", "Admin searches files manually", "Interruptions and slow answers create stress.", "AI chat that cites structured records."],
    ]
    story.append(make_table(jobs, styles, widths=[3.5 * cm, 4.0 * cm, 4.5 * cm, 4.8 * cm]))

    add_section(story, "6. Competitive Landscape", styles)
    story.append(para(
        "FleetLever should respect incumbents but not fight them on their home turf. The large vendors are strong in telematics, GPS, route control, driver behavior, and enterprise workflows. The opening is a lighter, Greece-specific operations-memory layer for companies that do not want hardware first.",
        styles["Body"],
    ))
    competitors = [
        ["Competitor/substitute", "Position", "Strength", "Opening for FleetLever"],
        ["Excel, WhatsApp, paper folders", "Default incumbent", "Free, flexible, already used, no onboarding sale required.", "Beat with import help, reminders, daily AI summaries, document search, and owner-visible calm."],
        ["PowerFleet Greece", "Telematics-led fleet management with ERP features", "GPS device install, real-time location, sensors/CANBUS, reporting, ERP records.", "Too hardware/tracking-first for document/compliance-first SMEs."],
        ["Webfleet via Eltrak", "European telematics and fleet optimization", "Trusted brand, 60k+ customers claim, route/fuel/service optimization.", "FleetLever can avoid hardware, start faster, and focus on Greek certificates and mixed equipment."],
        ["OTS Open1 Fleet", "Greek web/cloud fleet office system, mainly public authorities", "Traffic docs, maintenance, technical checks, insurance, driver documents, notifications.", "FleetLever can be more modern, AI-native, SMB-focused, and private-sector verticalized."],
        ["Yipii Mobility", "Fleet operations with compliance, automations, AI/IoT adjacency", "Closest feature overlap: compliance docs, expiry alerts, maintenance, WhatsApp, AI.", "Validates the wedge; FleetLever must win with Greece-specific packs, simpler setup, and local founder-led support."],
        ["Fleetio", "Global fleet management SaaS", "Clear per-vehicle pricing, mature maintenance/fleet features.", "Not Greek-compliance native; can feel generic/foreign for local SMEs."],
        ["MaintainX", "CMMS/EAM maintenance platform", "Strong work orders, inspections, maintenance, CoPilot, per-user pricing.", "Not fleet/document/KTEO-specific; may be too broad and operationally heavy for small Greek fleets."],
    ]
    story.append(make_table(competitors, styles, widths=[3.1 * cm, 3.4 * cm, 4.8 * cm, 5.5 * cm]))

    add_subsection(story, "Positioning Map", styles)
    positioning = [
        ["Axis", "Telematics incumbents", "CMMS incumbents", "FleetLever target"],
        ["Primary promise", "Where are vehicles and how do they perform?", "How do assets get maintained?", "What operational/compliance risk needs attention now?"],
        ["Starting data", "GPS/device streams", "Work orders and maintenance records", "Assets, documents, expiration dates, service tasks, issues"],
        ["Buyer feeling", "Control and optimization", "Maintenance discipline", "Calm, readiness, no missed deadline"],
        ["Adoption risk", "Hardware install and cost", "Change management and technician adoption", "Initial data import and trust in reminders"],
    ]
    story.append(make_table(positioning, styles, widths=[3.2 * cm, 4.5 * cm, 4.5 * cm, 4.6 * cm]))

    add_section(story, "7. Market Size and Revenue Scenarios", styles)
    story.append(para(
        "These are planning ranges, not verified market truth. Greece has a large top-of-funnel, but the software-reachable market is constrained by digital maturity, willingness to pay, and the need for setup. The best model is to size from reachable companies, not from total vehicles.",
        styles["Body"],
    ))
    model = [
        ["Case", "Reachable companies", "Avg MRR", "Annual SAM", "Interpretation"],
        ["Conservative", "3,000", "EUR 120", "EUR 4.3M", "Only companies with visible certificate/maintenance pain adopt."],
        ["Base", "8,000", "EUR 225", "EUR 21.6M", "Adoption across construction, crane, rental, tourism transport, and logistics SMBs."],
        ["Aggressive", "15,000", "EUR 350", "EUR 63.0M", "Category expands into broader mixed-asset operations and compliance workflows."],
    ]
    story.append(make_table(model, styles, widths=[2.2 * cm, 3.5 * cm, 2.4 * cm, 2.7 * cm, 6.0 * cm]))
    story.append(Paragraph(
        "Recommended planning range: EUR 7M-36M ARR SAM in Greece. A realistic 36-month founder-led SOM target is EUR 300k-1.2M ARR. That can be reached with roughly 125-500 customers at EUR 200/month, or fewer accounts if setup/import fees and higher asset-count plans work.",
        styles["Lead"],
    ))

    add_section(story, "8. Pricing and Packaging", styles)
    story.append(para(
        "Global pricing anchors show that fleet software can be priced per vehicle while CMMS platforms often price per user. For Greece, the recommended first model is company plan + asset cap + paid setup. Avoid per-user complexity early; Greek SMEs need pricing they can understand in one phone call.",
        styles["Body"],
    ))
    pricing = [
        ["Package", "Monthly price", "Target", "Includes"],
        ["Starter", "EUR 79-99", "Up to 10 assets", "Assets, docs, expiration tracking, reminders, basic AI weekly summary."],
        ["Operations", "EUR 199-249", "Up to 35 assets", "Maintenance logs, issue reports, daily AI summary, AI chat, roles, more storage."],
        ["Pro", "EUR 399-599", "Up to 100 assets", "Advanced permissions, audit history, custom categories, priority support, branch/location grouping."],
        ["Setup/import", "EUR 300-1,500 one-time", "All serious customers", "Excel import, document folder cleanup, initial categories, first readiness dashboard, team training."],
    ]
    story.append(make_table(pricing, styles, widths=[2.5 * cm, 2.7 * cm, 3.0 * cm, 8.6 * cm]))
    for item in [
        "Pilot offer: EUR 300-500 for 60 days including setup for the first 10 customers, with a conversion target to EUR 199/month or above.",
        "Do not run free pilots unless the company gives real data, real users, and permission for a case study/referral if successful.",
        "For early sales, the setup fee is not just money. It forces seriousness and solves the biggest adoption barrier: messy data.",
    ]:
        story.append(bullet(item, styles))

    add_section(story, "9. MVP Scope", styles)
    mvp = [
        ["Must build", "Why", "Avoid for now"],
        ["Asset register for vehicles, cranes, machinery, trailers, buses, forklifts, equipment.", "The product is useless unless every operating asset has one home.", "Complex fleet hierarchy, depreciation, accounting."],
        ["Document vault linked to assets/operators/vendors.", "Documents are the pain and the moat if organized well.", "Generic file storage without workflow."],
        ["Expiration states: OK, warning, critical, expired, missing.", "The dashboard needs instant meaning.", "Over-complex custom workflow builder."],
        ["Maintenance schedules, logs, overdue/completed status.", "Maintenance is the adjacent daily operational job.", "Predictive maintenance from sensors."],
        ["Issue reports with photos/notes and status.", "Captures field reality without making it a full work-order suite.", "Technician dispatch and parts inventory."],
        ["AI daily summary and chat over structured records.", "This is the differentiator and owner-facing habit loop.", "Uncited AI answers or legal-compliance claims."],
        ["Greek language UI and Greek operational templates.", "Localization is a sales asset.", "Overbuilding multilingual expansion too early."],
    ]
    story.append(make_table(mvp, styles, widths=[5.2 * cm, 6.0 * cm, 5.6 * cm]))

    add_section(story, "10. GTM Strategy", styles)
    story.append(Paragraph(
        "First sales motion: founder-led, vertical-specific, service-assisted, and proof-seeking. The point is not traffic at the beginning; it is 30 real conversations, 3 paid pilots, and 1 referenceable use case.",
        styles["Lead"],
    ))
    gtm = [
        ["Phase", "Goal", "Actions", "Success metric"],
        ["Days 1-14", "Problem validation", "Interview 15 crane/construction/rental/tourism operators. Ask how they track certificates, KTEO, insurance, inspections, operator licenses, service, and missing documents.", "8+ confirm recent missed/near-missed deadline, lost document, or service surprise."],
        ["Days 15-30", "Paid pilot proof", "Build account list of 100 companies. Run vertical demo with sample data. Offer concierge import.", "3 paid pilots signed or verbally committed."],
        ["Days 31-60", "Time-to-value proof", "Load real assets/docs, send daily summaries, track actions resolved.", "Each pilot has 20+ assets/docs or all critical assets loaded."],
        ["Days 61-90", "Conversion proof", "Turn pilot into monthly plan, capture testimonial, refine package.", "2+ pilots convert to EUR 199/month or higher."],
    ]
    story.append(make_table(gtm, styles, widths=[2.4 * cm, 3.0 * cm, 8.0 * cm, 3.4 * cm]))

    add_subsection(story, "Discovery questions that reveal real pain", styles)
    for item in [
        "When was the last time you had to find a KTEO, insurance, certificate, permit, or inspection document quickly? What happened?",
        "How do you know what expires this month? Who checks it? How long does it take?",
        "Have you ever missed, nearly missed, or rushed an inspection, certificate renewal, or service deadline?",
        "What spreadsheet, calendar, WhatsApp group, folder, accountant, or employee currently owns this process?",
        "If I imported your assets and documents and showed you every risk this week, what would that replace?",
        "Would you pay EUR 300-500 for a 60-day setup/pilot if it used your real documents and assets?",
    ]:
        story.append(bullet(item, styles))

    add_section(story, "11. Sales Messaging and Outreach", styles)
    story.append(para(
        "The message should sound like the business, not like AI hype. Start with certificates, documents, inspections, service readiness, and lost time. AI enters as the faster way to answer the owner's daily questions.",
        styles["Body"],
    ))
    angles = [
        ["Vertical", "Opening line", "Demo data to show"],
        ["Crane/lifting", "Before a job or inspection, know exactly which cranes, certificates, operators, and service items are not ready.", "Crane profile, lifting certificate, operator license, inspection due date, maintenance issue."],
        ["Construction machinery", "One dashboard for every machine, truck, document, and overdue service across your sites.", "Excavator, truck, forklift, service overdue, missing PDF, issue photo."],
        ["Rental", "Do not rent out equipment with missing documents or hidden service problems.", "Rental-ready checklist, damage/service log, certificate status, handover pack."],
        ["Tourism bus/transfer", "Before the season starts, see every KTEO, insurance, driver document, and bus readiness problem.", "Bus readiness board, KTEO, insurance, seasonal checklist, issue list."],
    ]
    story.append(make_table(angles, styles, widths=[3.4 * cm, 7.8 * cm, 5.6 * cm]))

    add_subsection(story, "Cold email draft", styles)
    story.append(Paragraph(
        clean("Subject: Quick question about your vehicles, machinery, and certificates\n\nHello [Name],\n\nI am building FleetLever for Greek companies that manage vehicles, cranes, machinery, KTEO, insurance, inspections, certificates, operator documents, and maintenance through Excel, WhatsApp, and folders.\n\nThe product gives you one dashboard and an AI assistant that answers: 'What needs attention this week?'\n\nI am speaking with a small number of [construction/crane/rental/tourism transport] operators to see if this solves a real problem. Would you be open to a 15-minute call? I can also show a quick demo using sample data.\n\nBest,\nGeorge").replace("\n", "<br/>"),
        styles["Body"],
    ))

    add_section(story, "12. SEO and Demand Capture", styles)
    story.append(para(
        "SEO should support outbound, not replace it at the beginning. The first website should be a conversion page for demos and pilots, then a small set of Greek vertical pages that match how prospects search and describe their paperwork problems.",
        styles["Body"],
    ))
    seo = [
        ["Page", "Intent", "Primary promise"],
        ["FleetLever homepage", "Brand + demo conversion", "Manage fleet/equipment documents, expirations, maintenance, and inspections with an AI assistant."],
        ["/crane-companies", "Vertical page", "Track lifting certificates, crane inspections, operator documents, and service readiness."],
        ["/construction-equipment", "Vertical page", "One place for machines, trucks, service, documents, and deadline reminders."],
        ["/kteo-insurance-reminders", "Problem page", "Never miss KTEO, insurance, permits, or certificate renewals."],
        ["/equipment-rental-readiness", "Vertical page", "Know which assets are ready to rent and which need documents or maintenance."],
        ["/tourism-bus-readiness", "Seasonal page", "Prepare buses and transfer vehicles before the season."],
    ]
    story.append(make_table(seo, styles, widths=[4.2 * cm, 4.0 * cm, 8.6 * cm]))

    add_section(story, "13. Risks, Unknowns, and Kill Criteria", styles)
    risks = [
        ["Risk", "Why it matters", "Fast test"],
        ["Praise without payment", "Greek SMBs may like the idea but stay with Excel.", "Require paid pilots; count payment as the signal."],
        ["Onboarding friction", "Value requires structured assets/docs/dates.", "Offer import service and measure time-to-first-useful-summary."],
        ["AI trust/liability", "Compliance mistakes can damage trust.", "AI must cite records, show confidence, and avoid legal advice."],
        ["Competitor overlap", "Yipii, OTS, PowerFleet, Fleetio, MaintainX validate pieces of the space.", "Win through Greek vertical templates, setup, and a narrower promise."],
        ["Feature creep", "GPS, ERP, fuel, routing, accounting requests will arrive quickly.", "Track requests but do not build until 10+ paying customers repeat the same need."],
        ["Low digital maturity", "Some prospects will not self-serve.", "Use service-assisted SaaS and design for non-technical operators."],
    ]
    story.append(make_table(risks, styles, widths=[3.6 * cm, 6.2 * cm, 7.0 * cm]))
    story.append(Paragraph(
        "Kill/pivot trigger: after 30 interviews and 10 serious demos, if fewer than 2 companies will pay anything for setup or pilot, the wedge is too weak or the buyer is wrong. Pivot segment or become a service-assisted compliance setup offer before building more software.",
        styles["Lead"],
    ))

    add_section(story, "14. Final Recommendation", styles)
    for item in [
        "Use FleetLever.com as the main brand. The name is clear enough to sell; do not restart naming unless a legal issue appears.",
        "Buy/keep FleetLever.gr defensively and redirect it to the .com for Greek trust.",
        "Build the MVP around assets, documents, dates, maintenance, issue reports, daily summary, and AI chat. The killer demo is asking: 'What needs attention this week?'",
        "Start with crane/lifting and construction machinery companies. They have the strongest mix of urgency, compliance consequences, mixed equipment, and reachable owner-led buying.",
        "Do not sell 'AI fleet management'. Sell 'never miss the thing that can stop the job, fail the inspection, or create admin panic.'",
        "Commercial next step: 30 interviews, 100-account lead list, 3 paid pilots. The first milestone is not code; it is getting real messy customer data into a useful readiness dashboard.",
    ]:
        story.append(bullet(item, styles))

    story.append(PageBreak())
    add_section(story, "Source Appendix", styles)
    sources = [
        ["ID", "Source", "URL"],
        ["S1", "ACEA, Vehicles on European Roads, January 2026", "https://energiaoltre.it/wp-content/uploads/2026/01/ACEA_Report-%E2%80%93-Vehicles_on_European_roads_2026.pdf"],
        ["S2", "ELSTAT, Business Demography - Yearly / 2023, SBR tables", "https://www.statistics.gr/en/statistics/-/publication/SBR051/2023"],
        ["S3", "ELSTAT, Road freight transport, yearly 2024", "https://www.statistics.gr/en/statistics/-/publication/SME16/-"],
        ["S4", "ELSTAT, Private Building Activity 2024 infographic", "https://www.statistics.gr/documents/20181/18566953/DT_oikodom_drastiriotita_2024_en.pdf/db2b8982-c2fe-172d-d5a9-08fd1178d353"],
        ["S5", "Bank of Greece, Developments in balance of travel services 2025", "https://www.bankofgreece.gr/en/news-and-media/press-office/news-list/news?announcement=27a32287-1c58-44e7-b900-2c92c53ffe9c"],
        ["S6", "European Commission, Greece 2025 Digital Decade Country Report", "https://digital-strategy.ec.europa.eu/en/factpages/greece-2025-digital-decade-country-report"],
        ["S7", "European Commission, Digitalisation of Business in EU Member States 2025", "https://digital-strategy.ec.europa.eu/en/library/digital-decade-2025-digitalisation-business-eu-member-states"],
        ["S8", "Eurostat, Digitalisation in Europe 2025", "https://ec.europa.eu/eurostat/web/interactive-publications/digitalisation-2025"],
        ["S9", "TUV Austria Hellas, Initial and periodic inspections of lifting machinery", "https://tuvaustriahellas.gr/services/initial-periodic-inspections-of-lifting-machinery/?lang=en"],
        ["S10", "Gov.gr, Vehicle technical inspection history", "https://www.gov.gr/ipiresies/periousia-kai-phorologia/okhemata/istoriko-kteo"],
        ["S11", "OTS, Open1 Fleet", "https://ots.gr/en/product/open1fleet-en/"],
        ["S12", "Yipii Mobility", "https://yipii.com/mobility"],
        ["S13", "Eltrak, Webfleet Greece", "https://eltrak.gr/en/activities/webfleet/"],
        ["S14", "PowerFleet Greece", "https://www.powerfleet.gr/en"],
        ["S15", "Fleetio pricing", "https://www.fleetio.com/pricing"],
        ["S16", "MaintainX pricing", "https://www.getmaintainx.com/pricing"],
        ["S17", "Arval Greece, Fleet & Mobility Barometer 2025", "https://www.arval.gr/en-gr/corporate/fleet-mobility-barometer-2025-for-greece"],
    ]
    story.append(make_table(sources, styles, widths=[1.3 * cm, 6.0 * cm, 9.5 * cm]))
    story.append(Spacer(1, 0.25 * cm))
    story.append(Paragraph(
        "Notes: This is strategic market research, not legal, accounting, tax, insurance, or regulatory advice. Greek compliance requirements should be verified with qualified local professionals before productizing legal reminders. Market-size scenarios are transparent estimates built from official business/vehicle anchors and SaaS pricing assumptions; validate with interviews and paid pilots.",
        styles["Small"],
    ))

    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)


if __name__ == "__main__":
    build()
