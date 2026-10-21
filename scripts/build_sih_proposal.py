import pptx
import os
import shutil

src_file = 'SMART INDIA HACKATHON 2025 Sikkim (2).pptx'
dst_file = 'SIH_2025_Meteorological_Intelligence_Proposal.pptx'
dst_file_ps26084 = 'SIH_2025_PS26084_Convective_Nowcasting_Proposal.pptx'
public_dst_file = os.path.join('landslide', 'public', 'SIH_2025_Meteorological_Intelligence_Proposal.pptx')
public_dst_file_ps26084 = os.path.join('landslide', 'public', 'SIH_2025_PS26084_Convective_Nowcasting_Proposal.pptx')

prs = pptx.Presentation(src_file)

# Helper function to set text while preserving font properties if possible
def set_shape_text(shape, new_text, font_size_pt=None, bold=None):
    if not shape.has_text_frame:
        return
    tf = shape.text_frame
    # Read existing font name/size from first paragraph if available
    first_font_name = None
    if len(tf.paragraphs) > 0 and len(tf.paragraphs[0].runs) > 0:
        first_font_name = tf.paragraphs[0].runs[0].font.name
    
    tf.text = ""  # clears
    lines = new_text.split('\n')
    for i, line in enumerate(lines):
        p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
        p.text = line
        if font_size_pt:
            p.font.size = pptx.util.Pt(font_size_pt)
        if bold is not None:
            p.font.bold = bold
        if first_font_name:
            p.font.name = first_font_name

# ==================== SLIDE 1 ====================
s1 = prs.slides[0]
for shape in s1.shapes:
    if shape.has_text_frame:
        t = shape.text_frame.text
        if 'SMART INDIA HACKATHON' in t:
            set_shape_text(shape, 'SMART INDIA HACKATHON 2025', font_size_pt=30, bold=True)
        elif 'Problem Statement ID' in t or 'Digitize' in t or 'Theme' in t:
            s1_details = (
                "Problem Statement ID – 26084\n"
                "Problem Statement Title - Convective scale nowcasting for Thunderstorms, Hail & Cloudbursts (06 hr)\n"
                "Organization - Ministry of Earth Sciences (MoES)\n"
                "Department - National Centre for Medium Range Weather Forecasting (NCMRWF)\n"
                "Category - Software  |  Theme - Disaster Management\n"
                "Team ID - 50617  |  Team Name - Antigravity (Promatrs)"
            )
            set_shape_text(shape, s1_details, font_size_pt=13)

# ==================== SLIDE 2 ====================
s2 = prs.slides[1]
# Shape 5: Title
set_shape_text(s2.shapes[5], "Hyper-Local Convective-Scale Nowcasting Platform (0–6 hr Lead Time at 1–3 km)", font_size_pt=15, bold=True)

# Shape 6: PROBLEM STATEMENT
s2_problem = (
    "PROBLEM STATEMENT (MoES / NCMRWF — PS 26084)\n"
    "• Severe Convective Hazard: Thunderstorms, hail, downburst winds, and cloudbursts are India's deadliest rapid-onset hazards.\n"
    "• NWP Computational Limitation: Traditional physics-based NWP models are too computationally slow to simulate violent storms developing within minutes, slipping through coarse grid resolutions.\n"
    "• Short-Term Early Warning Gap: Existing systems lack hyper-local (1–3 km) 0–6 hour lead time nowcasts, leaving local administrations, aviation, and farming communities vulnerable to sudden devastation."
)
set_shape_text(s2.shapes[6], s2_problem, font_size_pt=10.5)

# Shape 7: Who We Serve Header
set_shape_text(s2.shapes[7], "Target Stakeholders", font_size_pt=13, bold=True)

# Shape 14: Target 1
set_shape_text(s2.shapes[14], "MoES / NCMRWF & Disaster Authorities (NDMA, SDMAs, EOCs)", font_size_pt=9.5, bold=True)
# Shape 16: Target 2
set_shape_text(s2.shapes[16], "Aviation Safety, Airport Towers & Low-Altitude Corridors", font_size_pt=9.5, bold=True)
# Shape 18: Target 3
set_shape_text(s2.shapes[18], "Rural Farming, District Engineers & Vulnerable Communities", font_size_pt=9.5, bold=True)

# Shape 19: PROPOSED SOLUTION Header
set_shape_text(s2.shapes[19], "PROPOSED SOLUTION", font_size_pt=13, bold=True)

