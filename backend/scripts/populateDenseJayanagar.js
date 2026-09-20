const fs = require("fs");
const path = require("path");
const db = require("../db");

async function populateDenseJayanagar() {
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
      WHERE geom && ST_MakeEnvelope(77.570, 12.910, 77.600, 12.945, 4326) 
      ORDER BY id ASC
      LIMIT 600;
    `;
    const res = await db.query(q);
    console.log("Fetched", res.rows.length, "dense parcels from Supabase across Jayanagar.");

    if (res.rows.length === 0) return;

    const demoUlpins = [
      { ulpin: "1234567890ABCD", owner: "Rajesh Kumar", khasra: "45/2", zone: "Commercial", status: "Pending" },
      { ulpin: "1234567891ABCE", owner: "Priya Sharma", khasra: "46/1", zone: "Residential", status: "Pending" },
      { ulpin: "1234567892ABCF", owner: "Amit Patel", khasra: "47/3", zone: "Mixed Use", status: "Approved" },
      { ulpin: "1234567893ABCG", owner: "Sunita Rao", khasra: "14/1", zone: "Commercial", status: "Approved" },
      { ulpin: "1234567894ABCH", owner: "Vikram Singh", khasra: "14/2", zone: "Residential", status: "Pending" },
      { ulpin: "1234567895ABCI", owner: "Ananya Gupta", khasra: "14/3", zone: "Mixed Use", status: "Approved" },
      { ulpin: "1234567896ABCJ", owner: "Rohan Verma", khasra: "15/1", zone: "Commercial", status: "Approved" },
      { ulpin: "1234567897ABCK", owner: "Meenakshi Iyer", khasra: "15/2", zone: "Residential", status: "Pending" },
      { ulpin: "29572001218407", owner: "Arjun Reddy", khasra: "149/2", zone: "Residential", status: "Rejected" },
      { ulpin: "29572001199490", owner: "Naveen Gowda", khasra: "52/1", zone: "Commercial", status: "Approved" },
      { ulpin: "29572001218435", owner: "Keshav", khasra: "335/4", zone: "Residential", status: "Approved" }
    ];

    const features = [];
    const usedIndices = new Set();

    // Map the key demo ULPINs
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

    // Add all remaining real building parcels
    res.rows.forEach((row, idx) => {
      if (!usedIndices.has(idx)) {
        features.push({
          type: "Feature",
          id: row.ulpin,
          properties: {
            ulpin: row.ulpin,
            ownerName: row.ownerName || "Registered Landholder",
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

    const outPath = path.join(__dirname, "../../frontend/public/parcels.json");
    fs.writeFileSync(outPath, JSON.stringify({ type: "FeatureCollection", features }), "utf-8");
    console.log("Successfully wrote", features.length, "dense parcels to", outPath);
    console.log("File size:", (fs.statSync(outPath).size / 1024).toFixed(1), "KB");
  } catch (err) {
    console.error("Error populating parcels:", err);
  } finally {
    process.exit(0);
  }
}

populateDenseJayanagar();
