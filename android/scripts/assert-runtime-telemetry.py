#!/usr/bin/env python3
"""
Validates `[METEOGIS_RUNTIME_VERIFIED]` telemetry emitted over `adb logcat` by the installed
standalone APK running on a real Android 14 device against `https://meteo-gis.vercel.app`.
"""

import json
import sys


def main() -> int:
    label = sys.argv[1]
    log_line = sys.argv[2]

    if "[METEOGIS_RUNTIME_VERIFIED]" not in log_line:
        raise AssertionError(f"Missing [METEOGIS_RUNTIME_VERIFIED] marker in line: {log_line}")

    after_marker = log_line.split("[METEOGIS_RUNTIME_VERIFIED]", 1)[1].strip()
    start = after_marker.find("{")
    end = after_marker.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise AssertionError(f"Could not locate JSON object in telemetry line: {log_line}")
    payload_raw = after_marker[start : end + 1]
    data = json.loads(payload_raw)
    print(f"{label}_RUNTIME_PROOF={json.dumps(data, sort_keys=True)}")

    assert data.get("activeApiBase") == "https://meteo-gis.vercel.app", f"Unexpected API base: {data}"
    assert data.get("nativeBuildProdUrl") == "https://meteo-gis.vercel.app", f"Unexpected BuildConfig URL: {data}"
    assert data.get("hazardsHttp") == 200, f"Live hazards HTTP failed: {data}"
    assert data.get("warningsHttp") == 200, f"Live warnings HTTP failed: {data}"
    assert data.get("stationsHttp") == 200, f"Live stations HTTP failed: {data}"
    assert data.get("riskPredictOk") is True, f"Live ML risk prediction failed: {data}"
    assert data.get("routeOk") is True, f"Live evacuation route check failed: {data}"
    assert data.get("routeClosureVerification") == "closure_unverified", (
        f"Expected closure_unverified routing classification on OSRM feed, got: {data}"
    )
    assert data.get("routeBadge") == "Road-Closure Safety Unverified", (
        f"Unexpected route badge label: {data}"
    )
    assert int(data.get("routeVertices", 0)) >= 5, f"Insufficient route geometry vertices: {data}"
    assert data.get("sosDryRunStatus") == "queued_not_delivered", f"Unexpected SOS dry-run state: {data}"
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
