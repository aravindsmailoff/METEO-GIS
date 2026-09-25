-- ==============================================================================
-- NER LANDSLIDE RISKWATCH — VALHALLA DISASTER ROUTING & ROAD DISRUPTION SCHEMA
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Update status constraint on road_segments to support all disaster states
DO $$
BEGIN
    ALTER TABLE road_segments DROP CONSTRAINT IF EXISTS road_segments_status_check;
    ALTER TABLE road_segments ADD CONSTRAINT road_segments_status_check 
        CHECK (status IN ('OPEN', 'CAUTION', 'HIGH_RISK', 'RESTRICTED', 'BLOCKED', 'COMPLETELY_BLOCKED'));
EXCEPTION
    WHEN undefined_table THEN
        -- If road_segments does not exist yet, it will be created by database.sql
        NULL;
END $$;

-- 1. Active Disaster Incidents Table (Landslides, Rockfalls, Floods, Washouts)
CREATE TABLE IF NOT EXISTS disaster_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_code VARCHAR(50) UNIQUE NOT NULL,
    incident_type VARCHAR(50) NOT NULL, -- Landslide, Rockfall, Mudflow, Flash Flood, Bridge Failure
    state VARCHAR(50) NOT NULL,
    district VARCHAR(100) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL', 'CATASTROPHIC')),
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'UNDER_CLEARANCE', 'RESOLVED', 'MONITORED')),
    verified BOOLEAN DEFAULT TRUE,
    estimated_debris_m3 NUMERIC(10, 2) DEFAULT 0.0,
    estimated_clearance_hours NUMERIC(6, 1) DEFAULT 24.0,
    geom GEOMETRY(Geometry, 4326) NOT NULL, -- Point or Polygon
    buffer_radius_m NUMERIC(6, 1) DEFAULT 150.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_disaster_incidents_geom ON disaster_incidents USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_disaster_incidents_status ON disaster_incidents (status);

-- 2. Road Closures & Disaster Exclusions Table
CREATE TABLE IF NOT EXISTS road_closures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    road_segment_id UUID REFERENCES road_segments(id) ON DELETE CASCADE,
    disaster_incident_id UUID REFERENCES disaster_incidents(id) ON DELETE SET NULL,
    closure_reason VARCHAR(150) NOT NULL,
    risk_score NUMERIC(4, 3) DEFAULT 1.000, -- 0.000 to 1.000
    is_hard_closure BOOLEAN DEFAULT TRUE, -- TRUE = BLOCKED / completely impassable
    geom GEOMETRY(Geometry, 4326) NOT NULL, -- Exact point or polygon on road
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    effective_until TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_road_closures_geom ON road_closures USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_road_closures_active ON road_closures (active);

-- 3. Trigger Function: Automatically Map Landslide to Road Segments
CREATE OR REPLACE FUNCTION fn_map_incident_to_road_segments()
RETURNS TRIGGER AS $$
DECLARE
    affected_record RECORD;
    search_geom GEOMETRY;
BEGIN
    -- Create search buffer around incident (point or polygon)
    IF ST_GeometryType(NEW.geom) = 'ST_Point' THEN
        search_geom := ST_Buffer(NEW.geom::geography, COALESCE(NEW.buffer_radius_m, 150.0))::geometry;
    ELSE
        search_geom := ST_Buffer(NEW.geom::geography, 50.0)::geometry;
    END IF;

    -- Update intersecting or nearby road segments within search radius
    FOR affected_record IN
        SELECT id, road_name, geom
        FROM road_segments
        WHERE ST_DWithin(geom::geography, NEW.geom::geography, COALESCE(NEW.buffer_radius_m, 150.0))
           OR ST_Intersects(geom, search_geom)
    LOOP
        -- If critical/high severity incident, mark segment as BLOCKED
        IF NEW.severity IN ('HIGH', 'CRITICAL', 'CATASTROPHIC') THEN
            UPDATE road_segments
            SET status = 'BLOCKED',
                blockage_cause = NEW.incident_type || ': ' || NEW.incident_code,
                debris_volume_m3 = NEW.estimated_debris_m3,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = affected_record.id;

            -- Record in road_closures
            INSERT INTO road_closures (
                road_segment_id,
                disaster_incident_id,
                closure_reason,
                risk_score,
                is_hard_closure,
                geom,
                active
            ) VALUES (
                affected_record.id,
                NEW.id,
                NEW.incident_type || ' blockage at ' || affected_record.road_name,
                0.98,
                TRUE,
                ST_ClosestPoint(affected_record.geom, NEW.geom),
                TRUE
            );
        ELSIF NEW.severity = 'MODERATE' THEN
            UPDATE road_segments
            SET status = 'CAUTION',
                blockage_cause = NEW.incident_type || ' Warning: ' || NEW.incident_code,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = affected_record.id AND status = 'OPEN';
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_disaster_incident_road_mapping ON disaster_incidents;
CREATE TRIGGER trg_disaster_incident_road_mapping
AFTER INSERT OR UPDATE OF geom, severity, status
ON disaster_incidents
FOR EACH ROW
WHEN (NEW.status = 'ACTIVE')
EXECUTE FUNCTION fn_map_incident_to_road_segments();

