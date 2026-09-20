const fs = require("fs");
const path = require("path");
const db = require("../db");

async function sync() {
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
      ORDER BY id ASC
      LIMIT 80;
    `;
    const res = await db.query(q);
    console.log("Fetched", res.rows.length, "parcels from PostGIS.");

    if (res.rows.length === 0) {
      console.log("No rows found.");
      return;
    }

    const demoUlpins = [
      { ulpin: "1234567890ABCD", owner: "Rajesh Kumar", khasra: "45/2", zone: "Commercial", status: "Pending" },
      { ulpin: "1234567891ABCE", owner: "Priya Sharma", khasra: "46/1", zone: "Residential", status: "Pending" },
      { ulpin: "1234567892ABCF", owner: "Amit Patel", khasra: "47/3", zone: "Mixed Use", status: "Approved" },
      { ulpin: "1234567893ABCG", owner: "Sunita Rao", khasra: "14/1", zone: "Commercial", status: "Approved" },
      { ulpin: "1234567894ABCH", owner: "Vikram Singh", khasra: "14/2", zone: "Residential", status: "Pending" },
      { ulpin: "1234567895ABCI", owner: "Ananya Gupta", khasra: "14/3", zone: "Mixed Use", status: "Approved" },
      { ulpin: "1234567896ABCJ", owner: "Rohan Verma", khasra: "15/1", zone: "Commercial", status: "Approved" },
      { ulpin: "1234567897ABCK", owner: "Meenakshi Iyer", khasra: "15/2", zone: "Residential", status: "Pending" },
      { ulpin: "29572001218407", owner: "Arjun Reddy", khasra: "149/2", zone: "Residential", status: "Rejected" }
    ];

    const features = [];
    const usedIndices = new Set();

    // Assign real geometries to demo ULPINs first
    demoUlpins.forEach((demo, idx) => {
      const row = res.rows[idx];
      if (row) {
        usedIndices.add(idx);
        features.push({
          type: "Feature",
          id: demo.ulpin,
          properties: {
            ulpin: demo.ulpin,
            ownerName: demo.owner,
            khasraNumber: demo.khasra,
            zoneType: demo.zone,
            mutationStatus: demo.status,
            lat: row.lat,
            lng: row.lng
          },
          geometry: row.geometry
        });
      }
    });

    // Add remaining real PostGIS parcels
    res.rows.forEach((row, idx) => {
      if (!usedIndices.has(idx)) {
        features.push({
          type: "Feature",
          id: row.ulpin,
          properties: {
            ulpin: row.ulpin,
            ownerName: row.ownerName || "Landholder",
            khasraNumber: row.khasraNumber || `${idx + 10}/1`,
            zoneType: row.zoneType || "Residential",
            taxStatus: row.taxStatus || "Paid",
            mutationStatus: "Approved",
            lat: row.lat,
            lng: row.lng
          },
          geometry: row.geometry
        });
      }
    });

    const outGeoJson = {
      type: "FeatureCollection",
      features
    };

    const outPath = path.join(__dirname, "../../frontend/public/parcels.json");
    fs.writeFileSync(outPath, JSON.stringify(outGeoJson, null, 2), "utf-8");
    console.log("Successfully wrote", features.length, "cadastral features into:", outPath);

    // Also update demo ULPIN coords in registryStore if needed
    console.log("Demo 1234567890ABCD coordinates:", features[0].properties.lat, features[0].properties.lng);
  } catch (err) {
    console.error("Sync err:", err);
  } finally {
    process.exit(0);
  }
}

sync();
