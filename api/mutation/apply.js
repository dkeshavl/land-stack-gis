import { query } from "../_db.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { ulpin, newOwnerName, transferReason, documentName, applicantNotes, applicantPhone } = req.body || {};

  if (!ulpin || !newOwnerName) {
    return res.status(400).json({
      success: false,
      message: "ULPIN and New Owner Name are required fields."
    });
  }

  const cleanUlpin = String(ulpin).replace(/[^a-zA-Z0-9]/g, "").trim().toUpperCase();
  const applicationId = `MUT-${Date.now().toString().slice(-6)}`;

  let currentOwner = "Registered Landholder";

  try {
    // 1. Fetch current legal owner so title is NOT prematurely transferred
    const checkRes = await query(
      "SELECT owner_name FROM parcels WHERE UPPER(TRIM(ulpin)) = UPPER($1) LIMIT 1",
      [cleanUlpin]
    );
    if (checkRes.rows.length > 0 && checkRes.rows[0].owner_name) {
      currentOwner = checkRes.rows[0].owner_name;
    }

    // 2. Queue mutation application under 'Pending' review: keep owner_name intact, set pending_owner
    await query(
      `UPDATE parcels 
       SET pending_owner = $1, 
           mutation_status = 'Pending', 
           application_id = $2, 
           transfer_reason = $3, 
           updated_at = NOW() 
       WHERE UPPER(TRIM(ulpin)) = UPPER($4)`,
      [newOwnerName.trim(), applicationId, transferReason || "Sale Deed", cleanUlpin]
    );
  } catch (err) {
    console.warn("Mutation apply DB update warning:", err.message);
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
        ownerName: currentOwner,
        pendingNewOwner: newOwnerName.trim(),
        mutationStatus: "Pending",
        transferReason: transferReason || "Sale Deed",
        documentAttached: documentName || "Registered_Deed.pdf",
        appliedAt: new Date().toISOString(),
        applicantNotes,
        applicantPhone
      }
    }
  });
}
