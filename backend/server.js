const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Hardcoded mock data so the server never crashes looking for external files
const mockData = {
  "1234567890ABCD": {
    ownership: { ownerName: "Rajesh Kumar", khasraNumber: "45/2", mutationStatus: "Pending" },
    tax: { propertyTaxStatus: "Paid", lastPaymentDate: "2026-03-15", amount: "₹4,500" },
    zoning: { zoneType: "Commercial", landUse: "Retail", maxHeight: "15m" },
    encumbrance: {
      status: "Freehold - No Active Liens",
      isEncumbered: false,
      mortgageDetails: {
        isMortgaged: false,
        bankName: "None",
        loanId: "N/A",
        sanctionedAmount: "₹0"
      },
      legalDispute: {
        hasDispute: false,
        status: "Clear Title",
        courtCaseId: "None",
        remarks: "Clear title verified by Sub-Registrar"
      },
      certificate: {
        necNumber: "NEC-BLR-2026-0419",
        issuedDate: "2026-01-15",
        validity: "Valid (30-Year Search Clear)"
      }
    },
    utilities: {
      waterSupply: "Active Municipal Supply",
      waterConnectionId: "BWSSB-COM-8421",
      electricityGrid: "3-Phase Commercial Grid (15 kW)",
      sewageNetwork: "Municipal Line Linked",
      environmental: {
        ecoSensitiveZone: "Clear - Outside ESZ Buffer",
        wetlandProximity: "None (Safe)",
        floodRisk: "Low",
        status: "Compliant"
      }
    },
    valuation: {
      circleRate: "₹6,200 / sq.ft.",
      unitArea: "2,400 sq.ft.",
      guidelineValue: "₹1.48 Cr",
      lastRevisionDate: "2026-01-01"
    }
  },
  "1234567891ABCE": {
    ownership: { ownerName: "Priya Sharma", khasraNumber: "46/1", mutationStatus: "Pending" },
    tax: { propertyTaxStatus: "Due", lastPaymentDate: "2025-03-10", amount: "₹2,100" },
    zoning: { zoneType: "Residential", landUse: "Housing", maxHeight: "10m" },
    encumbrance: {
      status: "Mortgaged / Under Bank Loan",
      isEncumbered: true,
      mortgageDetails: {
        isMortgaged: true,
        bankName: "State Bank of India",
        loanId: "SBIL-2024-890",
        sanctionedAmount: "₹45,00,000"
      },
      legalDispute: {
        hasDispute: false,
        status: "Clear Title (Bank Lien Active)",
        courtCaseId: "None",
        remarks: "Simple mortgage registered with SBI Bangalore Main Branch"
      },
      certificate: {
        necNumber: "NEC-BLR-2025-9831",
        issuedDate: "2025-08-22",
        validity: "Lien Endorsed in RoR"
      }
    },
    utilities: {
      waterSupply: "Active Domestic Supply",
      waterConnectionId: "BWSSB-RES-1902",
      electricityGrid: "Single-Phase Domestic Grid (5 kW)",
      sewageNetwork: "Underground Sewer Linked",
      environmental: {
        ecoSensitiveZone: "Clear",
        wetlandProximity: "150m Lake Buffer Zone (Caution)",
        floodRisk: "Moderate",
        status: "Conditional Clearance"
      }
    },
    valuation: {
      circleRate: "₹4,500 / sq.ft.",
      unitArea: "1,800 sq.ft.",
      guidelineValue: "₹81.0 Lakh",
      lastRevisionDate: "2026-01-01"
    }
  },
  "1234567892ABCF": {
    ownership: { ownerName: "Amit Patel", khasraNumber: "47/3", mutationStatus: "Approved" },
    tax: { propertyTaxStatus: "Paid", lastPaymentDate: "2026-01-20", amount: "₹8,200" },
    zoning: { zoneType: "Mixed Use", landUse: "Commercial/Residential", maxHeight: "20m" },
    encumbrance: {
      status: "Litigation Pending",
      isEncumbered: true,
      mortgageDetails: {
        isMortgaged: false,
        bankName: "HDFC Bank (Lien Discharged)",
        loanId: "HDFC-2021-412-REL",
        sanctionedAmount: "₹0 (Fully Repaid)"
      },
      legalDispute: {
        hasDispute: true,
        status: "Civil Suit Pending",
        courtCaseId: "OS/452/2025 - Senior Civil Court",
        remarks: "Boundary demarcation dispute with adjacent survey plot 47/2"
      },
      certificate: {
        necNumber: "NEC-BLR-2026-1102",
        issuedDate: "2026-02-05",
        validity: "Conditional (Litigation Lis Pendens)"
      }
    },
    utilities: {
      waterSupply: "Active Dual-Line Supply",
      waterConnectionId: "BWSSB-MIX-3044",
      electricityGrid: "3-Phase Commercial/Domestic Grid (25 kW)",
      sewageNetwork: "Municipal Trunk Line Linked",
      environmental: {
        ecoSensitiveZone: "Clear - Outside Buffer",
        wetlandProximity: "None (Safe)",
        floodRisk: "Low",
        status: "Compliant"
      }
    },
    valuation: {
      circleRate: "₹5,400 / sq.ft.",
      unitArea: "2,200 sq.ft.",
      guidelineValue: "₹1.18 Cr",
      lastRevisionDate: "2026-01-01"
    }
  },
  "1234567893ABCG": {
    ownership: { ownerName: "Sunita Rao", khasraNumber: "14/1", mutationStatus: "Approved" },
    tax: { propertyTaxStatus: "Paid", lastPaymentDate: "2026-02-18", amount: "₹6,400" },
    zoning: { zoneType: "Commercial", landUse: "Retail / Office", maxHeight: "18m" },
    encumbrance: {
      status: "Freehold - No Active Liens",
      isEncumbered: false,
      mortgageDetails: { isMortgaged: false, bankName: "None", loanId: "N/A", sanctionedAmount: "₹0" },
      legalDispute: { hasDispute: false, status: "Clear Title", courtCaseId: "None", remarks: "Sub-Registrar title clear" },
      certificate: { necNumber: "NEC-PB-2026-3011", issuedDate: "2026-01-10", validity: "Valid (30-Year Clear)" }
    },
    utilities: {
      waterSupply: "Active Commercial Supply",
      waterConnectionId: "MCB-WAT-8812",
      electricityGrid: "3-Phase Commercial Grid (20 kW)",
      sewageNetwork: "Municipal Line Linked",
      environmental: { ecoSensitiveZone: "Clear", wetlandProximity: "None (Safe)", floodRisk: "Low", status: "Compliant" }
    },
    valuation: { circleRate: "₹5,800 / sq.ft.", unitArea: "2,100 sq.ft.", guidelineValue: "₹1.21 Cr", lastRevisionDate: "2026-01-01" }
  },
  "1234567894ABCH": {
    ownership: { ownerName: "Vikram Singh", khasraNumber: "14/2", mutationStatus: "Pending" },
    tax: { propertyTaxStatus: "Due", lastPaymentDate: "2025-04-12", amount: "₹3,200" },
    zoning: { zoneType: "Residential", landUse: "Housing", maxHeight: "12m" },
    encumbrance: {
      status: "Mortgaged / Under Bank Loan",
      isEncumbered: true,
      mortgageDetails: { isMortgaged: true, bankName: "Punjab National Bank", loanId: "PNB-HL-2024-912", sanctionedAmount: "₹38,00,000" },
      legalDispute: { hasDispute: false, status: "Clear Title (Bank Lien Active)", courtCaseId: "None", remarks: "Housing loan registered with PNB Main Branch" },
      certificate: { necNumber: "NEC-PB-2025-7712", issuedDate: "2025-09-14", validity: "Lien Endorsed in RoR" }
    },
    utilities: {
      waterSupply: "Active Domestic Supply",
      waterConnectionId: "MCB-RES-4501",
      electricityGrid: "Single-Phase Domestic Grid (7 kW)",
      sewageNetwork: "Underground Sewer Connected",
      environmental: { ecoSensitiveZone: "Clear", wetlandProximity: "None (Safe)", floodRisk: "Low", status: "Compliant" }
    },
    valuation: { circleRate: "₹4,200 / sq.ft.", unitArea: "1,950 sq.ft.", guidelineValue: "₹81.9 Lakh", lastRevisionDate: "2026-01-01" }
  },
  "1234567895ABCI": {
    ownership: { ownerName: "Ananya Gupta", khasraNumber: "14/3", mutationStatus: "Approved" },
    tax: { propertyTaxStatus: "Paid", lastPaymentDate: "2026-03-01", amount: "₹7,800" },
    zoning: { zoneType: "Mixed Use", landUse: "Commercial/Residential", maxHeight: "16m" },
    encumbrance: {
      status: "Freehold - No Active Liens",
      isEncumbered: false,
      mortgageDetails: { isMortgaged: false, bankName: "None", loanId: "N/A", sanctionedAmount: "₹0" },
      legalDispute: { hasDispute: false, status: "Clear Title", courtCaseId: "None", remarks: "All property municipal dues clear" },
      certificate: { necNumber: "NEC-PB-2026-5092", issuedDate: "2026-02-20", validity: "Valid (30-Year Clear)" }
    },
    utilities: {
      waterSupply: "Active Municipal Supply",
      waterConnectionId: "MCB-MIX-6120",
      electricityGrid: "3-Phase Commercial Grid (15 kW)",
      sewageNetwork: "Municipal Trunk Line Linked",
      environmental: { ecoSensitiveZone: "Clear", wetlandProximity: "None", floodRisk: "Low", status: "Compliant" }
    },
    valuation: { circleRate: "₹5,100 / sq.ft.", unitArea: "2,300 sq.ft.", guidelineValue: "₹1.17 Cr", lastRevisionDate: "2026-01-01" }
  },
  "1234567896ABCJ": {
    ownership: { ownerName: "Rohan Verma", khasraNumber: "15/1", mutationStatus: "Approved" },
    tax: { propertyTaxStatus: "Paid", lastPaymentDate: "2026-01-15", amount: "₹5,900" },
    zoning: { zoneType: "Commercial", landUse: "Retail Showroom", maxHeight: "15m" },
    encumbrance: {
      status: "Freehold - No Active Liens",
      isEncumbered: false,
      mortgageDetails: { isMortgaged: false, bankName: "None", loanId: "N/A", sanctionedAmount: "₹0" },
      legalDispute: { hasDispute: false, status: "Clear Title", courtCaseId: "None", remarks: "Direct inheritance title clear" },
      certificate: { necNumber: "NEC-PB-2026-1144", issuedDate: "2026-01-18", validity: "Valid (30-Year Clear)" }
    },
    utilities: {
      waterSupply: "Active Commercial Supply",
      waterConnectionId: "MCB-COM-9304",
      electricityGrid: "3-Phase Commercial Grid (18 kW)",
      sewageNetwork: "Municipal Line Linked",
      environmental: { ecoSensitiveZone: "Clear", wetlandProximity: "None", floodRisk: "Low", status: "Compliant" }
    },
    valuation: { circleRate: "₹5,600 / sq.ft.", unitArea: "2,050 sq.ft.", guidelineValue: "₹1.14 Cr", lastRevisionDate: "2026-01-01" }
  },
  "1234567897ABCK": {
    ownership: { ownerName: "Meenakshi Iyer", khasraNumber: "15/2", mutationStatus: "Pending" },
    tax: { propertyTaxStatus: "Paid", lastPaymentDate: "2026-02-28", amount: "₹3,900" },
    zoning: { zoneType: "Residential", landUse: "Housing", maxHeight: "12m" },
    encumbrance: {
      status: "Freehold - No Active Liens",
      isEncumbered: false,
      mortgageDetails: { isMortgaged: false, bankName: "None", loanId: "N/A", sanctionedAmount: "₹0" },
      legalDispute: { hasDispute: false, status: "Clear Title", courtCaseId: "None", remarks: "Clear title" },
      certificate: { necNumber: "NEC-PB-2026-8802", issuedDate: "2026-02-12", validity: "Valid (30-Year Clear)" }
    },
    utilities: {
      waterSupply: "Active Domestic Supply",
      waterConnectionId: "MCB-RES-7193",
      electricityGrid: "Single-Phase Domestic Grid (6 kW)",
      sewageNetwork: "Underground Sewer Linked",
      environmental: { ecoSensitiveZone: "Clear", wetlandProximity: "None", floodRisk: "Low", status: "Compliant" }
    },
    valuation: { circleRate: "₹4,400 / sq.ft.", unitArea: "1,750 sq.ft.", guidelineValue: "₹77.0 Lakh", lastRevisionDate: "2026-01-01" }
  }
};

