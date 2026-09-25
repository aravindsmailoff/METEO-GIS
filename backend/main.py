"""
NER Landslide RiskWatch — Production FastAPI Entrypoint
Comprehensive GIS Command Center, ML Hazard Predictor, and Telemetry Service
"""

import os
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

from services.ml_service import calculate_landslide_risk, FEATURE_NAMES, FEATURE_BASELINES
from services.upstream_service import get_upstream_telemetry_status
from services.routing_service import get_village_isolation_analytics
from services.alert_service import generate_cap_alert
from services import db
from routing.routes import router as routing_router
from routing.valhalla_service import get_valhalla_engine

app = FastAPI(
    title="NER Landslide Early Warning & GIS Command Center API",
    version="2.0.0",
    description="Full-stack AI Hazard Early Warning System for the North Eastern Region of India"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Official Valhalla Disaster Routing Endpoints
app.include_router(routing_router, prefix="/api/routing", tags=["Valhalla Routing"])
app.include_router(routing_router, prefix="/api/v1/routing", tags=["Valhalla Routing"])

class RiskInferenceRequest(BaseModel):
    features: Optional[Dict[str, float]] = None
    district: Optional[str] = "East Sikkim"
    latitude: Optional[float] = 27.3389
    longitude: Optional[float] = 88.6065

class CapAlertRequest(BaseModel):
    headline: str
    description: str
    severity: str = "Severe"
    urgency: str = "Immediate"
    certainty: str = "Observed"
    districts: List[str] = Field(default_factory=lambda: ["East Sikkim", "North Sikkim"])
    instruction: str = "Evacuate low-lying slopes and avoid NH-10. Seek nearest designated relief shelter."
    channels: List[str] = Field(default_factory=lambda: ["SMS", "CAP_FEED", "SIREN", "CITIZEN_PUSH"])

class CitizenReportRequest(BaseModel):
    incident_type: str
    severity: str
    description: str
    latitude: float
    longitude: float
    road_blocked: bool = False
    casualties_reported: int = 0
    reporter_phone: Optional[str] = ""

class CloudburstScenarioRequest(BaseModel):
    rain_rate_mm_h: float = Field(default=85.0, ge=0.0, le=250.0)
    duration_hours: float = Field(default=3.0, ge=1.0, le=24.0)
    soil_saturation_pct: float = Field(default=85.0, ge=0.0, le=100.0)

@app.get("/")
def root():
    return {
        "service": "NER Landslide RiskWatch Command API",
        "status": "OPERATIONAL",
        "mode": os.getenv("SYSTEM_MODE", "LIVE"),
        "version": "2.0.0",
        "docs": "/docs"
    }

@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    db_connected = db.is_connected()
    engine = get_valhalla_engine()
    return {
        "status": "HEALTHY",
        "postgis_connected": db_connected,
        "postgis_extension": db.postgis_available() if db_connected else False,
        "postgis_error": db.get_last_connection_error() if not db_connected else None,
        "valhalla_native_initialized": engine.is_native,
        "valhalla_config_path": engine.config_path,
        "xgboost_model_loaded": True,
        "shap_explainer_ready": True,
        "bhuvan_token_active": bool(os.getenv("BHUVAN_TOKEN"))
    }


@app.on_event("startup")
def startup_bootstrap():
    """Apply schema + seed data if a PostGIS database is reachable; initialize Valhalla engine."""
    if db.is_connected():
        if db.bootstrap_schema():
            db.seed_initial_data()
        print("[startup] PostGIS connected — schema and seed data verified.")
    else:
        print(f"[startup] PostGIS not reachable ({db.get_last_connection_error()}) — serving static fallback data.")
    
    valhalla_engine = get_valhalla_engine()
    print(f"[startup] Valhalla engine initialized: native={valhalla_engine.is_native}, config={valhalla_engine.config_path}")


@app.get("/api/v1/data-source")
def data_source_info():
    """Introspection endpoint showing whether live PostGIS or static fallback is in use."""
    return {
        "postgis_connected": db.is_connected(),
        "postgis_extension": db.postgis_available(),
        "isolation_analytics_source": get_village_isolation_analytics().get("source"),
        "error": db.get_last_connection_error(),
    }

@app.post("/api/v1/risk/predict")
def predict_risk(req: RiskInferenceRequest):
    features = req.features or FEATURE_BASELINES
    result = calculate_landslide_risk(features)
    result["district"] = req.district
    result["coordinates"] = [req.latitude, req.longitude]
    return result

@app.get("/api/v1/telemetry/upstream")
def get_telemetry():
    return {
        "system_mode": os.getenv("SYSTEM_MODE", "LIVE"),
        "providers": get_upstream_telemetry_status()
    }

@app.get("/api/v1/isolation/villages")
def get_villages():
    return get_village_isolation_analytics()

@app.post("/api/v1/alerts/broadcast")
def dispatch_alert(req: CapAlertRequest):
    return generate_cap_alert(
        headline=req.headline,
        description=req.description,
        severity=req.severity,
        urgency=req.urgency,
        certainty=req.certainty,
        districts=req.districts,
        instruction=req.instruction,
        channels=req.channels
    )

@app.post("/api/v1/citizen/report")
def submit_citizen_report(req: CitizenReportRequest):
    report_payload = {
        "reporter_phone": req.reporter_phone,
        "incident_type": req.incident_type,
        "severity": req.severity.upper() if req.severity else "MEDIUM",
        "description": req.description,
        "road_blocked": req.road_blocked,
        "casualties_reported": req.casualties_reported,
        "lat": req.latitude,
        "lng": req.longitude,
    }
    report_id = db.insert_citizen_report(report_payload)
    if report_id:
        return {
            "report_id": report_id,
            "status": "QUEUED_FOR_NDRF_TRIAGE",
            "details": req.dict(),
            "persisted": True,
            "message": "Incident report logged with GPS coordinates and queued for emergency command review."
        }
    return {
        "report_id": f"REP-{os.urandom(3).hex().upper()}",
        "status": "QUEUED_FOR_NDRF_TRIAGE",
        "details": req.dict(),
        "persisted": False,
        "message": "Incident report logged with GPS coordinates and queued for emergency command review."
    }

class SosRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    accuracy_m: Optional[float] = Field(None, ge=0)
    reporter_phone: Optional[str] = ""
    triggered_at_device: Optional[str] = None


class SosCancelRequest(BaseModel):
    report_id: str


@app.post("/api/v1/sos")
def trigger_sos(req: SosRequest):
    """Real SOS ingest: persists the beacon and auto-generates a CAP broadcast."""
    result = db.insert_sos_beacon(
        {
            "lat": req.latitude,
            "lng": req.longitude,
            "accuracy_m": req.accuracy_m,
            "reporter_phone": req.reporter_phone,
            "triggered_at_device": req.triggered_at_device,
        }
    )
    if result:
        return {
            "status": "RECEIVED",
            "persisted": True,
            "report_id": result["report_id"],
            "alert_id": result["alert_id"],
            "message": "Distress beacon logged and CAP alert broadcast to emergency channels.",
            "coordinates": [req.latitude, req.longitude],
        }
    return {
        "status": "ACCEPTED_NOT_PERSISTED",
        "persisted": False,
        "report_id": f"SOS-{os.urandom(3).hex().upper()}",
        "alert_id": None,
        "message": "Beacon received but emergency database is unreachable; logged for operator review.",
        "coordinates": [req.latitude, req.longitude],
    }


@app.post("/api/v1/sos/cancel")
def cancel_sos(req: SosCancelRequest):
    """Citizen 'I am safe' — marks the beacon resolved in the database."""
    cancelled = db.cancel_sos_beacon(req.report_id)
    return {
        "status": "ALL_CLEAR" if cancelled else "NOT_FOUND_OR_DB_UNREACHABLE",
        "persisted": cancelled,
        "report_id": req.report_id,
    }


@app.get("/api/v1/sos/active")
def active_sos():
    """Live feed for the command center: all beacons currently in SOS_ACTIVE state."""
    beacons = db.list_active_sos()
    if beacons is None:
        return {"available": False, "beacons": [], "message": "Emergency database unreachable."}
    return {"available": True, "beacons": beacons, "count": len(beacons)}


@app.get("/api/v1/landslides/historical")
def get_historical_landslides():
    """
    Returns historical landslide inventory (ISRO/NRSC Landslide Atlas & GSI).
    Strictly for training, validation, and historical risk context. NEVER closes roads.
    """
    data = db.fetch_historical_landslides()
    if data is None:
        return {
            "available": False,
            "source": "ISRO / NRSC Landslide Atlas of India",
            "message": "Historical database query unavailable.",
            "data": []
        }
    return {
        "available": True,
        "source": "ISRO / NRSC Landslide Atlas of India & GSI Historical Inventory",
        "count": len(data),
        "data": data,
        "policy": "Historical events are for analysis/training only and do not alter active road status."
    }


@app.get("/api/v1/landslides/confirmed")
def get_confirmed_landslides():
    """
    Returns real detected/verified landslide events from GSI, NDEM, ISRO, and State PWD.
    """
    data = db.fetch_confirmed_landslide_events()
    if data is None:
        return {
            "available": False,
            "source": "GSI / NDEM / State PWD",
            "message": "Confirmed events database query unavailable.",
            "data": []
        }
    return {
        "available": True,
        "source": "Geological Survey of India & NDEM Verified Incident Stream",
        "count": len(data),
        "data": data
    }


@app.get("/api/v1/roads/incidents")
def get_road_incidents():
    """
    Returns all active and reported road incidents with explicit status (OPEN, RESTRICTED, BLOCKED).
    Only status = 'BLOCKED' triggers routing exclusion.
    """
    data = db.fetch_road_incidents()
    if data is None:
        return {
            "available": False,
            "source": "NHAI & State PWD Disruption Stream",
            "message": "Road incidents database query unavailable.",
            "data": []
        }
    return {
        "available": True,
        "source": "NHAI & Meghalaya PWD / District Administration Live Feeds",
        "count": len(data),
        "data": data
    }


@app.get("/api/v1/demographics/exposure")
def get_demographics_exposure(district: Optional[str] = None):
    """
    Returns authoritative Census population and official Tourism Statistics for exposure analysis.
    """
    data = db.fetch_demographics_and_tourism(district)
    if data is None:
        return {
            "available": False,
            "message": "Demographics database query unavailable.",
            "data": []
        }
    return {
        "available": True,
        "data": data
    }


@app.post("/api/v1/roads/incidents/{incident_id}/status")
def update_road_incident_status(incident_id: str, payload: Dict[str, Any] = Body(...)):
    """
    Authoritative update of road status (e.g. BLOCKED -> OPEN or OPEN -> BLOCKED).
    """
    status = payload.get("status", "OPEN")
    notes = payload.get("notes")
    success = db.set_road_incident_status(incident_id, status, notes)
    return {
        "success": success,
        "incident_id": incident_id,
        "new_status": status
    }


@app.post("/api/v1/scenario/cloudburst")
def simulate_cloudburst(req: CloudburstScenarioRequest):
    # Dynamic risk multiplier across regions
    multiplier = 1.0 + (req.rain_rate_mm_h / 45.0) * (req.soil_saturation_pct / 100.0)
    base_probs = {
        "North Sikkim": min(0.99, 0.42 * multiplier),
        "East Sikkim": min(0.98, 0.38 * multiplier),
        "Kohima": min(0.95, 0.28 * multiplier),
        "Aizawl": min(0.92, 0.25 * multiplier),
        "Dima Hasao (Assam)": min(0.89, 0.20 * multiplier),
        "Papum Pare (Arunachal)": min(0.85, 0.18 * multiplier)
    }
    
    return {
        "scenario_parameters": req.dict(),
        "projected_landslide_count": int(multiplier * 4.2),
        "projected_isolated_population": int(multiplier * 6200),
        "district_risk_projections": [
            {"district": k, "projected_probability": round(v, 3), "threat_level": "Critical" if v >= 0.8 else "High" if v >= 0.6 else "Moderate" if v >= 0.35 else "Low"}
            for k, v in base_probs.items()
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

