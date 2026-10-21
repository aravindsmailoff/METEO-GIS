# ==============================================================================
# ANTIGRAVITY — CRISP, CRYSTAL-CLEAR TECHNICAL PRESENTATION DOCUMENT
# Designed to be simple, powerful, visual, and instantly understandable by anyone.
# ==============================================================================

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import sys
import os

# Add scripts directory to path
sys.path.append(r"d:\GIS Dashboard\scripts")
from docx_helpers import set_cell_background, set_cell_margins, set_cell_border, add_callout, add_diagram_box, format_table

def build_crisp_document():
    doc = docx.Document()
    
    # Page setup - 1 inch margins
    for section in doc.sections:
        section.top_margin = Inches(0.9)
        section.bottom_margin = Inches(0.9)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.9)
        section.different_first_page_header_footer = True
        
        # Header / Footer
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("ANTIGRAVITY — Executive Project Presentation & Architecture Guide")
        hrun.font.name = "Calibri"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)
        
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("ANTIGRAVITY: AI-GIS Disaster Intelligence & Safe Routing Platform | North Eastern Region of India")
        frun.font.name = "Calibri"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)

    # Base typography
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(4)
    normal_style.paragraph_format.space_before = Pt(0)

    # Heading Helpers
    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(15)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0x0F, 0x29, 0x4A) # Deep Navy
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(12)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0x1E, 0x40, 0xAF) # Crisp Blue
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(1)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(10.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
        return p

    def add_p(text, bold_prefix=None, italic=False):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(3)
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
        r.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
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
    # 1. COVER PAGE — CLEAN, BOLD, EXECUTIVE
    # ==============================================================================
    p_tag = doc.add_paragraph()
    p_tag.paragraph_format.space_before = Pt(30)
    p_tag.paragraph_format.space_after = Pt(6)
    r_tag = p_tag.add_run("TECHNICAL PROJECT PRESENTATION & ARCHITECTURE")
    r_tag.font.name = "Arial"
    r_tag.font.size = Pt(10)
    r_tag.font.bold = True
    r_tag.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)

    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(6)
    r_title = p_title.add_run("ANTIGRAVITY")
    r_title.font.name = "Arial"
    r_title.font.size = Pt(32)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0x0F, 0x29, 0x4A)

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(10)
    r_sub = p_sub.add_run("AI-Powered GIS-Based Landslide Monitoring, Disaster Intelligence and Safe Route Management Platform for the North Eastern Region of India")
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(13)
    r_sub.font.bold = True
    r_sub.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

    p_tagline = doc.add_paragraph()
    p_tagline.paragraph_format.space_before = Pt(0)
    p_tagline.paragraph_format.space_after = Pt(20)
    r_tagline = p_tagline.add_run("“From Hazard Detection to Safe Decision-Making and Emergency Routing”")
    r_tagline.font.name = "Georgia"
    r_tagline.font.size = Pt(12)
    r_tagline.font.italic = True
    r_tagline.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    # 10-Second Pitch Box on Cover Page
    add_callout(doc, "ANTIGRAVITY IN 10 SECONDS",
                "Normal navigation apps (like Google Maps) tell you the FASTEST way to get from A to B.\n"
                "In a mountain disaster, that 'fastest road' might be buried under 500 tons of rock.\n"
                "ANTIGRAVITY connects live disaster data with road navigation to answer one life-saving question:\n"
                "“Can I SAFELY reach my destination right now, and if not, what is the validated safe bypass?”",
                box_type="THE CORE IDEA", color_hex="2563EB", bg_hex="EFF6FF")

    # Project Summary Table
    meta_tbl = doc.add_table(rows=5, cols=2)
    meta_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_tbl.autofit = False
    meta_items = [
        ("Target Region", "North Eastern Region (NER) of India (Assam, Meghalaya, Sikkim, Arunachal Pradesh, etc.)"),
        ("Core Problem", "Monsoon landslides, flash floods, and road collapses cutting off mountain lifelines."),
        ("Key Tech Stack", "FastAPI (Backend) + PostGIS (Spatial Database) + Valhalla (Offline Routing) + MapLibre (GIS UI)"),
        ("Key Innovation", "Disaster-aware routing + Explainable road blockages + 100% real road topology (Zero straight lines)."),
        ("Target Users", "District Disaster Officers (EOC), Highway Engineers (PWD/NHAI), First Responders, Citizens.")
    ]
    for idx, (lbl, val) in enumerate(meta_items):
        row = meta_tbl.rows[idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.0)
        c1.width = Inches(4.7)
        set_cell_background(c0, "F1F5F9")
        set_cell_background(c1, "F8FAFC")
        set_cell_margins(c0, 60, 60, 90, 90)
        set_cell_margins(c1, 60, 60, 90, 90)
        set_cell_border(c0, top={"val":"single","sz":"4","color":"CBD5E1"}, bottom={"val":"single","sz":"4","color":"CBD5E1"}, left={"val":"single","sz":"4","color":"CBD5E1"}, right={"val":"single","sz":"4","color":"CBD5E1"})
        set_cell_border(c1, top={"val":"single","sz":"4","color":"CBD5E1"}, bottom={"val":"single","sz":"4","color":"CBD5E1"}, left={"val":"single","sz":"4","color":"CBD5E1"}, right={"val":"single","sz":"4","color":"CBD5E1"})
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(lbl)
        r0.font.bold = True
        r0.font.size = Pt(9)
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(val)
        r1.font.size = Pt(9.5)

    doc.add_page_break()

    # ==============================================================================
    # 2. EXECUTIVE SUMMARY & PROBLEM STATEMENT
    # ==============================================================================
    add_h1("1. Executive Summary & Problem Statement")
    
    add_h2("1.1 What is Antigravity?")
    add_p(
        "Antigravity is an AI-powered GIS disaster management and emergency routing platform. It monitors landslide-prone mountain areas, detects blocked highways, explains why roads are closed, and automatically calculates safe alternative routes for ambulances, supply trucks, and citizens."
    )
    add_p(
        "It combines 8 key ingredients into one live map: Rainfall sensors + Soil moisture + Mountain slope/terrain + Historical landslide records + Authoritative road maps + Field officer reports + Disaster incidents + High-speed offline routing."
    )

    add_callout(doc, "Decision-Support Role",
                "Antigravity is a Decision-Support System for government disaster authorities, PWD engineers, and rescue teams. It gives commanders clear spatial intelligence to make fast, life-saving decisions.",
                box_type="PURPOSE", color_hex="0F294A", bg_hex="F0F4F8")

    add_h2("1.2 The Real-World Problem in North East India")
    add_p(
        "In the mountains of North East India (Assam, Meghalaya, Sikkim, Arunachal Pradesh), monsoon rains trigger massive landslides, flash floods, and road collapses every single year. Critical highways (like NH-6 and NH-10) get completely buried under mud and rock."
    )
    add_p("During disasters, authorities and citizens face five major headaches:")
    add_bullet("Roads get blocked suddenly with no advance warning.", bold_prefix="1. Sudden Washouts: ")
    add_bullet("Information is scattered across police, weather, highway, and district offices.", bold_prefix="2. Fragmented Information: ")
    add_bullet("Regular apps show a red line for traffic, but nobody knows if the road is just slow or physically destroyed.", bold_prefix="3. Opaque Road Closures: ")
    add_bullet("GPS apps try to send ambulances through dangerous mudslides or non-existent mountain tracks.", bold_prefix="4. Dangerous Navigation: ")
    add_bullet("Villages get isolated for days because rescue teams cannot find a safe detour.", bold_prefix="5. Community Isolation: ")

    # Table 1: Problem and Solution
    add_h3("Table 1: Standard GPS vs. Antigravity — The Core Difference")
    t1_headers = ["Feature", "Conventional Navigation (e.g. Google Maps)", "Antigravity Disaster Platform"]
    t1_widths = [Inches(1.8), Inches(2.4), Inches(2.5)]
    t1_data = [
        ("Core Question Answered", "“How do I reach B in the fewest minutes?”", "“Can I SAFELY reach B without driving into a landslide or flood?”"),
        ("Hazard Awareness", "Blind to rain saturation, soil moisture, and landslide risks.", "Monitors live rainfall, soil saturation, slope angles, and active debris flows."),
        ("Road Blockage Details", "Shows a generic red line. No reason given.", "Tells you: 'LANDSLIDE: 600m³ debris across road. Verified by PWD. Reopening in 18 hrs.'"),
        ("Detour Safety", "May route you onto dangerous logging trails or cliffs.", "Validates all detours against real roads and guarantees >500m safety clearance from hazards."),
        ("Failure Behavior", "Draws straight lines or forces path through danger.", "Returns 'NO SAFE ROUTE' if all roads are cut off, preventing fatal dispatch.")
    ]
    t1_tbl = doc.add_table(rows=len(t1_data) + 1, cols=3)
    format_table(t1_tbl, t1_widths, t1_headers, t1_data, header_bg="0F294A")

    doc.add_page_break()

    # ==============================================================================
    # 3. PROJECT OBJECTIVES & REFERENCES
    # ==============================================================================
    add_h1("2. Objectives & Reference Systems")
    
    add_h2("2.1 Clear Project Objectives")
    add_bullet("Track rainfall, soil moisture, and slope stability across mountain roads.", bold_prefix="1. Real-Time Hazard Monitoring: ")
    add_bullet("Display all roads, landslides, risk zones, and shelters on one interactive GIS map.", bold_prefix="2. Unified GIS Command Map: ")
    add_bullet("Categorize terrain into Low, Moderate, High, and Critical danger zones.", bold_prefix="3. Spatial Risk Intelligence: ")
    add_bullet("Instantly flag roads as OPEN, CAUTION, HIGH RISK, RESTRICTED, or BLOCKED.", bold_prefix="4. Authoritative Road Status: ")
    add_bullet("Provide clear, structured explanations whenever a road is closed.", bold_prefix="5. Explainable Blockages: ")
    add_bullet("Dynamically route vehicles around blocked areas using the actual road network.", bold_prefix="6. Disaster-Aware Safe Routing: ")
    add_bullet("Ensure no fake straight lines or phantom mountain tracks are ever drawn.", bold_prefix="7. Topological Route Validation: ")
    add_bullet("Provide a clean control room dashboard for district disaster officers and engineers.", bold_prefix="8. Centralized Admin Console: ")
    add_bullet("Let field officers and citizens report hazards with GPS coordinates and photos.", bold_prefix="9. Field & Citizen Reporting: ")
    add_bullet("Keep routing operational even when the internet goes down during a storm.", bold_prefix="10. Offline Routing Capability: ")

    add_h2("2.2 Reference Systems & Conceptual Inspiration")
    add_p("Antigravity is inspired by the problem-solving concepts of India's leading disaster platforms:")
    add_bullet("Geological Survey of India's portal for national landslide inventories and citizen hazard reporting. (https://play.google.com/store/apps/details?id=in.gov.gsi.bhooskhalan&hl=en_IN)", bold_prefix="• Bhooskhalan (GSI): ")
    add_bullet("National Disaster Management Authority's portal for geo-targeted early warnings. (https://sachet.ndma.gov.in/)", bold_prefix="• SACHET (NDMA): ")
    add_bullet("C-DOT's mobile platform delivering disaster alerts via cell broadcast. (https://play.google.com/store/apps/details?id=com.cdotindia.capsachet)", bold_prefix="• SACHET Mobile (C-DOT): ")

    add_callout(doc, "Official Disclaimer",
                "Antigravity is an independent engineering project inspired by the public concepts of Bhooskhalan and SACHET. It is not an official government system or a direct copy of these platforms.",
                box_type="DISCLAIMER", color_hex="DC2626", bg_hex="FEF2F2")

    # ==============================================================================
    # 4. WHAT MAKES ANTIGRAVITY UNIQUE?
    # ==============================================================================
    add_h1("3. What Makes Antigravity Unique?")
    add_p("Antigravity is built around 5 powerful, distinctive innovations:")

    add_h2("3.1 Disaster-Aware Routing")
    add_p("Normal navigation does: Origin $\\rightarrow$ Distance $\\rightarrow$ Shortest Route.")
    add_p("Antigravity does: Origin $\\rightarrow$ Road Network $\\rightarrow$ Disaster Constraints $\\rightarrow$ Safety Risk Evaluation $\\rightarrow$ Safe Validated Route.", bold_prefix="Antigravity Logic: ")

    add_h2("3.2 Explainable Road Blockages")
    add_p("When you click a blocked road in Antigravity, you don't just see a red line. You get a complete explanation:")

    # Explainable card box
    add_callout(doc, "CLICK ON BLOCKED ROAD: NH-6 (Sonapur Reach)",
                "⛔ STATUS: COMPLETELY BLOCKED\n"
                "• Reason: LANDSLIDE (Major Debris Flow)\n"
                "• What Happened: Heavy rain triggered ~600 m³ of mud and rock across both lanes.\n"
                "• Verified By: Meghalaya PWD Executive Engineer (Field Verified)\n"
                "• Expected Reopening: 18 Hours (Bulldozers deployed)\n"
                "• Cut-off Villages: Sonapur, Umkiang, Ratacherra\n"
                "• Safe Alternative: Validated detour via Jowai-Khanduli State Highway.",
                box_type="EXPLAINABLE ROAD POPUP", color_hex="B91C1C", bg_hex="FEF2F2")

    add_h2("3.3 100% Real Road Routing (Zero Fake Straight Lines)")
    add_p(
        "In the mountains, drawing a straight line between two points can send someone off a 1000-foot cliff. Antigravity strictly navigates over real, validated roads (Valhalla + PostGIS). If all roads are cut off, it displays 'NO SAFE ROUTE'—it will NEVER invent a fake path."
    )

    add_h2("3.4 Multi-Factor GIS Intelligence")
    add_p("Antigravity combines 7 layers: Rain + Soil Saturation + Slope Gradient + Past Landslides + Road Network + Active Incidents = Complete Safety Picture.")

    add_h2("3.5 Dynamic Automatic Re-Routing")
    add_p("The moment an officer marks a road as BLOCKED, any active route using that road is instantly cancelled and a safe alternative bypass is calculated.")

    doc.add_page_break()

    # ==============================================================================
    # 5. MAJOR FEATURES (TABLE 2)
    # ==============================================================================
    add_h1("4. Major Features of Antigravity")
    
    # Table 2: Major Features
    add_h3("Table 2: Major Features — What They Do & Why They Matter")
    t2_headers = ["Feature", "What It Does", "Why It Is Useful"]
    t2_widths = [Inches(1.8), Inches(2.4), Inches(2.5)]
    t2_data = [
        ("Interactive GIS Command Map", "Displays roads, landslides, rain gauges, risk zones, and shelters in real-time.", "Gives commanders a single clear screen to see the entire disaster situation."),
        ("Landslide Tracker", "Shows verified, reported, and past landslides with exact coordinates and details.", "Helps rescue teams know exactly where slope failures are happening."),
        ("Risk Heatmap", "Colors mountain regions by danger level (Green = Low, Red = Critical).", "Helps authorities evacuate people BEFORE a major landslide occurs."),
        ("Rainfall & Soil Telemetry", "Reads live 1h, 24h rainfall and soil moisture from weather stations.", "Detects when soil is so waterlogged that it is about to slide down."),
        ("Road Status Monitoring", "Colors roads: Green (Open), Orange (Risk), Red (Blocked).", "Instantly shows which travel corridors are safe and which are impassable."),
        ("Explainable Blockages", "Shows the exact cause, debris volume, verifying officer, and reopening time.", "Eliminates confusion and keeps both the public and rescue teams informed."),
        ("Disaster-Aware Routing", "Calculates routes that automatically steer around blocked or high-risk roads.", "Guarantees ambulances and supply trucks are never sent into a trap."),
        ("Topological Validation", "Checks every calculated route to ensure it follows real, paved roads.", "Prevents dangerous navigation across rivers, cliffs, or non-existent tracks."),
        ("Citizen / Field Reports", "Lets field officers and citizens report hazards with photos and GPS location.", "Gives control rooms fast on-the-ground eyes before official surveys arrive."),
        ("Admin Control Center", "Allows disaster officers to verify reports, close roads, and manage alerts.", "Ensures only verified, authoritative data controls emergency routing."),
        ("Offline Routing Engine", "Calculates routes locally on the server without needing active internet.", "Keeps emergency navigation working even if cell towers are destroyed.")
    ]
    t2_tbl = doc.add_table(rows=len(t2_data) + 1, cols=3)
    format_table(t2_tbl, t2_widths, t2_headers, t2_data, header_bg="0F294A")

    # ==============================================================================
    # 6. ROAD STATUS CLASSIFICATION (TABLE 3)
    # ==============================================================================
    add_h1("5. Road Status Classification System")
    add_p("Every road in Antigravity has a clear, standardized operational status:")

    # Table 6: Road Status
    add_h3("Table 3: Road Status Meanings and System Routing Behavior")
    t6_headers = ["Status", "Map Color", "Ground Condition", "How Antigravity Routes Vehicles"]
    t6_widths = [Inches(1.4), Inches(1.2), Inches(2.2), Inches(1.9)]
    t6_data = [
        ("OPEN", "Green", "Road is clear, dry, and safe for normal traffic.", "Routes normally at standard speed limits."),
        ("CAUTION", "Amber", "Minor rain pooling, small pebbles on shoulder. Drivable with care.", "Routes normally, but adds a warning icon."),
        ("HIGH RISK", "Orange", "Severe rain saturation or active rockfall nearby.", "Avoids if possible; routes only if no safer detour exists."),
        ("RESTRICTED", "Purple", "Single-lane convoy or emergency vehicles only.", "Restricted to authorized emergency vehicles only."),
        ("BLOCKED", "Red", "Landslide debris, flood water, or rockfall blocking the road.", "COMPLETELY EXCLUDED. Graph router will NOT use this road."),
        ("COMPLETELY BLOCKED", "Dark Maroon", "Bridge collapsed or road washed into the valley.", "COMPLETELY EXCLUDED. Immediate alert sent to control room.")
    ]
    t6_tbl = doc.add_table(rows=len(t6_data) + 1, cols=4)
    format_table(t6_tbl, t6_widths, t6_headers, t6_data, header_bg="0F294A")

    doc.add_page_break()

    # ==============================================================================
    # 7. ROAD BLOCKAGE SYSTEM & 20 STANDARDIZED CAUSES
    # ==============================================================================
    add_h1("6. Road Blockage System & Forensics")
    add_p(
        "Antigravity never guesses why a road is closed. Every blocked road is tied to a structured database record containing 14 key fields:"
    )
    add_bullet("road_segment_id, road_name, status (e.g. BLOCKED), cause (e.g. LANDSLIDE), authority (e.g. PWD), reported_time, verified_time, expected_reopening, estimated_debris_m3, affected_villages, current_condition, verification_status, source, geometry.", bold_prefix="Structured Fields: ")

    add_h2("6.1 Standardized 20 Blockage Causes")
    add_p(
        "LANDSLIDE | FLASH_FLOOD | ROAD_COLLAPSE | BRIDGE_FAILURE | BRIDGE_DAMAGE | FLOODING | ROCKFALL | DEBRIS | MUDSLIDE | ROAD_WASHOUT | HEAVY_RAINFALL | TREE_FALL | ACCIDENT | CONSTRUCTION | ROAD_DAMAGE | LAND_SUBSIDENCE | SECURITY_RESTRICTION | GOVERNMENT_CLOSURE | WEATHER_HAZARD | UNKNOWN",
        bold_prefix="Recognized Causes: ", italic=True
    )

    add_callout(doc, "The Strict UNKNOWN Rule",
                "If a road is reported closed but the exact cause has not yet been confirmed by field engineers, the system displays 'UNKNOWN'. Antigravity NEVER fabricates or guesses a disaster cause.",
                box_type="DATA RULE", color_hex="D97706", bg_hex="FFFBEB")

    # ==============================================================================
    # 8. ROAD DETECTION & VALIDATION (PREVENTING FAKE ROADS)
    # ==============================================================================
    add_h1("7. Road Ingestion & Spatial Validation Rules")
    add_p(
        "Where do our roads come from? Antigravity uses verified vector road data from OpenStreetMap (OSM) and Government GIS portals (Bhuvan/NHAI)."
    )
    add_p(
        "If AI computer vision is used to find candidate roads from satellite images, those candidate roads are quarantined until they pass 5 strict validation tests:"
    )
    add_bullet("Rejects candidate roads that cut through building polygons.", bold_prefix="1. No Building Collisions: ")
    add_bullet("Rejects roads crossing rivers or gorges unless a verified bridge exists.", bold_prefix="2. No Unbridged Water Crossings: ")
    add_bullet("Rejects candidate paths steeper than 28° (which are un-drivable cliffs).", bold_prefix="3. Slope Gradient Check: ")
    add_bullet("Requires candidate roads to snap securely to the existing road network within 15 meters.", bold_prefix="4. Network Connectivity: ")
    add_bullet("Guarantees the road is a valid, clean OGC LineString with zero self-intersections.", bold_prefix="5. Clean Geometry: ")

    doc.add_page_break()

    # ==============================================================================
    # 9. SYSTEM ARCHITECTURE — 5 CLEAR LAYERS
    # ==============================================================================
    add_h1("8. Core System Architecture")
    add_p("Antigravity is structured into 5 clean, modular layers:")

    # 5-Layer Clean Diagram
    add_diagram_box(doc, "5-Layer End-to-End System Architecture",
"""┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER 1: DATA SOURCES (Sensors, Weather, Maps & Reports)                │
│ • IMD Rain Gauges  • NASA Satellite Rain  • ALOS 30m DEM  • Field Reports│
└────────────────────────────────────┬────────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER 2: SPATIAL DATABASE (PostgreSQL 16 + PostGIS)                     │
│ • road_segments (OSM Roads)        • road_incidents (Active Closures)   │
│ • rain_gauges (Live Telemetry)     • confirmed_landslides (Ground Truth)│
└────────────────────────────────────┬────────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER 3: INTELLIGENCE & OFFLINE ROUTING ENGINES                         │
│ • AI/ML Risk Scoring Engine        • Valhalla C++ Offline Router        │
│   (Calculates danger 0.0 to 1.0)     (Finds topological detours)        │
└────────────────────────────────────┬────────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER 4: FASTAPI BACKEND (Orchestrator & Business Logic)                │
│ • Injects dynamic avoid-barriers   • Validates route safety in PostGIS  │
│ • Serves REST & GeoJSON APIs       • Manages incident verification      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER 5: ADMIN DASHBOARD (MapLibre GIS Frontend)                        │
│ • Interactive Command Center Map   • Live Road Disruption Inspector     │
│ • Emergency Safe Route Simulator   • District Disaster Analytics & KPIs │
└─────────────────────────────────────────────────────────────────────────┘""")

    add_callout(doc, "The 5-Sentence Architecture Summary",
                "1. PostGIS knows what is happening in the real world (landslides, closures).\n"
                "2. Valhalla knows how roads connect topologically.\n"
                "3. FastAPI connects the disaster data with the router.\n"
                "4. AI provides predictive risk intelligence.\n"
                "5. MapLibre shows the complete picture clearly to the commander.",
                box_type="ARCHITECTURAL CREED", color_hex="0F294A", bg_hex="F0F4F8")

    doc.add_page_break()

    # ==============================================================================
    # 10. TECHNOLOGY STACK & EXPLANATIONS (TABLE 4)
    # ==============================================================================
    add_h1("9. Technology Stack & Component Explanations")
    
    # Table 3: Technology Stack
    add_h3("Table 4: Technology Stack Summary")
    t3_headers = ["Technology", "Role in Antigravity", "Why We Use It"]
    t3_widths = [Inches(1.5), Inches(2.2), Inches(3.0)]
    t3_data = [
        ("Python 3.11", "Backend programming, GIS processing, AI inference.", "Rich ecosystem for geospatial data (Shapely, GDAL) and clean API development."),
        ("FastAPI", "High-speed asynchronous REST API gateway.", "Ultra-fast response times, native async/await, and automatic OpenAPI documentation."),
        ("PostgreSQL 16", "Main relational enterprise database.", "ACID-compliant, rock-solid stability for mission-critical disaster records."),
        ("PostGIS 3.4", "Spatial database extension.", "Industry standard for spatial queries (ST_Intersects, ST_DWithin, GIST indexing)."),
        ("Valhalla", "C++ offline routing engine.", "High-speed graph routing that natively supports dynamic polygon avoid-barriers."),
        ("Geofabrik OSM PBF", "Authoritative road network dataset.", "Provides complete, free, high-density road geometry for North East India."),
        ("MapLibre GL JS", "Interactive web map renderer.", "GPU-accelerated vector map rendering with zero proprietary license fees."),
        ("Docker & Compose", "Containerization and orchestration.", "Allows entire stack (DB, Router, Backend, Frontend) to launch with one command."),
        ("GeoJSON", "Spatial data exchange format.", "Standardized, lightweight format for transferring roads, incidents, and routes.")
    ]
    t3_tbl = doc.add_table(rows=len(t3_data) + 1, cols=3)
    format_table(t3_tbl, t3_widths, t3_headers, t3_data, header_bg="0F294A")

    add_h2("9.1 Clear 4-Part Explanation for Every Core Technology")
    
    tech_details = [
        ("PostGIS", "Spatial database plugin for PostgreSQL.", "It can do spatial math (like checking if a road touches a landslide) in 1 millisecond.", "Stores all road lines, landslide points, rain gauges, and risk polygons.", "Fast spatial query results and GeoJSON hazard features."),
        ("Valhalla", "High-performance open-source routing engine written in C++.", "It can calculate routes offline and avoid custom disaster polygons instantly.", "Ingests the North East road network and computes emergency routes.", "Turn-by-turn navigation geometries, distances, and detour paths."),
        ("FastAPI", "Modern, super-fast web framework for Python.", "Handles hundreds of emergency requests per second with automatic data validation.", "Acts as the conductor: asks PostGIS for blocked roads, tells Valhalla to avoid them, and sends the safe route to the map.", "Clean REST API endpoints for the dashboard."),
        ("MapLibre GL", "High-speed interactive map rendering library.", "Smoothly renders thousands of road lines, heatmaps, and markers at 60 FPS.", "Renders the live command dashboard map in the web browser.", "Interactive visual map with clickable roads and side panels."),
        ("Docker", "Tool that packages software into isolated containers.", "Ensures the software runs perfectly on any computer or server without install headaches.", "Runs PostGIS, Valhalla, FastAPI, and Next.js in synchronized containers.", "One-click reproducible system deployment (`docker compose up -d`).")
    ]

    for name, what, why, how, out in tech_details:
        add_h3(f"• {name}")
        add_p(what, bold_prefix="What is it? ")
        add_p(why, bold_prefix="Why do we use it? ")
        add_p(how, bold_prefix="How is it used in Antigravity? ")
        add_p(out, bold_prefix="What does it produce? ")

    doc.add_page_break()

    # ==============================================================================
    # 11. DATABASE ARCHITECTURE (TABLE 5) & AI ARCHITECTURE (TABLE 6)
    # ==============================================================================
    add_h1("10. Database & AI/ML Architecture")
    
    # Table 4: Database Components
    add_h3("Table 5: Major Database Tables in PostGIS")
    t4_headers = ["Table Name", "Data Stored", "Purpose in System"]
    t4_widths = [Inches(1.8), Inches(2.3), Inches(2.6)]
    t4_data = [
        ("road_segments", "OSM road network geometry (LineStrings), highway class, surface.", "Base physical road map for navigation."),
        ("road_incidents", "Active road closures, cause codes, verifying officer, reopening ETA.", "Dynamic disruption layer. ONLY an active record here blocks a road."),
        ("confirmed_landslides", "Verified landslide events from GSI/PWD with coordinates.", "Official ground truth for active hazard locations."),
        ("landslide_predictions", "ML risk ratings (0.0 to 1.0) and polygon risk zones.", "Generates early warning heatmaps. NEVER automatically closes a road."),
        ("historical_landslides", "Historical landslide records from ISRO/NRSC Atlas & GSI.", "Used strictly for training and historical analysis. NEVER closes roads."),
        ("rain_gauges", "Live 1h, 24h rainfall and 30-day SPI from IMD weather stations.", "Supplies live water saturation data to the risk model."),
        ("villages", "Habitations, population count, remaining food/medical hours.", "Identifies cut-off villages and prioritizes relief delivery."),
        ("critical_infrastructure", "Hospitals, trauma centers, relief shelters, helipads.", "Destination targets for emergency medical evacuation routes.")
    ]
    t4_tbl = doc.add_table(rows=len(t4_data) + 1, cols=3)
    format_table(t4_tbl, t4_widths, t4_headers, t4_data, header_bg="0F294A")

    add_h2("10.1 AI / Machine Learning Capabilities Matrix")
    add_p(
        "Antigravity is completely honest about what AI does today versus what is planned for the future:"
    )

    # Table 5: AI Components
    add_h3("Table 6: AI / ML Capabilities Status Matrix")
    t5_headers = ["AI / ML Component", "Status", "What It Does"]
    t5_widths = [Inches(2.0), Inches(1.5), Inches(3.2)]
    t5_data = [
        ("Multi-Factor Risk Scoring", "Implemented", "Combines slope angle, live rainfall, and past history into 4 clear risk levels (Low, Moderate, High, Critical)."),
        ("Precipitation Threshold Alerts", "Implemented", "Automatically triggers alerts when rainfall crosses dangerous saturation limits (e.g. >120mm/24h)."),
        ("Spatial Hazard Buffering", "Implemented", "PostGIS calculates safe distance buffers around active landslides to protect nearby roads."),
        ("XGBoost Susceptibility Model", "Partially Implemented", "Decision-tree model trained on terrain features (slope, aspect, elevation) to estimate landslide probability."),
        ("Satellite Debris Detection (U-Net)", "Planned / Roadmap", "Computer vision model to automatically spot new landslide scars from satellite pictures."),
        ("Automated Drone Road Damage Vision", "Planned / Roadmap", "AI model to detect asphalt washouts and collapsed bridges from drone video feeds.")
    ]
    t5_tbl = doc.add_table(rows=len(t5_data) + 1, cols=3)
    format_table(t5_tbl, t5_widths, t5_headers, t5_data, header_bg="0F294A")

    doc.add_page_break()

    # ==============================================================================
    # 12. DATA FLOW & STEP-BY-STEP LANDSLIDE SCENARIO (TABLE 7)
    # ==============================================================================
    add_h1("11. Data Flow & Practical Disaster Walkthrough")
    
    # Table 7: Disaster Workflow
    add_h3("Table 7: How Data Moves from Hazard to Dashboard")
    t7_headers = ["Stage", "Input", "Processing", "Output Product"]
    t7_widths = [Inches(1.5), Inches(1.6), Inches(2.1), Inches(1.5)]
    t7_data = [
        ("1. Rain Detection", "IMD weather station telemetry.", "System checks if rain > danger threshold.", "Hydrological saturation alert."),
        ("2. Hazard Report", "Field officer photo + GPS coordinates.", "Submitted through mobile app into database.", "Unverified incident in PostGIS."),
        ("3. Verification", "Officer photo + coordinates.", "Disaster officer reviews & clicks 'Verify'.", "Status upgraded to 'VERIFIED'."),
        ("4. Road Impact", "Verified coordinates + road network.", "PostGIS finds exact highway segment.", "Segment marked 'BLOCKED'."),
        ("5. Route Request", "Origin & Destination from ambulance.", "FastAPI adds blocked road to avoid-list.", "Valhalla avoid-barrier constraint."),
        ("6. Safe Navigation", "Road graph + avoid barriers.", "Valhalla calculates detour on real roads.", "Safe bypass geometry."),
        ("7. Route Check", "Computed route + PostGIS.", "Checks for any conflict with hazards.", "100% validated safe route."),
        ("8. Dashboard View", "Safe route + incident details.", "MapLibre renders route in green, block in red.", "Clear guidance for responders.")
    ]
    t7_tbl = doc.add_table(rows=len(t7_data) + 1, cols=4)
    format_table(t7_tbl, t7_widths, t7_headers, t7_data, header_bg="0F294A")

    add_h2("11.1 Practical Story: Monsoon Landslide on NH-6")
    add_p("Here is exactly how Antigravity handles a real emergency in 6 simple steps:")
    add_bullet("140 mm of heavy monsoon rain falls in 24 hours near Sonapur, Meghalaya.", bold_prefix="Step 1 (Rain Alert): ")
    add_bullet("A 600 m³ landslide crashes down, burying NH-6. A PWD officer takes a photo and submits a GPS report.", bold_prefix="Step 2 (Landslide Occurs): ")
    add_bullet("The District Disaster Officer reviews the photo on the dashboard and approves it. NH-6 turns bold RED.", bold_prefix="Step 3 (Road Blocked): ")
    add_bullet("An ambulance needs to travel from Jowai to Silchar. Antigravity cancels the direct route through the mudslide.", bold_prefix="Step 4 (Route Invalidation): ")
    add_bullet("Valhalla automatically finds a safe green bypass through the validated Jowai-Khanduli state highway.", bold_prefix="Step 5 (Safe Bypass): ")
    add_bullet("18 hours later, bulldozers clear the mud. The officer marks the road 'OPEN'. NH-6 turns GREEN again.", bold_prefix="Step 6 (Reopening): ")

    doc.add_page_break()

    # ==============================================================================
    # 13. USER ROLES (TABLE 8) & ADMIN DASHBOARD
    # ==============================================================================
    add_h1("12. Admin Dashboard & Role-Based Access Control")
    add_p(
        "The Antigravity Admin Dashboard gives disaster commanders complete control over their district:"
    )
    add_bullet("Displays Active Incidents, Blocked Highway Miles, High-Risk Roads, and Vulnerable Villages.", bold_prefix="• KPI Telemetry Cards: ")
    add_bullet("Layer toggling for Slope, Rainfall Gauges, Risk Heatmaps, Roads, and Relief Shelters.", bold_prefix="• Interactive GIS Map: ")
    add_bullet("Triage citizen reports, inspect photos, and verify on-ground closures.", bold_prefix="• Incident Verification: ")
    add_bullet("Select origin/destination, test emergency bypasses, and check distance deltas.", bold_prefix="• Route Simulator: ")

    # Table 8: User Roles
    add_h3("Table 8: User Roles and System Permissions")
    t8_headers = ["User Role", "Who It Is", "What They Can Do in Antigravity"]
    t8_widths = [Inches(1.6), Inches(2.0), Inches(3.1)]
    t8_data = [
        ("System Administrator", "IT & GIS Engineers", "Full access: manage users, configure map layers, database backups."),
        ("Disaster Commander", "District Magistrates, SDMA Heads", "Authoritative control: verify incidents, close/reopen roads, dispatch emergency routes."),
        ("Highway Engineer", "State PWD & NHAI Engineers", "Operational control: update debris clearing progress, input reopening ETAs."),
        ("Field Officer", "Police, SDRF, First Responders", "Field access: submit GPS hazard reports with photos, view live detour maps."),
        ("Public / Citizen", "General Public & Commercial Drivers", "Read-only access: view verified blocked roads and get safe civilian driving routes.")
    ]
    t8_tbl = doc.add_table(rows=len(t8_data) + 1, cols=3)
    format_table(t8_tbl, t8_widths, t8_headers, t8_data, header_bg="0F294A")

    # ==============================================================================
    # 14. CURRENT STATUS VS FUTURE ROADMAP (TABLE 9) & LIMITATIONS
    # ==============================================================================
    add_h1("13. Current Capabilities, Limitations & Future Roadmap")
    
    # Table 9: Current vs Future
    add_h3("Table 9: What Works Today vs. What Is Coming Tomorrow")
    t9_headers = ["Feature Area", "Working in Antigravity Today", "Planned Future Enhancement"]
    t9_widths = [Inches(1.8), Inches(2.4), Inches(2.5)]
    t9_data = [
        ("Hazard Detection", "Field reports, weather thresholds, officer verification.", "Automated radar satellite detection (Sentinel-1 SAR)."),
        ("Routing Engine", "Valhalla offline road routing with avoid-polygons.", "Multi-truck convoy routing with bridge weight limits."),
        ("Disaster Types", "Landslides, debris flows, rockfalls, localized floods.", "Earthquakes, forest fires, and glacial lake outburst floods (GLOF)."),
        ("User Interface", "Web GIS command dashboard (Desktop/Tablet).", "Offline mobile app with peer-to-peer mesh radio networking."),
        ("Public Alerts", "Web dashboard warnings and REST API feeds.", "Integration with NDMA SACHET cell-broadcast SMS alerts.")
    ]
    t9_tbl = doc.add_table(rows=len(t9_data) + 1, cols=3)
    format_table(t9_tbl, t9_widths, t9_headers, t9_data, header_bg="0F294A")

    add_h2("13.1 Honest Project Limitations")
    add_bullet("Weather accuracy depends on the number of installed IMD weather stations.", bold_prefix="• Weather Sensor Density: ")
    add_bullet("Heavy monsoon clouds block regular optical satellites; radar is needed for all-weather satellite views.", bold_prefix="• Cloud Cover: ")
    add_bullet("AI models provide statistical probability, not physical certainty. Human field checks remain essential.", bold_prefix="• Field Verification: ")

    doc.add_page_break()

    # ==============================================================================
    # 15. LIVE DEMO SCRIPT & VIVA QUESTIONS
    # ==============================================================================
    add_h1("14. 5-Minute Live Presentation Script & Viva Q&A")
    
    add_h2("14.1 Step-by-Step Live Demo Flow (For Evaluators)")
    add_bullet("Open the dashboard and show the KPI cards (Active Landslides, Blocked Roads).", bold_prefix="Step 1: ")
    add_bullet("Show the North East map and toggle on the Slope and Rain Gauge layers.", bold_prefix="Step 2: ")
    add_bullet("Click an open green road to show its details (surface, normal status).", bold_prefix="Step 3: ")
    add_bullet("Request a route from Shillong to Silchar (shows the normal fast route along NH-6).", bold_prefix="Step 4: ")
    add_bullet("Simulate a landslide: open incident panel, approve a report on NH-6 Km 48, and set status to BLOCKED.", bold_prefix="Step 5: ")
    add_bullet("Show NH-6 instantly turning bold RED on the map.", bold_prefix="Step 6: ")
    add_bullet("Click the red road to display the explainable popup (Landslide, 600m³ debris, PWD verified).", bold_prefix="Step 7: ")
    add_bullet("Request the route again. Show Antigravity automatically routing the green path via the safe Jowai-Khanduli detour.", bold_prefix="Step 8: ")
    add_bullet("Show that the detour strictly follows real roads with ZERO straight lines.", bold_prefix="Step 9: ")
    add_bullet("Block all roads around a valley and request navigation; show the system returning 'NO SAFE ROUTE'.", bold_prefix="Step 10: ")

    add_h2("14.2 Top 8 Viva & Review Questions (Crystal-Clear Answers)")
    
    viva_qas = [
        ("Q1: Why use PostGIS instead of standard MySQL or MongoDB?", 
         "PostGIS is built specifically for maps. It can check if a road intersects a landslide polygon in 1 millisecond using spatial indexes. Standard databases cannot do fast geometric math."),
        
        ("Q2: Why not just use Google Maps?", 
         "Google Maps is a closed black box optimized for speed, not disaster safety. It does not let us inject custom disaster polygons to block dangerous mountain passes, and it cannot run offline in a disconnected control room."),
        
        ("Q3: What does Valhalla do?", 
         "Valhalla is our offline routing engine. It holds the road graph in memory and calculates real detours while respecting the blocked areas sent by PostGIS."),
        
        ("Q4: How do you know a road is blocked?", 
         "Through verified reports from field officers with GPS photos, highway department feeds, and confirmed landslide events."),
        
        ("Q5: What happens if all roads are cut off?", 
         "Antigravity returns 'NO SAFE ROUTE'. It will NEVER draw a fake straight line through a mountain cliff."),
        
        ("Q6: How do you prevent fake roads from crossing buildings or rivers?", 
         "Every candidate road must pass 5 PostGIS tests: checking building collisions, slope gradients (<28°), unbridged water, and connectivity to real roads."),
        
        ("Q7: Can this work without internet?", 
         "Yes! Valhalla runs on local pre-compiled road tiles on our server. Emergency navigation continues even if the wider internet is down."),
        
        ("Q8: Can this be used for floods or earthquakes?", 
         "Yes! Any hazard polygon (flood water, earthquake fissure) can be fed into Antigravity to block affected roads identically.")
    ]

    for q, a in viva_qas:
        add_h3(q)
        add_p(a)

    doc.add_page_break()

    # ==============================================================================
    # 16. CONCLUSION
    # ==============================================================================
    add_h1("15. Conclusion")
    add_p(
        "ANTIGRAVITY transforms mountain disaster management from confusion into clear, life-saving intelligence. By connecting live hazards directly to real road networks, it ensures emergency responders and citizens never drive into danger."
    )
    add_p(
        "It connects: Hazard $\\rightarrow$ Location $\\rightarrow$ Road Impact $\\rightarrow$ Clear Explanation $\\rightarrow$ Safe Validated Bypass.", bold_prefix="The Core Antigravity Chain: "
    )

    add_callout(doc, "Final Takeaway",
                "“Antigravity does not just show you where a disaster happened on a map.\n"
                "It tells you which roads are broken, explains why, and guides you safely around them.”",
                box_type="FINAL SUMMARY", color_hex="0F294A", bg_hex="F0F4F8")

    # Output file
    output_path = r"d:\GIS Dashboard\ANTIGRAVITY_Technical_Project_Presentation.docx"
    doc.save(output_path)
    print(f"Crisp, crystal-clear document saved successfully to: {output_path}")

if __name__ == "__main__":
    build_crisp_document()
