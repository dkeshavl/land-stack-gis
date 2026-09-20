import { query } from "./_db.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const q = String(req.query.q || "").trim();

  try {
    let results = [];
    if (q) {
      const searchPattern = `%${q}%`;
      const sql = `
        SELECT 
          ulpin,
          owner_name as "ownerName",
          pending_owner as "pendingNewOwner",
          COALESCE(mutation_status, 'Approved') as "mutationStatus",
          khasra_no as "khasraNumber",
          zone_type as "zoneType",
          tax_status as "taxStatus",
          ST_Y(ST_Centroid(geom)) AS lat,
          ST_X(ST_Centroid(geom)) AS lng
        FROM parcels
        WHERE ulpin ILIKE $1 
           OR owner_name ILIKE $1 
           OR pending_owner ILIKE $1
           OR khasra_no ILIKE $1
        LIMIT 20;
      `;
      const pgRes = await query(sql, [searchPattern]);
      results = pgRes.rows.map((r) => ({
        ulpin: r.ulpin,
        ownerName: r.ownerName || "Registered Landholder",
        pendingNewOwner: r.pendingNewOwner || undefined,
        khasraNumber: r.khasraNumber || "-",
        zoneType: r.zoneType || "Residential",
        mutationStatus: r.mutationStatus || "Approved",
        lat: parseFloat(r.lat) || 12.9250,
        lng: parseFloat(r.lng) || 77.5850
      }));
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      results
    });
  } catch (err) {
    console.error("Vercel search API error:", err.message);
    return res.status(200).json({
      success: true,
      count: 0,
      results: []
    });
  }
}
