const db = require("../db");

async function run() {
  try {
    const q = `
      SELECT 
        ulpin, 
        owner_name as "ownerName", 
        khasra_no as "khasraNumber", 
        zone_type as "zoneType", 
        tax_status as "taxStatus", 
        ST_AsGeoJSON(geom)::json as geometry,
        ST_Y(ST_Centroid(geom)) as lat,
        ST_X(ST_Centroid(geom)) as lng
      FROM parcels 
      WHERE geom && ST_MakeEnvelope(77.580, 12.920, 77.592, 12.935, 4326) 
      LIMIT 60;
    `;
    const res = await db.query(q);
    console.log("Found", res.rows.length, "parcels in Jayanagar!");
    if (res.rows.length > 0) {
      console.log("Sample ULPIN:", res.rows[0].ulpin, "Coords:", res.rows[0].lat, res.rows[0].lng);
    }
  } catch (err) {
    console.error("Query err:", err.message);
  } finally {
    process.exit(0);
  }
}

run();
