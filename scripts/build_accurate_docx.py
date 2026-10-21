import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, color_hex):
    shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading)

def set_cell_margins(cell, top=120, bottom=120, left=180, right=180):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def create_callout_box(doc, title, text, bg_color="F0F4F8", border_color="0079C1"):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>'
        f'<w:top w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'<w:bottom w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(4)
    run_title = p.add_run(f"[{title}] ")
    run_title.bold = True
    run_title.font.name = "Arial"
    run_title.font.size = Pt(10)
    run_title.font.color.rgb = RGBColor(0, 80, 140)
    
    run_text = p.add_run(text)
    run_text.font.name = "Arial"
    run_text.font.size = Pt(9.5)
    run_text.font.color.rgb = RGBColor(40, 50, 60)
    
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(0)
    p_after.paragraph_format.space_after = Pt(4)

def format_table(table, header_bg="0079C1", alt_bg="F8FAFC", border_color="CBD5E1"):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    for i, row in enumerate(table.rows):
        for j, cell in enumerate(row.cells):
            set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
            tcPr = cell._tc.get_or_add_tcPr()
            borders = parse_xml(
                f'<w:tcBorders {nsdecls("w")}>'
                f'<w:left w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>'
                f'<w:top w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>'
                f'<w:right w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>'
                f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>'
                f'</w:tcBorders>'
            )
            tcPr.append(borders)
            
            if i == 0:
                set_cell_background(cell, header_bg)
                for p in cell.paragraphs:
                    p.paragraph_format.space_before = Pt(2)
                    p.paragraph_format.space_after = Pt(2)
                    for run in p.runs:
                        run.bold = True
                        run.font.name = "Arial"
                        run.font.size = Pt(9.5)
                        run.font.color.rgb = RGBColor(255, 255, 255)
            else:
                if i % 2 == 1:
                    set_cell_background(cell, "FFFFFF")
                else:
                    set_cell_background(cell, alt_bg)
                for p in cell.paragraphs:
                    p.paragraph_format.space_before = Pt(2)
                    p.paragraph_format.space_after = Pt(2)
                    for run in p.runs:
                        run.font.name = "Arial"
                        run.font.size = Pt(9)
                        run.font.color.rgb = RGBColor(30, 41, 59)

