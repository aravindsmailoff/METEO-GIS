# METEOGIS — Expert-Level Meteorological Analytics & Early Warning Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=flat&logo=leaflet)](https://leafletjs.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)

**MeteoGIS** is an enterprise-grade meteorological intelligence and early-warning GIS dashboard engineered for authoritative disaster monitoring, nowcasting, and flood vulnerability analysis across India.

---

## 🌟 Key Capabilities

### 1. Multi-Agency Remote Sensing & Satellite Ingestion
- **NASA VIIRS SNPP Live TrueColor**: Global cloud imagery rendered seamlessly with zero orbital seams or black tiles.
- **NASA GPM IMERG Precipitation Radar**: 30-minute global precipitation rate overlay calibrated for tropical rainfall.
- **ISRO MOSDAC / INSAT-3DR**: Rapid-scan infrared geostationary cloud top brightness temperature observations.
- **IMD Doppler Weather Radar (DWR) Network**: 34 operational radar stations with 250 km surveillance rings and 100 km quantitative precipitation estimation (QPE) zones.
- **ISRO Bhuvan / NRSC CartoDEM**: Digital elevation models, river drainage networks, and historical flood inundation corridors.

### 2. In-Situ Observational Network
- **1,165+ IMD AWS & ARG Stations**: Live telemetry providing ambient temperature, relative humidity, surface wind velocity, barometric pressure, and 1-hour / 24-hour rainfall accumulations.
- **Authoritative District Warnings**: Official India Meteorological Department (IMD) red, orange, yellow synoptic bulletins.
- **Hyperlocal District Nowcasts**: 3-hour Doppler-backed convective alerts with hazard classification (Thunderstorm, Squall, Hail, Heavy Rain).

### 3. Dynamic Hazard Countdown Engine
Unlike static timers, MeteoGIS calculates authentic, deterministic operational windows tailored to the specific nature of each threat:
- **🌀 Cyclone & Deep Depression**: 8–20 hour coastal landfall forecast and storm surge countdown window.
- **🚨 Cloudburst Flash-Flood**: 25–50 minute immediate valley evacuation and tributary surge window.
- **🧊 Hailstorm Alert**: 40–80 minute convective mesocyclone core lifespan.
- **🔴 Red / Orange Alert Nowcast**: 1–3 hour Doppler radar surveillance and synoptic bulletin countdown.
- **🌊 Pluvial Sump Depression**: Drainage basin surcharge and retention threshold monitoring.

### 4. Hazard Exposure & Low-Lying Vulnerability Analysis
- Interactive map inspection dynamically calculates terrain elevation, relative depression dips, drainage basins, and estimated populations at risk for the exact location clicked on the map.
- Real-time tracking of low-lying sump basins and inundation retention zones across all Indian states and districts.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16 (Turbopack, App Router)](https://nextjs.org/)
- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Mapping & Spatial GIS**: [Leaflet.js](https://leafletjs.com/), [NASA GIBS WMTS](https://earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs), [ISRO Bhuvan Web Services](https://bhuvan.nrsc.gov.in/)
- **Styling & UI**: Tailwind CSS, Lucide React, Glassmorphism & High-Contrast Mission-Critical Themes
- **Data Ingestion**: Multi-source REST APIs with caching and offline fallback models

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.18+ or v20+)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### Installation
```bash
# Clone the repository
git clone https://github.com/aravindsmailoff/METEO-GIS.git
cd METEO-GIS

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm start
```

---

## 🔒 Data Integrity & Provenance
MeteoGIS strictly prioritizes authoritative government and scientific data feeds (IMD, ISRO, NASA, WMO). Synthetic or fabricated predictions are strictly separated from ground observations.
