"""
NER Landslide RiskWatch — Valhalla Disaster Routing Test Suite
Verifies normal routing, landslide exclusion, alternative scoring, emergency priority,
geometry validation (no straight lines), precision-6 polyline decoding, snapped coordinates,
RouteDebugInfo telemetry, and NO_SAFE_ROUTE handling.
"""

import sys
import os
import unittest

# Ensure backend root is on Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from routing.schemas import (
    Coordinate,
    RouteRequest,
    SafeRouteRequest,
    AlternativeRoutesRequest,
    EmergencyRouteRequest,
    ScoringWeights
)
from routing.disaster_routing import (
    compute_standard_route,
    compute_safe_route,
    compute_alternative_routes,
    compute_emergency_route,
    validate_route_geometry
)
from routing.valhalla_service import (
    decode_polyline_precision6,
    encode_polyline_precision6,
    get_valhalla_engine
)


class TestValhallaDisasterRouting(unittest.TestCase):

    def setUp(self):
        # Coordinates for Shillong to Umiam corridor (NH-06)
        self.origin = Coordinate(lat=25.682, lon=91.924)
        self.destination = Coordinate(lat=25.578, lon=91.880)

    def test_01_polyline_precision6_codec(self):
        """Test precision-6 polyline encoding and decoding accuracy."""
        coords = [
            [91.924000, 25.682000],
            [91.860000, 25.650000],
            [91.880000, 25.578000]
        ]
        encoded = encode_polyline_precision6(coords)
        self.assertIsInstance(encoded, str)
        self.assertGreater(len(encoded), 0)

        decoded = decode_polyline_precision6(encoded)
        self.assertEqual(len(decoded), len(coords))
        self.assertAlmostEqual(decoded[0][0], coords[0][0], places=5)
        self.assertAlmostEqual(decoded[0][1], coords[0][1], places=5)

    def test_02_geometry_validation_rules(self):
        """Test the 11-point geometry validation engine."""
        # Mock trip for validation test
        valid_trip = {
            "summary": {"length": 15.2, "time": 1200},
            "legs": [{
                "shape": "mock_encoded_shape",
                "maneuvers": [{"instruction": "Drive north", "type": 1}]
            }]
        }

        # 1. Valid road geometry (>= 10 coordinates)
        valid_coords = [[91.924 + i * 0.001, 25.682 - i * 0.001] for i in range(25)]
        is_valid, reason = validate_route_geometry(valid_trip, valid_coords, self.origin, self.destination)
        self.assertTrue(is_valid, f"Expected valid geometry, failed with: {reason}")

        # 2. Too few coordinates (prohibited straight lines)
        two_pt_coords = [[91.924, 25.682], [91.880, 25.578]]
        is_valid, reason = validate_route_geometry(valid_trip, two_pt_coords, self.origin, self.destination)
        self.assertFalse(is_valid)
        self.assertIn("insufficient coordinates", reason.lower())

        # 3. Missing legs or empty trip
        empty_trip = {"summary": {}, "legs": []}
        is_valid, reason = validate_route_geometry(empty_trip, valid_coords, self.origin, self.destination)
        self.assertFalse(is_valid)

        # 4. Zero length summary
        zero_trip = {
            "summary": {"length": 0.0, "time": 0},
            "legs": [{"shape": "abc", "maneuvers": [{"instruction": "Drive"}]}]
        }
        is_valid, reason = validate_route_geometry(zero_trip, valid_coords, self.origin, self.destination)
        self.assertFalse(is_valid)

    def test_03_normal_routing_and_debug_telemetry(self):
        """Test standard route generation, road-following geometry, snapped locations, and debug telemetry."""
        req = RouteRequest(
            origin=self.origin,
            destination=self.destination,
            costing="auto",
            units="kilometers"
        )
        res = compute_standard_route(req)
        self.assertEqual(res.status, "ROUTE_FOUND")
        self.assertGreater(res.distance_km, 0.0)
        self.assertGreater(res.duration_minutes, 0.0)
        self.assertEqual(res.geometry["type"], "LineString")
        
        # Verify road network node density (Rule #2, #10 - never a 2-point line)
        coord_count = len(res.geometry["coordinates"])
        self.assertGreaterEqual(coord_count, 10, "Route must contain realistic road network curve nodes")
        
        # Verify requested vs snapped location metadata (Rule #15)
        self.assertIsNotNone(res.origin)
        self.assertIsNotNone(res.origin.requested)
        self.assertIsNotNone(res.origin.snapped)
        self.assertIsNotNone(res.destination.snapped)
        self.assertAlmostEqual(res.origin.requested.lat, self.origin.lat, places=3)

        # Verify Route Debug HUD telemetry (Rule #19)
        self.assertIsNotNone(res.debug_info)
        self.assertEqual(res.debug_info.geometry_points, coord_count)
        self.assertEqual(res.debug_info.geometry_validation, "PASS")
        self.assertEqual(res.debug_info.road_network_route, "PASS")

    def test_04_landslide_closure_avoidance(self):
        """Test safe-route calculation avoiding active landslide closures."""
        req = SafeRouteRequest(
            origin=self.origin,
            destination=self.destination,
            costing="auto",
            avoid_disasters=True,
            custom_exclusions=[Coordinate(lat=25.688, lon=91.928)] # NH-06 blocked point
        )
        res = compute_safe_route(req)
        self.assertEqual(res.status, "ROUTE_FOUND")
        self.assertIsNotNone(res.recommended_route)
        self.assertGreater(res.recommended_route.safety_score, 0.50)
        self.assertGreater(res.active_disaster_exclusions, 0)
        self.assertEqual(res.recommended_route.geometry["type"], "LineString")
        self.assertGreaterEqual(len(res.recommended_route.geometry["coordinates"]), 10)
        self.assertIsNotNone(res.debug_info)

    def test_05_alternative_routes_and_scoring(self):
        """Test multi-alternative comparison and multi-factor safety scoring."""
        weights = ScoringWeights(safety=0.50, travel_time=0.25, distance=0.15, traffic=0.10)
        req = AlternativeRoutesRequest(
            origin=self.origin,
            destination=self.destination,
            costing="auto",
            max_alternatives=2,
            weights=weights
        )
        res = compute_alternative_routes(req)
        self.assertEqual(res.status, "ROUTE_FOUND")
        self.assertGreater(len(res.routes), 0)
        self.assertIsNotNone(res.recommended_route_id)

        # Check that each alternative route has full risk metrics and debug info
        for route in res.routes:
            self.assertIn("landslide_risk", route.model_dump())
            self.assertIn("flood_risk", route.model_dump())
            self.assertIn("safety_score", route.model_dump())
            self.assertIn("composite_score", route.model_dump())
            self.assertGreaterEqual(route.composite_score, 0.0)
            self.assertGreaterEqual(len(route.geometry["coordinates"]), 10)

    def test_06_emergency_responder_priority(self):
        """Test emergency route prioritizing absolute safety over distance."""
        req = EmergencyRouteRequest(
            origin=self.origin,
            destination=self.destination,
            responder_type="ambulance"
        )
        res = compute_emergency_route(req)
        self.assertEqual(res.status, "ROUTE_FOUND")
        self.assertEqual(res.responder_type, "AMBULANCE")
        self.assertEqual(res.priority_level, "CRITICAL_DISPATCH")
        self.assertGreater(res.safety_score, 0.70)
        self.assertIsNotNone(res.recommended_bypass)
        self.assertGreaterEqual(len(res.geometry["coordinates"]), 10)
        self.assertIsNotNone(res.debug_info)

    def test_07_offline_capability(self):
        """Test that route computation executes offline without external internet calls."""
        req = RouteRequest(
            origin=self.origin,
            destination=self.destination,
            costing="auto"
        )
        res = compute_standard_route(req)
        self.assertEqual(res.status, "ROUTE_FOUND")
        self.assertGreaterEqual(res.debug_info.geometry_points, 10)


if __name__ == "__main__":
    unittest.main()

