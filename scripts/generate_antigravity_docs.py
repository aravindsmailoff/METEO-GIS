# ==============================================================================
# ANTIGRAVITY — TECHNICAL PROJECT PRESENTATION DOCUMENT GENERATOR
# Generates a complete, professional, highly styled Microsoft Word (.docx) document
# ==============================================================================

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import os
import sys

# Add scripts dir to path
sys.path.append(r"d:\GIS Dashboard\scripts")
from docx_helpers import set_cell_background, set_cell_margins, set_cell_border, add_callout, add_diagram_box, format_table

def build_document():
    doc = docx.Document()
    
    # Page setup - Standard Letter, 1 inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        section.different_first_page_header_footer = True
        
        # Header / Footer for subsequent pages
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("ANTIGRAVITY: Technical Project Presentation & Architecture Report")
        hrun.font.name = "Calibri"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)
        
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("Confidential — AI-GIS Disaster Intelligence & Safe Routing Platform — North Eastern Region of India")
        frun.font.name = "Calibri"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)

    # Base Styles Configuration
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = RGBColor(0x2D, 0x37, 0x48) # Slate dark text
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(4)
    normal_style.paragraph_format.space_before = Pt(0)

    # Custom Heading Helper Functions
    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(16)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0x0F, 0x29, 0x4A) # Deep Navy
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0x1E, 0x40, 0xAF) # Blue Accent
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0x33, 0x41, 0x55) # Slate Medium
        return p

    def add_p(text, bold_prefix=None, italic=False):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.font.bold = True
            r_pre.font.name = 'Calibri'
            r_pre.font.size = Pt(10.5)
            r_pre.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
        r = p.add_run(text)
        r.font.italic = italic
        r.font.name = 'Calibri'
        r.font.size = Pt(10.5)
        r.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)
        return p

    def add_bullet(text, bold_prefix=None, level=0):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.left_indent = Inches(0.25 * (level + 1))
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.font.bold = True
            r_pre.font.name = 'Calibri'
            r_pre.font.size = Pt(10.5)
            r_pre.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
        r = p.add_run(text)
        r.font.name = 'Calibri'
        r.font.size = Pt(10.5)
        r.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
        return p

    # ==============================================================================
    # 1. COVER PAGE
    # ==============================================================================
    p_pre = doc.add_paragraph()
    p_pre.paragraph_format.space_before = Pt(36)
    p_pre.paragraph_format.space_after = Pt(10)
    r_tag = p_pre.add_run("TECHNICAL PROJECT PRESENTATION & COMPREHENSIVE SYSTEM ARCHITECTURE")
    r_tag.font.name = "Arial"
    r_tag.font.size = Pt(10)
    r_tag.font.bold = True
    r_tag.font.color.rgb = RGBColor(0x25, 0x63, 0xEB) # Bright Tech Blue

    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(8)
    r_title = p_title.add_run("ANTIGRAVITY")
    r_title.font.name = "Arial"
    r_title.font.size = Pt(32)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0x0F, 0x29, 0x4A)

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(16)
    r_sub = p_sub.add_run("AI-Powered GIS-Based Landslide Monitoring, Disaster Intelligence and Safe Route Management Platform for the North Eastern Region of India")
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(14)
    r_sub.font.bold = True
    r_sub.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

    p_tagline = doc.add_paragraph()
    p_tagline.paragraph_format.space_before = Pt(0)
    p_tagline.paragraph_format.space_after = Pt(28)
    r_tagline = p_tagline.add_run("“From Hazard Detection to Safe Decision-Making and Emergency Routing”")
    r_tagline.font.name = "Georgia"
    r_tagline.font.size = Pt(12)
    r_tagline.font.italic = True
    r_tagline.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    # Cover Page Metadata Card Table
    meta_tbl = doc.add_table(rows=6, cols=2)
    meta_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_tbl.autofit = False
    
    meta_data = [
        ("Target Region:", "North Eastern Region (NER) of India (Assam, Meghalaya, Sikkim, Arunachal Pradesh, Mizoram, Nagaland, Manipur, Tripura)"),
        ("System Domain:", "Disaster Risk Reduction (DRR), Geospatial Intelligence (GEOINT), Emergency Response Routing"),
        ("Core Engineering Stack:", "FastAPI, PostGIS (PostgreSQL 16), Valhalla Routing Engine, MapLibre GL / GIS Frontend, Docker"),
        ("Operational Role:", "Authoritative Decision-Support System for District EOCs, State SDMAs, PWDs & Emergency Responders"),
        ("Compliance Standard:", "Strict Ground-Truth Validation, NDMA / GSI Alignment, Explainable Physical Road Closures"),
        ("Document Purpose:", "Technical Presentation, Viva-Voce Defense, Academic & Industrial Project Evaluation")
    ]
    
    for idx, (label, val) in enumerate(meta_data):
        row = meta_tbl.rows[idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.3)
        set_cell_background(c0, "F1F5F9")
        set_cell_background(c1, "F8FAFC")
        set_cell_margins(c0, top=70, bottom=70, left=100, right=100)
        set_cell_margins(c1, top=70, bottom=70, left=100, right=100)
        set_cell_border(c0, top={"val": "single", "sz": "4", "color": "CBD5E1"},
                            bottom={"val": "single", "sz": "4", "color": "CBD5E1"},
                            left={"val": "single", "sz": "4", "color": "CBD5E1"},
                            right={"val": "single", "sz": "4", "color": "CBD5E1"})
        set_cell_border(c1, top={"val": "single", "sz": "4", "color": "CBD5E1"},
                            bottom={"val": "single", "sz": "4", "color": "CBD5E1"},
                            left={"val": "single", "sz": "4", "color": "CBD5E1"},
                            right={"val": "single", "sz": "4", "color": "CBD5E1"})
        
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(label)
        r0.font.name = "Arial"
        r0.font.size = Pt(9)
        r0.font.bold = True
        r0.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(val)
        r1.font.name = "Calibri"
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    doc.add_page_break()

    # ==============================================================================
    # 2. EXECUTIVE SUMMARY
    # ==============================================================================
    add_h1("1. Executive Summary")
    add_p(
        "ANTIGRAVITY is an advanced, AI-powered Geospatial Information System (GIS) and disaster intelligence platform engineered specifically to address the severe geo-hydrological challenges of the North Eastern Region (NER) of India. The platform bridges the critical operational gap between hazard identification and on-ground emergency mobility by transforming complex spatial telemetry into actionable, explainable, and disaster-aware decision support."
    )
    add_p(
        "The platform seamlessly unifies real-time rainfall telemetry, multi-depth soil moisture data, high-resolution Digital Elevation Models (DEM), slope stability analytics, historical landslide inventories (NRSC/GSI), authoritative road network geometry, field/citizen reports, and verified disaster incident feeds into a single, high-performance spatial database."
    )
    add_p(
        "Unlike commercial navigation engines that calculate shortest or fastest paths based purely on static distance and live traffic congestion, Antigravity integrates dynamic hazard intelligence directly into the topological routing graph. When a landslide, rockfall, flash flood, or road collapse strikes a mountain highway, Antigravity isolates the affected road segments, attaches structured forensic reasoning for the blockage, and dynamically recomputes safe alternative corridors across validated road topologies."
    )
    
    add_callout(doc, "Decision-Support Mandate", 
                "Antigravity is architected as an authoritative Decision-Support System (DSS) designed to empower State Disaster Management Authorities (SDMAs), District Emergency Operation Centers (DEOCs), Public Works Departments (PWD), and first responders. It does not replace field verification or statutory administrative command; rather, it provides unambiguous spatial intelligence to accelerate life-saving logistical decisions.",
                box_type="CRITICAL GOVERNANCE PRINCIPLE", color_hex="0F294A", bg_hex="F0F4F8")

    add_callout(doc, "Executive Speaker Note", 
                "“Antigravity is designed to solve a fundamental problem in mountain disaster management: how do we ensure emergency supplies and first responders can safely reach vulnerable communities when roads are collapsing? We do this by uniting spatial disaster data directly with offline road network routing.”",
                box_type="TALKING POINT", color_hex="2563EB", bg_hex="EFF6FF")

    # ==============================================================================
    # 3. PROBLEM STATEMENT
    # ==============================================================================
    add_h1("2. Problem Statement")
    add_p(
        "The North Eastern Region of India—characterized by the fragile Himalayan orogeny, steep slopes, active tectonic faulting, and extreme monsoonal precipitation—is among the most landslide-susceptible terrains in the world. Annually, prolonged monsoon deluges and cloudbursts trigger catastrophic slope failures, debris flows, mudslides, and flash floods that sever critical lifeline corridors such as NH-6, NH-10, and NH-29."
    )
    add_p(
        "During severe hazard events, administrative response is frequently crippled by five fundamental bottlenecks:"
    )
    add_bullet("Severe, unpredictable terrain failures including massive slope washouts, rockfalls, and bridge collapses that paralyze entire valleys.", bold_prefix="Extreme Physical Vulnerability: ")
    add_bullet("Delayed, fragmented, and siloed information spread across distinct agencies (meteorological, geological, highway, and police).", bold_prefix="Information Fragmentation: ")
    add_bullet("Lack of granular visibility into which exact road segments are impassable versus merely slow or congested.", bold_prefix="Opaque Road Status: ")
    add_bullet("Commercial routing algorithms directing civilian traffic and relief convoys into lethal disaster zones or non-existent straight-line detours.", bold_prefix="Unsafe Routing Engines: ")
    add_bullet("Mountain communities becoming isolated for weeks with emergency control rooms unable to calculate valid bypass corridors.", bold_prefix="Critical Lifeline Isolation: ")

    add_h2("2.1 The Fundamental Question: Standard Maps vs. Antigravity")
    add_p(
        "The operational philosophy of Antigravity is defined by a fundamental contrast in routing objectives:"
    )
    
    # Table 1: Problem and Solution
    add_h3("Table 1: Operational Comparison — Conventional Navigation vs. Antigravity")
    t1_headers = ["Operational Dimension", "Conventional Map Applications", "Antigravity Disaster Intelligence Platform"]
    t1_widths = [Inches(1.8), Inches(2.3), Inches(2.4)]
    t1_data = [
        ("Core Question Answered", "“How do I get from Point A to Point B in the shortest time?”", "“Can I safely navigate from Point A to Point B given real-time landslides, rainfall risk, and structural closures?”"),
        ("Routing Optimization", "Optimized purely for travel time, distance, and historical/live traffic speeds.", "Optimized for life safety, physical road passability, structural integrity, and disaster risk minimization."),
        ("Hazard Awareness", "Blind to slope stability, rainfall saturation, soil moisture, and active rockfall zones.", "Integrates real-time telemetry (IMD, NASA GPM), DEM slope analysis, and verified hazard perimeters."),
        ("Road Blockage Explanation", "Displays an ambiguous red traffic line without structural context or reason.", "Provides granular forensic reasoning (e.g., 'Landslide: 450m³ debris over carriageway, NHAI verifying')."),
        ("Detour Routing", "May suggest dangerous, unpaved logging trails, riverbeds, or landslide-prone bypasses.", "Validates every alternative route against topological road networks and spatial hazard exclusion zones."),
        ("Failure Behavior", "Draws straight lines or forces navigation through hazardous links when graphs fragment.", "Explicitly returns 'NO SAFE ROUTE' if all topological paths intersect confirmed hazards—preventing fatal dispatch.")
    ]
    t1_tbl = doc.add_table(rows=len(t1_data) + 1, cols=3)
    format_table(t1_tbl, t1_widths, t1_headers, t1_data, header_bg="0F294A")

    doc.add_page_break()

    # ==============================================================================
    # 4. PROJECT OBJECTIVES
    # ==============================================================================
    add_h1("3. Project Objectives")
    add_p(
        "To provide a robust, resilient, and scientifically grounded disaster risk reduction tool, Antigravity establishes the following core engineering and operational objectives:"
    )
    add_bullet("Continuous, near-real-time spatial tracking of slope stability indicators and environmental triggers across vulnerable mountain corridors.", bold_prefix="1. Landslide Hazard Monitoring: ")
    add_bullet("Provide multi-layered interactive mapping combining vector road geometries, telemetry rain gauges, soil moisture, and hazard perimeters.", bold_prefix="2. Unified GIS Command Center: ")
    add_bullet("Combine slope gradients, aspect, digital elevation models, precipitation anomalies, and historical inventories into spatial risk ratings.", bold_prefix="3. Spatial Vulnerability Analytics: ")
    add_bullet("Map authoritative district administrations, NHAI, and PWD road disruption records directly to canonical GIS road segments.", bold_prefix="4. Authoritative Road Status Tracking: ")
    add_bullet("Eliminate opaque red lines by delivering structured, explainable blockage causes (e.g., Landslide, Flash Flood, Mudslide, Bridge Failure).", bold_prefix="5. Explainable Disruption Intelligence: ")
    add_bullet("Dynamically exclude compromised road segments from the routing graph to guarantee no vehicle is dispatched into an active hazard.", bold_prefix="6. Disaster-Aware Safe Routing: ")
    add_bullet("Recompute topological bypasses using Valhalla on authoritative road networks when primary national/state highways are severed.", bold_prefix="7. Resilient Alternative Navigation: ")
    add_bullet("Strict spatial validation ensuring computed paths never cross non-existent links, buildings, waterbodies, or unverified tracks.", bold_prefix="8. Topological Route Validation: ")
    add_bullet("A dedicated, role-based control room interface for district magistrates, disaster officers, and highway engineers.", bold_prefix="9. Centralized Admin Dashboard: ")
    add_bullet("Ingest and triage geolocated crowd-sourced and field officer incident submissions with multi-stage verification workflows.", bold_prefix="10. Field & Citizen Report Integration: ")
    add_bullet("Provide offline-capable routing tiles capable of functioning when telecommunications and internet infrastructure collapse.", bold_prefix="11. Edge & Offline Routing Resilience: ")
    add_bullet("Architect a modular, decoupled microservices stack ready for future AI/ML automated landslide susceptibility inference.", bold_prefix="12. AI-Ready Scalable Architecture: ")

    # ==============================================================================
    # 5. REFERENCES & CONCEPTUAL INSPIRATION
    # ==============================================================================
    add_h1("4. References and Conceptual Inspiration")
    add_p(
        "The conceptual foundation of Antigravity is inspired by national disaster management frameworks, scientific initiatives, and digital portals pioneered by premier Indian government agencies:"
    )
    
    add_h2("4.1 Bhooskhalan — Geological Survey of India (GSI)")
    add_p(
        "Bhooskhalan is the flagship landslide portal and mobile application created by the Geological Survey of India (Ministry of Mines). It facilitates national landslide inventory enrichment, spatial mapping of historical slope failures, and crowd-sourced field submissions containing GPS coordinates, event dates, photographs, and geological commentary.",
        bold_prefix="System Role & Influence: "
    )
    add_p("Reference Portal: https://play.google.com/store/apps/details?id=in.gov.gsi.bhooskhalan&hl=en_IN", bold_prefix="Official Link: ", italic=True)

    add_h2("4.2 SACHET — National Disaster Alert Portal (NDMA)")
    add_p(
        "SACHET is the pan-India disaster alert portal established by the National Disaster Management Authority (NDMA). It utilizes the Common Alerting Protocol (CAP) to disseminate geo-targeted hazard warnings, meteorological forecasts, and emergency safety guidelines to citizens across diverse regional languages.",
        bold_prefix="System Role & Influence: "
    )
    add_p("Reference Portal: https://sachet.ndma.gov.in/", bold_prefix="Official Link: ", italic=True)

    add_h2("4.3 SACHET Mobile Application — Centre for Development of Telematics (C-DOT)")
    add_p(
        "Developed by C-DOT under NDMA aegis, the SACHET mobile platform delivers authoritative early warnings directly to mobile handsets using cell broadcast and location-based SMS, providing localized weather feeds, affected zone radii, and district emergency contact directories.",
        bold_prefix="System Role & Influence: "
    )
    add_p("Reference Portal: https://play.google.com/store/apps/details?id=com.cdotindia.capsachet", bold_prefix="Official Link: ", italic=True)

    add_callout(doc, "Statutory Disclaimer & Institutional Boundary", 
                "ANTIGRAVITY is an independent, original research and engineering project inspired by the public capabilities and problem-solving concepts of Bhooskhalan and SACHET. Antigravity does NOT claim to be an official government application, a direct implementation, or an authorized replica of GSI, NDMA, C-DOT, or Bhuvan systems. It operates as an academic and technological decision-support framework.",
                box_type="OFFICIAL DISCLAIMER", color_hex="DC2626", bg_hex="FEF2F2")

    doc.add_page_break()

    # ==============================================================================
    # 6. WHAT MAKES ANTIGRAVITY UNIQUE?
    # ==============================================================================
    add_h1("5. What Makes Antigravity Unique?")
    add_p(
        "Antigravity establishes a distinct paradigm in geospatial disaster management. Rather than presenting static map markers or isolated sensor charts, Antigravity pioneers the tight architectural coupling of four pillars: Disaster-Aware GIS + Road Network Intelligence + Safe Topological Routing + Explainable Blockages."
    )

    add_h2("5.1 Disaster-Aware Dynamic Routing")
    add_p(
        "Standard navigation algorithms optimize routes based strictly on travel time ($T = \\sum \\frac{d_i}{v_i}$). Antigravity redefines the cost function into a multi-criteria safety evaluation:"
    )
    add_p("Origin $\\rightarrow$ Road Network $\\rightarrow$ Disaster Constraints $\\rightarrow$ Risk Evaluation $\\rightarrow$ Safe Validated Route", bold_prefix="Routing Paradigm: ", italic=True)
    add_p(
        "Every road link is continuously evaluated against confirmed physical closures, active debris flows, flood inundations, and structural risk buffers. Compromised segments are dynamically injected as infinite-cost exclusion barriers into the routing graph."
    )

    add_h2("5.2 Explainable Road Blockages")
    add_p(
        "In mission-critical disaster management, a generic red line is unacceptable. An Incident Commander needs to know exactly why a road is closed, who verified it, what volume of debris exists, and when reopening is projected. When an operator clicks any disrupted segment in Antigravity, a structured forensic card is rendered:"
    )
    
    # Forensic Card Callout
    add_callout(doc, "ROAD BLOCKED — NH-6 (Shillong-Silchar Corridor)", 
                "• Road Segment ID: SEG-NER-NH06-KM48-2026\n"
                "• Current Status: COMPLETELY BLOCKED\n"
                "• Structured Reason: LANDSLIDE (Major Debris Flow)\n"
                "• Forensic Detail: High-intensity precipitation triggered an estimated 850 m³ debris collapse across both carriageways. Formation width completely compromised.\n"
                "• Incident Reference: INC-EKH-2026-0884 (Linked to Confirmed Event EVT-LS-042)\n"
                "• Verifying Authority: Executive Engineer, Meghalaya State PWD / NHAI Unit\n"
                "• Verification Status: VERIFIED (Field Inspection Confirmed)\n"
                "• Expected Reopening: 18 Hours (Heavy earthmoving machinery deployed)\n"
                "• Impacted Habitations: Sonapur, Umkiang, Ratacherra\n"
                "• Available Bypass: Validated Alternative via Jowai-Nartiang-Khanduli State Corridor",
                box_type="EXPLAINABLE ROAD CARD", color_hex="B91C1C", bg_hex="FEF2F2")

    add_h2("5.3 Actual Road-Network Routing (Zero Straight-Line Fallbacks)")
    add_p(
        "A critical safety tenet of Antigravity is topological integrity. Commercial systems often draw straight-line 'as-the-crow-flies' vectors when network data is sparse or disconnected. In rugged Himalayan terrain, a straight line represents a fatal cliff or impassable gorge. Antigravity routes exclusively across topologically validated road graphs (Valhalla PBF/PostGIS). If no contiguous, safe, paved/usable road corridor connects the origin and destination, the platform unequivocally returns 'NO SAFE ROUTE'."
    )

    add_h2("5.4 GIS-Based Multi-Factor Spatial Intelligence")
    add_p(
        "Instead of treating disasters as isolated GPS pins, Antigravity executes multi-layer spatial overlays: Continuous Rainfall Telemetry + Soil Moisture Saturation + DEM Slope Angle + Historical Inventory Clustering + Road Segment Geometries = Comprehensive Disaster Intelligence."
    )

    add_h2("5.5 Dynamic Disaster Response Lifecycle")
    add_p(
        "Antigravity functions as a living, reactive spatial state machine. When an active road transitions from OPEN $\\rightarrow$ BLOCKED, the system automatically invalidates intersecting active routes and triggers re-routing:"
    )
    
    # Workflow diagram 1
    add_diagram_box(doc, "Dynamic Road Invalidation & Safe Rerouting Workflow",
"""[ 1. New Hazard Detected / Field Report Verified ]
                      │
                      ▼
[ 2. Spatial Intersection: Incident Buffer ∩ Road Segment ]
                      │
                      ▼
[ 3. PostGIS Updates road_incidents: status = 'BLOCKED' ]
                      │
                      ▼
[ 4. Active Route Intersect Check (ST_Intersects) ]
                      │
         ┌────────────┴────────────┐
         ▼                         ▼
   [ Intersects ]           [ No Conflict ]
         │                         │
         ▼                         ▼
[ 5. Route Flagged INVALID ]  [ Route Maintained ]
         │
         ▼
[ 6. Exclude Segment IDs in Valhalla Routing Constraints ]
         │
         ▼
[ 7. Recompute Alternative Path on Validated Graph ]
         │
         ▼
[ 8. PostGIS Validates Geometry & Hazard Separation ]
         │
         ▼
[ 9. Safe Alternative Route Dispatched to EOC Dashboard ]""")

    add_callout(doc, "Presenter Talking Point", 
                "“Notice that Antigravity is not a static digital map. When a landslide occurs, the system knows within milliseconds which road segment is broken, why it is broken, alerts the control room, and recalculates a safe alternative route before an ambulance or supply truck is dispatched.”",
                box_type="TALKING POINT", color_hex="2563EB", bg_hex="EFF6FF")

    doc.add_page_break()

    # ==============================================================================
    # 7. MAJOR FEATURES OF ANTIGRAVITY
    # ==============================================================================
    add_h1("6. Major Features of Antigravity")
    add_p(
        "Antigravity integrates a comprehensive suite of purpose-built disaster management, geospatial analytics, and emergency navigation capabilities:"
    )
    
    # Table 2: Major Features
    add_h3("Table 2: Comprehensive Feature Matrix")
    t2_headers = ["Feature Module", "Operational Description", "Disaster Management Benefit"]
    t2_widths = [Inches(1.8), Inches(2.3), Inches(2.4)]
    t2_data = [
        ("Interactive GIS Command Map", "High-performance MapLibre vector map rendering roads, terrain, incidents, risk heatmaps, and infrastructure layers.", "Gives commanders an immediate, single-pane-of-glass operational picture of regional disaster status."),
        ("Landslide Hazard Tracker", "Visualizes confirmed, reported, and historical landslide events with spatial clustering and detail inspectors.", "Enables targeted resource staging and immediate identification of recurring failure points."),
        ("Multi-Scale Risk Heatmaps", "Dynamic raster/vector risk overlays computed from slope gradients, precipitation, and historical vulnerability.", "Allows proactive evacuation and pre-positioning of heavy clearing equipment before roads collapse."),
        ("Rainfall & Soil Telemetry", "Ingests 1-hour, 24-hour rainfall totals and 30-day Standardized Precipitation Indices (SPI) from IMD/AWS stations.", "Identifies extreme hydrologic saturation thresholds that trigger translational slope failures."),
        ("Digital Terrain Analysis", "Derives slope, aspect, curvature, and elevation profiles from 30m ALOS/SRTM DEM datasets.", "Isolates structurally unstable mountain faces and valley choke-points prone to debris avalanches."),
        ("Authoritative Road Status", "Classifies segments into OPEN, CAUTION, HIGH RISK, RESTRICTED, BLOCKED, and COMPLETELY BLOCKED.", "Eliminates ambiguity between routine traffic jams and catastrophic physical road washouts."),
        ("Explainable Blockage Cards", "Provides structured forensic metadata (cause, volume, authority, reopening ETA, bypass route) on click.", "Enables clear public communication and precise inter-agency logistics coordination."),
        ("Disaster-Aware Routing", "Valhalla-powered navigation that dynamically excludes all active blocked links and high-hazard buffers.", "Guarantees that emergency convoys and civilian evacuations are never routed into active hazards."),
        ("Topological Route Validation", "Spatial verification ensuring computed geometries are valid LineStrings strictly following real roads.", "Prevents lethal straight-line routing across mountain cliffs, dense forests, or wide rivers."),
        ("Citizen / Field Reporting", "Mobile-ready ingestion workflow for field officers and citizens to submit geolocated hazard reports with photos.", "Bridges the crucial first-mile gap between on-ground hazard occurrence and central EOC awareness."),
        ("Admin Incident Management", "Full administrative lifecycle: create, verify, escalate, link to road segments, and mark resolved.", "Maintains strict chain of custody and data integrity before hazards affect official routing graphs."),
        ("Offline Routing Engine", "Valhalla routing engine operates on pre-compiled local graph tiles without internet connectivity.", "Ensures life-saving emergency navigation remains fully functional when telecom towers fail."),
        ("Critical Infrastructure GIS", "Spatial layer displaying hospitals, relief shelters, helipads, fuel depots, and isolated hamlets.", "Enables rapid evacuation route generation directly connecting stranded villages to nearest hospitals.")
    ]
    t2_tbl = doc.add_table(rows=len(t2_data) + 1, cols=3)
    format_table(t2_tbl, t2_widths, t2_headers, t2_data, header_bg="0F294A")

    doc.add_page_break()

    # ==============================================================================
    # 8. ADMIN DASHBOARD & CONTROL CENTER
    # ==============================================================================
    add_h1("7. Admin Dashboard & Control Center")
    add_p(
        "The Antigravity Admin Dashboard serves as the central command cockpit for disaster managers, district magistrates, and emergency logistics teams. It combines macro-level situational statistics with micro-level operational control."
    )

    add_h2("7.1 Key Operational Modules")
    add_bullet("Live metrics displaying Total Active Incidents, Confirmed Landslides, Blocked Highway Miles, High-Risk Road Segments, Critical Vulnerable Settlements, and Pending Field Reports.", bold_prefix="1. KPI Overview & Telemetry Strip: ")
    add_bullet("Full-screen interactive GIS map with layer toggling (DEM Slope, Heatmaps, Road Network, Rain Gauges, Critical Infrastructure, Active Incidents).", bold_prefix="2. Interactive GIS Command Map: ")
    add_bullet("Workflow tool for disaster officers to review pending citizen/field reports, inspect photo evidence, verify coordinates, and approve/reject submissions.", bold_prefix="3. Incident Triage & Verification: ")
    add_bullet("Granular editor allowing administrators to mark specific road segments as BLOCKED, set cause codes, record estimated debris volumes, and input projected reopening dates.", bold_prefix="4. Road Disruption Management: ")
    add_bullet("Interactive origin-destination route tester displaying primary vs. emergency bypass routes, distance deltas, hazard clearances, and topological validation checks.", bold_prefix="5. Safe Route Simulator: ")
    add_bullet("District-wise breakdown of landslide frequency, road closure durations, response team clearance times, and historical precipitation correlations.", bold_prefix="6. Disaster Analytics & Reporting: ")

    # ==============================================================================
    # 9. ROAD BLOCKAGE SYSTEM
    # ==============================================================================
    add_h1("8. Road Blockage System & Structured Forensics")
    add_p(
        "A cornerstone of Antigravity is the elimination of unstructured, anecdotal road information. Every road closure is represented as a strongly typed, relational, and spatial record tied to canonical road segments."
    )

    add_h2("8.1 Canonical Database Schema for Road Incidents")
    add_bullet("UUID primary key uniquely identifying the physical disruption.", bold_prefix="incident_id: ")
    add_bullet("Foreign key linking the disruption directly to the canonical road_segments table.", bold_prefix="road_segment_id: ")
    add_bullet("Official highway name or district road designation (e.g., 'NH-06 Shillong-Silchar').", bold_prefix="road_name: ")
    add_bullet("Exact PostGIS Point (point of failure) or LineString (entire affected reach).", bold_prefix="geom: ")
    add_bullet("Strongly typed enumeration defining the physical nature of the closure.", bold_prefix="cause: ")
    add_bullet("Operational state (OPEN, RESTRICTED, BLOCKED, UNKNOWN).", bold_prefix="status: ")
    add_bullet("Reporting department or agency (e.g., 'East Khasi Hills District EOC', 'NHAI Live Feed').", bold_prefix="source: ")
    add_bullet("Authoritative official responsible for the closure verification.", bold_prefix="authority: ")
    add_bullet("Timestamp when incident was initially logged into the system.", bold_prefix="reported_time: ")
    add_bullet("Timestamp when an authorized engineer/officer verified the physical blockage.", bold_prefix="verified_time: ")
    add_bullet("Projected timestamp for clearance and traffic resumption.", bold_prefix="expected_end_time: ")
    add_bullet("Estimated volume of debris or rockfall over the carriageway (in m³).", bold_prefix="estimated_debris_m3: ")
    add_bullet("Comma-delimited or JSON array of habitations cut off by this specific closure.", bold_prefix="affected_villages: ")
    add_bullet("Verification lifecycle state (VERIFIED, REPORTED, UNVERIFIED).", bold_prefix="verification_status: ")

    add_h2("8.2 Standardized Cause Enumeration")
    add_p(
        "To maintain rigorous data standards and facilitate automated routing constraints, Antigravity enforces 20 standardized blockage cause codes:"
    )
    add_p(
        "LANDSLIDE | FLASH_FLOOD | ROAD_COLLAPSE | BRIDGE_FAILURE | BRIDGE_DAMAGE | FLOODING | ROCKFALL | DEBRIS | MUDSLIDE | ROAD_WASHOUT | HEAVY_RAINFALL | TREE_FALL | ACCIDENT | CONSTRUCTION | ROAD_DAMAGE | LAND_SUBSIDENCE | SECURITY_RESTRICTION | GOVERNMENT_CLOSURE | WEATHER_HAZARD | UNKNOWN",
        bold_prefix="Standardized Enums: ", italic=True
    )

    add_callout(doc, "The Strict 'UNKNOWN' Integrity Rule", 
                "Antigravity enforces a strict data integrity policy: The system MUST NEVER invent or hallucinate a blockage reason. If a road is reported closed by field police but geological verification is pending, the cause is explicitly recorded and displayed as 'UNKNOWN' until verified. Automated systems must never fabricate hazard descriptions.",
                box_type="DATA INTEGRITY RULE", color_hex="D97706", bg_hex="FFFBEB")

    doc.add_page_break()

    # ==============================================================================
    # 10. ROAD DETECTION AND ROAD VALIDATION
    # ==============================================================================
    add_h1("9. Road Detection, Network Ingestion & Topological Validation")
    add_p(
        "In mountainous disaster routing, navigating across unverified or hallucinated paths can be fatal. Antigravity establishes a strict architectural boundary between Authoritative Base Networks and AI-Derived Candidate Geometries."
    )

    add_h2("9.1 Authoritative Vector Road Networks")
    add_p(
        "The primary routing backbone of Antigravity is built exclusively from verified, topologically connected vector road datasets. These include:"
    )
    add_bullet("Geofabrik North-Eastern Zone OpenStreetMap extracts filtered for drivable highways.", bold_prefix="1. Authoritative OSM PBFs: ")
    add_bullet("ISRO Bhuvan National Transport Geodatabase and State PWD road inventories.", bold_prefix="2. Government GIS Portals: ")
    add_bullet("National Highways Authority of India (NHAI) spatial alignment records.", bold_prefix="3. NHAI Official Datasets: ")

    add_h2("9.2 AI-Based Satellite Road Detection & Extraction (Candidate Layer)")
    add_p(
        "While computer vision architectures (such as U-Net, DeepLabV3+, SegFormer, and centerline skeletonization) can extract candidate road networks from post-disaster satellite or drone imagery, Antigravity enforces a strict engineering principle:"
    )
    add_callout(doc, "The Golden Rule of Candidate Road Ingestion", 
                "AI-detected candidate road segments are STRICTLY QUARANTINED in a temporary GIS staging layer. They are NEVER injected into the active Valhalla routing graph until they pass automated topological validation and human engineer verification.",
                box_type="CRITICAL SAFETY PRINCIPLE", color_hex="0F294A", bg_hex="F0F4F8")

    add_h2("9.3 Automated Spatial Validation Rules")
    add_p("Before any new road geometry or bypass can become routable, the spatial validation engine tests for six physical disqualifiers:")
    add_bullet("Ensures candidate line segments do not intersect verified building polygon footprints.", bold_prefix="1. Building Footprint Collision: ")
    add_bullet("Rejects candidate roads crossing waterbodies or gorges unless a confirmed bridge or ferry node is validated in PostGIS.", bold_prefix="2. Waterbody & Gorge Crossing: ")
    add_bullet("Calculates terrain slope along the geometry using 30m DEM; segments exceeding 28° grade are flagged as non-drivable cliffs.", bold_prefix="3. Slope Gradient Feasibility: ")
    add_bullet("Ensures the candidate segment snaps within a 15-meter topological tolerance to existing road junction nodes.", bold_prefix="4. Network Connectivity: ")
    add_bullet("Guarantees the geometry is a non-self-intersecting, single-part OGC-compliant LineString with valid spatial reference (EPSG:4326).", bold_prefix="5. Geometry Validity: ")
    add_bullet("Flags paths crossing sports stadiums, agricultural terraces, or restricted defense perimeters.", bold_prefix="6. Land-Use Disqualification: ")

    # ==============================================================================
    # 11. ROAD NETWORK DATA MODEL
    # ==============================================================================
    add_h1("10. Road Network Data Model")
    add_p(
        "The physical road network is modeled in PostGIS as canonical segments representing individual highway links between junctions:"
    )
    
    # Table 6: Road Status & Meaning
    add_h3("Table 3: Road Operational Status Classification")
    t6_headers = ["Operational Status", "Visual Map Color", "Meaning & Ground Condition", "System Routing Behavior"]
    t6_widths = [Inches(1.5), Inches(1.2), Inches(2.0), Inches(1.8)]
    t6_data = [
        ("OPEN", "Emerald Green (#10B981)", "Road fully operational. Normal traffic flow with no active hazards or structural restrictions.", "Routable at standard speed limits and normal routing cost."),
        ("CAUTION", "Amber Gold (#F59E0B)", "Minor rainfall pooling, light debris on shoulder, or adverse weather. Drivable with care.", "Routable; penalty weight added to discourage non-essential travel."),
        ("HIGH RISK", "Vibrant Orange (#F97316)", "Severe rainfall saturation, active minor rockfall nearby, or steep slope instability alert.", "Routable ONLY if no alternative exists; high routing cost penalty."),
        ("RESTRICTED", "Purple (#8B5CF6)", "Administrative restriction: single-lane convoy movement, emergency vehicles only.", "Restricted by vehicle profile; civilian routing avoids segment."),
        ("BLOCKED", "Crimson Red (#EF4444)", "Confirmed physical blockage: landslide debris, flood washout, rockfall, or road collapse.", "COMPLETELY EXCLUDED from routing graph; infinite routing cost."),
        ("COMPLETELY BLOCKED", "Dark Maroon (#991B1B)", "Major structural destruction: bridge collapse, deep valley washout, impassable for days.", "COMPLETELY EXCLUDED; automatic alert dispatched to EOC commanders.")
    ]
    t6_tbl = doc.add_table(rows=len(t6_data) + 1, cols=4)
    format_table(t6_tbl, t6_widths, t6_headers, t6_data, header_bg="0F294A")

    doc.add_page_break()

    # ==============================================================================
    # 12. CORE SYSTEM ARCHITECTURE
    # ==============================================================================
    add_h1("11. Core System Architecture")
    add_p(
        "Antigravity is designed around a decoupled, 5-layer modular architecture that guarantees high performance, data integrity, and operational resilience during disaster scenarios."
    )
    
    # 5-Layer System Architecture Diagram
    add_diagram_box(doc, "Antigravity 5-Layer End-to-End System Architecture",
"""===============================================================================
LAYER 1: DATA SOURCES & TELEMETRY INGESTION
───────────────────────────────────────────────────────────────────────────────
  IMD Weather AWS  │ NASA GPM Rainfall │ ALOS/SRTM DEM │ ISRO NRSC Atlas
  Geofabrik OSM   │ Citizen / Mobile  │ NHAI / PWD    │ GSI Landslide Inv
=======================================┬=======================================
                                       ▼
===============================================================================
LAYER 2: DATA INGESTION, ETL & SPATIAL PERSISTENCE
───────────────────────────────────────────────────────────────────────────────
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ POSTGRESQL 16 + POSTGIS SPATIAL DATABASE                                │
  │ • road_segments (OSM Vectors)      • confirmed_landslide_events         │
  │ • road_incidents (Active Closures) • landslide_predictions (AI Output)  │
  │ • rain_gauges (Telemetry)          • villages & critical_infrastructure │
  │ • historical_landslides (GSI)      • admin_districts & demographics     │
  └────────────────────────────────────┬────────────────────────────────────┘
=======================================┼=======================================
                                       ▼
===============================================================================
LAYER 3: INTELLIGENCE & OFFLINE ROUTING ENGINES
───────────────────────────────────────────────────────────────────────────────
  ┌─────────────────────────────────┐     ┌─────────────────────────────────┐
  │ AI / ML INFERENCE ENGINE        │     │ VALHALLA OFFLINE ROUTING ENGINE │
  │ • Multi-Criteria Risk Scoring   │     │ • Pre-Compiled NER OSM Tiles    │
  │ • Precipitation Threshold Eval  │     │ • Dynamic Polygon Exclusions    │
  │ • Slope Stability Analytics     │     │ • Multi-Modal Emergency Profiles│
  └────────────────┬────────────────┘     └────────────────┬────────────────┘
                   │                                       │
===================┼───────────────────────────────────────┼===================
                   ▼                                       ▼
===============================================================================
LAYER 4: APPLICATION ORCHESTRATION & BUSINESS LOGIC (FASTAPI)
───────────────────────────────────────────────────────────────────────────────
  • REST API Gateway                  • Dynamic Barrier Injection
  • Topological Route Validator       • Incident Lifecycle & Auth Controller
  • GeoJSON Feature Serialization     • Forensic Explanation Generator
=======================================┬=======================================
                                       ▼
===============================================================================
LAYER 5: PRESENTATION & USER EXPERIENCE (WEB GIS & DASHBOARD)
───────────────────────────────────────────────────────────────────────────────
  • MapLibre GL Interactive GIS Map   • Admin Incident Management Console
  • Real-Time Road Status Inspector   • Emergency Safe Route Simulator
  • Explainable Disruption Cards      • District Disaster Analytics & KPIs
===============================================================================""")

    doc.add_page_break()

    # ==============================================================================
    # 13. TECHNOLOGY STACK
    # ==============================================================================
    add_h1("12. Technology Stack")
    add_p(
        "Every technology in the Antigravity ecosystem is chosen for its open-source stability, geospatial efficiency, and offline resilience in mission-critical environments:"
    )
    
    # Table 3: Technology Stack
    add_h3("Table 4: Antigravity Technology Stack Breakdown")
    t3_headers = ["Technology", "Role in Antigravity", "Engineering Rationale & Justification"]
    t3_widths = [Inches(1.4), Inches(2.2), Inches(2.9)]
    t3_data = [
        ("Python 3.11", "Backend core, AI/ML inference, geospatial ETL, script automation.", "Industry standard for GIS processing (GDAL, Shapely, PyValhalla) and machine learning workflows."),
        ("FastAPI", "High-performance asynchronous REST API backend and orchestration.", "Native async support, ultra-low latency, automatic OpenAPI documentation, and robust Pydantic data validation."),
        ("PostgreSQL 16", "Primary ACID-compliant relational enterprise database.", "Rock-solid reliability, advanced indexing, robust JSONB support, and seamless PostGIS extension hosting."),
        ("PostGIS 3.4", "Spatial engine: spatial indexing (GIST), vector intersection, buffering.", "Industry gold standard for GIS; executes spatial topological queries (ST_Intersects, ST_DWithin, ST_Buffer) in sub-milliseconds."),
        ("Valhalla", "C++ open-source multi-modal offline routing engine.", "High-performance graph navigation, support for dynamic edge cost penalties and complex polygon avoiding barriers."),
        ("Geofabrik OSM PBF", "Authoritative North Eastern Zone road network vector data.", "Provides complete, free, highly detailed, open-source road topology for graph tile compilation."),
        ("MapLibre GL JS", "High-performance vector tile and GeoJSON map renderer.", "Smooth GPU-accelerated client-side rendering of dense road networks, heatmaps, and markers without proprietary map license fees."),
        ("Docker & Compose", "Containerization, service orchestration, reproducible environment.", "Ensures instant zero-dependency deployment of the complete PostGIS, Valhalla, FastAPI, and Next.js stack across any host."),
        ("Linux (Ubuntu)", "Production server and deployment host environment.", "High-performance I/O, enterprise container runtime security, and optimal memory management for spatial databases."),
        ("REST APIs", "Decoupled communication between frontend and backend services.", "Stateless, standards-compliant JSON/GeoJSON exchange enabling multi-client support (Web, Mobile, EOC consoles)."),
        ("GeoJSON (RFC 7946)", "Standardized spatial data interchange format.", "Seamless interoperability between PostGIS spatial queries, FastAPI serialization, and MapLibre rendering engines."),
        ("Scikit-Learn / XGBoost", "AI/ML susceptibility modeling and risk score computation.", "Proven tabular and spatial classification power for multi-factor environmental risk evaluation."),
        ("Satellite / DEM Data", "ALOS PALSAR / SRTM 30m Digital Elevation Models.", "Provides slope angle, aspect, and curvature data required for terrain stability analytics.")
    ]
    t3_tbl = doc.add_table(rows=len(t3_data) + 1, cols=3)
    format_table(t3_tbl, t3_widths, t3_headers, t3_data, header_bg="0F294A")

    doc.add_page_break()

    # ==============================================================================
    # 14. TECHNOLOGY-BY-TECHNOLOGY EXPLANATION
    # ==============================================================================
    add_h1("13. Detailed Technology-by-Technology Explanation")
    add_p(
        "To provide complete technical transparency, every core component is detailed across its definition, justification, implementation, and output:"
    )

    techs = [
        ("Python", "High-level, interpreted programming language renowned for data science, GIS, and backend engineering.",
         "Provides the richest ecosystem of spatial libraries (Shapely, GeoPandas, PyValhalla) and asynchronous frameworks.",
         "Powers the FastAPI backend, data ingestion pipelines, spatial validation algorithms, and AI inference scripts.",
         "Fast, robust REST endpoints, automated ETL transformations, and validated GeoJSON routing payloads."),
        
        ("FastAPI", "Modern, high-performance web framework for building APIs with Python 3.8+ based on standard type hints.",
         "Delivers sub-millisecond request processing, native async/await concurrency, and automatic interactive Swagger documentation.",
         "Orchestrates requests between the frontend map, PostGIS spatial database, and the Valhalla routing engine.",
         "Secure, validated RESTful endpoints for road statuses, active incidents, spatial risk zones, and validated routes."),
        
        ("PostgreSQL", "World's most advanced open-source object-relational database management system.",
         "Offers rock-solid ACID compliance, complex relational integrity, and high-concurrency enterprise data reliability.",
         "Stores administrative districts, historical landslide inventories, telemetry logs, user credentials, and audit trails.",
         "Structured, persistent relational tables backing all disaster intelligence records."),
        
        ("PostGIS", "Spatial database extender for PostgreSQL that adds support for geographic objects and topological queries.",
         "Enables true spatial reasoning: distance calculations, spatial buffering, polygon intersections, and GIST indexing.",
         "Stores LineString road geometries, Point incident coordinates, and spatial risk polygons; tests route intersections.",
         "Spatial query results, hazard collision checks, and dynamic GeoJSON feature collections."),
        
        ("Valhalla", "High-performance, open-source routing engine written in C++ designed for OpenStreetMap data.",
         "Supports dynamic routing with customizable costing models, avoid-polygon barriers, and offline graph tiles.",
         "Ingests North Eastern Zone OSM PBF, builds an offline topological routing graph, and calculates emergency routes.",
         "Turn-by-turn navigation geometries, travel durations, distances, and alternative bypass corridors."),
        
        ("OpenStreetMap & Geofabrik", "Collaborative global mapping project and specialized regional data extract provider.",
         "Provides unencumbered, free, high-density vector road network data for the North Eastern Region of India.",
         "Downloaded as an OSM PBF file and compiled into Valhalla routing tiles and PostGIS road segment tables.",
         "Complete topological road network containing highways, district roads, bridges, and mountain passes."),
        
        ("MapLibre GL", "Open-source, GPU-accelerated TypeScript/JavaScript map rendering library.",
         "Renders complex vector tiles, road networks, and heatmaps at 60 FPS without commercial licensing restrictions.",
         "Renders the interactive command center map, color-coded road networks, incident markers, and active route paths.",
         "Interactive, highly responsive visual GIS interface for EOC commanders and field personnel."),
        
        ("GeoJSON", "Open standard format designed for representing simple geographical features along with non-spatial attributes.",
         "Ubiquitous, human-readable JSON-based spatial standard supported natively by PostGIS, FastAPI, and MapLibre.",
         "Transfers road segments, hazard zones, telemetry markers, and route paths across HTTP REST APIs.",
         "Structured FeatureCollection payloads parsed and styled directly on the client map."),
        
        ("Docker & Docker Compose", "Industry-standard platform for containerizing applications and managing multi-container stacks.",
         "Guarantees that PostGIS, Valhalla, FastAPI, and Next.js run identically across development and production servers.",
         "Packages each tier into isolated, networked containers with mapped storage volumes and health checks.",
         "One-command reproducible system deployment (`docker compose up -d`).")
    ]

    for name, what, why, how, produces in techs:
        add_h2(f"13.{techs.index((name, what, why, how, produces)) + 1} {name}")
        add_p(what, bold_prefix="• What is it? ")
        add_p(why, bold_prefix="• Why does Antigravity use it? ")
        add_p(how, bold_prefix="• How is it used in Antigravity? ")
        add_p(produces, bold_prefix="• What output does it produce? ")

    doc.add_page_break()

    # ==============================================================================
    # 15. DATA ARCHITECTURE & DATABASE SCHEMAS
    # ==============================================================================
    add_h1("14. Data Architecture & Database Schemas")
    add_p(
        "Antigravity enforces strict separation of concerns across its database entities to prevent operational confusion between historical records, AI predictions, and confirmed on-ground closures."
    )
    
    # Table 4: Database Components
    add_h3("Table 5: Database Entity Role Breakdown")
    t4_headers = ["Table Entity", "Spatial Type & Data Stored", "Operational Role in Antigravity"]
    t4_widths = [Inches(1.8), Inches(2.3), Inches(2.4)]
    t4_data = [
        ("admin_districts", "MultiPolygon (EPSG:4326). District bounds, census demographics, vulnerability indices.", "Defines administrative boundaries and population exposure for EOC jurisdiction."),
        ("historical_landslides", "Point (EPSG:4326). Historical landslide occurrences from ISRO Atlas & GSI records.", "Used strictly for historical spatial analysis and AI training. NEVER triggers road closures."),
        ("landslide_predictions", "Polygon / Point (EPSG:4326). Machine learning susceptibility risk ratings (0.0 to 1.0).", "Generates risk heatmaps and early warning alerts. Never automatically closes a road."),
        ("confirmed_landslide_events", "Point (EPSG:4326). Authoritatively verified landslide events from GSI, NHAI, or PWD.", "Official ground truth. Triggers spatial hazard buffering and alerts responders."),
        ("road_segments", "LineString (EPSG:4326). Physical road centerlines, highway designations, surfaces.", "Base topological road network; represents the physical highway infrastructure."),
        ("road_incidents", "Geometry (Point/LineString). Active physical closures, cause codes, authorities, ETAs.", "Dynamic disruption layer. ONLY an active 'BLOCKED' status here excludes a road from routing."),
        ("rain_gauges", "Point (EPSG:4326). IMD AWS telemetry, 1h/24h rainfall, 30-day SPI indices.", "Supplies live hydrological saturation data to the multi-criteria risk engine."),
        ("villages", "Point (EPSG:4326). Isolated hamlets, population, remaining food/medical supplies, bypasses.", "Identifies stranded habitations and prioritizes emergency relief supply dispatch."),
        ("critical_infrastructure", "Point (EPSG:4326). Hospitals, trauma centers, emergency shelters, helipads.", "Origin/Destination nodes for emergency vehicle routing and medical evacuations.")
    ]
    t4_tbl = doc.add_table(rows=len(t4_data) + 1, cols=3)
    format_table(t4_tbl, t4_widths, t4_headers, t4_data, header_bg="0F294A")

    # ==============================================================================
    # 16. AI / MACHINE LEARNING ARCHITECTURE
    # ==============================================================================
    add_h1("15. AI / Machine Learning Architecture")
    add_p(
        "Antigravity adheres to rigorous scientific transparency regarding its artificial intelligence capabilities, clearly distinguishing implemented components from planned enhancements."
    )
    
    # Table 5: AI Components
    add_h3("Table 6: AI / ML Capabilities Status Matrix")
    t5_headers = ["AI / ML Component", "Implementation Status", "Technical Scope & Capability"]
    t5_widths = [Inches(2.0), Inches(1.5), Inches(3.0)]
    t5_data = [
        ("Multi-Factor Risk Scoring", "Implemented", "Heuristic & statistical risk aggregation combining slope, rainfall telemetry, and historical spatial clustering into 4 risk tiers (Low, Moderate, High, Critical)."),
        ("Precipitation Threshold Engine", "Implemented", "Evaluates live rainfall against empirical intensity-duration thresholds to trigger automated hazard alerts."),
        ("Spatial Buffer Risk Evaluation", "Implemented", "PostGIS spatial buffering and polygon intersection checking road vulnerability based on nearby hazard proximity."),
        ("XGBoost Susceptibility Model", "Partially Implemented", "Gradient boosted decision tree trained on terrain features (DEM slope, aspect, curvature, lithology) to predict static susceptibility scores."),
        ("Satellite Debris Detection (U-Net)", "Planned / Future Enhancement", "Semantic segmentation of high-resolution post-disaster satellite imagery to identify fresh landslide scarps and mud deposits."),
        ("Automated Road Damage Vision", "Planned / Future Enhancement", "Computer vision model processing drone/field video to detect asphalt washouts, cracks, and structural bridge damage."),
        ("Time-Series Rainfall Forecasting", "Planned / Future Enhancement", "LSTM/Transformer architecture for 6-to-24 hour predictive rainfall-triggered landslide probability forecasting.")
    ]
    t5_tbl = doc.add_table(rows=len(t5_data) + 1, cols=3)
    format_table(t5_tbl, t5_widths, t5_headers, t5_data, header_bg="0F294A")

    doc.add_page_break()

    # ==============================================================================
    # 17. COMPLETE DATA FLOW PIPELINE
    # ==============================================================================
    add_h1("16. Complete Data Flow Pipeline")
    add_p(
        "The movement of information through Antigravity follows a strictly orchestrated, verified pipeline from sensor detection to dashboard dispatch:"
    )
    
    # Table 7: Disaster Workflow
    add_h3("Table 7: 12-Stage Data Ingestion, Processing & Routing Pipeline")
    t7_headers = ["Pipeline Stage", "Input Data", "Processing & Transformation", "Output Product"]
    t7_widths = [Inches(1.5), Inches(1.5), Inches(2.0), Inches(1.5)]
    t7_data = [
        ("1. Telemetry Ingestion", "IMD AWS feeds, satellite precipitation, DEM rasters.", "Automated REST polling and GeoTIFF slope derivation.", "Normalized numerical environmental metrics."),
        ("2. Spatial Ingestion", "Geofabrik OSM PBFs, Bhuvan road layers.", "OSM2PostGIS extraction, topological segment snapping.", "Canonical road_segments table in PostGIS."),
        ("3. Hazard Reporting", "Citizen mobile app reports, field officer submissions.", "Form serialization, GPS validation, image payload upload.", "Unverified records in road_incidents."),
        ("4. Spatial Ingestion", "Field reports, satellite alerts, rain thresholds.", "PostGIS GIST indexing, bounding box clustering.", "Staged incident candidate entries."),
        ("5. Risk Scoring", "Telemetry + DEM slope + historical clusters.", "Multi-criteria risk engine evaluates hazard score.", "Landslide risk rating (0.0 to 1.0)."),
        ("6. Officer Verification", "Staged incidents, photographic evidence.", "Admin reviews field photos, confirms coordinates, sets cause.", "Record upgraded to 'VERIFIED' status."),
        ("7. Road Impact Match", "Verified incident coordinates + road network.", "ST_DWithin / ST_Intersects isolates affected road segment.", "Target road_segment_id mapped to incident."),
        ("8. Status Transition", "Affected road ID + incident cause.", "PostGIS executes status update: OPEN -> BLOCKED.", "Updated road_incidents table."),
        ("9. Routing Request", "Origin/Destination coordinates from EOC.", "FastAPI extracts active blocked road geometries.", "Dynamic avoid-polygon barrier array."),
        ("10. Graph Navigation", "Origin, Destination, Avoid Barriers.", "Valhalla executes A* / Dijkstra on offline road tiles.", "Raw LineString route geometry."),
        ("11. Route Validation", "Computed route geometry + PostGIS layers.", "ST_Intersects checks against blocked roads & water.", "Validated safe route or 'NO SAFE ROUTE'."),
        ("12. EOC Presentation", "Validated route + forensic road cards.", "MapLibre renders route, side panels display bypass ETA.", "Live operational guidance for responders.")
    ]
    t7_tbl = doc.add_table(rows=len(t7_data) + 1, cols=4)
    format_table(t7_tbl, t7_widths, t7_headers, t7_data, header_bg="0F294A")

    doc.add_page_break()

    # ==============================================================================
    # 18. PRACTICAL SCENARIO: HEAVY RAINFALL LANDSLIDE
    # ==============================================================================
    add_h1("17. Step-by-Step Functional Walkthrough: Monsoon Landslide Scenario")
    add_p(
        "To understand how Antigravity operates under acute emergency conditions, consider a real-world scenario along the critical NH-6 lifeline corridor in Meghalaya:"
    )
    
    scenario_steps = [
        ("Step 1: Heavy Precipitation Detected", "IMD AWS telemetry at Jowai and Sonapur registers sustained rainfall exceeding 140 mm in 24 hours, breaching the localized empirical landslide threshold."),
        ("Step 2: Environmental Hazard Escalation", "The risk analytics engine correlates high rainfall with 34° DEM slope gradients, elevating the regional risk index to 'Critical' on the EOC heatmap."),
        ("Step 3: Slope Failure & Incident Logging", "A massive 600 m³ debris flow collapses onto NH-6 at Km 48. A local PWD field officer submits a geolocated photo report via the citizen/field portal."),
        ("Step 4: Spatial Persistence in PostGIS", "The report is ingested into PostGIS as an unverified incident with exact WGS84 point coordinates (25.1482°N, 92.3610°E)."),
        ("Step 5: Automated Spatial Road Identification", "PostGIS executes `ST_DWithin(geom, road_segments.geom, 25)` to immediately identify the exact underlying highway link: `SEG-NER-NH06-KM48`."),
        ("Step 6: Administrative Verification", "The District Disaster Management Officer reviews the photographic evidence on the Admin Dashboard and clicks 'Verify & Approve'."),
        ("Step 7: Road Status Transition", "The road segment status transitions from `OPEN` $\\rightarrow$ `BLOCKED` in `road_incidents`."),
        ("Step 8: Structured Forensics Attached", "The record receives structured metadata: Cause = `LANDSLIDE`, Authority = `Meghalaya PWD / NHAI`, Debris = `600 m³`, Expected Reopening = `18 Hours`."),
        ("Step 9: Active Route Invalidation", "The system checks all active emergency dispatch routes. An active medical supply route intersecting Km 48 is immediately flagged as `INVALID`."),
        ("Step 10: Valhalla Graph Rerouting", "FastAPI passes the blocked segment geometry as an avoid-polygon barrier to Valhalla, which recomputes the optimal path via the validated Jowai-Nartiang-Khanduli state highway."),
        ("Step 11: Route Safety Validation", "The PostGIS validation engine tests the new bypass geometry: confirms it is a contiguous LineString, snaps to real roads, and maintains >500m clearance from active hazards."),
        ("Step 12: Dashboard Visualization", "The Admin Dashboard displays NH-6 in bold red with a warning icon; the new green bypass route is instantly plotted on the operator's screen."),
        ("Step 13: Explainable Inspection", "Clicking the blocked section displays the full forensic card explaining the landslide cause, debris volume, and estimated reopening time."),
        ("Step 14: Field Clearance & Reopening", "After 16 hours, heavy earthmoving machinery clears the debris. The PWD engineer submits a clearance report; the admin updates status to `OPEN`."),
        ("Step 15: Normal Routing Restored", "NH-6 transitions back to Emerald Green in PostGIS; standard high-speed highway routing resumes automatically across the network.")
    ]

    for title, desc in scenario_steps:
        add_p(desc, bold_prefix=f"{title}: ")

    doc.add_page_break()

    # ==============================================================================
    # 19. SAFE ROUTING LOGIC & ROUTE VALIDATION
    # ==============================================================================
    add_h1("18. Safe Routing Logic and Geometric Validation")
    add_p(
        "The safe routing architecture of Antigravity is founded on a strict division of responsibilities between PostGIS, Valhalla, and FastAPI."
    )

    add_h2("18.1 Architectural Division of Routing Responsibilities")
    add_bullet("Holds the dynamic, live disaster truth. Knows which roads are physically blocked, which bridges are washed out, and where active hazard perimeters exist.", bold_prefix="• PostGIS: ")
    add_bullet("Holds the static, high-performance road connectivity graph. Knows how highways, district roads, and streets connect topologically.", bold_prefix="• Valhalla: ")
    add_bullet("The intelligent orchestrator. Queries PostGIS for dynamic barriers, injects them into Valhalla, and validates the resulting geometry before client presentation.", bold_prefix="• FastAPI: ")

    # Routing flow diagram
    add_diagram_box(doc, "Disaster-Aware Routing Orchestration Flow",
"""[ 1. User Requests Route (Origin / Destination) ]
                      │
                      ▼
[ 2. FastAPI Queries PostGIS for Active 'BLOCKED' Segments ]
                      │
                      ▼
[ 3. PostGIS Generates MultiPolygon Bounding Hazard Geometries ]
                      │
                      ▼
[ 4. FastAPI Formats Valhalla Request with 'exclude_polygons' ]
                      │
                      ▼
[ 5. Valhalla Recomputes Topological Route Avoiding Barriers ]
                      │
         ┌────────────┴────────────┐
         ▼                         ▼
  [ Route Found ]          [ No Path Exists ]
         │                         │
         ▼                         ▼
[ 6. PostGIS Geometric    [ Return 'NO SAFE ROUTE' ]
     Validation Checks ]           │
         │                         ▼
         ▼                 [ Do NOT Draw Fake Line ]
[ 7. Safe Route GeoJSON
     Dispatched to Map ]""")

    add_h2("18.2 Strict Geometric Validation Checks")
    add_p("To ensure 100% navigational safety, every route generated by Valhalla undergoes four automated spatial verification tests in PostGIS:")
    add_bullet("Confirms the returned geometry is an OGC-valid LineString without self-intersections or null geometries.", bold_prefix="1. OGC Geometry Validity: ")
    add_bullet("Confirms that the route geometry maintains zero intersection (`ST_Intersects = FALSE`) with all active 'BLOCKED' road segments.", bold_prefix="2. Hazard Barrier Separation: ")
    add_bullet("Verifies that the route geometry buffer lies entirely within the convex hull of the authorized road network.", bold_prefix="3. Network Adherence: ")
    add_bullet("Checks that the route does not cross unbridged water polygons, building footprints, or restricted landslide scarps.", bold_prefix="4. Topographical Safety: ")

    doc.add_page_break()

    # ==============================================================================
    # 20. API ARCHITECTURE & SECURITY
    # ==============================================================================
    add_h1("19. API Architecture & Role-Based Security")
    add_p(
        "Antigravity exposes a clean, modular RESTful API architecture documented via OpenAPI/Swagger specifications."
    )

    add_h2("19.1 Core REST API Endpoints")
    add_bullet("Returns GeoJSON FeatureCollection of all active road closures with forensic metadata.", bold_prefix="GET /api/v1/map/road-closures: ")
    add_bullet("Returns active and historical disaster incidents filtered by state, district, and severity.", bold_prefix="GET /api/v1/map/incidents: ")
    add_bullet("Returns spatial polygons representing categorized risk zones (Low to Critical).", bold_prefix="GET /api/v1/map/risk-zones: ")
    add_bullet("Accepts origin, destination, vehicle profile, and returns validated safe route GeoJSON.", bold_prefix="POST /api/v1/routing/emergency-route: ")
    add_bullet("Creates a new disaster incident report from authorized field personnel or citizen intake.", bold_prefix="POST /api/v1/incidents: ")
    add_bullet("Updates verification status, severity, debris volume, and notes for an incident.", bold_prefix="PATCH /api/v1/incidents/{id}: ")
    add_bullet("Updates operational status (OPEN/BLOCKED) and closure reasons for a road segment.", bold_prefix="PATCH /api/v1/roads/{id}/status: ")
    add_bullet("Returns aggregate disaster metrics, blocked highway miles, and district-wise summaries.", bold_prefix="GET /api/v1/analytics/kpis: ")

    add_h2("19.2 System Security & Role-Based Access Control (RBAC)")
    add_p(
        "To protect critical disaster infrastructure from unauthorized tampering, Antigravity implements JSON Web Token (JWT) authentication, bcrypt password hashing, and granular Role-Based Access Control:"
    )
    
    # Table 8: User Roles
    add_h3("Table 8: Role-Based Access Control & User Permissions Matrix")
    t8_headers = ["User Role", "Target User Group", "Access Level & Permissions"]
    t8_widths = [Inches(1.5), Inches(2.0), Inches(2.9)]
    t8_data = [
        ("System Administrator", "IT & GIS System Admins", "Full read/write access. User management, GIS layer configuration, database backups, system settings."),
        ("Disaster Commander", "District Magistrates, SDMA Heads", "Authoritative control: verify incidents, approve road closures, dispatch emergency routes, publish alerts."),
        ("Highway Engineer", "State PWD, NHAI Engineers", "Operational control: update road clearance progress, input debris volume, modify expected reopening ETAs."),
        ("Field Officer", "Police, First Responders, SDRF", "Field access: submit geolocated hazard reports, upload field photos, view operational routing maps."),
        ("Public / Viewer", "Citizens, Commercial Logistics", "Read-only access: view verified road statuses, public hazard alerts, and execute civilian safe routing.")
    ]
    t8_tbl = doc.add_table(rows=len(t8_data) + 1, cols=3)
    format_table(t8_tbl, t8_widths, t8_headers, t8_data, header_bg="0F294A")

    doc.add_page_break()

    # ==============================================================================
    # 21. RELIABILITY, OFFLINE CAPABILITY & PERFORMANCE
    # ==============================================================================
    add_h1("20. Reliability, Offline Capabilities & Performance Engineering")
    add_p(
        "Disaster environments represent the ultimate test of software resilience. Telecom infrastructure, power grids, and internet connectivity are frequently severed during extreme weather."
    )

    add_h2("20.1 Offline Routing vs. Offline Map Visualization")
    add_p("Antigravity maintains a critical engineering distinction between routing computation and visual tile rendering:")
    add_bullet("Valhalla operates completely offline on locally stored, pre-compiled road graph tiles (`/data/valhalla_tiles`). Routing calculations require zero internet access.", bold_prefix="1. Offline Routing Computation: ")
    add_bullet("MapLibre renders map features using cached vector tiles or local MBTiles/PMTiles container servers. In disconnected EOC environments, base maps are served locally.", bold_prefix="2. Offline Map Visualization: ")

    add_h2("20.2 Geospatial Performance Optimization Strategies")
    add_bullet("All spatial tables (`road_segments`, `road_incidents`, `landslide_predictions`) utilize PostgreSQL GIST indexes, accelerating spatial intersection queries to <2ms.", bold_prefix="• PostGIS Spatial Indexing (GIST): ")
    add_bullet("Valhalla's C++ routing engine evaluates topological A* paths across 500,000+ regional nodes in under 25 milliseconds.", bold_prefix="• C++ Graph Performance: ")
    add_bullet("High-volume polygon risk layers are served as Protocol Buffer Vector Tiles (MVT), reducing payload sizes by 85% compared to raw GeoJSON.", bold_prefix="• Vector Tile Streaming: ")
    add_bullet("FastAPI endpoints leverage Redis in-memory caching for frequently queried district KPI statistics and static road classifications.", bold_prefix="• Asynchronous In-Memory Caching: ")

    # ==============================================================================
    # 22. REALISTIC LIMITATIONS & FUTURE ROADMAP
    # ==============================================================================
    add_h1("21. System Limitations & Future Expansion Roadmap")
    add_p(
        "In alignment with professional engineering standards, Antigravity maintains an honest assessment of operational boundaries and future developmental phases."
    )

    add_h2("21.1 Realistic System Limitations")
    add_bullet("The precision of hazard warnings directly depends on the spatial density of IMD rain gauges and satellite revisit rates.", bold_prefix="• Telemetry Density: ")
    add_bullet("Optical satellite sensors cannot penetrate dense monsoon cloud cover; radar (SAR) data requires specialized interferometric processing.", bold_prefix="• Cloud Cover in Optical Imagery: ")
    add_bullet("Automated computer vision road extraction may produce false positives in dense jungle canopy or steep shadows.", bold_prefix="• AI False Positives: ")
    add_bullet("Automated predictions provide probabilistic risk, not physical certainty. Human field inspection remains essential.", bold_prefix="• Field Verification Necessity: ")

    # Table 9: Current vs Future
    add_h3("Table 9: Current Capabilities vs. Future Roadmap")
    t9_headers = ["Functional Capability", "Current Implementation Status", "Future Roadmap & Planned Enhancement"]
    t9_widths = [Inches(1.8), Inches(2.0), Inches(2.6)]
    t9_data = [
        ("Hazard Detection", "Field reports, telemetry thresholds, manual verification.", "Automated Sentinel-1 SAR interferometry and real-time IoT slope extensometers."),
        ("Routing Engine", "Valhalla offline road routing with avoid polygons.", "Multi-vehicle dynamic convoy routing with bridge weight and clearance constraints."),
        ("Disaster Scope", "Landslides, debris flows, rockfalls, localized floods.", "Multi-hazard expansion: Flash floods, earthquakes, forest fires, and glacial lake bursts."),
        ("User Interface", "Desktop/Tablet Web GIS Dashboard (MapLibre).", "Native offline mobile application with peer-to-peer mesh networking for rescue teams."),
        ("Alert Delivery", "Dashboard alerts and REST notification triggers.", "Integration with NDMA SACHET CAP feeds and localized multilingual voice broadcasts.")
    ]
    t9_tbl = doc.add_table(rows=len(t9_data) + 1, cols=3)
    format_table(t9_tbl, t9_widths, t9_headers, t9_data, header_bg="0F294A")

    doc.add_page_break()

    # ==============================================================================
    # 23. REAL-WORLD OPERATIONAL USE CASES
    # ==============================================================================
    add_h1("22. Real-World Operational Use Cases")
    add_p(
        "Antigravity is designed to solve high-stakes operational dilemmas across diverse disaster scenarios:"
    )

    use_cases = [
        ("Use Case 1: Lifeline Highway Landslide Disruption", 
         "A major debris flow blocks NH-6 connecting Meghalaya and Assam. District EOC receives field alerts, verifies coordinates, and marks the link BLOCKED. Antigravity isolates the segment, displays the blockage reason to all operators, and dynamically reroutes inter-state supply trucks across a safe validated state corridor."),
        
        ("Use Case 2: Flash Flood Inundation & Bridge Damage", 
         "Monsoon cloudburst causes a mountain river to surge, washing out a major bridge abutment. Highway engineers flag the bridge node as 'BRIDGE_FAILURE'. Antigravity permanently locks out the link, recomputing evacuation routes for downstream villages to reach higher-ground relief shelters."),
        
        ("Use Case 3: Emergency Critical Care Patient Evacuation", 
         "An advanced life support ambulance must transport a critical patient from a remote health center in Sohra to Civil Hospital Shillong during a thunderstorm. Antigravity calculates a path that avoids all high-risk saturated slopes, guaranteeing safe transit without getting trapped by fresh rockfalls."),
        
        ("Use Case 4: Field Officer Geotagged Incident Reporting", 
         "A patrolling police officer discovers a developing road crack and minor mudslide. Using a smartphone, the officer uploads GPS coordinates, notes 50m³ debris, and attaches a photo. The EOC dashboard immediately flags a yellow 'CAUTION' status, alerting upcoming traffic before complete collapse."),
        
        ("Use Case 5: State Disaster Control Room Strategic Coordination", 
         "During a statewide cyclone warning, the State Disaster Management Authority (SDMA) uses the Antigravity command map to monitor all 8 districts simultaneously, identifying which valleys are at risk of total road isolation and staging NDRF relief platoons in advance.")
    ]

    for title, desc in use_cases:
        add_h2(f"22.{use_cases.index((title, desc)) + 1} {title}")
        add_p(desc)

    # ==============================================================================
    # 24. LIVE DEMONSTRATION SCRIPT & FLOW
    # ==============================================================================
    add_h1("23. Live Demonstration Script & Flow (For Evaluators)")
    add_p(
        "When presenting Antigravity during technical evaluations, viva-voce exams, or stakeholder demonstrations, follow this structured 15-step demonstration flow:"
    )
    
    demo_steps = [
        ("Step 1: Open Dashboard", "Launch the Antigravity Command Center interface at `http://localhost:3000`."),
        ("Step 2: Present Macro Telemetry", "Show the KPI Overview cards displaying Active Landslides, Blocked Roads, and Regional Risk Level."),
        ("Step 3: Explore the GIS Map", "Navigate the MapLibre vector map; toggle the DEM Slope overlay, Rain Gauges, and Road Network layers."),
        ("Step 4: Inspect a Road Segment", "Click an Emerald Green road segment; demonstrate the inspector panel showing road name, surface, and 'OPEN' status."),
        ("Step 5: Execute Standard Route", "Request a route from Shillong to Silchar; show the fast primary path along NH-6."),
        ("Step 6: Simulate a Landslide Event", "Open the Incident Management panel; select an unverified landslide report at NH-6 Km 48."),
        ("Step 7: Verify Incident", "Review the attached photo; click 'Approve & Mark Blocked'. Select cause = 'LANDSLIDE', debris = '600 m³'."),
        ("Step 8: Observe Visual Transition", "Watch the NH-6 segment instantly transition to bold Crimson Red on the live map."),
        ("Step 9: Demonstrate Explainability", "Click the blocked red segment; show the evaluator the structured forensic card explaining the landslide cause and ETA."),
        ("Step 10: Re-Request Route", "Request the Shillong to Silchar route again with the exact same origin and destination."),
        ("Step 11: Present Disaster-Aware Bypass", "Show the system automatically calculating a safe green alternative route via the Jowai-Khanduli bypass."),
        ("Step 12: Highlight 'Zero Straight Lines'", "Point out that the bypass strictly follows validated vector roads with zero straight-line shortcuts."),
        ("Step 13: Simulate 'No Safe Route'", "Block all peripheral mountain passes around an isolated valley; request navigation into the zone."),
        ("Step 14: Demonstrate Fail-Safe Behavior", "Show the system returning 'NO SAFE ROUTE FOUND' rather than leading vehicles into danger."),
        ("Step 15: Conclude with Disaster Analytics", "Show the analytics dashboard summarizing blocked highway mileage and district risk metrics.")
    ]

    for title, desc in demo_steps:
        add_p(desc, bold_prefix=f"• {title}: ")

    doc.add_page_break()

    # ==============================================================================
    # 25. TECHNICAL VIVA & REVIEW QUESTIONS (Q&A)
    # ==============================================================================
    add_h1("24. Expected Technical Viva & Review Questions")
    add_p(
        "This section provides concise, authoritative answers to common questions posed by technical reviewers, external evaluators, and system architects:"
    )

    qas = [
        ("Q1: Why did you choose PostGIS instead of a traditional NoSQL or standard SQL database?",
         "PostGIS provides true spatial types (Geometry/Geography), spatial indexing (GIST R-Tree), and native topological functions (ST_Intersects, ST_DWithin, ST_Buffer). Executing spatial joins between road lines and hazard polygons in memory or NoSQL would be orders of magnitude slower and prone to geometric inaccuracies."),
        
        ("Q2: Why not simply use the Google Maps Directions API for emergency routing?",
         "Commercial navigation APIs like Google Maps are closed-source, proprietary black boxes that prioritize travel time and traffic speed, not physical hazard safety. They do not allow custom injection of dynamic GIS hazard polygons (landslide debris buffers, slope risk corridors) to forcibly exclude compromised mountain passes, nor can they operate completely offline in disconnected disaster zones."),
        
        ("Q3: What specific role does Valhalla play in the architecture?",
         "Valhalla is a high-performance C++ routing engine built specifically for OpenStreetMap graphs. It allows dynamic runtime edge costing and custom avoid-polygon barriers. Valhalla handles the complex topological graph traversal, while PostGIS manages the dynamic disaster state."),
        
        ("Q4: How does the platform know that a road is physically blocked?",
         "Road blockages are established through multi-source verified ingestion: field officer mobile reports with GPS photos, District EOC inputs, PWD/NHAI official feeds, and telemetry threshold triggers. Every closure undergoes administrative verification before updating the routing graph."),
        
        ("Q5: How does the system explain why a road is closed?",
         "Every closure is linked to a structured database record containing a typed cause code (e.g., LANDSLIDE, FLASH_FLOOD), estimated debris volume, verifying engineer, and expected reopening ETA. This metadata is rendered as an explainable forensic card when clicked on the map."),
        
        ("Q6: What happens if all available roads between A and B are blocked by landslides?",
         "Antigravity enforces a strict fail-safe: it returns 'NO SAFE ROUTE FOUND' and alerts the operator. It will NEVER draw an artificial straight line or route vehicles across unmapped mountain cliffs or rivers."),
        
        ("Q7: How do you prevent AI-detected roads from crossing buildings or rivers?",
         "All candidate road geometries must pass a PostGIS spatial validation pipeline: checking intersection against building footprints (ST_Intersects), unbridged waterbodies, slope gradient limits (>28°), and topological connectivity to the existing road network."),
        
        ("Q8: Is the AI/ML landslide prediction engine fully operational?",
         "The current implementation features an operational multi-factor statistical risk scoring engine and rainfall threshold alerting system. Complex computer vision satellite debris extraction (U-Net) and deep time-series forecasting are architectural roadmap modules designed for future integration."),
        
        ("Q9: Can Antigravity operate completely offline without internet connectivity?",
         "Yes. Valhalla executes routing entirely on pre-compiled local tile graphs stored on the server. When deployed with local vector tile servers, the complete command center functions in totally disconnected EOC field environments."),
        
        ("Q10: Can this platform be extended to other disasters such as flash floods and earthquakes?",
         "Yes. Antigravity's modular data model is disaster-agnostic. Inundation polygons from hydrological models or earthquake fault rupture zones can be ingested as avoid-barriers identically to landslide perimeters."),
        
        ("Q11: Can the architecture scale to cover the entire country?",
         "Yes. The decoupled microservices architecture (FastAPI + PostGIS + Valhalla) can be containerized and distributed across regional nodes. Valhalla natively supports country-scale routing graphs using tiered hierarchy tiles.")
    ]

    for q, a in qas:
        add_h2(q)
        add_p(a)

    doc.add_page_break()

    # ==============================================================================
    # 26. WHY THE ARCHITECTURE WORKS & CONCLUSION
    # ==============================================================================
    add_h1("25. Why the Architecture Works")
    add_p(
        "The enduring strength of Antigravity lies in its clean separation of institutional and computational concerns:"
    )
    
    add_callout(doc, "The Five-Pillar Architectural Creed", 
                "“PostGIS knows what is happening in the physical world.\n"
                "Valhalla knows how the road network connects topologically.\n"
                "FastAPI decides how disaster data and routing interact.\n"
                "AI provides predictive intelligence and risk assessment.\n"
                "GIS presents the unified truth clearly to the human commander.”",
                box_type="CORE ARCHITECTURAL CREED", color_hex="0F294A", bg_hex="F0F4F8")

    add_h1("26. Conclusion")
    add_p(
        "ANTIGRAVITY transforms mountain disaster management from reactive chaos into structured, proactive, and explainable geospatial intelligence. By uniting real-time environmental telemetry, multi-factor terrain analytics, authoritative road network topology, and offline-capable routing, the platform solves the single most critical dilemma during natural hazards: ensuring that relief convoys, emergency ambulances, and fleeing citizens can navigate safely through collapsing terrain."
    )
    add_p(
        "The platform establishes that disaster routing must never be treated as a standard shortest-path exercise. By connecting Hazard $\\rightarrow$ Location $\\rightarrow$ Road Impact $\\rightarrow$ Forensic Explanation $\\rightarrow$ Safe Alternative Bypass, Antigravity delivers an enterprise-grade, life-saving decision-support ecosystem tailored for the rugged North Eastern Region of India."
    )
    
    add_p("Document compiled and certified for technical project presentation, academic defense, and operational evaluation.", bold_prefix="Final Certification: ", italic=True)

    # Save document
    output_path = r"d:\GIS Dashboard\ANTIGRAVITY_Technical_Project_Presentation.docx"
    doc.save(output_path)
    print(f"Document successfully created and saved to: {output_path}")

if __name__ == "__main__":
    build_document()
