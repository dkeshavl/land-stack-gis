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

    const parcelRes = await client.query(
      "SELECT owner_name FROM parcels WHERE UPPER(TRIM(ulpin)) = UPPER($1) LIMIT 1 FOR UPDATE",
      [cleanUlpin]
    );
    const legalOwner = parcelRes.rows[0]?.owner_name || "Data Unavailable";

    // Action 1: Mark active mutation as REJECTED in mutations table
    await client.query(
      `UPDATE mutations 
       SET status = 'REJECTED', 
           reviewed_at = NOW(), 
           reviewed_by = $1 
       WHERE UPPER(TRIM(ulpin)) = UPPER($2) AND UPPER(status) = 'PENDING'`,
      [reviewer, cleanUlpin]
    );

    // Action 2: Clear pending_owner and active_mutation_id on parcels, mark Rejected
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

    return res.status(200).json({
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
    console.error("Vercel reject mutation transaction error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    if (client) client.release();
  }
}
