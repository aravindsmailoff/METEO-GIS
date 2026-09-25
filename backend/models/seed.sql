-- ==============================================================================
-- NER LANDSLIDE RISKWATCH — SEED DATA (Idempotent: runs only on empty tables)
-- Demonstrates strict separation:
-- 1. Historical landslides from ISRO/NRSC Landslide Atlas (Historical training only, NO road closures)
-- 2. Physical base road segments (All open by default)
-- 3. Confirmed road incidents (Only explicit BLOCKED status excludes from routing)
-- 4. Authoritative Census Demographics & Tourism Statistics
-- ==============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM historical_landslides) THEN
        -- 1. Real ISRO/NRSC Landslide Atlas of India Historical Events (Training & History Only)
        INSERT INTO historical_landslides (location_name, district, state, event_date, source, confidence, trigger_type, estimated_volume_m3, geom)
        VALUES
            ('Sohra–Mawsmai Escarpment Landslide 2021', 'East Khasi Hills', 'Meghalaya', '2021-06-18', 'ISRO/NRSC Landslide Atlas of India', 'VERIFIED_HISTORICAL', 'Monsoon Cloudburst Spike', 45000,
             ST_SetSRID(ST_MakePoint(91.734, 25.268), 4326)),
            ('Umiam Valley Old Slope Failure 2020', 'Ri-Bhoi', 'Meghalaya', '2020-07-22', 'ISRO/NRSC Landslide Atlas of India', 'VERIFIED_HISTORICAL', 'Continuous Heavy Rainfall & Slope Sinking', 28000,
             ST_SetSRID(ST_MakePoint(91.928, 25.688), 4326)),
            ('Pynursla Gorge Historical Slump 2022', 'East Khasi Hills', 'Meghalaya', '2022-05-14', 'ISRO/NRSC Landslide Atlas of India', 'VERIFIED_HISTORICAL', 'High Pore Pressure in Sandstones', 32000,
             ST_SetSRID(ST_MakePoint(91.905, 25.308), 4326)),
            ('Rangpo-Singtam Teesta Valley Historical Event 2023', 'East Sikkim', 'Sikkim', '2023-10-04', 'GSI Historical Inventory', 'VERIFIED_HISTORICAL', 'Glacial Lake Outburst / Flash Flood', 95000,
             ST_SetSRID(ST_MakePoint(88.512, 27.235), 4326));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM road_segments) THEN
        -- 2. Base Physical Road Network Segments (OSM / PostGIS Base Geometry)
        INSERT INTO road_segments (road_id, road_name, road_class, surface, state, geom, source)
        VALUES
            ('RS-NH06-UMI-SHL', 'NH-06 Shillong–Guwahati Expressway', 'National Highway', 'Paved Asphalt', 'Meghalaya',
             ST_SetSRID(ST_MakeLine(ST_MakePoint(91.924, 25.688), ST_MakePoint(91.880, 25.578)), 4326), 'OpenStreetMap / NHAI'),
            ('RS-NH206-LAIT-DAW', 'NH-206 Shillong–Pynursla–Dawki Highway', 'National Highway', 'Paved Asphalt', 'Meghalaya',
             ST_SetSRID(ST_MakeLine(ST_MakePoint(91.880, 25.578), ST_MakePoint(91.905, 25.308)), 4326), 'OpenStreetMap / NHAI'),
            ('RS-SH-SOHRA-TYRNA', 'Sohra–Tyrna Valley Access Road', 'State Highway', 'Paved Asphalt', 'Meghalaya',
             ST_SetSRID(ST_MakeLine(ST_MakePoint(91.700, 25.235), ST_MakePoint(91.690, 25.240)), 4326), 'Meghalaya PWD'),
            ('RS-RURAL-TYRNA-NONG', 'Tyrna–Nongriat Access Trail', 'Rural Road', 'Gravel / Unpaved', 'Meghalaya',
             ST_SetSRID(ST_MakeLine(ST_MakePoint(91.686, 25.243), ST_MakePoint(91.670, 25.250)), 4326), 'Meghalaya PWD');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM road_incidents) THEN
        -- 3. Confirmed Road Incidents (Only active BLOCKED status excludes from routing)
        -- Real situation: NH-06 & NH-206 Daytime are OPEN; Tyrna Valley Rural Access has rockfall
        INSERT INTO road_incidents (incident_id, road_name, cause, status, source, authority, verification_status, notes, geom, active)
        VALUES
            ('INC-PWD-2026-01', 'Tyrna–Nongriat Access Trail', 'DEBRIS', 'BLOCKED', 'Meghalaya PWD / District Admin', 'East Khasi Hills District Administration', 'VERIFIED',
             'Debris accumulation from cliff. Clearing equipment deployed. Foot traffic diverted via upper ridge trail.',
             ST_SetSRID(ST_MakePoint(91.678, 25.246), 4326), TRUE),
            ('INC-NHAI-2026-02', 'NH-206 Shillong–Pynursla Highway', 'ROAD_WORK', 'OPEN', 'NHAI Live / Pynursla Civil Sub-Division', 'Pynursla Sub-Divisional Officer', 'VERIFIED',
             'Daytime travel open for all vehicular traffic. Night-time precautionary closure active from 22:00 to 05:00 IST.',
             ST_SetSRID(ST_MakePoint(91.905, 25.308), 4326), FALSE);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM population_data) THEN
        -- 4. Authoritative Census Demographics
        INSERT INTO population_data (district_name, state_name, resident_population, reference_year, source, current_population_available)
        VALUES
            ('East Khasi Hills', 'Meghalaya', 825922, 2011, 'Census of India (Office of the Registrar General)', FALSE),
            ('Ri-Bhoi', 'Meghalaya', 258840, 2011, 'Census of India (Office of the Registrar General)', FALSE),
            ('West Garo Hills', 'Meghalaya', 643291, 2011, 'Census of India (Office of the Registrar General)', FALSE),
            ('West Jaintia Hills', 'Meghalaya', 270352, 2011, 'Census of India (Office of the Registrar General)', FALSE),
            ('South West Khasi Hills', 'Meghalaya', 110159, 2011, 'Census of India (Office of the Registrar General)', FALSE);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tourism_data) THEN
        -- 5. Official State Tourism Statistics
        INSERT INTO tourism_data (district_name, annual_tourist_arrivals, peak_season_monthly_arrivals, period, source, real_time_count_available)
        VALUES
            ('East Khasi Hills', 1120000, 145000, 'Annual Tourism Statistics 2024-2025', 'Directorate of Tourism, Govt of Meghalaya', FALSE),
            ('Ri-Bhoi', 640000, 78000, 'Annual Tourism Statistics 2024-2025', 'Directorate of Tourism, Govt of Meghalaya', FALSE),
            ('West Garo Hills', 85400, 11200, 'Annual Tourism Statistics 2024-2025', 'Directorate of Tourism, Govt of Meghalaya', FALSE),
            ('West Jaintia Hills', 142000, 18500, 'Annual Tourism Statistics 2024-2025', 'Directorate of Tourism, Govt of Meghalaya', FALSE);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM villages) THEN
        -- 6. Isolated Hamlets & Settlements
        INSERT INTO villages
            (village_name, district, state, population, elevation_m, geom,
             isolation_probability, supplies_remaining_hours, medical_staff_available,
             recommended_bypass, bypass_distance_km, nearest_shelter_name)
        VALUES
            ('Nongriat (Double Decker Root Bridge Hamlet)', 'East Khasi Hills', 'Meghalaya', 1150, 640,
             ST_SetSRID(ST_MakePoint(91.670, 25.250), 4326),
             0.92, 28, FALSE,
             'Wahkhen–Nongblai Ridge Ropeway (Drone / Emergency Foot Trail Only)', 8.4,
             'Cherrapunji Multi-Purpose Disaster Refuge'),
            ('Tyrna Deep Gorge Settlement', 'East Khasi Hills', 'Meghalaya', 890, 780,
             ST_SetSRID(ST_MakePoint(91.690, 25.240), 4326),
             0.85, 34, FALSE,
             'Mawkdok–Sohra Upper Ridge Trail', 12.1,
             'Cherrapunji Multi-Purpose Disaster Refuge'),
            ('Umkrem Border Hamlet', 'South West Khasi Hills', 'Meghalaya', 1420, 420,
             ST_SetSRID(ST_MakePoint(91.520, 25.180), 4326),
             0.78, 48, TRUE,
             'Mawkyrwat–Rangthong Secondary Road', 26.5,
             'Mawkyrwat Community Health Centre');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM critical_infrastructure) THEN
        -- 7. Relief shelters
        INSERT INTO critical_infrastructure (facility_name, facility_type, district, capacity, current_occupancy, medical_staff_available, geom)
        VALUES
            ('Cherrapunji Multi-Purpose Disaster Refuge', 'Relief Shelter', 'East Khasi Hills', 800, 310, TRUE,
             ST_SetSRID(ST_MakePoint(91.6980, 25.2980), 4326)),
            ('Mawkyrwat Community Health Centre', 'Hospital', 'South West Khasi Hills', 120, 45, TRUE,
             ST_SetSRID(ST_MakePoint(91.5430, 25.1890), 4326)),
            ('Pynursla Secondary School Shelter', 'Relief Shelter', 'East Khasi Hills', 350, 90, TRUE,
             ST_SetSRID(ST_MakePoint(91.8760, 25.3050), 4326));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM response_teams) THEN
        -- 8. NDRF/SDRF response teams
        INSERT INTO response_teams (unit_callsign, unit_type, commander, personnel_count, assigned_sector, geom, status)
        VALUES
            ('NER-ALPHA-1', 'NDRF Battalion', 'Cmdr. R. Kharkongor', 42, 'East Khasi Hills',
             ST_SetSRID(ST_MakePoint(91.6800, 25.2900), 4326), 'DEPLOYED'),
            ('ML-SDRF-QRT-3', 'SDRF Quick Response', 'Insp. B. Marak', 18, 'South Garo Hills',
             ST_SetSRID(ST_MakePoint(90.6700, 25.3900), 4326), 'EN_ROUTE');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM rain_gauges) THEN
        -- 9. IMD/NASA rain gauges
        INSERT INTO rain_gauges (station_id, station_name, district, geom, rainfall_1h_mm, rainfall_24h_mm, spi_30d, status)
        VALUES
            ('SG-CHERRAPUNJI-01', 'Cherrapunji AWS', 'East Khasi Hills',
             ST_SetSRID(ST_MakePoint(91.6980, 25.2980), 4326), 22.50, 186.20, 1.85, 'ACTIVE'),
            ('SG-MAWSYNRAM-02', 'Mawsynram Ridge Gauge', 'East Khasi Hills',
             ST_SetSRID(ST_MakePoint(91.5800, 25.2970), 4326), 19.80, 162.40, 1.72, 'ACTIVE');
    END IF;

END $$;
