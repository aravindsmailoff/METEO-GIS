"""
NER Landslide RiskWatch — Emergency Routing & Village Isolation Engine
Calculates dynamic bypass paths around debris blockages and mountain hamlet cutoff probabilities
"""

from typing import Dict, Any, List

from services.db import fetch_villages_with_isolation

# Sample isolated settlements in high-risk zones across Sikkim, Nagaland, Mizoram & Assam
# (Static fallback used only when PostGIS is unreachable.)
VILLAGE_ISOLATION_DATA = [
    {
        "id": "VIL-SKM-01",
        "name": "Naga Village (Chungthang flank)",
        "district": "North Sikkim",
        "state": "Sikkim",
        "population": 1420,
        "elevation_m": 1820,
        "coordinates": [27.583, 88.642],
        "blocked_road": "Mangan-Chungthang Road (NH-310A)",
        "isolation_probability": 0.88,
        "status": "CRITICAL_ISOLATION",
        "food_supplies_hrs": 36,
        "medical_staff": False,
        "recommended_bypass": "Tung–Pegong Mountain Bridle Path (Foot/Drone evacuation only)",
        "bypass_distance_km": 14.2,
        "nearest_shelter": "Chungthang ITBP Relief Camp",
        "last_contact": "12 min ago via VHF"
    },
    {
        "id": "VIL-SKM-02",
        "name": "Dikchu Upper Hamlet",
        "district": "East Sikkim",
        "state": "Sikkim",
        "population": 890,
        "elevation_m": 960,
        "coordinates": [27.382, 88.583],
        "blocked_road": "NH-10 Rangpo-Singtam Stretch",
        "isolation_probability": 0.74,
        "status": "HIGH_RISK",
        "food_supplies_hrs": 64,
        "medical_staff": True,
        "recommended_bypass": "Singtam–Sirwani–Namchi Alternate Loop",
        "bypass_distance_km": 32.8,
        "nearest_shelter": "Singtam Community Hall Shelter",
        "last_contact": "5 min ago"
    },
    {
        "id": "VIL-NAG-01",
        "name": "Zubza Valley Settlement",
        "district": "Kohima",
        "state": "Nagaland",
        "population": 2150,
        "elevation_m": 1440,
        "coordinates": [25.688, 94.025],
        "blocked_road": "NH-29 Dimapur–Kohima Sinking Zone",
        "isolation_probability": 0.58,
        "status": "MODERATE_RISK",
        "food_supplies_hrs": 96,
        "medical_staff": True,
        "recommended_bypass": "Peducha–Tsiesema Alternate Arterial Road",
        "bypass_distance_km": 21.5,
        "nearest_shelter": "Kohima Multi-Disciplinary Hall",
        "last_contact": "20 min ago"
    },
    {
        "id": "VIL-MIZ-01",
        "name": "Saitual Mountain Ridge",
        "district": "Aizawl",
        "state": "Mizoram",
        "population": 1640,
        "elevation_m": 1180,
        "coordinates": [23.712, 92.735],
        "blocked_road": "Aizawl–Champhai Road KM-42",
        "isolation_probability": 0.62,
        "status": "MODERATE_RISK",
        "food_supplies_hrs": 80,
        "medical_staff": True,
        "recommended_bypass": "Durtlang–Selesih Ridge Road",
        "bypass_distance_km": 18.0,
        "nearest_shelter": "Aizawl Tourist Lodge Shelter",
        "last_contact": "35 min ago"
    }
]

def _analytics_from_villages(villages: List[Dict[str, Any]]) -> Dict[str, Any]:
    critical_count = sum(1 for v in villages if v["isolation_probability"] >= 0.75)
    high_count = sum(1 for v in villages if 0.50 <= v["isolation_probability"] < 0.75)
    total_population_exposed = sum(v["population"] for v in villages if v["isolation_probability"] >= 0.50)

    return {
        "cutoff_hamlets_total": len(villages),
        "critical_isolation_count": critical_count,
        "high_risk_count": high_count,
        "total_population_at_risk": total_population_exposed,
        "villages": villages
    }


def get_village_isolation_analytics() -> Dict[str, Any]:
    """Live PostGIS query when available; static dataset otherwise."""
    rows = fetch_villages_with_isolation()
    if rows:
        villages = [
            {
                "id": r["id"],
                "name": r["village_name"],
                "district": r["district"],
                "state": r["state"],
                "population": r["population"],
                "elevation_m": r["elevation_m"],
                "coordinates": [float(r["lat"]), float(r["lng"])],
                "blocked_road": r["blocked_road"],
                "isolation_probability": float(r["isolation_probability"]),
                "status": r["status"],
                "food_supplies_hrs": r["supplies_remaining_hours"],
                "medical_staff": bool(r["medical_staff_available"]),
                "recommended_bypass": r["recommended_bypass"] or "Field assessment pending",
                "bypass_distance_km": float(r["bypass_distance_km"] or 0),
                "nearest_shelter": r["nearest_shelter_name"] or "TBD",
                "last_contact": r["last_contact"],
            }
            for r in rows
        ]
        analytics = _analytics_from_villages(villages)
        analytics["source"] = "postgis"
        return analytics

    analytics = _analytics_from_villages(VILLAGE_ISOLATION_DATA)
    analytics["source"] = "static_fallback"
    return analytics
