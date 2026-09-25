-- ==============================================================================
-- NER LANDSLIDE RISKWATCH — POSTGIS DATABASE SCHEMA & SPATIAL DEFINITIONS
-- Strict Separation of:
-- 1. Historical Landslides (ISRO/NRSC Atlas, GSI Inventory) - Training / History ONLY
-- 2. Landslide Predictions (Model Risk Inference) - Pure Risk Score, NOT road closure
-- 3. Confirmed Landslide Events (GSI, NDEM, NHAI, State PWD, District Admin)
-- 4. Physical Road Segments (OSM / PostGIS Base Geometry)
-- 5. Road Incidents (Confirmed Blockages / Disruption Status - Excludes from routing)
-- 6. Traffic Conditions (Congestion separate from physical blockages)
-- 7. Population, Demographics & Tourism Exposure
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Districts & Administrative Bounds (ISRO Bhuvan integration)
CREATE TABLE IF NOT EXISTS admin_districts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    district_name VARCHAR(100) NOT NULL,
    state_name VARCHAR(100) NOT NULL,
    bhuvan_code VARCHAR(50),
    geom GEOMETRY(MultiPolygon, 4326),
    resident_population INT,
    census_year INT DEFAULT 2011,
    vulnerability_index NUMERIC(3, 2) DEFAULT 0.50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_districts_geom ON admin_districts USING GIST (geom);

-- 2. Historical Landslide Inventory (ISRO/NRSC Landslide Atlas & GSI Historical Records)
-- Used exclusively for training, validation, and historical risk context.
-- NEVER triggers an active road closure.
CREATE TABLE IF NOT EXISTS historical_landslides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_name VARCHAR(150) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,
    source VARCHAR(100) NOT NULL, -- e.g. 'ISRO/NRSC Landslide Atlas of India', 'GSI Historical Inventory'
    confidence VARCHAR(30) DEFAULT 'VERIFIED_HISTORICAL',
    trigger_type VARCHAR(100) DEFAULT 'High Intensity Monsoon Rainfall',
    estimated_volume_m3 NUMERIC(10, 2),
    fatalities INT DEFAULT 0,
    geom GEOMETRY(Point, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_historical_landslides_geom ON historical_landslides USING GIST (geom);

-- 3. Model Landslide Risk Predictions (ML / Susceptibility Engine Output)
-- Continuous risk rating. NEVER automatically closes a road.
CREATE TABLE IF NOT EXISTS landslide_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_name VARCHAR(150) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    risk_score NUMERIC(4, 3) NOT NULL, -- 0.000 to 1.000
    risk_level VARCHAR(20) CHECK (risk_level IN ('Low', 'Moderate', 'High', 'Critical')),
    model_version VARCHAR(50) DEFAULT 'XGB-NER-v2.6',
    features_json JSONB,
    contributing_factors JSONB,
    geom GEOMETRY(Polygon, 4326),
    centroid_geom GEOMETRY(Point, 4326),
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_landslide_predictions_geom ON landslide_predictions USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_landslide_predictions_level ON landslide_predictions(risk_level);

-- 4. Confirmed / Detected Landslide Events (Authoritative Real-Time Detections)
-- Verified reports from GSI, NDEM, ISRO, NHAI, State PWD, District Admin
CREATE TABLE IF NOT EXISTS confirmed_landslide_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_code VARCHAR(50) UNIQUE NOT NULL,
    event_name VARCHAR(150) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    source VARCHAR(100) NOT NULL, -- 'GSI', 'ISRO/NRSC', 'NDEM', 'NHAI', 'State PWD', 'District Administration'
    verification_status VARCHAR(30) CHECK (verification_status IN ('VERIFIED', 'REPORTED', 'UNVERIFIED')) DEFAULT 'VERIFIED',
    confidence NUMERIC(3, 2) DEFAULT 0.95,
    event_type VARCHAR(50) NOT NULL, -- 'Debris Flow', 'Rockfall', 'Rotational Slump', 'Mudflow'
    estimated_debris_m3 NUMERIC(10, 2),
    geom GEOMETRY(Point, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_confirmed_landslides_geom ON confirmed_landslide_events USING GIST (geom);

-- 5. Physical Road Networks (OpenStreetMap / PostGIS Base Geometry)
CREATE TABLE IF NOT EXISTS road_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    road_id VARCHAR(50) UNIQUE NOT NULL,
    road_name VARCHAR(150) NOT NULL,
    road_class VARCHAR(50) NOT NULL, -- 'National Highway', 'State Highway', 'Major District Road', 'Rural Road'
    surface VARCHAR(50) DEFAULT 'Paved Asphalt',
    state VARCHAR(50) NOT NULL,
    geom GEOMETRY(LineString, 4326) NOT NULL,
    source VARCHAR(100) DEFAULT 'OpenStreetMap / NHAI',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_road_segments_geom ON road_segments USING GIST (geom);

-- 6. Road Incidents & Confirmed Blockages (Dynamic Disruption Layer)
-- ONLY an active 'BLOCKED' status in this table excludes a road from routing.
CREATE TABLE IF NOT EXISTS road_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id VARCHAR(50) UNIQUE NOT NULL,
    road_segment_id UUID REFERENCES road_segments(id) ON DELETE SET NULL,
    road_name VARCHAR(150) NOT NULL,
    geom GEOMETRY(Geometry, 4326) NOT NULL, -- Point of incident or LineString segment affected
    cause VARCHAR(50) CHECK (cause IN ('LANDSLIDE', 'DEBRIS', 'FLOOD', 'ACCIDENT', 'ROAD_WORK', 'OTHER')) NOT NULL,
    status VARCHAR(30) CHECK (status IN ('OPEN', 'RESTRICTED', 'BLOCKED', 'UNKNOWN')) NOT NULL,
    source VARCHAR(100) NOT NULL, -- 'East Khasi Hills District Admin', 'NHAI Live Feed', 'Meghalaya PWD', 'Traffic Police'
    reported_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_time TIMESTAMP WITH TIME ZONE,
    start_time TIMESTAMP WITH TIME ZONE,
    expected_end_time TIMESTAMP WITH TIME ZONE,
    verification_status VARCHAR(30) CHECK (verification_status IN ('VERIFIED', 'REPORTED', 'UNVERIFIED')) DEFAULT 'VERIFIED',
    authority VARCHAR(100) NOT NULL,
    notes TEXT,
    active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_road_incidents_geom ON road_incidents USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_road_incidents_status ON road_incidents(status, active);

-- 7. Traffic Conditions (Congestion separate from physical blockages)
CREATE TABLE IF NOT EXISTS traffic_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    road_segment_id UUID REFERENCES road_segments(id) ON DELETE CASCADE,
    congestion_level VARCHAR(20) CHECK (congestion_level IN ('FREE_FLOW', 'MODERATE', 'HEAVY', 'STANDSTILL')),
    average_speed_kmh NUMERIC(5, 1),
    free_flow_speed_kmh NUMERIC(5, 1),
    delay_seconds INT DEFAULT 0,
    source VARCHAR(100) DEFAULT 'Authorized Traffic Sensor / PWD Feed',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Demographics & Authoritative Population Data
CREATE TABLE IF NOT EXISTS population_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    district_name VARCHAR(100) NOT NULL,
    state_name VARCHAR(100) NOT NULL,
    resident_population INT NOT NULL,
    reference_year INT NOT NULL DEFAULT 2011,
    source VARCHAR(100) NOT NULL DEFAULT 'Census of India',
    current_population_available BOOLEAN DEFAULT FALSE,
    current_population_estimate INT,
    geom GEOMETRY(MultiPolygon, 4326)
);

-- 9. Tourism & Visitor Information
CREATE TABLE IF NOT EXISTS tourism_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    district_name VARCHAR(100) NOT NULL,
    annual_tourist_arrivals INT NOT NULL,
    peak_season_monthly_arrivals INT,
    period VARCHAR(50) NOT NULL DEFAULT 'Annual Tourism Statistics 2024-2025',
    source VARCHAR(100) NOT NULL DEFAULT 'Directorate of Tourism, Govt of Meghalaya',
    real_time_count_available BOOLEAN DEFAULT FALSE,
    real_time_count INT
);