# Shape 8: Proposed Solution Points
s2_solution = (
    "• Multi-Source Data Fusion Engine: Real-time ingestion fusing Doppler Weather Radars (DWR reflectivity & velocity), geostationary satellite (INSAT-3D/3DR TIR-1 cloud-top cooling), and ground lightning detection networks.\n"
    "• Early Convective Initiation (CI): Detects rapid storm genesis 30–60 minutes before severe radar reflectivity cores emerge.\n"
    "• Dynamic Severe Storm Parameters: Real-time forecasting of lightning strike density, hail probability & MESH diameter, downburst wind velocity, and cloudburst threshold (≥100 mm/h).\n"
    "• 1–3 km Interactive GIS Dashboard: Hyper-local hazard zones with real-time vector extrapolation and live countdown clocks for storm arrivals.\n"
    "• Authoritative Data Integrity: Operates on genuine operational data streams with verifiable telemetry provenance."
)
set_shape_text(s2.shapes[8], s2_solution, font_size_pt=10)

# Shape 20 & 21: MVP & Verification links
set_shape_text(s2.shapes[20], "Live Operational Dashboard: Multi-Source Fusion Active", font_size_pt=9)
set_shape_text(s2.shapes[21], "NCMRWF Objective: 0–6h Lead Time • 1–3 km Hyper-Local Resolution • Live Arrival Countdown Clocks", font_size_pt=9)

# ==================== SLIDE 3 ====================
s3 = prs.slides[2]
set_shape_text(s3.shapes[2], "TECHNICAL APPROACH & DATA FLOW ARCHITECTURE", font_size_pt=18, bold=True)
set_shape_text(s3.shapes[12], "Multi-Source Ingestion & Fusion Streams", font_size_pt=13, bold=True)

s3_tech = (
    "• IMD Doppler Weather Radar (DWR) — Plan Position Indicator (PPI) reflectivity (dBZ) & Doppler radial velocity fields\n"
    "• ISRO MOSDAC / INSAT-3DR — Rapid-scan geostationary TIR-1 cloud-top cooling rates (dT/dt < -4K/15min) for early CI\n"
    "• Ground Lightning Detection Network — Real-time lightning strike density (strikes/km²/hr) & flash rate tracking\n"
    "• IMD AWS/ARG Surface Network — 1,165+ ground stations for in-situ thermodynamic verification & pressure drops\n"
    "• Next.js 14 & Leaflet/MapLibre Engine — High-performance GIS rendering 1–3 km hazard grids & vector motion\n"
    "• FastAPI Convective Engine — Sub-30s inference pipeline computing storm cell trajectories & countdown clocks"
)
set_shape_text(s3.shapes[7], s3_tech, font_size_pt=10)

set_shape_text(s3.shapes[17], "0–6h Convective Processing Pipeline", font_size_pt=12, bold=True)
s3_pipeline = (
    "• High-Frequency Ingestion: Automated async pipelines ingest radar sweeps (10 min), satellite frames (15 min), and lightning feeds.\n"
    "• QC & Multi-Sensor Fusion: Spatial alignment onto a unified 1–3 km grid, eliminating ground clutter and satellite parallax.\n"
    "• Early Convective Initiation (CI): Optical flow + satellite thermal infrared cooling rates detect developing cumulus updrafts.\n"
    "• Dynamic Storm Extrapolation: SCIT/TITAN-derived centroid tracking forecasts cell vectors and downburst corridors for 0–6 hours.\n"
    "• Parameter Estimation: Real-time calculation of MESH hail size (mm), hail probability (%), downburst kts, and cloudburst rates (≥100 mm/h).\n"
    "• Real-Time GIS & Live Countdown: Interactive hazard contours, storm motion vectors, and live T-minus arrival countdown timers."
)
set_shape_text(s3.shapes[18], s3_pipeline, font_size_pt=9.5)

# ==================== SLIDE 4 ====================
s4 = prs.slides[3]
set_shape_text(s4.shapes[1], "FEASIBILITY AND VIABILITY", font_size_pt=18, bold=True)

