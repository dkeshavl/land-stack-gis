const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Auto-load backend/.env if present
const envFilePath = path.join(__dirname, ".env");
if (fs.existsSync(envFilePath)) {
  const envContent = fs.readFileSync(envFilePath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [k, ...v] = trimmed.split("=");
      if (k && v.length && !process.env[k.trim()]) {
        process.env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
      }
    }
  });
}

const db = require("./db");
const parcelsRouter = require("./routes/parcels");
const {
  mockData,
  auditLogs,
  recordAuditLog,
  updateParcelsJsonFile
} = require("./data/registryStore");

// Enterprise Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Configured CORS Middleware
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000"
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(new Error("CORS policy violation: Origin not permitted."));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  })
);

app.use(express.json());

// Intercept malformed JSON gracefully
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.warn("Express body-parser intercepted malformed JSON payload:", err.message);
    return res.status(400).json({
      success: false,
      message: "Bad Request: Malformed JSON or unescaped characters in request body."
    });
  }
  next(err);
});

/**
 * Health Check & PostGIS Diagnostic Endpoint
 */
app.get("/api/health", async (req, res) => {
  let dbStatus = "disconnected";
  let parcelCount = 0;

  try {
    const result = await db.query("SELECT COUNT(*) FROM parcels;");
    dbStatus = "connected";
    parcelCount = parseInt(result.rows[0].count, 10);
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  return res.json({
    status: "HEALTHY",
    service: "Land Stack Spatial Registry API",
    version: "2.0.0",
    compliance: "SIH PS 26014 - Ministry of Rural Development",
    database: {
      engine: "PostgreSQL 15+ / PostGIS 3+",
      status: dbStatus,
      totalParcels: parcelCount
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Audit Trail Logs with filtering
 */
app.get("/api/audit/logs", (req, res) => {
  const { action, ulpin, limit = 50 } = req.query;
  let filtered = [...auditLogs];

  if (action && action !== "ALL") {
    filtered = filtered.filter((l) => l.action.toLowerCase() === action.toLowerCase());
  }
  if (ulpin) {
    filtered = filtered.filter((l) => l.ulpin.toLowerCase().includes(ulpin.toLowerCase()));
  }

  return res.json({
    success: true,
    count: filtered.length,
    totalLogs: auditLogs.length,
    data: filtered.slice(0, parseInt(limit, 10))
  });
});

/**
 * Unified Spatial & Attribute Search
 * Queries both PostGIS database and fallback registry
 */
app.get("/api/search", async (req, res) => {
  const query = (req.query.q || "").trim();

  try {
    let postgisMatches = [];

    if (query) {
      const searchPattern = `%${query}%`;
      const pgQuery = `
        SELECT 
          ulpin,
          owner_name as "ownerName",
          khasra_no as "khasraNumber",
          zone_type as "zoneType",
          tax_status as "taxStatus",
          ST_Y(ST_Centroid(geom)) AS lat,
          ST_X(ST_Centroid(geom)) AS lng
        FROM parcels
        WHERE ulpin ILIKE $1 
           OR owner_name ILIKE $1 
           OR khasra_no ILIKE $1
        LIMIT 15;
      `;

      try {
        const result = await db.query(pgQuery, [searchPattern]);
        postgisMatches = result.rows.map((r) => ({
          ulpin: r.ulpin,
          ownerName: r.ownerName || "Registered Landholder",
          khasraNumber: r.khasraNumber || "-",
          zoneType: r.zoneType || "Residential",
          mutationStatus: "Approved",
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lng)
        }));
      } catch (dbErr) {
        console.warn("PostGIS search query fallback:", dbErr.message);
      }
    }

    // Combine with mockData entries
    const allMockEntries = Object.entries(mockData).map(([ulpin, data]) => ({
      ulpin,
      ownerName: data.ownership?.ownerName || "Unknown",
      khasraNumber: data.ownership?.khasraNumber || "-",
      zoneType: data.zoning?.zoneType || "General",
      mutationStatus: data.ownership?.mutationStatus || "Approved",
      lat: data.lat || 12.9009,
      lng: data.lng || 77.4575
    }));

    let mockMatches = allMockEntries;
    if (query) {
      const qLower = query.toLowerCase();
      mockMatches = allMockEntries.filter((item) => {
        return (
          item.ulpin.toLowerCase().includes(qLower) ||
          item.ownerName.toLowerCase().includes(qLower) ||
          item.khasraNumber.toLowerCase().includes(qLower)
        );
      });
    }

    // Merge and deduplicate by ULPIN (PostGIS records take priority)
    const seenUlpins = new Set();
    const combined = [];

    for (const item of postgisMatches) {
      if (!seenUlpins.has(item.ulpin)) {
        seenUlpins.add(item.ulpin);
        combined.push(item);
      }
    }

    for (const item of mockMatches) {
      if (!seenUlpins.has(item.ulpin)) {
        seenUlpins.add(item.ulpin);
        combined.push(item);
      }
    }

    return res.json({
      success: true,
      results: combined.slice(0, 20),
      count: combined.length
    });
  } catch (err) {
    console.error("Search API error:", err);
    return res.status(500).json({
      success: false,
      message: "Search failure: " + err.message,
      results: []
    });
  }
});

/**
 * Analytics and Summary Metrics
 */
app.get("/api/analytics/metrics", async (req, res) => {
  try {
    let totalParcels = 0;
    let zoningDistribution = [];

    try {
      const countRes = await db.query("SELECT COUNT(*) as total FROM parcels;");
      totalParcels = parseInt(countRes.rows[0].total, 10);

      const zoneRes = await db.query(`
        SELECT COALESCE(zone_type, 'General') as zone, COUNT(*) as count 
        FROM parcels 
        GROUP BY zone_type 
        ORDER BY count DESC 
        LIMIT 5;
      `);

      zoningDistribution = zoneRes.rows.map((r) => ({
        zone: r.zone,
        count: parseInt(r.count, 10),
        percentage: totalParcels > 0 ? Math.round((parseInt(r.count, 10) / totalParcels) * 100) : 0
      }));
    } catch (pgErr) {
      console.warn("Analytics PostGIS query fallback:", pgErr.message);
    }

    if (totalParcels === 0) {
      totalParcels = Object.keys(mockData).length;
    }

    const formatINR = (amount) => {
      if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(2)} Cr`;
      }
      if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(2)} Lakh`;
      }
      return `₹${amount.toLocaleString("en-IN")}`;
    };

    const estimatedTotalLandValue = totalParcels * 9500000;

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        totalParcels,
        totalEstimatedValue: formatINR(estimatedTotalLandValue),
        rawEstimatedValue: estimatedTotalLandValue,
        taxMetrics: {
          complianceRate: 88,
          paidCount: Math.round(totalParcels * 0.88),
          dueCount: Math.round(totalParcels * 0.12),
          totalTaxCollected: `₹${(totalParcels * 4200).toLocaleString("en-IN")}`,
          totalTaxDue: `₹${(totalParcels * 650).toLocaleString("en-IN")}`,
          totalTaxAssessed: `₹${(totalParcels * 4850).toLocaleString("en-IN")}`
        },
        mutationMetrics: {
          pending: 3,
          approved: totalParcels - 3,
          pendingRate: 1
        },
        zoningDistribution: zoningDistribution.length > 0 ? zoningDistribution : [
          { zone: "Residential", count: Math.round(totalParcels * 0.55), percentage: 55 },
          { zone: "Commercial", count: Math.round(totalParcels * 0.3), percentage: 30 },
          { zone: "Mixed Use", count: Math.round(totalParcels * 0.15), percentage: 15 }
        ],
        recentParcels: Object.entries(mockData).slice(0, 5).map(([ulpin, p]) => ({
          ulpin,
          ownerName: p.ownership?.ownerName,
          zoneType: p.zoning?.zoneType,
          mutationStatus: p.ownership?.mutationStatus,
          taxStatus: p.tax?.propertyTaxStatus
        }))
      }
    });
  } catch (err) {
    console.error("Analytics metrics error:", err);
    return res.status(500).json({
      success: false,
      message: "Analytics failure: " + err.message
    });
  }
});