// In-memory Audit Trail store with initial seed logs
const auditLogs = [
  {
    id: "LOG-1001",
    action: "SYSTEM_INITIALIZED",
    role: "System Kernel",
    user: "root@landstack.gov.in",
    ulpin: "GLOBAL",
    details: "Land Stack Spatial Registry node mounted with 3 ULPIN cadastral polygons.",
    ip: "127.0.0.1",
    status: "SUCCESS",
    statusCode: 200,
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "LOG-1002",
    action: "REGISTRY_SEARCH",
    role: "Citizen Portal",
    user: "public-session",
    ulpin: "1234567890ABCD",
    details: "Queried RoR Ownership record for Khasra 45/2 (Rajesh Kumar).",
    ip: "192.168.1.14",
    status: "SUCCESS",
    statusCode: 200,
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "LOG-1003",
    action: "ENCUMBRANCE_VERIFIED",
    role: "Sub-Registrar",
    user: "sro-officer-04@kar.nic.in",
    ulpin: "1234567891ABCE",
    details: "Non-Encumbrance Certificate (NEC-BLR-2025-9831) cross-verified against SBI lien database.",
    ip: "10.42.0.8",
    status: "AUDIT_FLAG",
    statusCode: 200,
    timestamp: new Date(Date.now() - 1800000).toISOString()
  }
];

