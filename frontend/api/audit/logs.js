export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const defaultLogs = [
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
      ulpin: "29572001193047",
      details: "Inspected RoR title, encumbrance, and utilities for PostGIS ULPIN 29572001193047 (Rajesh Kumar).",
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
      ulpin: "29572001218435",
      details: "Non-Encumbrance Certificate cross-verified against lien database for Keshav (Khasra 335/4).",
      ip: "10.42.0.8",
      status: "AUDIT_FLAG",
      statusCode: 200,
      timestamp: new Date(Date.now() - 1800000).toISOString()
    }
  ];

  return res.status(200).json({
    success: true,
    count: defaultLogs.length,
    totalLogs: defaultLogs.length,
    data: defaultLogs
  });
}
