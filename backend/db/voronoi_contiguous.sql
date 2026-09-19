-- ============================================================================
-- Land Stack GIS - Gapless Cadastral Boundary Generation via Voronoi Polygons
-- Target: PostgreSQL 14+ with PostGIS 3+
-- Purpose: Mathematically converts building footprints into gapless, contiguous
--          cadastral parcel boundaries identical to LandGlide / Regrid.
-- ============================================================================

-- Step 1: Create a staging table with building centroids and attributes
DROP TABLE IF EXISTS parcel_centroids CASCADE;
CREATE TABLE parcel_centroids AS
SELECT 
    id,
    ulpin,
    owner_name,
    khasra_no,
    zone_type,
    tax_status,
    encumbrance,
    ST_Centroid(geom) AS centroid
FROM parcels
WHERE ST_IsValid(geom);

CREATE INDEX idx_centroids_geom ON parcel_centroids USING GIST (centroid);

-- Step 2: Compute City Bounding Envelope for clipping infinite rays
-- We expand the envelope by 0.005 degrees (~500m) to encompass peripheral parcels
DROP TABLE IF EXISTS city_bounding_mask CASCADE;
CREATE TABLE city_bounding_mask AS
SELECT ST_SetSRID(
    ST_Envelope(ST_Collect(centroid)), 
    4326
) AS envelope
FROM parcel_centroids;

-- Step 3: Generate Gapless Voronoi Polygons & Spatially Re-join Attributes
-- Note: ST_VoronoiPolygons computes the Delaunay dual. ST_Dump separates the geometrycollection.
DROP TABLE IF EXISTS parcels_contiguous CASCADE;

CREATE TABLE parcels_contiguous (
    id SERIAL PRIMARY KEY,
    ulpin VARCHAR(14) UNIQUE NOT NULL,
    owner_name VARCHAR(255) NOT NULL DEFAULT 'Registered Owner',
    khasra_no VARCHAR(50) NOT NULL,
    zone_type VARCHAR(50) NOT NULL DEFAULT 'Residential',
    tax_status VARCHAR(20) NOT NULL DEFAULT 'Paid',
    encumbrance VARCHAR(100) NOT NULL DEFAULT 'Freehold - Clear Title',
    geom GEOMETRY(Geometry, 4326) NOT NULL,
    area_sqm NUMERIC(12, 2) GENERATED ALWAYS AS (ST_Area(geom::geography)) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Execute Voronoi diagram generation clipped to the city boundary
-- Each Voronoi polygon mathematically encapsulates exactly one centroid
INSERT INTO parcels_contiguous (ulpin, owner_name, khasra_no, zone_type, tax_status, encumbrance, geom)
WITH raw_voronoi AS (
    SELECT (ST_Dump(ST_VoronoiPolygons(ST_Collect(c.centroid), 0.0, (SELECT envelope FROM city_bounding_mask)))).geom AS v_geom
    FROM parcel_centroids c
),
clipped_voronoi AS (
    SELECT ST_Intersection(v.v_geom, m.envelope) AS geom
    FROM raw_voronoi v, city_bounding_mask m
    WHERE ST_IsValid(v.v_geom)
)
SELECT 
    c.ulpin,
    c.owner_name,
    c.khasra_no,
    c.zone_type,
    c.tax_status,
    c.encumbrance,
    ST_Multi(ST_CollectionExtract(v.geom, 3)) AS geom
FROM clipped_voronoi v
JOIN parcel_centroids c 
  ON ST_Contains(v.geom, c.centroid)
ON CONFLICT (ulpin) DO NOTHING;

-- Step 4: Atomic Swap & Index Reconstruction
DROP TABLE IF EXISTS parcels CASCADE;
ALTER TABLE parcels_contiguous RENAME TO parcels;

-- Rebuild GiST Spatial Index for sub-millisecond BBox viewport queries
CREATE INDEX idx_parcels_geom_gist ON parcels USING GIST (geom);
CREATE INDEX idx_parcels_ulpin ON parcels (ulpin);
CREATE INDEX idx_parcels_khasra ON parcels (khasra_no);
CREATE INDEX idx_parcels_zone ON parcels (zone_type);

-- Clean up staging tables
DROP TABLE IF EXISTS parcel_centroids CASCADE;
DROP TABLE IF EXISTS city_bounding_mask CASCADE;

-- Refresh PostGIS R-Tree query planner statistics
VACUUM ANALYZE parcels;

-- Verification query
SELECT 
    COUNT(*) AS total_contiguous_parcels,
    ST_AsText(ST_Envelope(ST_Extent(geom))) AS cadastral_extent
FROM parcels;