-- 4. Spatial Function: Get Active Exclusions for Valhalla
CREATE OR REPLACE FUNCTION fn_get_valhalla_exclusions()
RETURNS TABLE (
    closure_id UUID,
    road_name VARCHAR,
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    polygon_geojson JSON,
    risk_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rc.id AS closure_id,
        COALESCE(rs.road_name, 'Disaster Zone') AS road_name,
        ST_Y(ST_Centroid(rc.geom)) AS lat,
        ST_X(ST_Centroid(rc.geom)) AS lon,
        ST_AsGeoJSON(ST_Buffer(rc.geom::geography, 100.0)::geometry)::json AS polygon_geojson,
        rc.risk_score
    FROM road_closures rc
    LEFT JOIN road_segments rs ON rs.id = rc.road_segment_id
    WHERE rc.active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- 5. Spatial Function: Assess Route Safety and Disaster Intersections
CREATE OR REPLACE FUNCTION fn_assess_route_safety(route_linestring_geojson TEXT)
RETURNS TABLE (
    total_blocked_segments INT,
    total_high_risk_segments INT,
    max_hazard_severity VARCHAR,
    exposed_population INT,
    affected_villages JSON,
    critical_facilities JSON
) AS $$
DECLARE
    route_geom GEOMETRY;
BEGIN
    route_geom := ST_SetSRID(ST_GeomFromGeoJSON(route_linestring_geojson), 4326);

    RETURN QUERY
    WITH affected_vils AS (
        SELECT 
            v.village_name,
            v.population,
            v.district
        FROM villages v
        WHERE ST_DWithin(v.geom::geography, route_geom::geography, 1000.0)
    ),
    affected_facs AS (
        SELECT 
            ci.facility_name,
            ci.facility_type,
            ci.district
        FROM critical_infrastructure ci
        WHERE ST_DWithin(ci.geom::geography, route_geom::geography, 800.0)
    ),
    blocked_segs AS (
        SELECT COUNT(*) as cnt
        FROM road_segments rs
        WHERE rs.status IN ('BLOCKED', 'COMPLETELY_BLOCKED')
          AND ST_Intersects(rs.geom, ST_Buffer(route_geom::geography, 50.0)::geometry)
    ),
    risk_segs AS (
        SELECT COUNT(*) as cnt
        FROM road_segments rs
        WHERE rs.status IN ('HIGH_RISK', 'CAUTION', 'RESTRICTED')
          AND ST_Intersects(rs.geom, ST_Buffer(route_geom::geography, 50.0)::geometry)
    )
    SELECT
        (SELECT cnt::INT FROM blocked_segs),
        (SELECT cnt::INT FROM risk_segs),
        'HIGH'::VARCHAR,
        COALESCE((SELECT SUM(population)::INT FROM affected_vils), 0),
        COALESCE((SELECT json_agg(row_to_json(affected_vils)) FROM affected_vils), '[]'::json),
        COALESCE((SELECT json_agg(row_to_json(affected_facs)) FROM affected_facs), '[]'::json);
END;
$$ LANGUAGE plpgsql;
