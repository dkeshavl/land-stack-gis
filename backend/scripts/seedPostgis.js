/**
 * backend/scripts/seedPostgis.js
 * Ingestion script to migrate parcels.json into PostgreSQL + PostGIS
 * 
 * Run with: node backend/scripts/seedPostgis.js
 */

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

// Automatically read .env if present in backend directory
const envPath = path.join(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  envConfig.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [k, ...v] = trimmed.split("=");
      if (k && v.length) {
        process.env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
      }
    }
  });
}

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ ERROR: DATABASE_URL environment variable is missing.");
  console.error("Please set it in backend/.env or run with: DATABASE_URL=\"...\" node scripts/seedPostgis.js");
  process.exit(1);
}

if (connectionString.includes("6543") && !connectionString.includes("pgbouncer=true")) {
  connectionString += connectionString.includes("?") ? "&pgbouncer=true" : "?pgbouncer=true";
}

const pool = new Pool({
  connectionString,
  ssl:
    process.env.NODE_ENV === "production" ||
    connectionString.includes("supabase.co") ||
    connectionString.includes("supabase.com") ||
    connectionString.includes("render.com") ||
    connectionString.includes("neon.tech")
      ? { rejectUnauthorized: false }
      : false
});

async function seedParcels() {
  const client = await pool.connect();

  try {
    console.log("🔌 Connected to PostgreSQL/PostGIS database.");

    // Locate parcels.json
    const possiblePaths = [
      path.join(__dirname, "../../frontend/public/parcels.json"),
      path.join(__dirname, "../data/parcels.json"),
      path.join(__dirname, "parcels.json")
    ];

    const geoJsonPath = possiblePaths.find((p) => fs.existsSync(p));

    if (!geoJsonPath) {
      throw new Error(`parcels.json not found in paths: \n${possiblePaths.join("\n")}`);
    }

    console.log(`📂 Reading GeoJSON features from: ${geoJsonPath}`);
    const rawData = fs.readFileSync(geoJsonPath, "utf-8");
    const geojson = JSON.parse(rawData);

    if (!geojson.features || !Array.isArray(geojson.features)) {
      throw new Error("Invalid GeoJSON: FeatureCollection with 'features' array expected.");
    }

    console.log(`📦 Found ${geojson.features.length} parcel features to ingest.`);

    await client.query("BEGIN");

    const insertQuery = `
      INSERT INTO parcels (
        ulpin,
        owner_name,
        khasra_no,
        zone_type,
        tax_status,
        encumbrance,
        geom
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        ST_SetSRID(ST_GeomFromGeoJSON($7), 4326)
      )
      ON CONFLICT (ulpin) DO UPDATE SET
        owner_name = EXCLUDED.owner_name,
        khasra_no = EXCLUDED.khasra_no,
        zone_type = EXCLUDED.zone_type,
        tax_status = EXCLUDED.tax_status,
        encumbrance = EXCLUDED.encumbrance,
        geom = EXCLUDED.geom,
        updated_at = NOW();
    `;

    let insertedCount = 0;

    for (const [index, feature] of geojson.features.entries()) {
      const props = feature.properties || {};
      const geom = feature.geometry;

      if (!geom || !geom.coordinates) {
        console.warn(`⚠️ Feature #${index} has missing geometry. Skipping.`);
        continue;
      }

      const ulpin = props.ulpin || `ULPIN_${Date.now()}_${index}`;
      const ownerName = props.ownerName || props.owner_name || "Registered Landholder";
      const khasraNo = props.khasraNumber || props.khasra_no || `${40 + index}/${index + 1}`;
      const zoneType = props.zoneType || props.zone_type || "Residential";
      const taxStatus = props.taxStatus || props.tax_status || "Paid";
      const encumbrance = props.encumbrance || props.status || "Freehold - Clear Title";

      const geometryJson = JSON.stringify(geom);

      await client.query(insertQuery, [
        ulpin,
        ownerName,
        khasraNo,
        zoneType,
        taxStatus,
        encumbrance,
        geometryJson
      ]);

      insertedCount++;
    }

    await client.query("COMMIT");
    console.log(`✅ Successfully seeded ${insertedCount} parcels into PostGIS!`);

    const summaryRes = await client.query(`
      SELECT 
        COUNT(*) as total_parcels,
        ST_AsText(ST_Envelope(ST_Extent(geom))) as spatial_envelope
      FROM parcels;
    `);

    console.log("🗺️ Spatial Table Summary:", summaryRes.rows[0]);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error during PostGIS seeding:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedParcels();