# Technical Feasibility
set_shape_text(s4.shapes[14], "Technical Feasibility", font_size_pt=12, bold=True)
s4_tech = (
    "• Operational Multi-Source Fusion: Bypasses computationally prohibitive NWP PDE-solvers with sub-30s real-time inference.\n"
    "• Standardized Protocol Integration: Direct ingestion of operational DWR NetCDF/HDF5 radar sweeps, MOSDAC HDF, and CAP XML.\n"
    "• Lightweight GPU WebGL GIS: Renders dynamic 1–3 km hazard polygons and live countdown clocks smoothly on any web browser."
)
set_shape_text(s4.shapes[11], s4_tech, font_size_pt=9.5)

# Operational Feasibility
set_shape_text(s4.shapes[13], "Operational Feasibility", font_size_pt=12, bold=True)
s4_oper = (
    "• Purpose-built for NCMRWF forecasters, State Disaster Management Authorities (SDMAs), and District Emergency Operation Centres.\n"
    "• Actionable Live Countdown Clocks: Replaces vague district forecasts with exact storm arrival countdowns (e.g., 'T-35 min to Hail Core')."
)
set_shape_text(s4.shapes[18], s4_oper, font_size_pt=9.5)

# Financial Feasibility
set_shape_text(s4.shapes[15], "Financial Feasibility", font_size_pt=12, bold=True)
s4_fin = (
    "• 100% Open-Source software stack (Next.js, Python/FastAPI, Leaflet, GeoTIFF, WebGL), eliminating costly GIS licensing fees.\n"
    "• Leverages existing national infrastructure: IMD DWR network, ISRO INSAT-3DR, and IITM lightning sensor network."
)
set_shape_text(s4.shapes[12], s4_fin, font_size_pt=9.5)

# Challenges and Risks
set_shape_text(s4.shapes[16], "Challenges and Risks", font_size_pt=12, bold=True)
s4_risks = (
    "• Radar Beam Blockage in Mountain Corridors: DWR beam blockage in complex Himalayan topography.\n"
    "• Non-Linear Storm Evolution: Cells undergoing rapid split/merge dynamics during violent convection.\n"
    "• Feed Disruption & Latency: Sporadic connectivity delays from remote radar and telemetry sites."
)
set_shape_text(s4.shapes[19], s4_risks, font_size_pt=9.5)

# Risks and Mitigation
set_shape_text(s4.shapes[17], "Risks and Mitigation", font_size_pt=12, bold=True)
s4_mitigation = (
    "• Multi-Source Triangulation: INSAT-3DR rapid cloud-top cooling and lightning density fill radar blind spots in mountain terrain.\n"
    "• Morphological Ensemble Tracking: Hybrid optical flow and centroid kinematics handle cell splitting and merger transitions.\n"
    "• Transparent Provenance: Telemetry latency and data source indicators displayed honestly on every monitored hazard cell."
)
set_shape_text(s4.shapes[20], s4_mitigation, font_size_pt=9.5)

# ==================== SLIDE 5 ====================
s5 = prs.slides[4]
set_shape_text(s5.shapes[1], "IMPACT AND BENEFITS", font_size_pt=18, bold=True)

s5_b1 = (
    "For NCMRWF, IMD & Disaster Authorities (NDMA / SDMAs)\n"
    "• Bridges the Critical 0–6h Gap: Closes the temporal gap where traditional NWP is too slow to alert on localized convective bursts.\n"
    "• 30–60 Min Early CI Advantage: Detects convective updrafts before destructive cloudburst and hail precipitation cores reach the ground.\n"
    "• Zero False Alarm Fatigue: Hyper-local 1–3 km hazard zones ensure alerts target only the exact communities in the path of the storm."
)
set_shape_text(s5.shapes[10], s5_b1, font_size_pt=10)

s5_b2 = (
    "For Aviation, Transport & Critical Infrastructure\n"
    "• Severe Downburst Warnings: Radial velocity shear detection provides low-altitude windshear alerts for airport runways and flight corridors.\n"
    "• Cloudburst Inundation Defense: Anticipates ≥100 mm/h deluge corridors, allowing railway and highway engineers to halt traffic pre-emptively.\n"
    "• Power Grid Protection: Real-time lightning strike density tracking safeguards high-voltage transmission substations."
)
set_shape_text(s5.shapes[12], s5_b2, font_size_pt=10)

s5_b3 = (
    "For Rural Agriculture & Farming Communities\n"
    "• Hail Risk & MESH Sizing: Accurate hail probability and expected stone diameter warnings allow farmers to shelter livestock and orchards.\n"
    "• Actionable Countdown Clocks: Simple, intuitive arrival countdowns (e.g., 'Thunderstorm arrival in 40 mins') on mobile-ready GIS maps.\n"
    "• Scalable Pan-India Architecture: Ready for deployment across all 36 States/UTs and vulnerable agro-climatic zones."
)
set_shape_text(s5.shapes[14], s5_b3, font_size_pt=10)

