"""
NER Landslide RiskWatch — PostGIS Database Layer
SQLAlchemy 2.0 engine/session management with connection health probing,
schema bootstrap, and graceful degradation when the database is unreachable.
"""

import os
import json
import threading
from contextlib import contextmanager
from typing import Any, Dict, List, Optional

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@localhost:5432/ner_landslide",
)

engine: Optional[Engine] = None
_SessionFactory: Optional[sessionmaker] = None
_last_error: Optional[str] = None
_lock = threading.Lock()


def _get_engine() -> Optional[Engine]:
    """Lazily create the engine; returns None if the URL/driver is unusable."""
    global engine, _SessionFactory, _last_error
    if engine is not None:
        return engine
    with _lock:
        if engine is not None:
            return engine
        try:
            engine = create_engine(
                DATABASE_URL,
                pool_pre_ping=True,
                pool_size=5,
                max_overflow=10,
                connect_args={"connect_timeout": 3},
            )
            # Force an actual TCP connect; a bad URL fails here, not later.
            with engine.connect():
                pass
            _SessionFactory = sessionmaker(bind=engine, expire_on_commit=False)
            return engine
        except Exception as exc:  # driver missing, bad URL, DB down, auth failure...
            _last_error = str(exc).split("\n")[0][:300]
            engine = None
            _SessionFactory = None
            return None


def get_last_connection_error() -> Optional[str]:
    return _last_error


def is_connected() -> bool:
    """True only if a live PostGIS round-trip succeeds right now."""
    eng = _get_engine()
    if eng is None:
        return False
    try:
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except SQLAlchemyError:
        return False


def postgis_available() -> bool:
    """True if the connected database actually has the PostGIS extension."""
    eng = _get_engine()
    if eng is None:
        return False
    try:
        with eng.connect() as conn:
            row = conn.execute(
                text("SELECT COUNT(*) FROM pg_extension WHERE extname = 'postgis'")
            ).scalar()
        return bool(row)
    except SQLAlchemyError:
        return False


def get_session():
    """Context manager yielding a Session, or None if the DB is unreachable.

    Usage:
        with get_session() as session:
            if session is None:
                ...  # fall back to static data
    """
    factory = None
    if _get_engine() is not None:
        factory = _SessionFactory
    if factory is None:
        return _NullSessionContext()
    return _SessionContext(factory)


class _SessionContext:
    def __init__(self, factory: sessionmaker):
        self._factory = factory

    def __enter__(self) -> Optional[Session]:
        try:
            self._session = self._factory()
            return self._session
        except SQLAlchemyError:
            self._session = None
            return None

    def __exit__(self, exc_type, exc_val, exc_tb) -> bool:
        if self._session is not None:
            self._session.close()
        return False  # do not swallow caller exceptions


class _NullSessionContext:
    def __enter__(self) -> Optional[Session]:
        return None

    def __exit__(self, exc_type, exc_val, exc_tb) -> bool:
        return False


def bootstrap_schema() -> bool:
    """Apply backend/models/database.sql and seed data if the DB is reachable.

    Safe to call at startup — idempotent (schema file uses IF NOT EXISTS).
    """
    eng = _get_engine()
    if eng is None:
        return False

    schema_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "models",
        "database.sql",
    )
    valhalla_schema_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "models",
        "valhalla_routing.sql",
    )
    try:
        # Extension creation may require superuser; the schema file re-creates
        # it with IF NOT EXISTS, and CREATE TABLE will fail if truly absent.
        _execute_raw_sql("CREATE EXTENSION IF NOT EXISTS postgis")
    except SQLAlchemyError:
        pass

    db_ok = _execute_raw_sql_file(schema_path)
    val_ok = _execute_raw_sql_file(valhalla_schema_path)
    return db_ok and val_ok


def seed_initial_data() -> bool:
    """Load seed rows (villages, gauges, infrastructure, teams) if tables are empty."""
    seed_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "models",
        "seed.sql",
    )
    return _execute_raw_sql_file(seed_path)


