export function formatPostgisParcel(row) {
  const lat = parseFloat(row.lat) || 12.9250;
  const lng = parseFloat(row.lng) || 77.5850;
  const areaSqm = parseFloat(row.area_sqm) || 200;
  const isLakeBuffer =
    (row.environmental_zone || "").toLowerCase().includes("buffer") ||
    (row.environmental_zone || "").toLowerCase().includes("lake");

  const isCommercial = (row.zone_type || "").toLowerCase().includes("commercial");

  return {
    id: row.id,
    ulpin: row.ulpin,
    lat,
    lng,
    owner_name: row.owner_name || "Data Unavailable",
    ownerName: row.owner_name || "Data Unavailable",
    khasra_no: row.khasra_no,
    khasraNumber: row.khasra_no,
    zone_type: row.zone_type,
    zoneType: row.zone_type,
    tax_status: row.tax_status,
    taxStatus: row.tax_status,
    encumbrance: row.encumbrance || "Freehold - No Active Liens",
    area_sqm: areaSqm,
    areaSqm: areaSqm,
    water_connection_id: row.water_connection_id,
    power_connection_id: row.power_connection_id,
    environmental_zone: row.environmental_zone || "Standard",
    mutationStatus: (row.mutation_status || "").toUpperCase() === "PENDING" ? "Pending" : (row.mutation_status || "").toUpperCase() === "REJECTED" ? "Rejected" : "Approved",
    ownership: {
      ownerName: row.owner_name || "Data Unavailable",
      previousOwner: row.previous_owner || undefined,
      pendingNewOwner: (row.mutation_status || "").toUpperCase() === "PENDING" ? (row.pending_owner || undefined) : undefined,
      applicationId: (row.mutation_status || "").toUpperCase() === "PENDING" ? (row.application_id || undefined) : undefined,
      transferReason: (row.mutation_status || "").toUpperCase() === "PENDING" ? (row.transfer_reason || undefined) : undefined,
      khasraNumber: row.khasra_no || "-",
      mutationStatus: (row.mutation_status || "").toUpperCase() === "PENDING" ? "Pending" : (row.mutation_status || "").toUpperCase() === "REJECTED" ? "Rejected" : "Approved"
    },
    zoning: {
      zoneType: row.zone_type || "Residential",
      landUse: isCommercial ? "Commercial Retail / Office" : "Residential Primary",
      maxHeight: isCommercial ? "18m (G+4)" : "15m (G+3)"
    },
    tax: {
      propertyTaxStatus: row.tax_status || "Paid",
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
          row.environmental_zone === "Standard" || !row.environmental_zone
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
      circleRate: isCommercial ? "₹8,500 / sq.ft." : "₹4,500 / sq.ft.",
      unitArea: `${Math.round(areaSqm > 0 ? areaSqm * 10.7639 : 2200)} sq.ft.`,
      guidelineValue: `₹${(
        (((areaSqm || 200) * (isCommercial ? 8500 : 4500) * 10.7639) / 10000000) || 1.15
      ).toFixed(2)} Cr`,
      lastRevisionDate: "2026-01-01"
    },
    encumbranceData: {
      status: row.encumbrance || "Freehold - No Active Liens",
      legalDispute: { hasDispute: (row.encumbrance || "").toLowerCase().includes("dispute") }
    }
  };
}

export function getSynthesizedParcel(cleanUlpin) {
  // Deterministic fallback values based on numerical hash of ULPIN
  const numHash = cleanUlpin.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const surveyNum = `${(numHash % 350) + 1}/${(numHash % 4) + 1}`;
  const isPending = false;

  const sampleNames = [
    "Rajesh Kumar",
    "Priya Sharma",
    "Amit Patel",
    "Sunita Rao",
    "Vikram Singh",
    "Ananya Gupta",
    "Rohan Verma",
    "Meenakshi Iyer",
    "Keshav",
    "Suresh Gowda",
    "Karthik Subbaraj"
  ];
  const ownerName = sampleNames[numHash % sampleNames.length] || "Data Unavailable";

  return {
    id: cleanUlpin,
    ulpin: cleanUlpin,
    lat: 12.9250 + (numHash % 100) * 0.0001,
    lng: 77.5850 + (numHash % 100) * 0.0001,
    owner_name: ownerName,
    ownerName: ownerName,
    khasra_no: surveyNum,
    khasraNumber: surveyNum,
    zone_type: "Residential",
    zoneType: "Residential",
    tax_status: "Paid",
    taxStatus: "Paid",
    encumbrance: "Freehold - No Active Liens",
    area_sqm: 185,
    areaSqm: 185,
    mutationStatus: "Approved",
    ownership: {
      ownerName: ownerName,
      khasraNumber: surveyNum,
      mutationStatus: "Approved"
    },
    zoning: {
      zoneType: "Residential",
      landUse: "Residential Primary",
      maxHeight: "15m (G+3)"
    },
    tax: {
      propertyTaxStatus: isPending ? "Due" : "Paid",
      lastPaidDate: "2025-2026 Fiscal",
      amount: "₹14,200"
    },
    utilities: {
      waterSupply: "Active Municipal Connection",
      waterConnectionId: "BWSSB-RES-9102",
      electricityGrid: "Single-Phase Domestic Grid (7 kW)",
      sewageNetwork: "BWSSB Underground Sewer Linked",
      environmental: {
        status: "Compliant",
        ecoSensitiveZone: "Clear",
        wetlandProximity: "None (Safe)",
        floodRisk: "Low"
      }
    },
    valuation: {
      circleRate: "₹4,500 / sq.ft.",
      unitArea: "1,991 sq.ft.",
      guidelineValue: "₹89.6 Lakh",
      lastRevisionDate: "2026-01-01"
    },
    encumbranceData: {
      status: "Freehold - No Active Liens",
      legalDispute: { hasDispute: false }
    }
  };
}
