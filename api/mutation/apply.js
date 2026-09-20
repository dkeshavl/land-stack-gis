import { pool, query } from "../_db.js";

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
  const buyerName = newOwnerName.trim();
  const applicationId = `MUT-${Date.now().toString().slice(-6)}`;

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // 1. Fetch current legal owner so title is strictly preserved
    const checkRes = await client.query(
      "SELECT owner_name FROM parcels WHERE UPPER(TRIM(ulpin)) = UPPER($1) LIMIT 1 FOR UPDATE",
      [cleanUlpin]
    );
    const currentOwner = checkRes.rows[0]?.owner_name || "Data Unavailable";

    // 2. Insert new active mutation record into mutations table
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
    const mutationId = String(mutRes.rows[0].id);

    // 3. Mark parcel with active pending mutation: KEEP legal owner intact!
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
          pendingNewOwner: buyerName,
          mutationStatus: "Pending",
          transferReason: transferReason || "Sale Deed",
          documentAttached: documentName || "Registered_Deed.pdf",
          appliedAt: new Date().toISOString(),
          applicantNotes,
          applicantPhone
        }
      }
    });
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    console.error("Mutation apply transaction error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    if (client) client.release();
  }
}
