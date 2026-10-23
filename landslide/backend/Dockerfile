# ==============================================================================
# NER Landslide RiskWatch — FastAPI Backend with Valhalla Python Bindings
# ==============================================================================

FROM python:3.11-slim-bookworm AS base

# Install core runtime geospatial libraries and C++ runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgeos-dev \
    libpq-dev \
    libspatialindex-dev \
    libprotobuf-lite32 \
    libboost-program-options1.74.0 \
    libboost-filesystem1.74.0 \
    libboost-system1.74.0 \
    libboost-thread1.74.0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -U pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt || \
    pip install --no-cache-dir \
        fastapi>=0.110.0 \
        uvicorn>=0.28.0 \
        pydantic>=2.6.0 \
        xgboost>=2.0.0 \
        shap>=0.45.0 \
        numpy>=1.26.0 \
        pandas>=2.2.0 \
        scikit-learn>=1.4.0 \
        httpx>=0.27.0 \
        sqlalchemy>=2.0.0 \
        psycopg2-binary>=2.9.9 \
        geoalchemy2>=0.14.0 \
        shapely>=2.0.0 \
        polyline>=2.0.0 \
        geojson>=3.1.0 \
        python-dotenv>=1.0.0

# Copy application source code
COPY . .

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    VALHALLA_CONFIG_PATH=/data/valhalla.json \
    SYSTEM_MODE=LIVE

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
