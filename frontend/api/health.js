import { query } from "./_db.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  let dbStatus = "disconnected";
  let parcelCount = 0;

  try {
    const result = await query("SELECT COUNT(*) FROM parcels;");
    dbStatus = "connected";
    parcelCount = parseInt(result.rows[0].count, 10);
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  return res.status(200).json({
    status: "HEALTHY",
    service: "Land Stack Spatial Registry API (Vercel Edge Node)",
    version: "2.1.0",
    compliance: "SIH PS 26014 - Ministry of Rural Development",
    database: {
      engine: "PostgreSQL 15+ / PostGIS 3+",
      status: dbStatus,
      totalParcels: parcelCount
    },
    timestamp: new Date().toISOString()
  });
}
