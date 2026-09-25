# NER Landslide RiskWatch — Backend (FastAPI + PostGIS)

## Data source behavior

The API serves live data from a PostGIS database when reachable and
**automatically falls back to the built-in static dataset** when it is not.
Nothing crashes without a database — check `GET /api/v1/data-source` to see
which mode is active.

## Run with a real PostGIS database

1. Start PostGIS (Docker is easiest):

   ```bash
   docker run -d --name ner-postgis \
     -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ner_landslide \
     -p 5432:5432 postgis/postgis:16-3.4
   ```

2. Configure the connection:

   ```bash
   cp .env.example .env
   # edit DATABASE_URL if you changed user/password/db/port
   ```

3. Install deps and start:

   ```bash
   pip install -r requirements.txt
   python main.py   # http://localhost:8000  (docs at /docs)
   ```

On startup the app applies `models/database.sql` (schema, idempotent) and
`models/seed.sql` (villages, roads, shelters, teams, gauges — only if empty).

## Run without a database

`python main.py` works as-is. `/api/v1/health` will report
`"postgis_connected": false` with the connection error, and the isolation
analytics endpoint will return `"source": "static_fallback"`.

## Endpoints wired to PostGIS

| Endpoint | DB-backed behavior |
|---|---|
| `GET /api/v1/health` | Real `postgis_connected` + extension check |
| `GET /api/v1/data-source` | Shows which source is active and why |
| `GET /api/v1/isolation/villages` | PostGIS nearest-blocked-road spatial join; `source: postgis` or `static_fallback` |
| `POST /api/v1/citizen/report` | Persists the report with a PostGIS point; response includes `persisted: true/false` |
| `POST /api/v1/sos` | **Real SOS ingest**: persists the beacon (`citizen_reports`, status `SOS_ACTIVE`) and auto-broadcasts a CAP alert (`cap_alerts`) in one transaction |
| `POST /api/v1/sos/cancel` | "I am safe" — flips the beacon to `ALL_CLEAR`; only confirmed if the row updated |
| `GET /api/v1/sos/active` | Live feed of all active beacons for the command center |
| `POST /api/routing/route` | Standard Valhalla routing with local OSM graph tiles |
| `POST /api/routing/safe-route` | Dynamic disaster-safe routing querying PostGIS road closures & injecting Valhalla exclusions |
| `POST /api/routing/alternative-routes` | Multi-route candidate comparison with multi-factor scoring (Safety, Travel Time, Distance, Traffic) |
| `POST /api/routing/emergency-route` | Critical responder routing (Ambulance, Fire, NDRF, SDRF, BRO) prioritizing disaster clearance |
| `GET /health/routing` | Valhalla Actor, OSM tile availability, and PostGIS spatial health check |

## Official Valhalla Routing Engine Integration

The application integrates the official [Valhalla open-source routing engine](https://github.com/valhalla/valhalla) with native Python bindings (`pyvalhalla` `Actor`) and PostGIS dynamic disaster states.

### Core Architecture:
1. **OSM Foundation**: Precompiled hierarchical graph tiles for the North Eastern Region (`Arunachal Pradesh`, `Assam`, `Manipur`, `Meghalaya`, `Mizoram`, `Nagaland`, `Sikkim`, `Tripura`) generated from Geofabrik's extract.
2. **PostGIS Dynamic State**: Dynamic landslides, rockfalls, and road closures are managed in PostGIS and applied at query time via Valhalla's `exclude_locations` and `exclude_polygons`.
3. **In-Process Actor**: `ValhallaRoutingEngine` maintains a thread-safe singleton `Actor` in FastAPI without HTTP daemon network overhead.

### Building Valhalla Tiles:
```bash
# Run automated tile compilation for North Eastern Zone
bash scripts/build_tiles.sh
```

### Full-Stack Docker Deployment:
```bash
docker compose up -d
```
