import { query } from "./_db.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { bbox } = req.query;

    if (bbox) {
      const coords = String(bbox)
        .split(",")
        .map((c) => parseFloat(c.trim()));

      if (coords.length !== 4 || coords.some(isNaN)) {
        return res.status(400).json({
          type: "FeatureCollection",
          features: [],
          error: "Invalid bbox format. Expected: ?bbox=minLng,minLat,maxLng,maxLat"
        });
      }

      const [minLng, minLat, maxLng, maxLat] = coords;

      if (minLng < -180 || maxLng > 180 || minLat < -90 || maxLat > 90) {
        return res.status(400).json({
          type: "FeatureCollection",
          features: [],
          error: "BBox coordinates out of valid EPSG:4326 range."
        });
      }

      if (minLng >= maxLng || minLat >= maxLat) {
        return res.status(400).json({
          type: "FeatureCollection",
          features: [],
          error: "Invalid bounding envelope: minLng must be < maxLng and minLat must be < maxLat."
        });
      }

      // Spatial DOS Guard: Protect database from whole-world queries
      const lngSpan = Math.abs(maxLng - minLng);
      const latSpan = Math.abs(maxLat - minLat);
      if (lngSpan > 1.5 || latSpan > 1.5) {
        return res.status(400).json({
          type: "FeatureCollection",
          features: [],
          error: "Viewport envelope too large. Zoom in closer to inspect cadastral boundaries."
        });
      }

      const sql = `
        SELECT json_build_object(
          'type', 'FeatureCollection',
          'features', COALESCE(
            json_agg(
              json_build_object(
                'type', 'Feature',
                'geometry', ST_AsGeoJSON(ST_Simplify(p.geom, 0.00005))::json,
                'properties', json_build_object(
                  'ulpin', p.ulpin
                )
              )
            ),
            '[]'::json
          )
        ) AS geojson
        FROM (
          SELECT ulpin, geom
          FROM parcels
          WHERE geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)
            AND ST_Intersects(geom, ST_MakeEnvelope($1, $2, $3, $4, 4326))
          LIMIT 1500
        ) p;
      `;

      const startTime = Date.now();
      const result = await query(sql, [minLng, minLat, maxLng, maxLat]);
      const duration = Date.now() - startTime;

      res.setHeader("X-Response-Time", `${duration}ms`);
      res.setHeader("Cache-Control", "public, max-age=10, stale-while-revalidate=30");

      return res.status(200).json(result.rows[0]?.geojson || { type: "FeatureCollection", features: [] });
    }

    // Default: Return recent parcels if no bbox specified
    const allQuery = `
      SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(
          json_agg(
            json_build_object(
              'type', 'Feature',
              'id', p.id,
              'geometry', ST_AsGeoJSON(p.geom)::json,
              'properties', json_build_object(
                'id', p.id,
                'ulpin', p.ulpin,
                'ownerName', p.owner_name,
                'khasraNumber', p.khasra_no,
                'zoneType', p.zone_type,
                'taxStatus', p.tax_status,
                'encumbrance', p.encumbrance,
                'areaSqm', p.area_sqm
              )
            )
          ),
          '[]'::json
        )
      ) AS geojson
      FROM (
        SELECT id, ulpin, owner_name, khasra_no, zone_type, tax_status, encumbrance, area_sqm, geom
        FROM parcels
        ORDER BY updated_at DESC, id DESC
        LIMIT 100
      ) p;
    `;

    const allResult = await query(allQuery);
    return res.status(200).json(allResult.rows[0]?.geojson || { type: "FeatureCollection", features: [] });
  } catch (err) {
    console.error("Vercel BBox parcels API error:", err.message);
    return res.status(200).json({
      type: "FeatureCollection",
      features: [],
      error: err.message
    });
  }
}
