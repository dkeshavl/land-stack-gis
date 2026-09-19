// backend/scripts/ingestBengaluru.js
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Auto-load backend/.env if DATABASE_URL is not set
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

// Lazy-load osmtogeojson
let osmtogeojson;
try {
  osmtogeojson = require('osmtogeojson');
} catch (e) {
  console.error("osmtogeojson not yet installed. Run: npm install osmtogeojson in backend/");
}

// Bengaluru City Bounds (Greater Bengaluru Area: Koramangala, Indiranagar, Whitefield, CBD, Malleshwaram)
const CITY = {
  minLat: 12.85, 
  maxLat: 13.10,
  minLng: 77.45,
  maxLng: 77.75,
  step: 0.05 // Breaks the city into ~5.5km x 5.5km chunks
};

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function fetchChunk(sLat, sLng, nLat, nLng) {
  const query = `
    [out:json][timeout:60];
    (
      way["building"](${sLat},${sLng},${nLat},${nLng});
      way["landuse"="residential"](${sLat},${sLng},${nLat},${nLng});
      way["landuse"="commercial"](${sLat},${sLng},${nLat},${nLng});
    );
    out body;
    >;
    out skel qt;
  `;
  
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
    headers: {
      'User-Agent': 'LandStack-GIS-SIH/1.0 (Hackathon Spatial Ingestion)'
    }
  });
  
  if (!response.ok) throw new Error(`Overpass API Error: ${response.status} ${response.statusText}`);
  return await response.json();
}

async function runCityCrawler() {
  if (!osmtogeojson) {
    osmtogeojson = require('osmtogeojson');
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('🚀 Connected to Supabase PostGIS.');
  console.log('🧹 Clearing old parcels...');
  await client.query('TRUNCATE TABLE parcels RESTART IDENTITY CASCADE;');

  let globalCounter = 0;
  
  const latSteps = Math.ceil((CITY.maxLat - CITY.minLat) / CITY.step);
  const lngSteps = Math.ceil((CITY.maxLng - CITY.minLng) / CITY.step);
  const totalChunks = latSteps * lngSteps;
  let currentChunk = 0;

  console.log(`🗺️  Divided Bengaluru into ${totalChunks} spatial chunks. Starting crawler...`);

  for (let i = 0; i < latSteps; i++) {
    for (let j = 0; j < lngSteps; j++) {
      currentChunk++;
      const sLat = CITY.minLat + (i * CITY.step);
      const sLng = CITY.minLng + (j * CITY.step);
      const nLat = sLat + CITY.step;
      const nLng = sLng + CITY.step;

      console.log(`\n📦 Fetching Chunk ${currentChunk}/${totalChunks} [Lat: ${sLat.toFixed(2)} - ${nLat.toFixed(2)} | Lng: ${sLng.toFixed(2)} - ${nLng.toFixed(2)}]...`);
      
      try {
        const rawOsmData = await fetchChunk(sLat, sLng, nLat, nLng);
        const geojsonData = osmtogeojson(rawOsmData);
        
        const polygons = geojsonData.features.filter(f => 
          f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
        );

        if (polygons.length === 0) {
          console.log(`   ⏭️  No buildings found in this chunk.`);
          continue;
        }

        console.log(`   📥 Received ${polygons.length} building polygons. Ingesting in sub-batches...`);

        // Sub-batch in groups of 200 to respect PostgreSQL query parameter limits
        const SUB_BATCH_SIZE = 200;
        for (let b = 0; b < polygons.length; b += SUB_BATCH_SIZE) {
          const slice = polygons.slice(b, b + SUB_BATCH_SIZE);
          let queryParts = [];
          let values = [];

          slice.forEach((feature, idx) => {
            const offset = idx * 7;
            const u = globalCounter + b + idx;
            
            // 14-digit Karnataka ULPIN: State (29) + District (572) + Sub-District (001) + 6-digit Parcel
            const ulpin = `29572001${String(100000 + (u % 900000)).slice(-6)}`;
            const owner = `Citizen ${u + 1}`;
            const khasra = `${100 + (u % 300)}/${(u % 4) + 1}`;
            const zone = feature.properties?.landuse || (feature.properties?.['building'] === 'commercial' ? 'Commercial' : 'Residential');
            const tax = u % 5 === 0 ? 'Pending' : 'Paid';
            const encumbrance = u % 15 === 0 ? 'Active Mortgage - SBI' : 'Freehold - Clear Title';
            
            // Note: area_sqm is omitted because it is a GENERATED ALWAYS column computed by PostGIS
            queryParts.push(`(
              $${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4},
              $${offset + 5}, $${offset + 6},
              ST_SetSRID(ST_GeomFromGeoJSON($${offset + 7}), 4326)
            )`);
            
            values.push(ulpin, owner, khasra, zone, tax, encumbrance, JSON.stringify(feature.geometry));
          });

          // Insert into PostGIS
          const sql = `
            INSERT INTO parcels (ulpin, owner_name, khasra_no, zone_type, tax_status, encumbrance, geom) 
            VALUES ${queryParts.join(', ')} 
            ON CONFLICT (ulpin) DO NOTHING;
          `;
          
          await client.query(sql, values);
        }

        globalCounter += polygons.length;
        console.log(`   ✅ Ingested ${polygons.length} parcels. Total in DB: ${globalCounter}`);

        // Wait 6 seconds between Overpass chunks
        console.log(`   ⏳ Cooling down for Overpass API rate limits (6s)...`);
        await delay(6000);

      } catch (err) {
        console.error(`   ❌ Failed to fetch/insert chunk: ${err.message}`);
        console.log(`   ⏳ Cooling down for 10 seconds before resuming...`);
        await delay(10000);
      }
    }
  }

  console.log(`\n🎉 CRAWL COMPLETE! Re-indexing spatial columns...`);
  await client.query('REINDEX TABLE parcels;');
  await client.query('VACUUM ANALYZE parcels;');
  
  const finalRes = await client.query('SELECT COUNT(*) FROM parcels;');
  console.log(`🏆 Successfully mapped Bengaluru with ${finalRes.rows[0].count} real properties in PostGIS!`);
  await client.end();
}

runCityCrawler();