def _execute_raw_sql_file(path: str) -> bool:
    """Run a .sql file over a raw psycopg2 connection (handles DO $$ blocks etc.)."""
    eng = _get_engine()
    if eng is None:
        return False
    try:
        with open(path, "r", encoding="utf-8") as fh:
            raw_sql = fh.read()
    except OSError:
        return False
    try:
        raw_conn = eng.raw_connection()
        try:
            cursor = raw_conn.cursor()
            cursor.execute(raw_sql)
            raw_conn.commit()
            cursor.close()
        finally:
            raw_conn.close()
        return True
    except SQLAlchemyError as exc:
        _last_error = f"{os.path.basename(path)} failed: {str(exc).splitlines()[0][:200]}"
        return False


def _execute_raw_sql(sql: str) -> None:
    """Run a single statement over a raw psycopg2 connection."""
    eng = _get_engine()
    if eng is None:
        return
    raw_conn = eng.raw_connection()
    try:
        cursor = raw_conn.cursor()
        cursor.execute(sql)
        raw_conn.commit()
        cursor.close()
    finally:
        raw_conn.close()


def fetch_villages_with_isolation() -> Optional[List[Dict[str, Any]]]:
    """Read villages joined with their blocked road segment for the isolation view.

    Returns None when the database is unreachable (caller falls back to static data).
    """
    sql = text(
        """
        SELECT
            v.id::text,
            v.village_name,
            v.district,
            v.state,
            v.population,
            v.elevation_m,
            ST_Y(v.geom) AS lat,
            ST_X(v.geom) AS lng,
            v.isolation_probability,
            v.supplies_remaining_hours,
            v.medical_staff_available,
            v.recommended_bypass,
            v.bypass_distance_km,
            v.nearest_shelter_name,
            COALESCE(r.road_name, 'Unknown approach road') AS blocked_road,
            CASE
                WHEN v.isolation_probability >= 0.75 THEN 'CRITICAL_ISOLATION'
                WHEN v.isolation_probability >= 0.50 THEN 'HIGH_RISK'
                WHEN v.isolation_probability >= 0.30 THEN 'MODERATE_RISK'
                ELSE 'ACCESSIBLE'
            END AS status,
            'Live PostGIS sync' AS last_contact
        FROM villages v
        LEFT JOIN road_segments r
            ON r.id = (
                SELECT r2.id FROM road_segments r2
                WHERE r2.status IN ('RESTRICTED', 'BLOCKED')
                ORDER BY ST_Distance(r2.geom, v.geom) ASC
                LIMIT 1
            )
        ORDER BY v.isolation_probability DESC
        """
    )
    eng = _get_engine()
    if eng is None:
        return None
    try:
        with eng.connect() as conn:
            result = conn.execute(sql)
            rows = result.mappings().all()
        return [dict(row) for row in rows]
    except SQLAlchemyError:
        return None


def insert_citizen_report(report: Dict[str, Any]) -> Optional[str]:
    """Persist a citizen report; returns the generated report_id or None on failure."""
    eng = _get_engine()
    if eng is None:
        return None
    sql = text(
        """
        INSERT INTO citizen_reports
            (reporter_phone, incident_type, severity, description,
             road_blocked, casualties_reported, geom, status)
        VALUES
            (:reporter_phone, :incident_type, :severity, :description,
             :road_blocked, :casualties_reported,
             ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), 'PENDING_VERIFICATION')
        RETURNING id::text
        """
    )
    try:
        with eng.begin() as conn:
            report_id = conn.execute(sql, report).scalar()
        return report_id
    except SQLAlchemyError:
        return None


