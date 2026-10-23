"""
NER Landslide RiskWatch — Routing Engine Pydantic Schemas
Official schemas for Valhalla Native Integration & PostGIS Disaster Routing
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class Coordinate(BaseModel):
    lat: float = Field(..., description="Latitude in decimal degrees", ge=-90.0, le=90.0)
    lon: float = Field(..., description="Longitude in decimal degrees", ge=-180.0, le=180.0)
    type: Optional[str] = Field("break", description="Location type: 'break', 'through', or 'via'")


class LocationDetail(BaseModel):
    requested: Coordinate = Field(..., description="Requested geographic location")
    snapped: Coordinate = Field(..., description="Snapped road-network location from Valhalla graph")


class RouteDebugInfo(BaseModel):
    status: str = Field(..., description="Debug status code: ROUTE_FOUND, NO_SAFE_ROUTE, NO_VALID_ROUTE_GEOMETRY")
    geometry_points: int = Field(..., description="Total coordinate points in decoded road geometry")
    legs_count: int = Field(..., description="Number of legs in calculated trip")
    distance_km: float = Field(..., description="Total road network distance in km")
    duration_minutes: float = Field(..., description="Total travel duration along road network in minutes")
    maneuver_count: int = Field(..., description="Total turn-by-turn navigation maneuvers")
    excluded_segments: int = Field(default=0, description="Active disaster closures avoided")
    geometry_validation: str = Field(default="PASS", description="Validation check result: PASS or FAIL")
    road_network_route: str = Field(default="PASS", description="Confirmation that route follows road graph")
    engine: str = Field(default="valhalla_native", description="Routing engine used")
    origin: Optional[LocationDetail] = None
    destination: Optional[LocationDetail] = None


class RouteRequest(BaseModel):
    origin: Coordinate = Field(..., description="Route starting point")
    destination: Coordinate = Field(..., description="Route destination point")
    costing: str = Field("auto", description="Valhalla costing profile: auto, truck, bicycle, pedestrian, motorcycle")
    units: str = Field("kilometers", description="Distance units: kilometers or miles")
    exclude_locations: Optional[List[Coordinate]] = Field(default=None, description="Coordinates to avoid/exclude from pathfinding")
    exclude_polygons: Optional[List[List[List[float]]]] = Field(default=None, description="Polygon boundary rings [[[lon, lat], ...]] to exclude")
    alternates: Optional[int] = Field(default=0, ge=0, le=5, description="Number of alternative routes to request from Valhalla")


class ScoringWeights(BaseModel):
    safety: float = Field(default=0.50, description="Safety score weight (0.0 to 1.0)", ge=0.0, le=1.0)
    travel_time: float = Field(default=0.25, description="Travel time score weight (0.0 to 1.0)", ge=0.0, le=1.0)
    distance: float = Field(default=0.15, description="Distance score weight (0.0 to 1.0)", ge=0.0, le=1.0)
    traffic: float = Field(default=0.10, description="Traffic/congestion score weight (0.0 to 1.0)", ge=0.0, le=1.0)


class SafeRouteRequest(BaseModel):
    origin: Coordinate = Field(..., description="Route starting point")
    destination: Coordinate = Field(..., description="Route destination point")
    costing: str = Field("auto", description="Costing profile (auto, truck, pedestrian)")
    weights: Optional[ScoringWeights] = Field(default_factory=ScoringWeights, description="Custom multi-factor weights")
    avoid_disasters: bool = Field(default=True, description="Query PostGIS for active landslide/flood closures")
    custom_exclusions: Optional[List[Coordinate]] = Field(default=None, description="Additional points to avoid")


class AlternativeRoutesRequest(BaseModel):
    origin: Coordinate = Field(..., description="Route starting point")
    destination: Coordinate = Field(..., description="Route destination point")
    costing: str = Field("auto", description="Valhalla costing profile")
    max_alternatives: int = Field(default=3, ge=1, le=5, description="Maximum candidate paths to evaluate")
    weights: Optional[ScoringWeights] = Field(default_factory=ScoringWeights)


class EmergencyRouteRequest(BaseModel):
    origin: Coordinate = Field(..., description="Starting location of emergency responder")
    destination: Coordinate = Field(..., description="Incident or evacuation target location")
    responder_type: str = Field(
        default="ambulance",
        description="Type: ambulance, fire, police, search_and_rescue, disaster_response, road_clearance"
    )
    costing: Optional[str] = Field(default=None, description="Costing override (auto, truck, emergency)")


class BlockedSegment(BaseModel):
    closure_id: Optional[str] = None
    road_name: str
    lat: float
    lon: float
    reason: str
    risk_score: float = 1.0
    status: str = "BLOCKED"
    landslide_probability: Optional[float] = 0.95
    road_disruption_probability: Optional[float] = 0.98
    expected_reopening: Optional[str] = "48 hours (subject to geo-assessment)"
    affected_villages: Optional[List[str]] = []
    incident_id: Optional[str] = None


class CriticalFacilityExposure(BaseModel):
    facility_name: str
    facility_type: str
    district: str
    distance_to_route_km: float


class IsolatedVillageExposure(BaseModel):
    village_name: str
    population: int
    district: str
    isolation_probability: float


class RouteOption(BaseModel):
    id: str
    title: str
    distance_km: float
    duration_minutes: float
    landslide_risk: float
    flood_risk: float
    road_condition: str
    number_of_blocked_segments: int
    number_of_high_risk_segments: int
    affected_population: int
    critical_infrastructure_exposure: List[CriticalFacilityExposure] = []
    affected_villages: List[IsolatedVillageExposure] = []
    safety_score: float
    composite_score: float
    geometry: Dict[str, Any]
    maneuvers: List[Dict[str, Any]] = []
    legs: List[Dict[str, Any]] = []
    warnings: List[str] = []
    origin: Optional[LocationDetail] = None
    destination: Optional[LocationDetail] = None
    debug_info: Optional[RouteDebugInfo] = None


class RouteResponse(BaseModel):
    status: str
    message: Optional[str] = None
    distance_km: float
    duration_minutes: float
    geometry: Dict[str, Any]
    maneuvers: List[Dict[str, Any]] = []
    legs: List[Dict[str, Any]] = []
    warnings: List[str] = []
    origin: Optional[LocationDetail] = None
    destination: Optional[LocationDetail] = None
    debug_info: Optional[RouteDebugInfo] = None
    engine: str = "valhalla_native"


class SafeRouteResponse(BaseModel):
    status: str
    message: Optional[str] = None
    recommended_route: Optional[RouteOption] = None
    alternatives_evaluated: int = 0
    active_disaster_exclusions: int = 0
    blocked_segments: List[BlockedSegment] = []
    warnings: List[str] = []
    debug_info: Optional[RouteDebugInfo] = None
    engine: str = "valhalla_native"


class AlternativeRoutesResponse(BaseModel):
    status: str
    recommended_route_id: str
    routes: List[RouteOption]
    scoring_weights_applied: ScoringWeights
    total_candidates: int
    debug_info: Optional[RouteDebugInfo] = None
    engine: str = "valhalla_native"


class EmergencyRouteResponse(BaseModel):
    status: str
    responder_type: str
    priority_level: str
    distance_km: float
    duration_minutes: float
    safety_score: float
    landslide_risk: float
    geometry: Dict[str, Any]
    maneuvers: List[Dict[str, Any]] = []
    legs: List[Dict[str, Any]] = []
    recommended_bypass: Optional[str] = None
    affected_hamlets_notified: int = 0
    warnings: List[str] = []
    origin: Optional[LocationDetail] = None
    destination: Optional[LocationDetail] = None
    debug_info: Optional[RouteDebugInfo] = None
    engine: str = "valhalla_native"


class HealthRoutingResponse(BaseModel):
    status: str
    valhalla_initialized: bool
    valhalla_config_path: str
    tiles_directory: str
    tiles_found: bool
    postgis_connected: bool
    active_road_closures_count: int
    memory_mode: str
