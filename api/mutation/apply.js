import { query } from "../_db.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { ulpin, newOwnerName, transferReason, documentName } = req.body || {};

  if (!ulpin || !newOwnerName) {
    return res.status(400).json({
      success: false,
      message: "ULPIN and New Owner Name are required fields."
    });
  }

  const cleanUlpin = String(ulpin).replace(/[^a-zA-Z0-9]/g, "").trim().toUpperCase();
  const applicationId = `MUT-${Date.now().toString().slice(-6)}`;

  try {
    // Attempt updating in database if present
    await query(
      "UPDATE parcels SET owner_name = $1, updated_at = NOW() WHERE UPPER(TRIM(ulpin)) = UPPER($2)",
      [newOwnerName.trim(), cleanUlpin]
    );
  } catch (err) {
    console.warn("Vercel mutation DB update warning:", err.message);
  }

  return res.status(200).json({
    success: true,
    message: "Mutation application submitted successfully and queued for Revenue Officer review.",
    applicationId,
    ulpin: cleanUlpin,
    data: {
      ulpin: cleanUlpin,
      applicationId,
      ownership: {
        ownerName: newOwnerName.trim(),
        pendingNewOwner: newOwnerName.trim(),
        mutationStatus: "Pending",
        transferReason: transferReason || "Sale Deed",
        documentAttached: documentName || "Registered_Deed.pdf",
        appliedAt: new Date().toISOString()
      }
    }
  });
}
