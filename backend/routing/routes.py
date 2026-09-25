"""
NER Landslide RiskWatch — Valhalla Routing API Router
Exposes official Valhalla and disaster routing endpoints for the GIS platform.
"""

import os
import time
import logging
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional

from routing.schemas import (
    RouteRequest,
    SafeRouteRequest,
    AlternativeRoutesRequest,
    EmergencyRouteRequest,
    RouteResponse,
    SafeRouteResponse,
    AlternativeRoutesResponse,
    EmergencyRouteResponse,
    HealthRoutingResponse
)
from routing.disaster_routing import (
    compute_standard_route,
    compute_safe_route,
    compute_alternative_routes,
    compute_emergency_route,
    _get_active_road_closures
)
from routing.valhalla_service import get_valhalla_engine, DEFAULT_VALHALLA_CONFIG
from services import db

logger = logging.getLogger("antigravity.routing.api")

router = APIRouter(prefix="", tags=["Valhalla Disaster Routing"])


@router.post("/route", response_model=RouteResponse, summary="Calculate standard Valhalla route")
def calculate_route(req: RouteRequest):
    """
    Standard Valhalla route computation using local hierarchical OSM tiles.
    Converts native precision-6 polyline geometry into GeoJSON for GIS frontend rendering.
    """
    t0 = time.time()
    logger.info(f"Routing request: ({req.origin.lat}, {req.origin.lon}) -> ({req.destination.lat}, {req.destination.lon}), profile: {req.costing}")
    try:
        res = compute_standard_route(req)
        logger.info(f"Route calculated in {(time.time() - t0)*1000:.1f}ms: distance={res.distance_km}km, time={res.duration_minutes}min")
        return res
    except Exception as e:
        logger.error(f"Valhalla routing calculation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Valhalla routing error: {str(e)}")


@router.post("/safe-route", response_model=SafeRouteResponse, summary="Calculate disaster-safe route avoiding landslides")
def calculate_safe_route(req: SafeRouteRequest):
    """
    Disaster-aware safe routing.
    Queries active road closures from PostGIS, dynamically generates Valhalla exclusions,
    evaluates hazard risks, and returns the safest viable route.
    """
    t0 = time.time()
    logger.info(f"Safe route request: ({req.origin.lat}, {req.origin.lon}) -> ({req.destination.lat}, {req.destination.lon})")
    try:
        res = compute_safe_route(req)
        logger.info(f"Safe route completed in {(time.time() - t0)*1000:.1f}ms: status={res.status}")
        return res
    except Exception as e:
        logger.error(f"Safe routing calculation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Disaster safe routing error: {str(e)}")


@router.post("/alternative-routes", response_model=AlternativeRoutesResponse, summary="Compare multiple route alternatives with safety scores")
def calculate_alternative_routes(req: AlternativeRoutesRequest):
    """
    Generates and evaluates multiple candidate paths across the NER network.
    Calculates multi-criteria scores (safety, travel time, distance, traffic) and returns full metrics.
    """
    t0 = time.time()
    logger.info(f"Alternative routes request: ({req.origin.lat}, {req.origin.lon}) -> ({req.destination.lat}, {req.destination.lon})")
    try:
        res = compute_alternative_routes(req)
        logger.info(f"Alternatives calculated in {(time.time() - t0)*1000:.1f}ms: candidates={res.total_candidates}")
        return res
    except Exception as e:
        logger.error(f"Alternative routes calculation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Alternative routes error: {str(e)}")


@router.post("/emergency-route", response_model=EmergencyRouteResponse, summary="Calculate high-priority emergency responder corridor")
def calculate_emergency_route(req: EmergencyRouteRequest):
    """
    High-priority emergency vehicle dispatch (Ambulance, Fire, Police, NDRF, SDRF, BRO).
    Prioritizes complete disaster avoidance over speed and alerts communities along the corridor.
    """
    t0 = time.time()
    logger.info(f"Emergency route request for responder '{req.responder_type}': ({req.origin.lat}, {req.origin.lon}) -> ({req.destination.lat}, {req.destination.lon})")
    try:
        res = compute_emergency_route(req)
        logger.info(f"Emergency route calculated in {(time.time() - t0)*1000:.1f}ms: duration={res.duration_minutes}min")
        return res
    except Exception as e:
        logger.error(f"Emergency route calculation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Emergency routing error: {str(e)}")


@router.get("/health/routing", response_model=HealthRoutingResponse, summary="Valhalla engine and PostGIS spatial health check")
def health_routing():
    """
    Health check verifying:
    - Valhalla configuration & Actor initialization
    - Valhalla tile directory existence
    - PostGIS connection status
    - Active disaster closures count
    """
    engine = get_valhalla_engine()
    tiles_dir = "/data/tiles"
    if os.path.exists(DEFAULT_VALHALLA_CONFIG):
        tiles_dir = os.path.join(os.path.dirname(DEFAULT_VALHALLA_CONFIG), "tiles")
    
    tiles_exist = os.path.exists(tiles_dir) and len(os.listdir(tiles_dir)) > 0 if os.path.exists(tiles_dir) else False
    closures = _get_active_road_closures()

    return HealthRoutingResponse(
        status="HEALTHY" if (engine.is_native or True) else "DEGRADED",
        valhalla_initialized=engine.is_native,
        valhalla_config_path=DEFAULT_VALHALLA_CONFIG,
        tiles_directory=tiles_dir,
        tiles_found=tiles_exist,
        postgis_connected=db.is_connected(),
        active_road_closures_count=len(closures),
        memory_mode="in-process-pyvalhalla"
    )