# ==================== SLIDE 6 ====================
s6 = prs.slides[5]
set_shape_text(s6.shapes[1], "RESEARCH, REFERENCES & BENCHMARKS", font_size_pt=18, bold=True)

set_shape_text(s6.shapes[8], "Authoritative Standards & Scientific Foundations", font_size_pt=12, bold=True)
s6_ref1 = (
    "• MoES & NCMRWF Convective Modeling: Framework for high-resolution mesoscale weather prediction & nowcasting.\n"
    "• IMD DWR Radar Algorithms: Severe storm identification, TITAN/SCIT cell tracking, and MESH hail estimation guidelines.\n"
    "• ISRO MOSDAC INSAT-3D/3DR: Geostationary rapid-scan multispectral cloud-top cooling and convective initiation techniques.\n"
    "• NDMA & WMO CAP Protocol: International Common Alerting Protocol (CAP v1.2) for authenticated multi-hazard alerting."
)
set_shape_text(s6.shapes[9], s6_ref1, font_size_pt=9.5)

set_shape_text(s6.shapes[10], "Benchmark Comparisons: Why This Platform?", font_size_pt=12, bold=True)
s6_ref2 = (
    "• Physics-Based NWP Models (WRF / NCUM): High computational overhead, 6–12 hr cycle times, and 4–12 km resolution; unable to resolve rapid 15-minute convective genesis in real-time.\n"
    "• Generic Commercial Weather Apps: Global statistical interpolation without Doppler velocity fields, hail MESH, or cloudburst thresholds.\n"
    "• Proposed Convective Nowcasting System: Real-time Multi-Source Data Fusion, 1–3 km hyper-local resolution, 0–6 hour lead time, dynamic severe parameters (hail, lightning, downburst, cloudburst), and live arrival countdown clocks."
)
set_shape_text(s6.shapes[11], s6_ref2, font_size_pt=9.5)

# ==================== SLIDE 7 ====================
s7 = prs.slides[6]
set_shape_text(s7.shapes[5], "SYSTEM ARCHITECTURE CREED & EVALUATION STANDARDS", font_size_pt=16, bold=True)
set_shape_text(s7.shapes[6], "Five Pillars Aligned with MoES / NCMRWF Problem Statement 26084", font_size_pt=12, bold=True)

s7_creed = (
    "1. MULTI-SOURCE DATA FUSION: Harmonizes DWR radar (reflectivity & velocity), INSAT-3DR satellite, and lightning networks.\n"
    "2. 1–3 KM HYPER-LOCAL SPATIAL SCALE: Pinpoint hazard zones replacing coarse district-wide text bulletins.\n"
    "3. 0–6 HOUR ACTIONABLE NOWCASTING: Fast kinematic extrapolation with live arrival countdown clocks for emergency response.\n"
    "4. COMPREHENSIVE CONVECTIVE PARAMETERS: Live hail probability & MESH, downburst velocity, lightning density, & cloudburst thresholds.\n"
    "5. PROVENANCE & RELIABILITY: 100% verified meteorological telemetry with zero synthetic data fabrication and explicit status metrics."
)
set_shape_text(s7.shapes[4], s7_creed, font_size_pt=10.5)

# Save to destination files
# 1. Save dedicated PS 26084 root file (always writable)
prs.save(dst_file_ps26084)
print(f"[OK] Saved PS 26084 presentation: {dst_file_ps26084}")

# 2. Save to public web folder (accessible via web app download)
prs.save(public_dst_file)
prs.save(public_dst_file_ps26084)
print(f"[OK] Saved web download presentation: {public_dst_file}")
print(f"[OK] Saved web download PS 26084 copy: {public_dst_file_ps26084}")

# 3. Attempt to save/overwrite original dst_file if not locked by PowerPoint
try:
    prs.save(dst_file)
    print(f"[OK] Saved root presentation: {dst_file}")
except Exception as e:
    print(f"! Note: '{dst_file}' is currently open in PowerPoint (exclusive file lock).")
    print(f"  Close PowerPoint to overwrite it, or view the freshly generated '{dst_file_ps26084}'.")



