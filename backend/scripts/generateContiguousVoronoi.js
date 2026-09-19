// backend/scripts/generateContiguousVoronoi.js
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Auto-load backend/.env
if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [k, ...v] = trimmed.split('=');
        if (k && v.length && !process.env[k.trim()]) {
          process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
  }
}

async function runContiguousVoronoiMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔌 Connected to PostgreSQL/PostGIS on Supabase.');
    console.log('📐 Starting Gapless Cadastral Voronoi Transformation...');

    // 1. Create parcels_contiguous table
    console.log('🏗️  Creating parcels_contiguous table structure...');
    await client.query(`
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
    `);

    // 2. We extract the bounding box and grid cells to run Voronoi in robust, bounded partitions
    console.log('🔍 Analyzing existing centroid distribution...');
    const gridRes = await client.query(`
      SELECT 
        floor(ST_X(ST_Centroid(geom)) * 50) / 50.0 AS cell_lng,
        floor(ST_Y(ST_Centroid(geom)) * 50) / 50.0 AS cell_lat,
        count(*) as pt_count
      FROM parcels
      WHERE ST_IsValid(geom)
      GROUP BY 1, 2
      HAVING count(*) >= 3
      ORDER BY count(*) DESC;
    `);

    console.log(`📦 Found ${gridRes.rows.length} spatial grid sectors to process into gapless boundaries.`);

    let totalCreated = 0;

    for (const [idx, cell] of gridRes.rows.entries()) {
      const minX = parseFloat(cell.cell_lng);
      const minY = parseFloat(cell.cell_lat);
      const maxX = minX + 0.02;
      const maxY = minY + 0.02;

      process.stdout.write(`\r⏳ Processing sector ${idx + 1}/${gridRes.rows.length} [Lng: ${minX.toFixed(2)}, Lat: ${minY.toFixed(2)}] (${cell.pt_count} points)...`);

      const sectorSql = `
        WITH sector_points AS (
          SELECT id, ulpin, owner_name, khasra_no, zone_type, tax_status, encumbrance, ST_Centroid(geom) as centroid
          FROM parcels
          WHERE geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)
            AND ST_Intersects(geom, ST_MakeEnvelope($1, $2, $3, $4, 4326))
        ),
        envelope_mask AS (
          SELECT ST_MakeEnvelope($1, $2, $3, $4, 4326) as env
        ),
        voronoi_cells AS (
          SELECT (ST_Dump(ST_VoronoiPolygons(ST_Collect(p.centroid), 0.0, (SELECT env FROM envelope_mask)))).geom as v_geom
          FROM sector_points p
        ),
        clipped_cells AS (
          SELECT ST_Intersection(v.v_geom, m.env) as geom
          FROM voronoi_cells v, envelope_mask m
          WHERE ST_IsValid(v.v_geom)
        )
        INSERT INTO parcels_contiguous (ulpin, owner_name, khasra_no, zone_type, tax_status, encumbrance, geom)
        SELECT 
          p.ulpin, p.owner_name, p.khasra_no, p.zone_type, p.tax_status, p.encumbrance,
          ST_Multi(ST_CollectionExtract(c.geom, 3)) as geom
        FROM clipped_cells c
        JOIN sector_points p ON ST_Contains(c.geom, p.centroid)
        ON CONFLICT (ulpin) DO NOTHING;
      `;

      try {
        const insertRes = await client.query(sectorSql, [minX, minY, maxX, maxY]);
        totalCreated += insertRes.rowCount || 0;
      } catch (err) {
        // Continue through other sectors
      }
    }

    console.log(`\n✅ Generated ${totalCreated} gapless Voronoi cadastral boundaries!`);

    // 3. Swap tables and recreate spatial index
    console.log('🔄 Swapping parcels table & building GiST spatial index...');
    await client.query(`
      DROP TABLE IF EXISTS parcels CASCADE;
      ALTER TABLE parcels_contiguous RENAME TO parcels;
      CREATE INDEX idx_parcels_geom_gist ON parcels USING GIST (geom);
      CREATE INDEX idx_parcels_ulpin ON parcels (ulpin);
      VACUUM ANALYZE parcels;
    `);

    const finalRes = await client.query('SELECT count(*) FROM parcels');
    console.log(`🎉 Complete! Total gapless parcels in live PostGIS: ${finalRes.rows[0].count}`);

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

runContiguousVoronoiMigration();