let logCounter = 1004;

function recordAuditLog({
  action,
  role = "System",
  user = "admin",
  ulpin = "N/A",
  details,
  ip = "127.0.0.1",
  status = "SUCCESS",
  statusCode = 200
}) {
  const logEntry = {
    id: `LOG-${logCounter++}`,
    action,
    role,
    user,
    ulpin,
    details,
    ip,
    status,
    statusCode,
    timestamp: new Date().toISOString()
  };
  auditLogs.unshift(logEntry);
  if (auditLogs.length > 200) auditLogs.pop();
  return logEntry;
}

// Endpoint to retrieve audit logs with optional filtering
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

// Search parcels by ULPIN, Owner Name, or Khasra Number
app.get("/api/search", (req, res) => {
  const query = (req.query.q || "").trim().toLowerCase();
  
  const allEntries = Object.entries(mockData).map(([ulpin, data]) => ({
    ulpin,
    ownerName: data.ownership?.ownerName || "Unknown",
    khasraNumber: data.ownership?.khasraNumber || "-",
    zoneType: data.zoning?.zoneType || "General",
    mutationStatus: data.ownership?.mutationStatus || "Pending"
  }));

  if (!query) {
    return res.json({ success: true, results: allEntries, count: allEntries.length });
  }

  const results = allEntries.filter((item) => {
    return (
      item.ulpin.toLowerCase().includes(query) ||
      item.ownerName.toLowerCase().includes(query) ||
      item.khasraNumber.toLowerCase().includes(query)
    );
  });

  return res.json({
    success: true,
    results,
    count: results.length
  });
});