-- 10. Telemetry Rain Gauges (IMD AWS & NASA GPM)
CREATE TABLE IF NOT EXISTS rain_gauges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id VARCHAR(50) UNIQUE NOT NULL,
    station_name VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,
    rainfall_1h_mm NUMERIC(5, 2) DEFAULT 0.00,
    rainfall_24h_mm NUMERIC(6, 2) DEFAULT 0.00,
    spi_30d NUMERIC(4, 2) DEFAULT 0.00,
    source VARCHAR(100) DEFAULT 'IMD Automatic Weather Station',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rain_gauges_geom ON rain_gauges USING GIST (geom);

-- 11. Isolated Hamlets & Relief Shelters
CREATE TABLE IF NOT EXISTS villages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    village_name VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL DEFAULT 'Meghalaya',
    population INT NOT NULL,
    elevation_m INT NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,
    isolation_probability NUMERIC(4, 3) DEFAULT 0.000,
    supplies_remaining_hours INT DEFAULT 72,
    medical_staff_available BOOLEAN DEFAULT TRUE,
    recommended_bypass TEXT,
    bypass_distance_km NUMERIC(6, 2),
    nearest_shelter_name VARCHAR(150),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_villages_geom ON villages USING GIST (geom);

-- 12. Critical Infrastructure & Relief Shelters
CREATE TABLE IF NOT EXISTS critical_infrastructure (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_name VARCHAR(100) NOT NULL,
    facility_type VARCHAR(50) NOT NULL, -- Relief Shelter, Hospital, Helipad, Bridge
    district VARCHAR(100) NOT NULL,
    capacity INT,
    current_occupancy INT DEFAULT 0,
    medical_staff_available BOOLEAN DEFAULT TRUE,
    geom GEOMETRY(Point, 4326) NOT NULL,
    status VARCHAR(20) DEFAULT 'OPERATIONAL'
);
CREATE INDEX IF NOT EXISTS idx_infrastructure_geom ON critical_infrastructure USING GIST (geom);

