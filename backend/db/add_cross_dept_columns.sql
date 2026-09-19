-- ============================================================================
-- SIH Problem Statement 26014: Cross-Departmental Data Enrichment Migration
-- Adds Municipal Water, Power Grid, and Environmental Protection Zones
-- ============================================================================

-- 1. Add Cross-Departmental Integration Columns to Parcels Table
ALTER TABLE parcels 
ADD COLUMN IF NOT EXISTS water_connection_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS power_connection_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS environmental_zone VARCHAR(100) DEFAULT 'Standard';

-- 2. Create B-Tree Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_parcels_water ON parcels (water_connection_id);
CREATE INDEX IF NOT EXISTS idx_parcels_power ON parcels (power_connection_id);
CREATE INDEX IF NOT EXISTS idx_parcels_env_zone ON parcels (environmental_zone);