/**
 * POST /api/mutation/apply
 * Citizen Form 12-A Title Mutation Application
 */
app.post("/api/mutation/apply", async (req, res) => {
  const { ulpin, newOwnerName, transferReason, documentName, applicantNotes, applicantPhone } = req.body;

  if (!ulpin || !newOwnerName) {
    return res.status(400).json({
      success: false,
      message: "ULPIN and New Owner Name are required fields."
    });
  }

  const cleanUlpin = ulpin.trim().toUpperCase().replace(/[^a-zA-Z0-9]/g, "");
  const applicationId = `MUT-${Date.now().toString().slice(-6)}`;
  const buyerName = newOwnerName.trim();

  let currentOwner = "Data Unavailable";
  let client;

  try {
    const { pool } = db;
    client = await pool.connect();
    await client.query("BEGIN");

    // 1. Fetch current legal owner so title is NOT prematurely changed before approval
    const checkRes = await client.query(
      "SELECT owner_name FROM parcels WHERE UPPER(TRIM(ulpin)) = UPPER($1) LIMIT 1 FOR UPDATE",
      [cleanUlpin]
    );
    if (checkRes.rows.length > 0 && checkRes.rows[0].owner_name) {
      currentOwner = checkRes.rows[0].owner_name;
    }

    // 2. Insert into mutations table with status = 'PENDING'
    const mutRes = await client.query(
      `INSERT INTO mutations (ulpin, buyer_name, previous_owner, transfer_reason, document_name, application_id, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', NOW())
       RETURNING id`,
      [
        cleanUlpin,
        buyerName,
        currentOwner,
        transferReason || "Sale Deed",
        documentName || "Registered_Deed.pdf",
        applicationId
      ]
    );
    const mutationId = mutRes.rows[0]?.id ? String(mutRes.rows[0].id) : null;

    // 3. Queue mutation in PostGIS: keep owner_name intact, set pending_owner, active_mutation_id & mutation_status = 'Pending'
    await client.query(
      `UPDATE parcels 
       SET pending_owner = $1, 
           mutation_status = 'Pending', 
           active_mutation_id = $2,
           application_id = $3, 
           transfer_reason = $4, 
           updated_at = NOW() 
       WHERE UPPER(TRIM(ulpin)) = UPPER($5)`,
      [buyerName, mutationId, applicationId, transferReason || "Sale Deed", cleanUlpin]
    );

    await client.query("COMMIT");
  } catch (dbErr) {
    if (client) await client.query("ROLLBACK");
    console.warn("PostGIS mutation apply DB transaction warning:", dbErr.message);
  } finally {
    if (client) client.release();
  }

  if (mockData[cleanUlpin]) {
    const parcel = mockData[cleanUlpin];
    if (!parcel.ownership) parcel.ownership = {};

    parcel.ownership.pendingNewOwner = buyerName;
    parcel.ownership.mutationStatus = "Pending";
    parcel.ownership.applicationId = applicationId;
    parcel.ownership.transferReason = transferReason || "Sale Deed";
    parcel.ownership.appliedAt = new Date().toISOString();
    parcel.ownership.documentAttached = documentName || "Registered_Deed.pdf";
    if (applicantNotes) parcel.ownership.applicantNotes = applicantNotes;
    if (applicantPhone) parcel.ownership.applicantPhone = applicantPhone;

    recordAuditLog({
      action: "CITIZEN_APPLIED",
      role: "Citizen Portal",
      user: buyerName,
      ulpin: cleanUlpin,
      details: `Filed transfer application (${transferReason || "Sale Deed"}) for ULPIN ${cleanUlpin}. App ID: ${applicationId}.`,
      ip: req.ip || "127.0.0.1",
      status: "PENDING_REVIEW",
      statusCode: 200
    });

    return res.json({
      success: true,
      message: "Mutation application submitted successfully and queued for Revenue Officer review.",
      applicationId,
      ulpin: cleanUlpin,
      data: parcel
    });
  }

  // If parcel is new or in PostGIS without local mock
  mockData[cleanUlpin] = {
    ownership: {
      ownerName: currentOwner,
      pendingNewOwner: buyerName,
      khasraNumber: `${Math.floor(Math.random() * 50) + 1}/${Math.floor(Math.random() * 5) + 1}`,
      mutationStatus: "Pending",
      applicationId,
      transferReason: transferReason || "New Title Registration",
      appliedAt: new Date().toISOString(),
      documentAttached: documentName || "Title_Application.pdf"
    },
    tax: {
      propertyTaxStatus: "Due",
      lastPaymentDate: "N/A",
      amount: "₹1,500"
    },
    zoning: {
      zoneType: "Residential",
      landUse: "Housing",
      maxHeight: "12m"
    },
    encumbrance: {
      status: "Freehold - No Active Liens",
      isEncumbered: false,
      mortgageDetails: { isMortgaged: false, bankName: "None", loanId: "N/A", sanctionedAmount: "₹0" },
      legalDispute: { hasDispute: false, status: "Clear Title", courtCaseId: "None", remarks: "Pending Title Verification" },
      certificate: { necNumber: `NEC-2026-${Date.now().toString().slice(-4)}`, issuedDate: new Date().toISOString().split("T")[0], validity: "Provisional Registration" }
    },
    utilities: {
      waterSupply: "Active Municipal Connection",
      electricityGrid: "Grid Connection Available",
      sewageNetwork: "Municipal Line Accessible",
      environmental: { ecoSensitiveZone: "Clear", wetlandProximity: "None", floodRisk: "Low", status: "Compliant" }
    },
    valuation: { circleRate: "₹4,500 / sq.ft.", unitArea: "1,500 sq.ft.", guidelineValue: "₹67.5 Lakh", lastRevisionDate: "2026-01-01" }
  };

  recordAuditLog({
    action: "CITIZEN_APPLIED",
    role: "Citizen Portal",
    user: buyerName,
    ulpin: cleanUlpin,
    details: `Filed transfer application for ULPIN ${cleanUlpin}. App ID: ${applicationId}.`,
    ip: req.ip || "127.0.0.1",
    status: "PENDING_REVIEW",
    statusCode: 200
  });

  return res.status(201).json({
    success: true,
    message: `Parcel ${cleanUlpin} registered and mutation queued for review.`,
    applicationId,
    ulpin: cleanUlpin,
    data: mockData[cleanUlpin]
  });
});