def insert_sos_beacon(payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Persist an SOS: citizen_reports row + auto-generated CAP broadcast in one transaction.

    Returns {'report_id', 'alert_id'} on success, None if the DB is unreachable.
    """
    eng = _get_engine()
    if eng is None:
        return None

    accuracy = payload.get("accuracy_m")
    location_text = f"GPS {payload.get('lat'):.5f}, {payload.get('lng'):.5f}" + (
        f" (±{accuracy:.0f} m)" if accuracy else ""
    )
    report_row = {
        "reporter_phone": payload.get("reporter_phone") or "",
        "incident_type": "SOS Distress Beacon",
        "severity": "CRITICAL",
        "description": (
            f"One-click SOS triggered from citizen portal. "
            f"Accuracy ±{accuracy:.0f} m. Device clock {payload.get('triggered_at_device')}."
            if accuracy
            else f"One-click SOS triggered from citizen portal. Device clock {payload.get('triggered_at_device')}."
        ),
        "road_blocked": False,
        "casualties_reported": 0,
        "lat": payload["lat"],
        "lng": payload["lng"],
    }
    alert_id = f"NER-CAP-SOS-{os.urandom(3).hex().upper()}"

    sql_report = text(
        """
        INSERT INTO citizen_reports
            (reporter_phone, incident_type, severity, description,
             road_blocked, casualties_reported, geom, status)
        VALUES
            (:reporter_phone, :incident_type, :severity, :description,
             :road_blocked, :casualties_reported,
             ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), 'SOS_ACTIVE')
        RETURNING id::text
        """
    )
    sql_alert = text(
        """
        INSERT INTO cap_alerts
            (cap_identifier, sender, urgency, severity, certainty,
             headline, description, instruction, affected_districts, channels_dispatched)
        VALUES
            (:cap_identifier, :sender, 'Immediate', 'Extreme', 'Observed',
             :headline, :description, :instruction,
             :affected_districts::jsonb, :channels::jsonb)
        """
    )
    try:
        with eng.begin() as conn:
            report_id = conn.execute(sql_report, report_row).scalar()
            conn.execute(
                sql_alert,
                {
                    "cap_identifier": alert_id,
                    "sender": "ner-sos-beacon@ndma.gov.in",
                    "headline": "SOS Distress Beacon Activated",
                    "description": (
                        f"Citizen SOS at {location_text}. "
                        "Immediate field verification and rescue dispatch required."
                    ),
                    "instruction": (
                        "Dispatch nearest NDRF/SDRF quick response team to the beacon coordinates. "
                        "Establish VHF contact with the reporting device owner."
                    ),
                    "affected_districts": json.dumps(["Unassigned — GPS point pending district assignment"]),
                     "channels": json.dumps(["SMS", "CAP_FEED", "CITIZEN_PUSH"]),
                },
            )
        return {"report_id": report_id, "alert_id": alert_id}
    except SQLAlchemyError:
        return None


def cancel_sos_beacon(report_id: str) -> bool:
    """Mark an SOS report as resolved ('ALL_CLEAR'). Returns True only if a row was updated."""
    eng = _get_engine()
    if eng is None:
        return False
    try:
        with eng.begin() as conn:
            result = conn.execute(
                text(
                    """
                    UPDATE citizen_reports
                    SET status = 'ALL_CLEAR'
                    WHERE id::text = :rid AND status = 'SOS_ACTIVE'
                    """
                ),
                {"rid": report_id},
            )
        return bool(result.rowcount)
    except SQLAlchemyError:
        return False


def list_active_sos() -> Optional[List[Dict[str, Any]]]:
    """All beacons currently in 'SOS_ACTIVE' state, nearest-last-seen first."""
    eng = _get_engine()
    if eng is None:
        return None
    try:
        with eng.connect() as conn:
            rows = conn.execute(
                text(
                    """
                    SELECT id::text, ST_Y(geom) AS lat, ST_X(geom) AS lng,
                           reporter_phone, created_at
                    FROM citizen_reports
                    WHERE status = 'SOS_ACTIVE'
                    ORDER BY created_at DESC
                    """
                )
            ).mappings().all()
        return [dict(r) for r in rows]
    except SQLAlchemyError:
        return None


def fetch_active_road_closures() -> Optional[List[Dict[str, Any]]]:
    """
    Queries ONLY confirmed, active road blockages from road_incidents with status='BLOCKED'.
    Strictly ensures high risk predictions or historical landslides NEVER close roads.
    """
    eng = _get_engine()
    if eng is None:
        return None
    sql = text(
        """
        SELECT 
            ri.incident_id AS closure_id,
            ri.road_name,
            ST_Y(ST_Centroid(ri.geom)) AS lat,
            ST_X(ST_Centroid(ri.geom)) AS lon,
            COALESCE(ri.notes, ri.cause) AS reason,
            1.00 AS risk_score,
            ri.status,
            ri.cause,
            ri.source,
            ri.authority,
            ri.verification_status
        FROM road_incidents ri
        WHERE ri.status = 'BLOCKED' AND ri.active = TRUE
        """
    )
    try:
        with eng.connect() as conn:
            rows = conn.execute(sql).mappings().all()
        return [dict(r) for r in rows]
    except SQLAlchemyError:
        return None


def fetch_historical_landslides() -> Optional[List[Dict[str, Any]]]:
    """
    Queries historical landslide events from ISRO/NRSC Landslide Atlas & GSI.
    Used for historical visualization and training only. NEVER closes a road.
    """
    eng = _get_engine()
    if eng is None:
        return None
    sql = text(
        """
        SELECT 
            id::text,
            location_name,
            district,
            state,
            event_date::text AS event_date,
            source,
            confidence,
            trigger_type,
            estimated_volume_m3,
            ST_Y(geom) AS lat,
            ST_X(geom) AS lng,
            'HISTORICAL_EVENT' AS entity_type
        FROM historical_landslides
        ORDER BY event_date DESC
        """
    )
    try:
        with eng.connect() as conn:
            rows = conn.execute(sql).mappings().all()
        return [dict(r) for r in rows]
    except SQLAlchemyError:
        return None


def fetch_confirmed_landslide_events() -> Optional[List[Dict[str, Any]]]:
    """
    Queries real detected/verified landslide events from GSI, NDEM, ISRO, PWD.
    """
    eng = _get_engine()
    if eng is None:
        return None
    sql = text(
        """
        SELECT 
            id::text,
            event_code,
            event_name,
            district,
            state,
            event_timestamp::text AS event_timestamp,
            source,
            verification_status,
            confidence,
            event_type,
            estimated_debris_m3,
            ST_Y(geom) AS lat,
            ST_X(geom) AS lng,
            'CONFIRMED_EVENT' AS entity_type
        FROM confirmed_landslide_events
        ORDER BY event_timestamp DESC
        """
    )
    try:
        with eng.connect() as conn:
            rows = conn.execute(sql).mappings().all()
        return [dict(r) for r in rows]
    except SQLAlchemyError:
        return None


def fetch_road_incidents() -> Optional[List[Dict[str, Any]]]:
    """
    Queries all active and reported road incidents with explicit status (OPEN, RESTRICTED, BLOCKED).
    """
    eng = _get_engine()
    if eng is None:
        return None
    sql = text(
        """
        SELECT 
            id::text,
            incident_id,
            road_name,
            cause,
            status,
            source,
            reported_time::text AS reported_time,
            verified_time::text AS verified_time,
            verification_status,
            authority,
            notes,
            active,
            ST_Y(ST_Centroid(geom)) AS lat,
            ST_X(ST_Centroid(geom)) AS lng
        FROM road_incidents
        ORDER BY reported_time DESC
        """
    )
    try:
        with eng.connect() as conn:
            rows = conn.execute(sql).mappings().all()
        return [dict(r) for r in rows]
    except SQLAlchemyError:
        return None


def fetch_demographics_and_tourism(district: Optional[str] = None) -> Optional[List[Dict[str, Any]]]:
    """
    Queries authoritative Census resident population and official tourism statistics.
    """
    eng = _get_engine()
    if eng is None:
        return None
    sql = text(
        """
        SELECT 
            p.district_name,
            p.state_name,
            p.resident_population,
            p.reference_year AS census_year,
            p.source AS population_source,
            p.current_population_available,
            COALESCE(t.annual_tourist_arrivals, 0) AS annual_tourist_arrivals,
            COALESCE(t.peak_season_monthly_arrivals, 0) AS peak_season_monthly_arrivals,
            COALESCE(t.period, 'Annual Tourism Statistics 2024-2025') AS tourism_period,
            COALESCE(t.source, 'Directorate of Tourism') AS tourism_source,
            COALESCE(t.real_time_count_available, FALSE) AS real_time_tourists_available
        FROM population_data p
        LEFT JOIN tourism_data t ON t.district_name = p.district_name
        WHERE :district IS NULL OR p.district_name ILIKE :district
        """
    )
    try:
        with eng.connect() as conn:
            rows = conn.execute(sql, {"district": district}).mappings().all()
        return [dict(r) for r in rows]
    except SQLAlchemyError:
        return None


def set_road_incident_status(incident_id: str, status: str, notes: Optional[str] = None) -> bool:
    """Updates the status of a road incident (e.g. BLOCKED -> OPEN)."""
    eng = _get_engine()
    if eng is None:
        return False
    sql = text(
        """
        UPDATE road_incidents
        SET status = :status,
            notes = COALESCE(:notes, notes),
            verified_time = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE incident_id = :inc_id
        """
    )
    try:
        with eng.begin() as conn:
            res = conn.execute(sql, {"inc_id": incident_id, "status": status, "notes": notes})
        return bool(res.rowcount)
    except SQLAlchemyError:
        return False