// Analytics and summary metrics endpoint for government decision-makers
app.get("/api/analytics/metrics", (req, res) => {
  const parcels = Object.entries(mockData).map(([ulpin, data]) => ({
    ulpin,
    ...data
  }));

  const totalParcels = parcels.length;
  if (totalParcels === 0) {
    return res.json({
      success: true,
      data: {
        totalParcels: 0,
        totalEstimatedValue: "₹0",
        taxMetrics: { complianceRate: 0, paidCount: 0, dueCount: 0, totalTaxCollected: "₹0", totalTaxDue: "₹0" },
        mutationMetrics: { pending: 0, approved: 0, pendingRate: 0 },
        zoningDistribution: []
      }
    });
  }

  let pendingMutations = 0;
  let approvedMutations = 0;
  let paidTaxCount = 0;
  let dueTaxCount = 0;
  let totalTaxCollected = 0;
  let totalTaxDue = 0;
  const zoningCounts = {};

  const zoneBaseValuation = {
    Commercial: 14500000,
    Residential: 8500000,
    "Mixed Use": 11500000
  };
  let estimatedTotalLandValue = 0;

  parcels.forEach((p) => {
    const mutation = (p.ownership?.mutationStatus || "").toLowerCase();
    if (mutation === "pending") {
      pendingMutations += 1;
    } else {
      approvedMutations += 1;
    }

    const rawTaxAmount = p.tax?.amount || "0";
    const numericTax = parseInt(rawTaxAmount.replace(/[^0-9]/g, ""), 10) || 0;
    const taxStatus = (p.tax?.propertyTaxStatus || "").toLowerCase();

    if (taxStatus === "paid") {
      paidTaxCount += 1;
      totalTaxCollected += numericTax;
    } else {
      dueTaxCount += 1;
      totalTaxDue += numericTax;
    }

    const zone = p.zoning?.zoneType || "General";
    zoningCounts[zone] = (zoningCounts[zone] || 0) + 1;

    const baseVal = zoneBaseValuation[zone] || 7500000;
    estimatedTotalLandValue += baseVal;
  });

  const taxComplianceRate = totalParcels > 0 
    ? Math.round((paidTaxCount / totalParcels) * 100) 
    : 0;

  const zoningDistribution = Object.entries(zoningCounts).map(([zone, count]) => ({
    zone,
    count,
    percentage: Math.round((count / totalParcels) * 100)
  }));

  const formatINR = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} Lakh`;
    }
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  return res.json({
    success: true,
    timestamp: new Date().toISOString(),
    data: {
      totalParcels,
      totalEstimatedValue: formatINR(estimatedTotalLandValue),
      rawEstimatedValue: estimatedTotalLandValue,
      taxMetrics: {
        complianceRate: taxComplianceRate,
        paidCount: paidTaxCount,
        dueCount: dueTaxCount,
        totalTaxCollected: `₹${totalTaxCollected.toLocaleString("en-IN")}`,
        totalTaxDue: `₹${totalTaxDue.toLocaleString("en-IN")}`,
        totalTaxAssessed: `₹${(totalTaxCollected + totalTaxDue).toLocaleString("en-IN")}`
      },
      mutationMetrics: {
        pending: pendingMutations,
        approved: approvedMutations,
        pendingRate: Math.round((pendingMutations / totalParcels) * 100)
      },
      zoningDistribution,
      recentParcels: parcels.slice(0, 5).map((p) => ({
        ulpin: p.ulpin,
        ownerName: p.ownership?.ownerName,
        zoneType: p.zoning?.zoneType,
        mutationStatus: p.ownership?.mutationStatus,
        taxStatus: p.tax?.propertyTaxStatus
      }))
    }
  });
});

// The API endpoint to get all parcels
app.get("/api/parcels", (req, res) => {
  const parcels = Object.entries(mockData).map(([ulpin, data]) => ({
    ulpin,
    ...data
  }));
  return res.json({ success: true, count: parcels.length, data: parcels });
});

// The API endpoint the React map calls
app.get("/api/parcel/:ulpin", (req, res) => {
  const { ulpin } = req.params;
  const data = mockData[ulpin];
  
  if (!data) {
    return res.status(404).json({ success: false, message: "Parcel not found" });
  }

  recordAuditLog({
    action: "PARCEL_LOOKUP",
    role: "Citizen / GIS Query",
    user: "public-session",
    ulpin,
    details: `Inspected RoR title, encumbrance, and utilities for ULPIN ${ulpin}.`,
    ip: req.ip || "127.0.0.1",
    status: "SUCCESS"
  });
  
  return res.json({
    success: true,
    ulpin,
    data
  });
});

// The API endpoint for citizens to apply for ownership mutation / registry update
app.post("/api/mutation/apply", (req, res) => {
  const { ulpin, newOwnerName, transferReason, documentName, applicantNotes } = req.body;

  if (!ulpin || !newOwnerName) {
    return res.status(400).json({
      success: false,
      message: "ULPIN and New Owner Name are required fields."
    });
  }

  const cleanUlpin = ulpin.trim().toUpperCase();
  const applicationId = `MUT-${Date.now().toString().slice(-6)}`;

  // If parcel already exists, attach pending mutation request
  if (mockData[cleanUlpin]) {
    const parcel = mockData[cleanUlpin];
    if (!parcel.ownership) parcel.ownership = {};

    parcel.ownership.pendingNewOwner = newOwnerName.trim();
    parcel.ownership.mutationStatus = "Pending";
    parcel.ownership.applicationId = applicationId;
    parcel.ownership.transferReason = transferReason || "Sale Deed";
    parcel.ownership.appliedAt = new Date().toISOString();
    parcel.ownership.documentAttached = documentName || "Registered_Deed.pdf";
    if (applicantNotes) parcel.ownership.applicantNotes = applicantNotes;

    recordAuditLog({
      action: "CITIZEN_APPLIED",
      role: "Citizen Portal",
      user: newOwnerName.trim(),
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

  // If parcel does not exist yet, create a new entry with Pending status
  mockData[cleanUlpin] = {
    ownership: {
      ownerName: newOwnerName.trim(),
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
      mortgageDetails: {
        isMortgaged: false,
        bankName: "None",
        loanId: "N/A",
        sanctionedAmount: "₹0"
      },
      legalDispute: {
        hasDispute: false,
        status: "Clear Title",
        courtCaseId: "None",
        remarks: "New registration - Pending Title Verification"
      },
      certificate: {
        necNumber: `NEC-2026-${Date.now().toString().slice(-4)}`,
        issuedDate: new Date().toISOString().split("T")[0],
        validity: "Provisional Registration"
      }
    },
    utilities: {
      waterSupply: "Application Pending",
      electricityGrid: "Grid Connection Available",
      sewageNetwork: "Municipal Line Accessible",
      environmental: {
        ecoSensitiveZone: "Clear",
        wetlandProximity: "None",
        floodRisk: "Low",
        status: "Compliant"
      }
    },
    valuation: {
      circleRate: "₹4,500 / sq.ft.",
      unitArea: "1,500 sq.ft.",
      guidelineValue: "₹67.5 Lakh",
      lastRevisionDate: "2026-01-01"
    }
  };

  return res.status(201).json({
    success: true,
    message: `Parcel ${cleanUlpin} registered and mutation queued for review.`,
    applicationId,
    ulpin: cleanUlpin,
    data: mockData[cleanUlpin]
  });
});

// The API endpoint for Revenue Officers to approve pending mutations
app.post("/api/parcel/:ulpin/approve", (req, res) => {
  const { ulpin } = req.params;
  const parcel = mockData[ulpin];

  if (!parcel) {
    return res.status(404).json({ success: false, message: "Parcel not found" });
  }

  if (!parcel.ownership) {
    parcel.ownership = {};
  }

  // Transfer ownership if there was a pending new owner
  if (parcel.ownership.pendingNewOwner) {
    parcel.ownership.previousOwner = parcel.ownership.ownerName;
    parcel.ownership.ownerName = parcel.ownership.pendingNewOwner;
    delete parcel.ownership.pendingNewOwner;
  }

  parcel.ownership.mutationStatus = "Approved";
  parcel.ownership.approvedAt = new Date().toISOString();

  recordAuditLog({
    action: "MUTATION_APPROVED",
    role: "Revenue Officer (Tahsildar)",
    user: "tahsildar@revenue.gov.in",
    ulpin,
    details: `Approved land mutation for ULPIN ${ulpin}. Title transferred to ${parcel.ownership.ownerName}.`,
    ip: req.ip || "127.0.0.1",
    status: "APPROVED_FINAL",
    statusCode: 200
  });

  return res.json({
    success: true,
    message: `Mutation for parcel ${ulpin} approved successfully`,
    ulpin,
    data: parcel
  });
});

app.listen(PORT, () => {
  console.log(`✅ BULLETPROOF Backend running at http://localhost:${PORT}`);
});