/**
 * Shared Mutation Approval Handler
 * Updates BOTH PostGIS database and local shared cache via strict SQL Transaction
 */
async function handleMutationApproval(req, res) {
  const ulpin = req.params.ulpin || req.body?.ulpin;
  const cleanUlpin = (ulpin || "").replace(/[^a-zA-Z0-9]/g, "").trim().toUpperCase();
  const reviewer = (req.body?.reviewedBy || "Shri R. K. Verma (Tahsildar)").trim();
  const mutationId = req.body?.id || req.body?.mutationId;

  if (!cleanUlpin && !mutationId) {
    return res.status(400).json({ success: false, message: "ULPIN or Mutation ID is required." });
  }

  let client;
  try {
    const { pool } = db;
    client = await pool.connect();
    await client.query("BEGIN");

    // 1. Fetch active pending mutation record
    let mutRes;
    if (mutationId) {
      mutRes = await client.query(
        `SELECT id, ulpin, buyer_name, previous_owner 
         FROM mutations 
         WHERE id = $1 AND UPPER(status) = 'PENDING' 
         FOR UPDATE`,
        [mutationId]
      );
    } else {
      mutRes = await client.query(
        `SELECT id, ulpin, buyer_name, previous_owner 
         FROM mutations 
         WHERE UPPER(TRIM(ulpin)) = UPPER($1) AND UPPER(status) = 'PENDING' 
         ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
        [cleanUlpin]
      );
    }

    const targetUlpin = cleanUlpin || (mutRes.rows[0]?.ulpin ? String(mutRes.rows[0].ulpin).trim().toUpperCase() : "");

    // 2. Fetch current parcel title
    const parcelRes = await client.query(
      "SELECT owner_name, pending_owner FROM parcels WHERE UPPER(TRIM(ulpin)) = UPPER($1) LIMIT 1 FOR UPDATE",
      [targetUlpin]
    );

    const currentLegalOwner = parcelRes.rows[0]?.owner_name || mockData[targetUlpin]?.ownership?.ownerName || "Data Unavailable";
    const targetOwner = (
      req.body?.newOwnerName ||
      mutRes.rows[0]?.buyer_name ||
      parcelRes.rows[0]?.pending_owner ||
      mockData[targetUlpin]?.ownership?.pendingNewOwner ||
      ""
    ).trim();

    if (!targetOwner || targetOwner.toUpperCase() === "ADD") {
      const fallbackBuyer = (mutRes.rows[0]?.buyer_name || "").trim();
      if (!fallbackBuyer && !targetOwner) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: "Valid transferee/buyer name is required for approval." });
      }
    }

    const resolvedOwner = (targetOwner && targetOwner.toUpperCase() !== "ADD") ? targetOwner : (mutRes.rows[0]?.buyer_name || targetOwner);

    // Action 1: UPDATE mutations SET status = 'APPROVED' WHERE id = $1;
    const activeMutId = mutationId || mutRes.rows[0]?.id;
    if (activeMutId) {
      await client.query(
        `UPDATE mutations 
         SET status = 'APPROVED', 
             reviewed_at = NOW(), 
             reviewed_by = $1 
         WHERE id = $2`,
        [reviewer, activeMutId]
      );
    } else {
      await client.query(
        `UPDATE mutations 
         SET status = 'APPROVED', 
             reviewed_at = NOW(), 
             reviewed_by = $1 
         WHERE UPPER(TRIM(ulpin)) = UPPER($2) AND UPPER(status) = 'PENDING'`,
        [reviewer, targetUlpin]
      );
    }

    // Action 2: UPDATE parcels SET owner_name = $2, previous_owner = owner_name, active_mutation_id = NULL WHERE ulpin = $3;
    await client.query(
      `UPDATE parcels 
       SET previous_owner = owner_name, 
           owner_name = $1, 
           pending_owner = NULL, 
           active_mutation_id = NULL,
           mutation_status = 'Approved', 
           updated_at = NOW() 
       WHERE UPPER(TRIM(ulpin)) = UPPER($2)`,
      [resolvedOwner, targetUlpin]
    );

    await client.query("COMMIT");

    // Sync mockData and parcels.json
    if (mockData[targetUlpin]) {
      if (!mockData[targetUlpin].ownership) mockData[targetUlpin].ownership = {};
      mockData[targetUlpin].ownership.previousOwner = currentLegalOwner;
      mockData[targetUlpin].ownership.ownerName = resolvedOwner;
      mockData[targetUlpin].ownership.mutationStatus = "Approved";
      mockData[targetUlpin].ownership.approvedAt = new Date().toISOString();
      delete mockData[targetUlpin].ownership.pendingNewOwner;
    }
    updateParcelsJsonFile(targetUlpin, resolvedOwner, "Approved");

    recordAuditLog({
      action: "MUTATION_APPROVED",
      role: "Revenue Officer (Tahsildar)",
      user: reviewer,
      ulpin: targetUlpin,
      details: `Approved land mutation for ULPIN ${targetUlpin}. Title transferred to ${resolvedOwner}.`,
      ip: req.ip || "127.0.0.1",
      status: "APPROVED_FINAL",
      statusCode: 200
    });

    return res.json({
      success: true,
      message: `Mutation for parcel ${targetUlpin} approved successfully`,
      ulpin: targetUlpin,
      data: {
        ulpin: targetUlpin,
        ownerName: resolvedOwner,
        previousOwner: currentLegalOwner,
        mutationStatus: "Approved"
      }
    });
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    console.error("Mutation approval transaction failure:", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    if (client) client.release();
  }
}

/**
 * Shared Mutation Rejection Handler
 * Sets status to Rejected in PostGIS & cache via strict SQL Transaction
 */
async function handleMutationRejection(req, res) {
  const ulpin = req.params.ulpin || req.body?.ulpin;
  const cleanUlpin = (ulpin || "").replace(/[^a-zA-Z0-9]/g, "").trim().toUpperCase();
  const reviewer = (req.body?.reviewedBy || "Shri R. K. Verma (Tahsildar)").trim();
  const mutationId = req.body?.id || req.body?.mutationId;

  if (!cleanUlpin && !mutationId) {
    return res.status(400).json({ success: false, message: "ULPIN or Mutation ID is required." });
  }

  let client;
  try {
    const { pool } = db;
    client = await pool.connect();
    await client.query("BEGIN");

    // 1. Fetch current legal owner
    const parcelRes = await client.query(
      "SELECT owner_name FROM parcels WHERE UPPER(TRIM(ulpin)) = UPPER($1) LIMIT 1 FOR UPDATE",
      [cleanUlpin]
    );
    const legalOwner = parcelRes.rows[0]?.owner_name || mockData[cleanUlpin]?.ownership?.ownerName || "Data Unavailable";

    // Action 1: Mark active mutation as REJECTED in mutations table
    const activeMutId = mutationId;
    if (activeMutId) {
      await client.query(
        `UPDATE mutations 
         SET status = 'REJECTED', 
             reviewed_at = NOW(), 
             reviewed_by = $1 
         WHERE id = $2`,
        [reviewer, activeMutId]
      );
    } else {
      await client.query(
        `UPDATE mutations 
         SET status = 'REJECTED', 
             reviewed_at = NOW(), 
             reviewed_by = $1 
         WHERE UPPER(TRIM(ulpin)) = UPPER($2) AND UPPER(status) = 'PENDING'`,
        [reviewer, cleanUlpin]
      );
    }

    // Action 2: Clear pending_owner and active_mutation_id on parcels, mark Rejected, keep legal owner intact
    await client.query(
      `UPDATE parcels 
       SET pending_owner = NULL, 
           active_mutation_id = NULL, 
           mutation_status = 'Rejected', 
           updated_at = NOW() 
       WHERE UPPER(TRIM(ulpin)) = UPPER($1)`,
      [cleanUlpin]
    );

    await client.query("COMMIT");

    if (mockData[cleanUlpin]) {
      if (!mockData[cleanUlpin].ownership) mockData[cleanUlpin].ownership = {};
      mockData[cleanUlpin].ownership.mutationStatus = "Rejected";
      mockData[cleanUlpin].ownership.rejectedAt = new Date().toISOString();
      delete mockData[cleanUlpin].ownership.pendingNewOwner;
    }
    updateParcelsJsonFile(cleanUlpin, legalOwner, "Rejected");

    recordAuditLog({
      action: "MUTATION_REJECTED",
      role: "Revenue Officer (Tahsildar)",
      user: reviewer,
      ulpin: cleanUlpin,
      details: `Mutation rejected for ULPIN ${cleanUlpin}. Ownership retained by ${legalOwner}.`,
      ip: req.ip || "127.0.0.1",
      status: "REJECTED_FINAL",
      statusCode: 200
    });

    return res.json({
      success: true,
      message: `Mutation for parcel ${cleanUlpin} rejected successfully. Title retained by ${legalOwner}.`,
      ulpin: cleanUlpin,
      data: {
        ulpin: cleanUlpin,
        ownerName: legalOwner,
        mutationStatus: "Rejected"
      }
    });
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    console.error("Mutation rejection transaction failure:", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    if (client) client.release();
  }
}

// Support all mutation approval and rejection route variants
app.post("/api/parcel/:ulpin/approve", handleMutationApproval);
app.post("/api/parcels/:ulpin/approve", handleMutationApproval);
app.post("/api/mutations/approve", handleMutationApproval);
app.post("/api/mutation/approve", handleMutationApproval);

app.post("/api/parcel/:ulpin/reject", handleMutationRejection);
app.post("/api/parcels/:ulpin/reject", handleMutationRejection);
app.post("/api/mutations/reject", handleMutationRejection);
app.post("/api/mutation/reject", handleMutationRejection);

// Mount main spatial cadastre router (supports both /api/parcels and /api/parcel seamlessly)
app.use("/api/parcels", parcelsRouter);
app.use("/api/parcel", parcelsRouter);

app.listen(PORT, () => {
  console.log(`✅ Land Stack DPI Backend running at http://localhost:${PORT}`);
});