const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const db = require("../db");
const {
  mockData,
  recordAuditLog,
  updateParcelsJsonFile
} = require("../data/registryStore");

/**
 * GET /api/parcels
 * Supports:
 * - Spatial BBox query: ?bbox=minLng,minLat,maxLng,maxLat
 * - Fallback query: Returns standard FeatureCollection
 */
router.get("/", async (req, res) => {
  try {
    const { bbox } = req.query;

    if (bbox) {
      // 1. Parse & Validate Coordinates
      const coords = bbox.split(",").map((c) => parseFloat(c.trim()));

      if (coords.length !== 4 || coords.some(isNaN)) {
        return res.status(400).json({
          type: "FeatureCollection",
          features: [],
          error: "Invalid bbox format. Expected: ?bbox=minLng,minLat,maxLng,maxLat"
        });
      }

      const [minLng, minLat, maxLng, maxLat] = coords;

      // Coordinate boundary sanity checks (EPSG:4326)
      if (minLng < -180 || maxLng > 180 || minLat < -90 || maxLat > 90) {
        return res.status(400).json({
          type: "FeatureCollection",
          features: [],
          error: "BBox coordinates out of valid EPSG:4326 range (-180 to 180, -90 to 90)."
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

      // High-performance query with direct JSON construction in PostgreSQL
      // ST_Simplify(geom, 0.00005) reduces vertex count, only 'ulpin' returned in properties for minimum payload
      const query = `
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
      const result = await db.query(query, [minLng, minLat, maxLng, maxLat]);
      const duration = Date.now() - startTime;

      res.set({
        "Content-Type": "application/json",
        "X-Response-Time": `${duration}ms`,
        "Cache-Control": "public, max-age=5, stale-while-revalidate=15"
      });

      return res.json(result.rows[0].geojson);
    }

    // Registry / Fallback: If no bbox is supplied, return recent parcels with subquery LIMIT and overlay pending mutations
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

    const allResult = await db.query(allQuery);
    const geojson = allResult.rows[0]?.geojson || { type: "FeatureCollection", features: [] };
    const features = Array.isArray(geojson.features) ? geojson.features : [];

    // Overlay in-memory mockData mutation states & ensure any pending mutations (like 29572001218407) appear at top
    const seenUlpins = new Set(features.map((f) => (f.properties?.ulpin || "").toUpperCase()));

    Object.entries(mockData).forEach(([mUlpin, mData]) => {
      const cleanM = (mUlpin || "").toUpperCase();
      const existingFeat = features.find((f) => (f.properties?.ulpin || "").toUpperCase() === cleanM);

      if (existingFeat) {
        if (mData.ownership?.mutationStatus) {
          existingFeat.properties.mutationStatus = mData.ownership.mutationStatus;
        }
        if (mData.ownership?.pendingNewOwner) {
          existingFeat.properties.pendingNewOwner = mData.ownership.pendingNewOwner;
        }
        if (mData.ownership?.previousOwner) {
          existingFeat.properties.previousOwner = mData.ownership.previousOwner;
        }
        if (mData.ownership?.applicationId) {
          existingFeat.properties.applicationId = mData.ownership.applicationId;
        }
        if (mData.ownership?.transferReason) {
          existingFeat.properties.transferReason = mData.ownership.transferReason;
        }
        if (mData.ownership?.appliedAt) {
          existingFeat.properties.appliedAt = mData.ownership.appliedAt;
        }
      } else if (mData.ownership?.mutationStatus === "Pending") {
        features.unshift({
          type: "Feature",
          id: cleanM,
          geometry: {
            type: "Point",
            coordinates: [mData.lng || 77.5917, mData.lat || 12.9338]
          },
          properties: {
            id: cleanM,
            ulpin: cleanM,
            ownerName: mData.ownership?.previousOwner || mData.ownership?.ownerName || "Registered Landholder",
            previousOwner: mData.ownership?.previousOwner,
            pendingNewOwner: mData.ownership?.pendingNewOwner || mData.ownership?.ownerName,
            khasraNumber: mData.ownership?.khasraNumber || "45/2",
            zoneType: mData.zoning?.zoneType || "Residential",
            taxStatus: mData.tax?.propertyTaxStatus || "Paid",
            encumbrance: mData.encumbrance?.status || "Freehold - No Active Liens",
            areaSqm: mData.area_sqm || 200,
            mutationStatus: "Pending",
            applicationId: mData.ownership?.applicationId || `MUT-${cleanM.slice(-6)}`,
            transferReason: mData.ownership?.transferReason || "Sale Deed",
            appliedAt: mData.ownership?.appliedAt || new Date().toISOString()
          }
        });
        seenUlpins.add(cleanM);
      }
    });

    return res.json({
      type: "FeatureCollection",
      features
    });

  } catch (err) {
    console.warn("PostGIS parcels API query failed, falling back to cached registry:", err.message);
    const fallbackFeatures = [];

    // 1. First include all pending and mock mutations from registryStore
    Object.entries(mockData).forEach(([mUlpin, mData]) => {
      fallbackFeatures.push({
        type: "Feature",
        id: mUlpin,
        geometry: {
          type: "Point",
          coordinates: [mData.lng || 77.5917, mData.lat || 12.9338]
        },
        properties: {
          id: mUlpin,
          ulpin: mUlpin,
          ownerName: mData.ownership?.previousOwner || mData.ownership?.ownerName || "Landholder",
          previousOwner: mData.ownership?.previousOwner,
          pendingNewOwner: mData.ownership?.pendingNewOwner || (mData.ownership?.mutationStatus === "Pending" ? mData.ownership?.ownerName : undefined),
          khasraNumber: mData.ownership?.khasraNumber || "12/1",
          zoneType: mData.zoning?.zoneType || "Residential",
          taxStatus: mData.tax?.propertyTaxStatus || "Paid",
          encumbrance: mData.encumbrance?.status || "Freehold - No Active Liens",
          areaSqm: mData.area_sqm || 200,
          mutationStatus: mData.ownership?.mutationStatus || "Pending",
          applicationId: mData.ownership?.applicationId || `MUT-${mUlpin.slice(-6)}`,
          transferReason: mData.ownership?.transferReason || "Sale Deed",
          appliedAt: mData.ownership?.appliedAt || new Date().toISOString()
        }
      });
    });

    // 2. Merge frontend/public/parcels.json if available
    try {
      const fallbackPath = path.join(__dirname, "../../frontend/public/parcels.json");
      if (fs.existsSync(fallbackPath)) {
        const fileContent = fs.readFileSync(fallbackPath, "utf-8");
        const parsed = JSON.parse(fileContent);
        if (Array.isArray(parsed?.features)) {
          parsed.features.forEach((feat) => {
            const u = feat?.properties?.ulpin;
            if (u && !fallbackFeatures.some((f) => f.properties?.ulpin === u)) {
              fallbackFeatures.push(feat);
            }
          });
        }
      }
    } catch (fallbackErr) {
      console.error("Fallback parcels.json error:", fallbackErr.message);
    }

    return res.json({
      type: "FeatureCollection",
      features: fallbackFeatures
    });
  }
});

/**
 * Formats raw PostGIS database row into full DPI Cadastral Dossier JSON
 */
function formatPostgisParcel(row) {
  const lat = parseFloat(row.lat);
  const lng = parseFloat(row.lng);
  const areaSqm = parseFloat(row.area_sqm) || 0;
  const isLakeBuffer =
    (row.environmental_zone || "").toLowerCase().includes("buffer") ||
    (row.environmental_zone || "").toLowerCase().includes("lake");

  return {
    id: row.id,
    ulpin: row.ulpin,
    lat,
    lng,
    owner_name: row.owner_name,
    ownerName: row.owner_name,
    khasra_no: row.khasra_no,
    khasraNumber: row.khasra_no,
    zone_type: row.zone_type,
    zoneType: row.zone_type,
    tax_status: row.tax_status,
    taxStatus: row.tax_status,
    encumbrance: row.encumbrance,
    area_sqm: areaSqm,
    areaSqm: areaSqm,
    water_connection_id: row.water_connection_id,
    power_connection_id: row.power_connection_id,
    environmental_zone: row.environmental_zone || "Standard",
    ownership: {
      ownerName: row.owner_name,
      khasraNumber: row.khasra_no,
      mutationStatus: "Approved"
    },
    zoning: {
      zoneType: row.zone_type,
      landUse: row.zone_type === "Commercial" ? "Commercial Retail / Office" : "Residential Primary",
      maxHeight: "15m (G+3)"
    },
    tax: {
      propertyTaxStatus: row.tax_status,
      lastPaidDate: "2025-2026 Fiscal",
      amount: "₹14,200"
    },
    utilities: {
      waterSupply: row.water_connection_id ? "Connected (BWSSB Piped Grid)" : "Active Municipal Connection",
      waterConnectionId: row.water_connection_id || "BWSSB-MUNICIPAL",
      powerConnectionId: row.power_connection_id || "BESCOM-GRID",
      electricityGrid: row.power_connection_id
        ? `Connected (${row.power_connection_id})`
        : "3-Phase Commercial/Domestic Grid",
      sewageNetwork: "BWSSB Underground Trunk Line Linked",
      environmental: {
        status:
          row.environmental_zone === "Standard"
            ? "Compliant"
            : isLakeBuffer
            ? "Buffer Zone Caution"
            : "Heritage Controlled",
        ecoSensitiveZone: row.environmental_zone || "Clear",
        wetlandProximity: isLakeBuffer ? "Within 50m Lake Buffer" : "None (Safe)",
        floodRisk: isLakeBuffer ? "Moderate" : "Low"
      }
    },
    valuation: {
      circleRate: row.zone_type === "Commercial" ? "₹8,500 / sq.ft." : "₹4,500 / sq.ft.",
      unitArea: `${Math.round(areaSqm > 0 ? areaSqm * 10.7639 : 2200)} sq.ft.`,
      guidelineValue: `₹${(
        (((areaSqm || 200) * (row.zone_type === "Commercial" ? 8500 : 4500) * 10.7639) / 10000000) || 1.15
      ).toFixed(2)} Cr`,
      lastRevisionDate: "2026-01-01"
    },
    encumbranceData: {
      status: row.encumbrance || "Freehold - No Active Liens",
      legalDispute: { hasDispute: (row.encumbrance || "").toLowerCase().includes("dispute") }
    }
  };
}

/**
 * GET /api/parcels/:ulpin
 * Hydrates full metadata for a specific parcel from PostGIS or shared mockData fallback:
 * - Metadata: owner_name, khasra_no, zone_type, tax_status, encumbrance, area_sqm
 * - Centroid: ST_Y(ST_Centroid(geom)) AS lat, ST_X(ST_Centroid(geom)) AS lng
 */
router.get("/:ulpin", async (req, res) => {
  try {
    const { ulpin } = req.params;
    if (!ulpin) {
      return res.status(400).json({ success: false, message: "ULPIN is required." });
    }

    const cleanUlpin = (ulpin || "").replace(/[^a-zA-Z0-9]/g, "").trim().toUpperCase();
    if (!cleanUlpin) {
      return res.status(400).json({ success: false, message: "Invalid ULPIN format." });
    }

    // 1. Primary lookup: PostgreSQL PostGIS spatial database
    try {
      const query = `
        SELECT 
          id,
          ulpin,
          owner_name,
          khasra_no,
          zone_type,
          tax_status,
          encumbrance,
          area_sqm,
          water_connection_id,
          power_connection_id,
          environmental_zone,
          ST_Y(ST_Centroid(geom)) AS lat,
          ST_X(ST_Centroid(geom)) AS lng
        FROM parcels
        WHERE UPPER(TRIM(ulpin)) = UPPER($1)
        LIMIT 1;
      `;

      const result = await db.query(query, [cleanUlpin]);

      if (result.rows.length > 0) {
        const parcel = formatPostgisParcel(result.rows[0]);

        recordAuditLog({
          action: "PARCEL_LOOKUP",
          role: "Citizen / GIS Query",
          user: "public-session",
          ulpin: cleanUlpin,
          details: `Inspected RoR title, encumbrance, and utilities for PostGIS ULPIN ${cleanUlpin}.`,
          ip: req.ip || "127.0.0.1",
          status: "SUCCESS"
        });

        return res.json({
          success: true,
          ...parcel,
          data: parcel
        });
      }
    } catch (dbErr) {
      console.warn(`PostGIS query error for ${cleanUlpin}, checking registryStore:`, dbErr.message);
    }

    // 2. Secondary lookup: Shared fallback mockData
    if (mockData[cleanUlpin]) {
      const data = mockData[cleanUlpin];
      const parcel = {
        ulpin: cleanUlpin,
        lat: data.lat || 12.9009,
        lng: data.lng || 77.4575,
        ownerName: data.ownership?.ownerName || "Registered Landholder",
        owner_name: data.ownership?.ownerName || "Registered Landholder",
        khasraNumber: data.ownership?.khasraNumber || "45/2",
        khasra_no: data.ownership?.khasraNumber || "45/2",
        zoneType: data.zoning?.zoneType || "Commercial",
        zone_type: data.zoning?.zoneType || "Commercial",
        taxStatus: data.tax?.propertyTaxStatus || "Paid",
        tax_status: data.tax?.propertyTaxStatus || "Paid",
        encumbrance: data.encumbrance?.status || "Freehold - No Active Liens",
        ...data
      };

      recordAuditLog({
        action: "PARCEL_LOOKUP",
        role: "Citizen / GIS Query",
        user: "public-session",
        ulpin: cleanUlpin,
        details: `Inspected RoR title for demonstration ULPIN ${cleanUlpin}.`,
        ip: req.ip || "127.0.0.1",
        status: "SUCCESS"
      });

      return res.json({
        success: true,
        ...parcel,
        data: parcel
      });
    }

    return res.status(404).json({
      success: false,
      message: `Cadastral record for ULPIN ${cleanUlpin} not found in database.`
    });
  } catch (err) {
    console.error("Hydration API error for ULPIN:", err);
    return res.status(500).json({
      success: false,
      message: "Database query failure: " + err.message
    });
  }
});

/**
 * PUT /api/parcels/:ulpin
 * Updates parcel ownership in PostgreSQL PostGIS database during mutation/transfer
 */
router.put("/:ulpin", async (req, res) => {
  try {
    const { ulpin } = req.params;
    const { newOwnerName, owner_name, ownerName, transferReason } = req.body;
    const targetOwner = (newOwnerName || owner_name || ownerName || "").trim();

    if (!targetOwner) {
      return res.status(400).json({
        success: false,
        message: "New owner name is required for title mutation."
      });
    }

    const cleanUlpin = (ulpin || "").replace(/[^a-zA-Z0-9]/g, "").trim().toUpperCase();

    // 1. Update in PostGIS spatial database
    let updatedRow = null;
    try {
      const result = await db.query(
        `UPDATE parcels 
         SET owner_name = $1, updated_at = NOW() 
         WHERE UPPER(TRIM(ulpin)) = UPPER($2) 
         RETURNING id, ulpin, owner_name, khasra_no, zone_type, tax_status, encumbrance, water_connection_id, power_connection_id, environmental_zone, ST_Y(ST_Centroid(geom)) AS lat, ST_X(ST_Centroid(geom)) AS lng`,
        [targetOwner, cleanUlpin]
      );
      if (result.rows.length > 0) {
        updatedRow = result.rows[0];
      }
    } catch (dbErr) {
      console.warn("PostGIS direct PUT update warning:", dbErr.message);
    }

    // 2. Keep shared in-memory mockData synced
    if (mockData[cleanUlpin]) {
      if (!mockData[cleanUlpin].ownership) mockData[cleanUlpin].ownership = {};
      mockData[cleanUlpin].ownership.previousOwner = mockData[cleanUlpin].ownership.ownerName;
      mockData[cleanUlpin].ownership.ownerName = targetOwner;
      mockData[cleanUlpin].ownership.mutationStatus = "Approved";
      mockData[cleanUlpin].ownership.approvedAt = new Date().toISOString();
      if (transferReason) mockData[cleanUlpin].ownership.transferReason = transferReason;
    }

    // 3. Keep public/parcels.json synced for canvas layer
    updateParcelsJsonFile(cleanUlpin, targetOwner, "Approved");

    // 4. Record audit log
    recordAuditLog({
      action: "MUTATION_RECORDED",
      role: "Revenue Officer (Tahsildar)",
      user: "tahsildar@revenue.gov.in",
      ulpin: cleanUlpin,
      details: `Title transfer finalized for ULPIN ${cleanUlpin}. Owner registered as ${targetOwner}.`,
      ip: req.ip || "127.0.0.1",
      status: "APPROVED_FINAL",
      statusCode: 200
    });

    return res.status(200).json({
      success: true,
      message: "Mutation Successful: Record of Rights Updated",
      data: {
        ulpin: cleanUlpin,
        ownerName: targetOwner,
        owner_name: targetOwner,
        lat: updatedRow ? parseFloat(updatedRow.lat) : mockData[cleanUlpin]?.lat || 12.9009,
        lng: updatedRow ? parseFloat(updatedRow.lng) : mockData[cleanUlpin]?.lng || 77.4575
      }
    });
  } catch (err) {
    console.error("Mutation update error:", err);
    return res.status(500).json({
      success: false,
      message: "Database mutation update failure: " + err.message
    });
  }
});

module.exports = router;
