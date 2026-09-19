// backend/scripts/seedCityScale.js
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Auto-load backend/.env if DATABASE_URL is not in process.env
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

const BATCH_SIZE = 250; // Ingestion chunk size

// Target: Chandigarh Pilot Area (approx. 30.70 to 30.77 Lat, 76.75 to 76.83 Lng)
const CITY_CONFIG = {
  name: "Chandigarh Pilot Sector Grid",
  minLat: 30.7050,
  maxLat: 30.7650,
  minLng: 76.7450,
  maxLng: 76.8250,
  latSteps: 60, // 60 x 70 grid = ~3,600+ realistic parcels across the city
  lngSteps: 70
};

const ZONES = ['Residential', 'Commercial', 'Agricultural', 'Institutional', 'Mixed Use'];
const TAX_STATUSES = ['Paid', 'Pending', 'Overdue'];
const ENCUMBRANCES = ['Clear', 'Active Mortgage - SBI', 'Active Mortgage - HDFC', 'Disputed - Civil Court'];
const FIRST_NAMES = ['Ramesh', 'Sunita', 'Vikram', 'Ananya', 'Gurpreet', 'Harpreet', 'Amit', 'Pooja', 'Deepak', 'Kavita'];
const LAST_NAMES = ['Sharma', 'Singh', 'Verma', 'Patel', 'Kaur', 'Gupta', 'Rao', 'Reddy', 'Mehta', 'Joshi'];

function generateRandomParcel(latStart, latEnd, lngStart, lngEnd, index) {
  // Add slight organic jitter so parcels aren't perfect grid squares
  const jitter = 0.00015;
  const p1 = [lngStart + (Math.random() - 0.5) * jitter, latStart + (Math.random() - 0.5) * jitter];
  const p2 = [lngEnd + (Math.random() - 0.5) * jitter, latStart + (Math.random() - 0.5) * jitter];
  const p3 = [lngEnd + (Math.random() - 0.5) * jitter, latEnd + (Math.random() - 0.5) * jitter];
  const p4 = [lngStart + (Math.random() - 0.5) * jitter, latEnd + (Math.random() - 0.5) * jitter];

  const coordinates = [[p1, p2, p3, p4, p1]]; // Closed GeoJSON polygon ring

  // 14-digit ULPIN: State (04) + District (001) + Sub-District (001) + 6-digit Parcel ID
  const ulpin = `04001001${String(100000 + index).slice(-6)}`;
  const owner = `${FIRST_NAMES[index % FIRST_NAMES.length]} ${LAST_NAMES[(index * 3) % LAST_NAMES.length]}`;
  const khasra = `${100 + (index % 400)}/${(index % 5) + 1}`;
  const zone = ZONES[index % ZONES.length];
  const tax = TAX_STATUSES[index % TAX_STATUSES.length];
  const encumbrance = ENCUMBRANCES[index % ENCUMBRANCES.length];

  const geojsonGeometry = JSON.stringify({
    type: "Polygon",
    coordinates: coordinates
  });

  return { ulpin, owner, khasra, zone, tax, encumbrance, geojsonGeometry };
}

async function runCitySeeder() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`🔌 Connected to PostGIS on Supabase.`);
    console.log(`🏙️ Preparing bulk cadastral generation for ${CITY_CONFIG.name}...`);

    const latDelta = (CITY_CONFIG.maxLat - CITY_CONFIG.minLat) / CITY_CONFIG.latSteps;
    const lngDelta = (CITY_CONFIG.maxLng - CITY_CONFIG.minLng) / CITY_CONFIG.lngSteps;

    const parcels = [];
    let count = 0;

    for (let i = 0; i < CITY_CONFIG.latSteps; i++) {
      for (let j = 0; j < CITY_CONFIG.lngSteps; j++) {
        // Leave gaps for roads/open infrastructure every few blocks
        if (i % 7 === 0 || j % 7 === 0) continue;

        const latStart = CITY_CONFIG.minLat + i * latDelta;
        const latEnd = latStart + latDelta * 0.92; // 8% gap for cadastral buffer/road
        const lngStart = CITY_CONFIG.minLng + j * lngDelta;
        const lngEnd = lngStart + lngDelta * 0.92;

        parcels.push(generateRandomParcel(latStart, latEnd, lngStart, lngEnd, count++));
      }
    }

    console.log(`📦 Generated ${parcels.length} full-scale city parcels. Beginning chunked database ingestion...`);

    // Ingest in batches (area_sqm is auto-calculated by PostGIS generated column)
    for (let b = 0; b < parcels.length; b += BATCH_SIZE) {
      const chunk = parcels.slice(b, b + BATCH_SIZE);
      
      const values = [];
      const queryParts = [];

      chunk.forEach((p, idx) => {
        const offset = idx * 7;
        queryParts.push(`(
          $${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, 
          $${offset + 5}, $${offset + 6}, 
          ST_SetSRID(ST_GeomFromGeoJSON($${offset + 7}), 4326)
        )`);
        values.push(p.ulpin, p.owner, p.khasra, p.zone, p.tax, p.encumbrance, p.geojsonGeometry);
      });

      const sql = `
        INSERT INTO parcels (
          ulpin, owner_name, khasra_no, zone_type, tax_status, encumbrance, geom
        ) VALUES ${queryParts.join(', ')}
        ON CONFLICT (ulpin) DO NOTHING;
      `;

      await client.query(sql, values);
      process.stdout.write(`\r🚀 Ingested: ${Math.min(b + BATCH_SIZE, parcels.length)} / ${parcels.length} parcels`);
    }

    console.log(`\n🔍 Ensuring GiST Spatial Index is up to date...`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_parcels_geom_gist ON parcels USING GIST (geom);`);
    await client.query(`VACUUM ANALYZE parcels;`);

    const finalCount = await client.query(`SELECT COUNT(*) FROM parcels;`);
    console.log(`✅ Full City Scale Active! Total Parcels in PostGIS: ${finalCount.rows[0].count}`);

  } catch (err) {
    console.error(`❌ Ingestion failed:`, err);
  } finally {
    await client.end();
  }
}

runCitySeeder();
