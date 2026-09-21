const fs = require("fs");
const path = require("path");

// Shared mockData for offline fallback and demonstration
const mockData = {
  "29572001218407": {
    lat: 12.9338,
    lng: 77.5917,
    ownership: {
      ownerName: "Arjun Reddy",
      previousOwner: "Arjun Reddy",
      khasraNumber: "149/2",
      mutationStatus: "Rejected",
      applicationId: "MUT-218407",
      transferReason: "Sale Deed",
      rejectedAt: new Date().toISOString()
    },
    zoning: { zoneType: "Residential", landUse: "Residential Primary" },
    tax: { propertyTaxStatus: "Paid", amount: "₹14,200" },
    encumbrance: { status: "Freehold - Clear Title" },
    valuation: { guidelineValue: "₹1.04 Cr" }
  },
  "1234567890ABCD": {
    lat: 12.9298,
    lng: 77.5843,
    ownership: { ownerName: "Rajesh Kumar", pendingNewOwner: "Shri A. K. Sharma", khasraNumber: "45/2", mutationStatus: "Pending" },
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
    lat: 30.2073,
    lng: 74.4578,
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
    lat: 30.2078,
    lng: 74.4578,
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
    lat: 30.2085,
    lng: 74.4580,
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
    lat: 30.2091,
    lng: 74.4582,
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
    lat: 30.2096,
    lng: 74.4585,
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
    lat: 30.2102,
    lng: 74.4588,
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
    lat: 30.2108,
    lng: 74.4590,
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
    details: "Land Stack Spatial Registry node mounted with PostGIS connection pool.",
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
  if (auditLogs.length > 300) auditLogs.pop();
  return logEntry;
}

// Helper to keep public/parcels.json synced with live ownership mutations
function updateParcelsJsonFile(ulpin, newOwnerName, mutationStatus) {
  try {
    const possiblePaths = [
      path.join(__dirname, "../../frontend/public/parcels.json"),
      path.join(__dirname, "../data/parcels.json")
    ];
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        if (Array.isArray(content.features)) {
          let changed = false;
          content.features.forEach((feat) => {
            if (feat.properties && feat.properties.ulpin === ulpin) {
              if (newOwnerName) feat.properties.ownerName = newOwnerName;
              if (mutationStatus) feat.properties.mutationStatus = mutationStatus;
              changed = true;
            }
          });
          if (changed) {
            fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf-8");
          }
        }
      }
    }
  } catch (err) {
    console.warn("Could not sync parcels.json file:", err.message);
  }
}

module.exports = {
  mockData,
  auditLogs,
  recordAuditLog,
  updateParcelsJsonFile
};
