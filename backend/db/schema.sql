-- ============================================================================
-- Land Stack GIS - PostGIS Database Schema
-- Target: PostgreSQL 14+ with PostGIS 3+
-- ============================================================================

-- 1. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create the parcels table with geometry column
CREATE TABLE IF NOT EXISTS parcels (
    id SERIAL PRIMARY KEY,
    ulpin VARCHAR(14) UNIQUE NOT NULL,
    owner_name VARCHAR(255) NOT NULL DEFAULT 'Registered Owner',
    khasra_no VARCHAR(50) NOT NULL,
    zone_type VARCHAR(50) NOT NULL DEFAULT 'Residential',
    tax_status VARCHAR(20) NOT NULL DEFAULT 'Paid',
    encumbrance VARCHAR(100) NOT NULL DEFAULT 'Freehold - No Active Liens',
    geom GEOMETRY(Geometry, 4326) NOT NULL,
    area_sqm NUMERIC(12, 2) GENERATED ALWAYS AS (ST_Area(geom::geography)) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create GiST Spatial Index for sub-millisecond BBox queries
CREATE INDEX IF NOT EXISTS idx_parcels_geom_gist ON parcels USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_parcels_ulpin ON parcels (ulpin);
CREATE INDEX IF NOT EXISTS idx_parcels_khasra ON parcels (khasra_no);
CREATE INDEX IF NOT EXISTS idx_parcels_zone ON parcels (zone_type);
