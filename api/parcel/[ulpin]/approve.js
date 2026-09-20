import { pool } from "../../_db.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { ulpin } = req.query;
  const cleanUlpin = String(ulpin || "").replace(/[^a-zA-Z0-9]/g, "").trim().toUpperCase();
  const reviewer = (req.body?.reviewedBy || "Shri R. K. Verma (Tahsildar)").trim();

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // 1. Fetch active pending mutation record
    const mutRes = await client.query(
      `SELECT id, buyer_name, previous_owner 
       FROM mutations 
       WHERE UPPER(TRIM(ulpin)) = UPPER($1) AND UPPER(status) = 'PENDING' 
       ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
      [cleanUlpin]
    );

    // 2. Fetch current parcel title
    const parcelRes = await client.query(
      "SELECT owner_name, pending_owner FROM parcels WHERE UPPER(TRIM(ulpin)) = UPPER($1) LIMIT 1 FOR UPDATE",
      [cleanUlpin]
    );

    const currentLegalOwner = parcelRes.rows[0]?.owner_name || "Data Unavailable";
    const rawTarget = (
      req.body?.newOwnerName ||
      mutRes.rows[0]?.buyer_name ||
      parcelRes.rows[0]?.pending_owner ||
      ""
    ).trim();

    const targetOwner = (rawTarget && rawTarget.toUpperCase() !== "ADD")
      ? rawTarget
      : (mutRes.rows[0]?.buyer_name || rawTarget || "Data Unavailable");

    if (!targetOwner || targetOwner === "Data Unavailable") {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Valid buyer name is required for title transfer." });
    }

    // Action 1: UPDATE mutations SET status = 'APPROVED' WHERE id = $1;
    const activeMutId = req.body?.id || req.body?.mutationId || mutRes.rows[0]?.id;
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
        [reviewer, cleanUlpin]
      );
    }

    // Action 2: UPDATE parcels SET owner_name = $2, previous_owner = owner_name, active_mutation_id = NULL WHERE ulpin = $3;
    await client.query(
      `UPDATE parcels 
       SET owner_name = $1, 
           previous_owner = owner_name, 
           pending_owner = NULL, 
           active_mutation_id = NULL, 
           mutation_status = 'Approved', 
           updated_at = NOW() 
       WHERE UPPER(TRIM(ulpin)) = UPPER($2)`,
      [targetOwner, cleanUlpin]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: `Mutation for parcel ${cleanUlpin} approved successfully`,
      ulpin: cleanUlpin,
      data: {
        ulpin: cleanUlpin,
        ownerName: targetOwner,
        previousOwner: currentLegalOwner,
        mutationStatus: "Approved"
      }
    });
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    console.error("Vercel approve mutation transaction error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    if (client) client.release();
  }
}