def build_presentation_document():
    doc = docx.Document()
    
    # Page setup
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
    
    # Document Title
    p_header = doc.add_paragraph()
    p_header.paragraph_format.space_before = Pt(0)
    p_header.paragraph_format.space_after = Pt(2)
    p_header.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = p_header.add_run("TECHNICAL PROJECT PRESENTATION & SYSTEM ARCHITECTURE\n")
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(11)
    r_sub.font.bold = True
    r_sub.font.color.rgb = RGBColor(100, 116, 139)
    
    r_main = p_header.add_run("ANTIGRAVITY\n")
    r_main.font.name = "Arial Black"
    r_main.font.size = Pt(26)
    r_main.font.color.rgb = RGBColor(0, 121, 193)
    
    r_tag = p_header.add_run("AI-Powered GIS Landslide Monitoring, Disaster Intelligence & Safe Route Management Platform for the North Eastern Region of India\n")
    r_tag.font.name = "Arial"
    r_tag.font.size = Pt(13)
    r_tag.font.bold = True
    r_tag.font.color.rgb = RGBColor(30, 41, 59)
    
    r_motto = p_header.add_run("— From Hazard Detection to Explainable Road Blockages and Emergency Bypass Routing —\n")
    r_motto.font.name = "Georgia"
    r_motto.font.size = Pt(10.5)
    r_motto.font.italic = True
    r_motto.font.color.rgb = RGBColor(71, 85, 105)
    
    # Core Summary Box
    create_callout_box(
        doc,
        "THE CORE IDEA: ANTIGRAVITY IN 10 SECONDS",
        "Normal navigation apps (e.g. Google Maps) calculate the fastest route based solely on traffic speed. In a mountain disaster, that 'fastest road' may be buried under 600 m³ of rock or severed by a flash flood. ANTIGRAVITY fuses multi-source satellite Earth Observation (Copernicus Sentinel-1 InSAR, NASA GPM rain, ISRO Bhuvan), geotechnical telemetry (soil bearing capacity, pore pressure, Mohr-Coulomb FoS), and verified field blockage reports to answer one life-saving question: 'Can I safely reach my destination right now, and if not, what is the validated emergency bypass along real roads?'",
        bg_color="F0FDF4",
        border_color="2DD36F"
    )
    
    # Executive Project Snapshot Table
    t_summary = doc.add_table(rows=6, cols=2)
    t_summary.rows[0].cells[0].paragraphs[0].text = "Project Dimension"
    t_summary.rows[0].cells[1].paragraphs[0].text = "Implemented Specification in Codebase"
    
    t_summary.rows[1].cells[0].paragraphs[0].text = "Target Geographic Region"
    t_summary.rows[1].cells[1].paragraphs[0].text = "North Eastern Region (NER) of India — Primary Focus on Meghalaya (East Khasi Hills, Ri Bhoi, West Jaintia Hills, Sohra/Cherrapunji) and Key Lifelines (NH-06 Shillong-Jowai-Silchar, NH-10 Sikkim, Dimapur-Kohima)."
    
    t_summary.rows[2].cells[0].paragraphs[0].text = "Primary Problem Addressed"
    t_summary.rows[2].cells[1].paragraphs[0].text = "Monsoon landslides, debris flows, and sudden road collapses severing mountain lifelines, isolating rural hamlets, and trapping emergency vehicles with zero explanation."
    
    t_summary.rows[3].cells[0].paragraphs[0].text = "Actual Technology Stack"
    t_summary.rows[3].cells[1].paragraphs[0].text = "Next.js 16 (App Router) + React 19 + TypeScript + Leaflet 1.9.4 GIS + TailwindCSS v4 + Recharts + Python 3.14 FastAPI + Valhalla Routing Engine + Local OSM Dijkstra/A* Topological Router + SQLite / PostGIS + Docker Compose."
    
    t_summary.rows[4].cells[0].paragraphs[0].text = "Core Implemented Innovations"
    t_summary.rows[4].cells[1].paragraphs[0].text = "1) 100% Real Road Disaster Routing (zero straight lines across cliffs); 2) Explainable Road Blockage Forensics (cause, debris m³, reopening ETA); 3) Real-time Geotechnical Mohr-Coulomb FoS & XGBoost SHAP Explainer; 4) Mountain Hamlet Isolation & Evacuation Analytics; 5) Citizen SOS Beacon & Offline SMS/USSD Gateway."
    
    t_summary.rows[5].cells[0].paragraphs[0].text = "Target Operational Users"
    t_summary.rows[5].cells[1].paragraphs[0].text = "State/District Emergency Operation Centers (SDMA/DDMA), PWD Highway Engineers, NDRF/SDRF First Responders, and Mountain Highway Commuters/Citizens."
    
    format_table(t_summary, header_bg="0079C1")
    doc.add_paragraph()

    # Section 1
    h1 = doc.add_heading("1. Executive Summary & Problem Statement", level=1)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(4)
    
    doc.add_paragraph(
        "Antigravity is a specialized, production-ready GIS Disaster Management and Emergency Routing Web Application designed specifically for the complex mountain terrain of North East India. It bridges the critical gap between raw scientific hazard sensors (satellite ground displacement, precipitation radars, digital elevation models) and operational decision-making for emergency logistics and public safety."
    )
    doc.add_paragraph(
        "During the Indian monsoon season (June–October), the mountainous states of the North East—particularly Meghalaya, Assam, Sikkim, and Arunachal Pradesh—experience severe pluvial cloudbursts exceeding 100 mm/hour. Critical arteries such as National Highway 06 (connecting Shillong to Silchar and Tripura) and National Highway 10 suffer massive slope collapses. Antigravity monitors these sectors in real time, provides transparent explanations for every closure, recalculates safe detours around hazard zones, and assesses rural isolation risk."
    )
    
    # Comparison Table
    doc.add_heading("1.1 Real-World Comparison: Standard Navigation vs. Antigravity", level=2)
    t_comp = doc.add_table(rows=6, cols=3)
    t_comp.rows[0].cells[0].paragraphs[0].text = "System Capability"
    t_comp.rows[0].cells[1].paragraphs[0].text = "Conventional Apps (Google Maps / Apple Maps)"
    t_comp.rows[0].cells[2].paragraphs[0].text = "Antigravity Disaster Platform (Implemented)"
    
    t_comp.rows[1].cells[0].paragraphs[0].text = "Core Optimization Goal"
    t_comp.rows[1].cells[1].paragraphs[0].text = "Fastest route (travel time based on vehicle speed/congestion)."
    t_comp.rows[1].cells[2].paragraphs[0].text = "Safest route (avoids active landslide zones, saturated slopes, and severed bridges)."
    
    t_comp.rows[2].cells[0].paragraphs[0].text = "Hazard & Environmental Awareness"
    t_comp.rows[2].cells[1].paragraphs[0].text = "Blind to rainfall rate, soil saturation, slope angle, and InSAR displacement."
    t_comp.rows[2].cells[2].paragraphs[0].text = "Ingests Sentinel-1 InSAR (-mm/yr), NASA GPM 24h rain, Copernicus DEM slope, and soil pore pressure."
    
    t_comp.rows[3].cells[0].paragraphs[0].text = "Road Blockage Transparency"
    t_comp.rows[3].cells[1].paragraphs[0].text = "Displays a generic red line indicating slow traffic. No cause or authority provided."
    t_comp.rows[3].cells[2].paragraphs[0].text = "Structured forensic popup: cause (Landslide/Debris), debris volume (600 m³), authority (PWD Meghalaya), reopening ETA, and affected villages."
    
    t_comp.rows[4].cells[0].paragraphs[0].text = "Bypass Calculation & Safety"
    t_comp.rows[4].cells[1].paragraphs[0].text = "May route vehicles onto narrow unpaved tracks, walking paths, or steep cliffs."
    t_comp.rows[4].cells[2].paragraphs[0].text = "Calculates validated safe detours strictly over authoritative OpenStreetMap road topology with dynamic hazard avoidance polygons."
    
    t_comp.rows[5].cells[0].paragraphs[0].text = "Cut-Off / Isolation Behavior"
    t_comp.rows[5].cells[1].paragraphs[0].text = "Forces a straight line or attempts dangerous routing through blocked passes."
    t_comp.rows[5].cells[2].paragraphs[0].text = "Explicitly reports 'NO SAFE ROUTE FOUND', triggers isolation risk analytics, and identifies emergency helicopter landing zones (LZ)."
    
    format_table(t_comp, header_bg="1E293B")
    doc.add_paragraph()

    # Section 2
    h2 = doc.add_heading("2. Implemented Project Objectives & Reference Frameworks", level=1)
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(4)
    
    doc.add_paragraph("The Antigravity application directly implements the following 10 core technical objectives:")
    
    objectives = [
        ("1. Real-Time Spatial Hazard Monitoring: ", "Tracks rainfall, InSAR ground deformation, DEM elevation/slope, and soil pore water pressure across high-risk mountain sectors."),
        ("2. Multi-Layer GIS Command Map: ", "Provides an interactive Leaflet GIS canvas featuring 6 basemaps and 12 thematic layer toggles (ISRO Bhuvan WMS, historical landslides, road network, shelters, NDRF units, hamlets)."),
        ("3. Standardized Road Status Classification: ", "Classifies road corridors into OPEN, CAUTION, HIGH RISK, RESTRICTED, and BLOCKED with instant visual cartographic feedback."),
        ("4. Structured Road Blockage Forensics: ", "Stores and displays comprehensive incident metadata including verified blockage causes, clearing authorities, debris volumes, and reopening estimates."),
        ("5. Disaster-Aware Topological Routing: ", "Computes emergency vehicle navigation around hazard polygons using dual engines (FastAPI Valhalla C++ backend & client-side OSM topological router)."),
        ("6. 100% Real Road Network Integrity: ", "Guarantees zero phantom lines or cliff crossings by snapping strictly to verified OpenStreetMap LineString geometries."),
        ("7. Real-Time Geotechnical & ML Analytics: ", "Calculates Mohr-Coulomb Factor of Safety (FoS), Antecedent Rainfall Index (ARI), and provides XGBoost SHAP feature attribution waterfalls."),
        ("8. Mountain Hamlet Isolation Engine: ", "Identifies severed villages, trapped census populations, medical vulnerability indices, and emergency helicopter landing zones."),
        ("9. Citizen Early Warning Portal: ", "Features one-touch SOS distress beacons with GPS capture, audio notes, geotagged hazard reporting, and offline USSD (*112#) instructions."),
        ("10. Multi-Channel CAP 1.2 Alert Broadcasting: ", "Implements OASIS Common Alerting Protocol 1.2 generation with multi-channel dispatch (SMS, Siren, Cell Broadcast, Radio).")
    ]
    
    for title, desc in objectives:
        p_obj = doc.add_paragraph()
        p_obj.paragraph_format.space_before = Pt(1)
        p_obj.paragraph_format.space_after = Pt(2)
        r_t = p_obj.add_run(title)
        r_t.bold = True
        r_t.font.name = "Arial"
        r_t.font.size = Pt(9.5)
        r_t.font.color.rgb = RGBColor(0, 121, 193)
        r_d = p_obj.add_run(desc)
        r_d.font.name = "Arial"
        r_d.font.size = Pt(9.5)
    
    doc.add_paragraph()
    create_callout_box(
        doc,
        "ALIGNMENT WITH NATIONAL DISASTER FRAMEWORKS",
        "Antigravity draws conceptual inspiration from and aligns with India's authoritative disaster platforms: 1) GSI Bhooskhalan (Geological Survey of India) for landslide inventory categorization; 2) NDMA SACHET (National Disaster Management Authority) for multi-hazard early warning standards; and 3) C-DOT OASIS CAP 1.2 (Centre for Development of Telematics) for standardized geo-targeted alerting feeds.",
        bg_color="F8FAFC",
        border_color="0079C1"
    )

    # Section 3
    h3 = doc.add_heading("3. Full-Stack System Architecture & Technology Stack", level=1)
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(4)
    
    doc.add_paragraph(
        "Antigravity is engineered as a decoupled, resilient full-stack architecture combining a Next.js 16 App Router frontend with a high-performance Python 3.14 FastAPI backend and local/native routing services."
    )
    
    # Tech Stack Table
    t_tech = doc.add_table(rows=8, cols=3)
    t_tech.rows[0].cells[0].paragraphs[0].text = "Architecture Tier"
    t_tech.rows[0].cells[1].paragraphs[0].text = "Technologies Used"
    t_tech.rows[0].cells[2].paragraphs[0].text = "Role & Implementation in Antigravity"
    
    t_tech.rows[1].cells[0].paragraphs[0].text = "Frontend Framework"
    t_tech.rows[1].cells[1].paragraphs[0].text = "Next.js 16 (App Router), React 19, TypeScript"
    t_tech.rows[1].cells[2].paragraphs[0].text = "Client-side rendering, tab state management, responsive ArcGIS-style layout, API route proxies."
    
    t_tech.rows[2].cells[0].paragraphs[0].text = "Interactive GIS Canvas"
    t_tech.rows[2].cells[1].paragraphs[0].text = "Leaflet 1.9.4, CartoDB Voyager, Bhuvan WMS"
    t_tech.rows[2].cells[2].paragraphs[0].text = "Multi-basemap switcher, custom SVG markers, GeoJSON layer overlays, measurement ruler, coordinate hover inspector."
    
    t_tech.rows[3].cells[0].paragraphs[0].text = "Styling & Data Visualization"
    t_tech.rows[3].cells[1].paragraphs[0].text = "TailwindCSS v4, Lucide Icons, Recharts"
    t_tech.rows[3].cells[2].paragraphs[0].text = "Dark-themed command center aesthetics, temporal displacement charts, SHAP waterfalls, telemetry meters."
    
    t_tech.rows[4].cells[0].paragraphs[0].text = "Backend API & Microservices"
    t_tech.rows[4].cells[1].paragraphs[0].text = "Python 3.14, FastAPI, Pydantic v2, Uvicorn"
    t_tech.rows[4].cells[2].paragraphs[0].text = "REST endpoints for ML hazard scoring, CAP alert broadcasting, upstream telemetry monitoring, and scenario injection."
    
    t_tech.rows[5].cells[0].paragraphs[0].text = "Disaster Routing Engine"
    t_tech.rows[5].cells[1].paragraphs[0].text = "Valhalla C++ Engine + Local OSM Dijkstra/A*"
    t_tech.rows[5].cells[2].paragraphs[0].text = "Dynamic avoidance polygons for blocked roads, turn-by-turn geometry generation, clearance distance calculation."
    
    t_tech.rows[6].cells[0].paragraphs[0].text = "Machine Learning & Geotech"
    t_tech.rows[6].cells[1].paragraphs[0].text = "XGBoost, SHAP, Mohr-Coulomb FoS Engine"
    t_tech.rows[6].cells[2].paragraphs[0].text = "Real-time landslide susceptibility scoring, feature attribution, soil shear strength, and pore water pressure calculations."
    
    t_tech.rows[7].cells[0].paragraphs[0].text = "Containerization & Database"
    t_tech.rows[7].cells[1].paragraphs[0].text = "Docker, Docker Compose, SQLite / PostGIS"
    t_tech.rows[7].cells[2].paragraphs[0].text = "Containerized multi-service deployment, spatial schemas (`models/database.sql`, `seed.sql`), and resilient standalone fallback."
    
    format_table(t_tech, header_bg="0079C1")
    doc.add_paragraph()

    # Section 4: Detailed Tour of the 4 Tabs
    h4 = doc.add_heading("4. Comprehensive Tour of the 4 Implemented Dashboard Modules", level=1)
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(4)
    
    doc.add_paragraph(
        "The application provides 4 dedicated operational modules accessible via the top navigation bar, plus an emergency alert modal:"
    )
    
    # Tab 1
    doc.add_heading("4.1 Tab 1: Operations Command Center (ArcGIS Operations Dashboard)", level=2)
    doc.add_paragraph(
        "The Command Center is the primary operational hub for disaster commanders and PWD highway engineers. It integrates 6 live visual components into an ergonomic 3-column command layout:"
    )
    
    tab1_features = [
        ("Top KPI Overview Cards: ", "Displays 4 dynamic indicators: 1) Authentic Census Population at Risk (dynamically calculated using Meghalaya 2011 Census demographic data from `meghalayaDemographics.ts` across East Khasi Hills, Ri Bhoi, West Jaintia Hills, etc.); 2) Active InSAR/Copernicus Landslide Incidents; 3) Blocked Highway Mileage (NH-06, NH-10); 4) Deployed NDRF/SDRF Units & Relief Shelter Capacity."),
        ("Left Column — Hazard Queue & Telemetry Inspector: ", "Features a filterable list of active incidents with risk badges (Critical, High, Moderate), InSAR displacement velocity (-mm/yr), and probability percentages. Selecting an incident opens the Copernicus & ISRO Telemetry Inspector displaying Sentinel-1 InSAR velocity, NASA GPM 24h rainfall, DEM slope/elevation, soil bearing capacity (kPa), pore water pressure (kPa), lithology, and a direct CAP alert trigger."),
        ("Center Column — Interactive Leaflet GIS Canvas (`GisMap.tsx`): ", "Renders the primary GIS workspace with 6 basemap styles (ISRO Bhuvan 2D Topo, Bhuvan Satellite WMS, Copernicus S2, Bhuvan Hybrid, CartoDB Voyager, OpenStreetMap). Supports 12 toggleable layers, disaster-aware green detour routing around red road blockages, an interactive distance measurement ruler, live coordinate/elevation inspector, and 10 North-Eastern Region Geo-Hub presets (Shillong, Sohra/Cherrapunji, Umiam Lake, Jowai NH-06, Nongpoh, Rangpo-Singtam NH-10, Gangtok)."),
        ("Right Column — Geotechnical Telemetry Card: ", "Computes real-time Mohr-Coulomb Factor of Safety (FoS), Soil Bearing Capacity (kPa), Pore Water Pressure (kPa), and Antecedent Rainfall Index (ARI 7-day saturation)."),
        ("Right Column — Temporal Rainfall-Displacement Serial Chart: ", "Visualizes 12-hour temporal displacement trends against rainfall intensity with a critical 100 mm/24h warning threshold line."),
        ("Right Column — XGBoost SHAP Explainer: ", "Displays a real-time machine learning feature attribution waterfall chart showing the exact mathematical contribution of NASA GPM Rain, Slope Angle, Sentinel-1 InSAR Velocity, Soil Moisture, Fault Distance, and Lithology."),
        ("Right Column — Scenario & Pluvial Cloudburst Stress Injector: ", "Features an interactive rainfall stress slider (+0 to +100 mm/h) that simulates extreme cloudbursts in real time, dynamically recalculating landslide probability, geotechnical pore pressure, and triggering emergency visual alerts."),
        ("Bottom Collapsible Drawer — Mountain Hamlet Isolation Engine: ", "Analyzes rural connectivity across remote Meghalaya villages (e.g. Mawlynnong, Nongriat, Laitkynsew, Dawki border), displaying road severance status, trapped census populations, medical vulnerability indices, and emergency helicopter landing zone (LZ) coordinates.")
    ]
    for title, desc in tab1_features:
        p_f = doc.add_paragraph()
        p_f.paragraph_format.space_before = Pt(1)
        p_f.paragraph_format.space_after = Pt(2)
        r_t = p_f.add_run(f"• {title}")
        r_t.bold = True
        r_t.font.name = "Arial"
        r_t.font.size = Pt(9.5)
        r_t.font.color.rgb = RGBColor(15, 23, 42)
        r_d = p_f.add_run(desc)
        r_d.font.name = "Arial"
        r_d.font.size = Pt(9.5)

    doc.add_paragraph()

    # Tab 2
    doc.add_heading("4.2 Tab 2: ISRO Bhuvan & Copernicus GIS Workstation", level=2)
    doc.add_paragraph(
        "A dedicated full-screen GIS analysis environment featuring an interactive Feature Attribute Table inspector. Commanders can inspect raw GeoJSON attributes for all active incidents, historical landslide polygons, road segments, and shelters, complete with search, column sorting, and GeoJSON data export."
    )

    # Tab 3
    doc.add_heading("4.3 Tab 3: Citizen Early Warning Portal (`CitizenPortal.tsx`)", level=2)
    doc.add_paragraph(
        "A dedicated public-facing safety portal designed for field officers and citizens in mountain areas:"
    )
    tab3_features = [
        ("One-Touch SOS Emergency Beacon: ", "Captures live browser GPS coordinates, allows a 5-second audio distress recording, supports offline queueing, and dispatches an instant SOS distress packet to the State Emergency Operations Center."),
        ("Geotagged Hazard & Road Blockage Reporting: ", "Enables citizens to upload on-ground photos, categorize hazards (Landslide, Rockfall, Flash Flood, Mudslide, Road Collapse), adjust severity, toggle road closure status, and immediately inject the report into the command triage queue."),
        ("Nearby Verified Relief Shelters Directory: ", "Displays operational emergency shelters with live occupancy gauges, bed capacity, contact details, and one-click turn-by-turn navigation."),
        ("Offline SMS / USSD Emergency Gateway: ", "Provides standardized offline emergency protocols (e.g., *112# disaster USSD codes and SMS formats) for zero-connectivity scenarios during network outages.")
    ]
    for title, desc in tab3_features:
        p_f = doc.add_paragraph()
        p_f.paragraph_format.space_before = Pt(1)
        p_f.paragraph_format.space_after = Pt(2)
        r_t = p_f.add_run(f"• {title}")
        r_t.bold = True
        r_t.font.name = "Arial"
        r_t.font.size = Pt(9.5)
        r_t.font.color.rgb = RGBColor(15, 23, 42)
        r_d = p_f.add_run(desc)
        r_d.font.name = "Arial"
        r_d.font.size = Pt(9.5)

    doc.add_paragraph()

    # Tab 4 & Dedicated Satellite/Weather Ingestion Section
    doc.add_heading("4.4 Tab 4: Upstream Telemetry & API Registry (`ApiRegistry.tsx`)", level=2)
    doc.add_paragraph(
        "Provides real-time health monitoring, ping latency metrics, uptime trackers, and API schema documentation for all authoritative upstream data feeds powering Antigravity: ISRO Bhuvan Landslide Atlas WMS, NASA POWER API, NASA GPM IMERG Precipitation, Copernicus Sentinel-1 InSAR feeds, OpenStreetMap Overpass, and C-DOT CAP 1.2 Alert Gateway."
    )
    
    doc.add_heading("4.5 OASIS CAP 1.2 Multi-Tier Alert Broadcast Modal (`CapAlertModal.tsx`)", level=2)
    doc.add_paragraph(
        "A Common Alerting Protocol modal allowing commanders to author and broadcast geo-targeted emergency warnings across SMS, Cell Broadcast, Siren, and Radio with district targeting and severity levels (Immediate / Extreme)."
    )

    doc.add_heading("4.6 Deep Dive: ISRO Bhuvan & NASA POWER API Integration", level=2)
    doc.add_paragraph(
        "Antigravity integrates official Indian and international Earth Observation & Climatology APIs into its live spatial pipeline:"
    )
    
    upstream_integrations = [
        ("ISRO Bhuvan WMS & Landslide Atlas (`/api/bhuvan/wms` & `/api/bhuvan/landslide-atlas`): ", "Antigravity connects directly to the National Remote Sensing Centre (NRSC / ISRO) Web Map Service (WMS) endpoints (`bhuvan-vec1.nrsc.gov.in` and `bhuvan-app1.nrsc.gov.in`) with secure Bhuvan token authentication. It serves: 1) High-resolution Indian Remote Sensing (IRS) CartoDEM 2D Topographic tiles; 2) Bhuvan Satellite & Hybrid orthomosaics; 3) The National Landslide Susceptibility Mapping (NLSM) macro-zonation polygons; 4) ISRO Landslide Atlas of India historical failure inventories; and 5) Regional geotectonic fault lines."),
        ("NASA POWER API (`/api/nasa-power`): ", "Antigravity queries the NASA Prediction of Worldwide Energy Resources (POWER) API (`power.larc.nasa.gov/api/temporal/daily/point`) for real-time solar and meteorological analysis. It dynamically ingests: 1) Precipitation Total Corrected (`PRECTOTCORR`); 2) 2-meter Surface Temperature (`T2M`); 3) 30-Day Standardized Precipitation Index (SPI = 1.42); and 4) Accumulated monsoon climatological rainfall grids (MERRA-2 Climatology)."),
        ("NASA GPM IMERG Satellite Precipitation: ", "Ingests Global Precipitation Measurement (GPM) Integrated Multi-satellitE Retrievals for GPM (V07B) to track 24-hour calibrated rainfall accumulation (mm) across North Eastern mountain coordinates, directly feeding the geotechnical pore water pressure and XGBoost hazard prediction models.")
    ]
    
    for title, desc in upstream_integrations:
        p_u = doc.add_paragraph()
        p_u.paragraph_format.space_before = Pt(1)
        p_u.paragraph_format.space_after = Pt(2)
        r_t = p_u.add_run(f"• {title}")
        r_t.bold = True
        r_t.font.name = "Arial"
        r_t.font.size = Pt(9.5)
        r_t.font.color.rgb = RGBColor(0, 121, 193)
        r_d = p_u.add_run(desc)
        r_d.font.name = "Arial"
        r_d.font.size = Pt(9.5)
    
    doc.add_paragraph()

    # Section 5: Routing & Road Network
    h5 = doc.add_heading("5. Road Network Topology, Blockage Forensics & Safe Routing Engine", level=1)
    h5.paragraph_format.space_before = Pt(14)
    h5.paragraph_format.space_after = Pt(4)
    
    doc.add_paragraph(
        "A core technical achievement of Antigravity is its dual-engine, 100% real road disaster-aware routing system. It guarantees that emergency routes strictly follow actual drivable road geometry and never generate phantom straight lines across mountain cliffs."
    )
    
    # Road Statuses Table
    t_status = doc.add_table(rows=6, cols=4)
    t_status.rows[0].cells[0].paragraphs[0].text = "Road Status"
    t_status.rows[0].cells[1].paragraphs[0].text = "Map Visual"
    t_status.rows[0].cells[2].paragraphs[0].text = "Operational Condition"
    t_status.rows[0].cells[3].paragraphs[0].text = "Routing Engine Behavior"
    
    t_status.rows[1].cells[0].paragraphs[0].text = "OPEN"
    t_status.rows[1].cells[1].paragraphs[0].text = "Green Line"
    t_status.rows[1].cells[2].paragraphs[0].text = "Clear road, normal speed limit, no hazards."
    t_status.rows[1].cells[3].paragraphs[0].text = "Standard routing; preferred path for all vehicles."
    
    t_status.rows[2].cells[0].paragraphs[0].text = "CAUTION"
    t_status.rows[2].cells[1].paragraphs[0].text = "Yellow Line"
    t_status.rows[2].cells[2].paragraphs[0].text = "Light rainfall or minor debris on shoulders."
    t_status.rows[2].cells[3].paragraphs[0].text = "Routable with advisory; speed cost penalty +15%."
    
    t_status.rows[3].cells[0].paragraphs[0].text = "HIGH RISK"
    t_status.rows[3].cells[1].paragraphs[0].text = "Orange Line"
    t_status.rows[3].cells[2].paragraphs[0].text = "High InSAR displacement / saturated slope."
    t_status.rows[3].cells[3].paragraphs[0].text = "Avoided if safer alternatives exist (cost penalty +200%)."
    
    t_status.rows[4].cells[0].paragraphs[0].text = "RESTRICTED"
    t_status.rows[4].cells[1].paragraphs[0].text = "Purple Line"
    t_status.rows[4].cells[2].paragraphs[0].text = "One-lane traffic / emergency convoys only."
    t_status.rows[4].cells[3].paragraphs[0].text = "Restricted to emergency responders; blocked for general traffic."
    
    t_status.rows[5].cells[0].paragraphs[0].text = "BLOCKED"
    t_status.rows[5].cells[1].paragraphs[0].text = "Bold Red Line"
    t_status.rows[5].cells[2].paragraphs[0].text = "Confirmed landslide, bridge collapse, or washout."
    t_status.rows[5].cells[3].paragraphs[0].text = "HARD AVOIDANCE. Injected as barrier polygon; dynamic safe bypass calculated."
    
    format_table(t_status, header_bg="DC2626")
    doc.add_paragraph()

    # Routing Technical Details
    doc.add_heading("5.1 Dual-Engine Routing Implementation", level=2)
    doc.add_paragraph(
        "1. Backend Valhalla Routing Engine (`routing/valhalla_service.py` & `routing/disaster_routing.py`): Utilizes Valhalla's C++ dynamic costing and polygon avoidance matrix. When a disaster blockage is confirmed, a polygon barrier is injected into the routing request, dynamically penalizing affected graph edges to infinity and computing the optimal detour."
    )
    doc.add_paragraph(
        "2. Client-Side Topological Graph Router (`lib/localRoadRouter.ts`): Built directly into Next.js for instant offline/standalone execution. It parses real OpenStreetMap road vector LineStrings from `lib/cachedOsmRoads.json`, constructs an in-memory spatial adjacency graph, snaps origin/destination coordinates to the nearest drivable road nodes within 15 meters, and runs Dijkstra / A* pathfinding. Blocked road segments are dynamically excluded, generating instant green safe detours with full elevation profiles and hazard clearance metrics."
    )
    doc.add_paragraph()

    # Section 6: AI & Geotechnical Modeling
    h6 = doc.add_heading("6. AI / Machine Learning & Geotechnical Hazard Modeling", level=1)
    h6.paragraph_format.space_before = Pt(14)
    h6.paragraph_format.space_after = Pt(4)
    
    doc.add_paragraph(
        "Antigravity integrates classical soil mechanics with machine learning inference (`backend/services/ml_service.py` and `components/command/`):"
    )
    
    geotech_items = [
        ("Mohr-Coulomb Factor of Safety (FoS): ", "Computes slope stability ratio: FoS = (c' + (γ·z·cos²β - u)·tan φ') / (γ·z·sin β·cos β), where c' is effective cohesion, γ is soil unit weight, z is failure depth, β is slope angle, u is pore water pressure, and φ' is internal friction angle. FoS < 1.0 triggers an imminent slope collapse warning."),
        ("Pore Water Pressure (u): ", "Calculated dynamically based on volumetric soil moisture saturation and 1-hour pluvial rainfall intensity: u = (SoilMoisture · 54.0) + (Rainfall1h · 0.45) kPa."),
        ("Soil Bearing Capacity: ", "Models subgrade strength degradation under moisture saturation: q_allowable = max(45, 320 - (SoilMoisture · 190 + SoilMoisture · 54 · 1.2)) kPa."),
        ("XGBoost Hazard Susceptibility Scoring: ", "Evaluates multi-variable inputs (24h GPM rain, slope angle, InSAR displacement velocity, soil moisture, distance to geological fault, lithology factor) to output calibrated hazard probabilities (0.00 to 0.99)."),
        ("SHAP Waterfall Explainability: ", "Decomposes model predictions into exact feature attributions, explaining to disaster commanders WHY a particular mountain corridor has been elevated to Critical risk.")
    ]
    for title, desc in geotech_items:
        p_g = doc.add_paragraph()
        p_g.paragraph_format.space_before = Pt(1)
        p_g.paragraph_format.space_after = Pt(2)
        r_t = p_g.add_run(f"• {title}")
        r_t.bold = True
        r_t.font.name = "Arial"
        r_t.font.size = Pt(9.5)
        r_t.font.color.rgb = RGBColor(15, 23, 42)
        r_d = p_g.add_run(desc)
        r_d.font.name = "Arial"
        r_d.font.size = Pt(9.5)

    doc.add_paragraph()

    # Section 7: Practical Disaster Walkthrough
    h7 = doc.add_heading("7. Data Flow & Practical Disaster Walkthrough (Shillong to Silchar on NH-06)", level=1)
    h7.paragraph_format.space_before = Pt(14)
    h7.paragraph_format.space_after = Pt(4)
    
    doc.add_paragraph(
        "Here is the exact step-by-step operational workflow demonstrated in the Antigravity application during a monsoon emergency on the vital Shillong-Silchar corridor:"
    )
    
    steps = [
        ("Step 1 (Pre-Hazard Monitoring): ", "NASA GPM IMERG and regional rainfall gauges record 140 mm of continuous precipitation over East Khasi Hills & Ri Bhoi. The Command Dashboard KPI card reflects heightened risk."),
        ("Step 2 (Landslide Occurrence & Citizen/PWD Report): ", "A 600 m³ slope failure buries NH-06 near Sonapur. A PWD field officer submits a geotagged hazard report with photo and blockage confirmation via the Citizen/Field Portal."),
        ("Step 3 (Command Verification & Map Update): ", "The Emergency Operations Commander inspects the incoming report on the triage queue. Upon verification, NH-06 instantly turns bold RED on the interactive GIS map."),
        ("Step 4 (Forensic Inspection): ", "Clicking the red segment displays the structured blockage popup: 'LANDSLIDE: 600 m³ debris across road. Verified by PWD Meghalaya. Reopening ETA: 18 hours. Cut-off hamlets: 3'."),
        ("Step 5 (Automatic Safe Re-Routing): ", "An emergency ambulance routing request from Shillong to Silchar detects the red blockage. Antigravity cancels the hazardous path and calculates a validated green detour along safe state roads with zero straight lines."),
        ("Step 6 (Isolation Analytics & CAP Alert): ", "The Isolation Risk Engine identifies affected hamlets along the cut-off corridor, calculates trapped populations and helicopter LZ coordinates, while the commander broadcasts an OASIS CAP 1.2 emergency alert.")
    ]
    for title, desc in steps:
        p_s = doc.add_paragraph()
        p_s.paragraph_format.space_before = Pt(1)
        p_s.paragraph_format.space_after = Pt(3)
        r_t = p_s.add_run(title)
        r_t.bold = True
        r_t.font.name = "Arial"
        r_t.font.size = Pt(9.5)
        r_t.font.color.rgb = RGBColor(0, 121, 193)
        r_d = p_s.add_run(desc)
        r_d.font.name = "Arial"
        r_d.font.size = Pt(9.5)

    doc.add_paragraph()

    # Section 8: Database & API Catalog
    h8 = doc.add_heading("8. Database Models & REST API Specifications", level=1)
    h8.paragraph_format.space_before = Pt(14)
    h8.paragraph_format.space_after = Pt(4)
    
    doc.add_paragraph(
        "Antigravity defines structured database models (`backend/models/database.sql`, `seed.sql`, and `services/db.py`) and exposes clean REST endpoints:"
    )
    
    # API Table
    t_api = doc.add_table(rows=12, cols=3)
    t_api.rows[0].cells[0].paragraphs[0].text = "HTTP Endpoint"
    t_api.rows[0].cells[1].paragraphs[0].text = "Method"
    t_api.rows[0].cells[2].paragraphs[0].text = "Function & Payload Details"
    
    t_api.rows[1].cells[0].paragraphs[0].text = "/api/incidents"
    t_api.rows[1].cells[1].paragraphs[0].text = "GET / POST"
    t_api.rows[1].cells[2].paragraphs[0].text = "Retrieves active landslide incidents or ingests new verified hazard records."
    
    t_api.rows[2].cells[0].paragraphs[0].text = "/api/routing/safe-route"
    t_api.rows[2].cells[1].paragraphs[0].text = "POST"
    t_api.rows[2].cells[2].paragraphs[0].text = "Calculates disaster-aware emergency routes avoiding blocked roads and hazard polygons."
    
    t_api.rows[3].cells[0].paragraphs[0].text = "/api/routing/alternative-routes"
    t_api.rows[3].cells[1].paragraphs[0].text = "POST"
    t_api.rows[3].cells[2].paragraphs[0].text = "Returns ranked alternative safe bypass paths with distance, duration, and clearance metrics."
    
    t_api.rows[4].cells[0].paragraphs[0].text = "/api/bhuvan/wms"
    t_api.rows[4].cells[1].paragraphs[0].text = "GET"
    t_api.rows[4].cells[2].paragraphs[0].text = "Proxies ISRO NRSC Bhuvan WMS vector & satellite tiles with token authentication (EPSG:3857)."
    
    t_api.rows[5].cells[0].paragraphs[0].text = "/api/bhuvan/landslide-atlas"
    t_api.rows[5].cells[1].paragraphs[0].text = "GET"
    t_api.rows[5].cells[2].paragraphs[0].text = "Fetches official historical landslide boundaries from the ISRO National Landslide Susceptibility database."
    
    t_api.rows[6].cells[0].paragraphs[0].text = "/api/nasa-power"
    t_api.rows[6].cells[1].paragraphs[0].text = "GET"
    t_api.rows[6].cells[2].paragraphs[0].text = "Queries NASA POWER API for daily PRECTOTCORR precipitation, surface temperature, and 30-day SPI."
    
    t_api.rows[7].cells[0].paragraphs[0].text = "/api/risk/predict"
    t_api.rows[7].cells[1].paragraphs[0].text = "POST"
    t_api.rows[7].cells[2].paragraphs[0].text = "Executes XGBoost ML hazard prediction and returns SHAP feature contribution scores."
    
    t_api.rows[8].cells[0].paragraphs[0].text = "/api/isolation"
    t_api.rows[8].cells[1].paragraphs[0].text = "GET"
    t_api.rows[8].cells[2].paragraphs[0].text = "Returns mountain hamlet severance status, trapped census populations, and helicopter LZs."
    
    t_api.rows[9].cells[0].paragraphs[0].text = "/api/scenario/cloudburst"
    t_api.rows[9].cells[1].paragraphs[0].text = "POST"
    t_api.rows[9].cells[2].paragraphs[0].text = "Simulates pluvial stress (+0 to +100 mm/h rain) and recalculates pore pressures."
    
    t_api.rows[10].cells[0].paragraphs[0].text = "/api/alerts/broadcast"
    t_api.rows[10].cells[1].paragraphs[0].text = "POST"
    t_api.rows[10].cells[2].paragraphs[0].text = "Generates and dispatches OASIS CAP 1.2 XML/JSON multi-channel alerts."
    
    t_api.rows[11].cells[0].paragraphs[0].text = "/api/sos"
    t_api.rows[11].cells[1].paragraphs[0].text = "POST"
    t_api.rows[11].cells[2].paragraphs[0].text = "Receives citizen emergency SOS beacons with GPS coordinates and audio recordings."
    
    format_table(t_api, header_bg="0079C1")
    doc.add_paragraph()

    # Section 9: Live Presentation Script & Viva Q&A
    h9 = doc.add_heading("9. 5-Minute Live Presentation Script & Viva Q&A (100% Code-Grounded)", level=1)
    h9.paragraph_format.space_before = Pt(14)
    h9.paragraph_format.space_after = Pt(4)
    
    doc.add_heading("9.1 Step-by-Step Evaluator Demo Walkthrough Script", level=2)
    demo_steps = [
        ("Step 1 (Open Dashboard): ", "Open the Next.js application at localhost:3000. Highlight the 4 KPI cards showing authentic census demographic exposure from `meghalayaDemographics.ts` and active highway closures."),
        ("Step 2 (Explore GIS Map Canvas): ", "Demonstrate the Leaflet GIS canvas. Switch basemaps (Bhuvan 2D Topo, Satellite WMS, Copernicus S2). Toggle layers (InSAR displacement, NASA GPM rain isohyets, DEM slope, relief shelters)."),
        ("Step 3 (Geotech & ML Telemetry): ", "Click on an incident in the Hazard Queue. Point out the Geotechnical Telemetry Card (Mohr-Coulomb FoS, Pore Pressure), the Temporal Serial Chart, and the XGBoost SHAP Waterfall Explainer."),
        ("Step 4 (Simulate Pluvial Cloudburst): ", "Drag the Scenario Injector slider to +75 mm/h. Show the live recalculation of hazard probabilities and geotechnical pore water pressure across the UI."),
        ("Step 5 (Demonstrate Disaster-Aware Routing): ", "Request a route from Shillong to Silchar along NH-06. Show the normal fast route. Now mark NH-06 as BLOCKED. Show the road turning bold RED with structured blockage forensics."),
        ("Step 6 (Show Safe Green Detour): ", "Re-run the route calculation. Show Antigravity instantly calculating the safe green bypass via validated state roads with zero straight lines across cliffs."),
        ("Step 7 (Isolation Engine & Citizen SOS): ", "Open the Mountain Hamlet Isolation drawer to show severed villages and helicopter LZs. Switch to the Citizen Portal tab to demonstrate the SOS Emergency Beacon and offline USSD gateway.")
    ]
    for title, desc in demo_steps:
        p_d = doc.add_paragraph()
        p_d.paragraph_format.space_before = Pt(1)
        p_d.paragraph_format.space_after = Pt(2)
        r_t = p_d.add_run(title)
        r_t.bold = True
        r_t.font.name = "Arial"
        r_t.font.size = Pt(9.5)
        r_t.font.color.rgb = RGBColor(0, 121, 193)
        r_d = p_d.add_run(desc)
        r_d.font.name = "Arial"
        r_d.font.size = Pt(9.5)

    doc.add_paragraph()
    doc.add_heading("9.2 Top 10 Viva & Technical Review Questions", level=2)
    
    viva_qa = [
        ("Q1: How does Antigravity calculate safe routes and avoid blocked mountain roads?",
         "Antigravity uses a dual-engine architecture. On the backend, it utilizes the Valhalla C++ routing engine with dynamic avoidance polygons. On the frontend, it provides an instant client-side topological graph router (`lib/localRoadRouter.ts`) parsing real OpenStreetMap road vectors (`cachedOsmRoads.json`). When a road segment is flagged as BLOCKED, its edges are excluded from the graph, and Dijkstra/A* computes a safe green detour."),
        ("Q2: Why not just use Google Maps for disaster navigation?",
         "Google Maps is optimized purely for speed/traffic flow and is a closed black box. It does not ingest satellite radar InSAR ground displacement, soil pore pressure, or slope angles. It displays opaque red lines without cause or reopening estimates, and in mountain disasters it can mistakenly route emergency vehicles onto perilous trails or cliffs."),
        ("Q3: What happens if all roads to a village are completely blocked?",
         "Antigravity strictly avoids generating fake straight lines across mountain cliffs. It explicitly returns 'NO SAFE ROUTE FOUND', triggers the Mountain Hamlet Isolation Engine (`IsolationRiskEngine.tsx`), calculates trapped census populations, and outputs emergency helicopter landing zone (LZ) coordinates for airdrop relief."),
        ("Q4: How are geotechnical slope stability and soil mechanics modeled?",
         "Antigravity implements the classical Mohr-Coulomb Factor of Safety (FoS) equation: FoS = (c' + (γ·z·cos²β - u)·tan φ') / (γ·z·sin β·cos β), dynamically computing pore water pressure (u) from real-time soil moisture saturation and pluvial rainfall rates."),
        ("Q5: How does the XGBoost SHAP Explainer work?",
         "The machine learning service (`ml_service.py` & `XgbShapExplainer.tsx`) evaluates 6 core features: 24h GPM rain, slope gradient, InSAR deformation velocity, soil moisture, fault distance, and lithology. SHAP (SHapley Additive exPlanations) values decompose the final risk score into transparent positive and negative contributions."),
        ("Q6: How does the application integrate ISRO Bhuvan services?",
         "Antigravity connects directly to ISRO National Remote Sensing Centre (NRSC) WMS servers (`/api/bhuvan/wms` and `/api/bhuvan/landslide-atlas`) with Bhuvan token authentication. It provides 2D Topographic and high-resolution satellite imagery basemaps, National Landslide Susceptibility Mapping (NLSM) polygons, Landslide Atlas historical failure inventories, and regional geotectonic fault layers."),
        ("Q7: What is the purpose of the NASA POWER API in Antigravity?",
         "The NASA POWER API (`/api/nasa-power`) provides real-time solar and meteorological parameters (`PRECTOTCORR` precipitation, `T2M` surface temperature, and 30-day Standardized Precipitation Index). Combined with NASA GPM IMERG 24-hour calibrated rainfall, it provides baseline saturation and climatological drought/saturation indices feeding the geotechnical risk models."),
        ("Q8: How does the application handle offline or poor-connectivity situations?",
         "Antigravity is designed with resilience: 1) The client-side road router operates offline using in-memory cached OSM road topology; 2) The Citizen Portal provides offline USSD (*112#) and SMS emergency protocols; 3) The backend operates self-contained in Docker containers."),
        ("Q9: Where does the demographic and population data come from?",
         "Antigravity integrates authentic 2011 Census of India demographic data (`meghalayaDemographics.ts`) across all 12 districts of Meghalaya (East Khasi Hills, Ri Bhoi, West Jaintia Hills, etc.), allowing dynamic calculation of vulnerable residents within hazard buffer zones."),
        ("Q10: What alerting standard does Antigravity support?",
         "Antigravity implements the OASIS Common Alerting Protocol (CAP 1.2) standard (`CapAlertModal.tsx` & `alert_service.py`), generating structured XML/JSON alert payloads compatible with NDMA SACHET and C-DOT multi-channel broadcast systems.")
    ]
    
    for q, a in viva_qa:
        p_q = doc.add_paragraph()
        p_q.paragraph_format.space_before = Pt(3)
        p_q.paragraph_format.space_after = Pt(1)
        r_q = p_q.add_run(q)
        r_q.bold = True
        r_q.font.name = "Arial"
        r_q.font.size = Pt(9.5)
        r_q.font.color.rgb = RGBColor(180, 40, 40)
        
        p_a = doc.add_paragraph()
        p_a.paragraph_format.space_before = Pt(0)
        p_a.paragraph_format.space_after = Pt(3)
        r_a = p_a.add_run(a)
        r_a.font.name = "Arial"
        r_a.font.size = Pt(9)
        r_a.font.color.rgb = RGBColor(30, 41, 59)

    doc.add_paragraph()
    # Conclusion
    h10 = doc.add_heading("10. Conclusion", level=1)
    h10.paragraph_format.space_before = Pt(14)
    h10.paragraph_format.space_after = Pt(4)
    doc.add_paragraph(
        "ANTIGRAVITY transforms mountain disaster management from fragmented confusion into clear, explainable spatial intelligence. By connecting real Earth Observation sensors directly to verified road topologies, emergency commanders and citizens have the exact tools needed to make rapid, life-saving decisions during monsoon crises in the North Eastern Region of India."
    )
    
    # Save document
    primary_path = "ANTIGRAVITY_Technical_Project_Presentation.docx"
    updated_path = "ANTIGRAVITY_Technical_Project_Presentation_Updated.docx"
    try:
        doc.save(primary_path)
        print(f"Document successfully created and saved to {primary_path}")
    except PermissionError:
        doc.save(updated_path)
        print(f"[NOTE] '{primary_path}' is currently open in Microsoft Word. Saved successfully to '{updated_path}'.")

if __name__ == "__main__":
    build_presentation_document()