-- 13. Deployed Emergency Response Teams (NDRF / SDRF)
CREATE TABLE IF NOT EXISTS response_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_callsign VARCHAR(50) NOT NULL,
    unit_type VARCHAR(50) NOT NULL, -- NDRF Battalion, SDRF Quick Response, BRO Clearance
    commander VARCHAR(100),
    personnel_count INT NOT NULL,
    assigned_sector VARCHAR(100) NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,
    status VARCHAR(50) NOT NULL,
    last_ping_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_response_teams_geom ON response_teams USING GIST (geom);

-- 14. Crowdsourced Citizen Reports
CREATE TABLE IF NOT EXISTS citizen_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_phone VARCHAR(20),
    incident_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    description TEXT,
    photo_url VARCHAR(255),
    casualties_reported INT DEFAULT 0,
    road_blocked BOOLEAN DEFAULT FALSE,
    geom GEOMETRY(Point, 4326) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING_VERIFICATION',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_geom ON citizen_reports USING GIST (geom);

-- 15. OASIS Common Alerting Protocol (CAP) Broadcasts
CREATE TABLE IF NOT EXISTS cap_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cap_identifier VARCHAR(100) UNIQUE NOT NULL,
    sender VARCHAR(100) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Actual',
    msg_type VARCHAR(20) DEFAULT 'Alert',
    scope VARCHAR(20) DEFAULT 'Public',
    urgency VARCHAR(20) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    certainty VARCHAR(20) NOT NULL,
    event_category VARCHAR(50) DEFAULT 'Geo',
    headline TEXT NOT NULL,
    description TEXT NOT NULL,
    instruction TEXT,
    affected_districts JSONB,
    channels_dispatched JSONB
);

-- 16. IMD Hydromet Derived Hazard Events (Thunderstorm, Hail, Cloudburst, Background)
CREATE TABLE IF NOT EXISTS hazard_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    district_id VARCHAR(50) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    category VARCHAR(30) CHECK (category IN ('THUNDERSTORM', 'HAIL', 'CLOUDBURST', 'BACKGROUND')) NOT NULL,
    category_labels TEXT[] NOT NULL DEFAULT '{}',
    severity VARCHAR(20) CHECK (severity IN ('RED', 'ORANGE', 'YELLOW', 'GREEN')) NOT NULL,
    is_severe BOOLEAN NOT NULL DEFAULT FALSE,
    cloudburst_status VARCHAR(20) CHECK (cloudburst_status IN ('NONE', 'ADVISORY', 'CONFIRMED')) DEFAULT 'NONE',
    triggering_station VARCHAR(100),
    rainfall_rate_mm_hr NUMERIC(6, 2),
    window_start TIMESTAMP WITH TIME ZONE,
    window_end TIMESTAMP WITH TIME ZONE,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    source_endpoint VARCHAR(50) NOT NULL, -- 'districtnowcast', 'districtwarning', 'aws_data'
    confidence VARCHAR(20) CHECK (confidence IN ('HIGH', 'MEDIUM', 'LOW')) NOT NULL DEFAULT 'HIGH',
    raw_payload JSONB NOT NULL DEFAULT '{}',
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_hazard_events_category ON hazard_events(category);
CREATE INDEX IF NOT EXISTS idx_hazard_events_severity ON hazard_events(severity);
CREATE INDEX IF NOT EXISTS idx_hazard_events_valid_until ON hazard_events(valid_until);
CREATE INDEX IF NOT EXISTS idx_hazard_events_geom ON hazard_events USING GIST (geom);

-- 17. Pluvial Flood Risk & Low-Lying Vulnerability Layer (DEM Minima + Live Rainfall)
CREATE TABLE IF NOT EXISTS pluvial_flood_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_name VARCHAR(150) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    dem_elevation_m NUMERIC(6, 2) NOT NULL,
    relative_depression_m NUMERIC(5, 2) NOT NULL,
    live_rain_rate_mm_h NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
    cumulative_rain_24h_mm NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
    pluvial_flood_risk VARCHAR(20) CHECK (pluvial_flood_risk IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')) NOT NULL,
    trend VARCHAR(20) DEFAULT 'STABLE',
    confidence VARCHAR(20) DEFAULT 'HIGH',
    drainage_outlet_status VARCHAR(50) DEFAULT 'NATURAL_OVERFLOW',
    geom GEOMETRY(Polygon, 4326),
    centroid_geom GEOMETRY(Point, 4326),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pluvial_flood_zones_geom ON pluvial_flood_zones USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_pluvial_flood_risk ON pluvial_flood_zones(pluvial_flood_risk);

