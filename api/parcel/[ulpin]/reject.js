import { query } from "../../_db.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { ulpin } = req.query;
  const cleanUlpin = String(ulpin || "").replace(/[^a-zA-Z0-9]/g, "").trim().toUpperCase();

  try {
    const checkRes = await query(
      "SELECT owner_name, pending_owner FROM parcels WHERE UPPER(TRIM(ulpin)) = UPPER($1) LIMIT 1",
      [cleanUlpin]
    );
    const originalOwner = checkRes.rows[0]?.owner_name || "Registered Landholder";

    // Mark mutation rejected and clear pending_owner, retaining original owner
    await query(
      `UPDATE parcels 
       SET pending_owner = NULL, 
           mutation_status = 'Rejected', 
           updated_at = NOW() 
       WHERE UPPER(TRIM(ulpin)) = UPPER($1)`,
      [cleanUlpin]
    );

    return res.status(200).json({
      success: true,
      message: `Mutation for parcel ${cleanUlpin} rejected successfully. Title retained by ${originalOwner}.`,
      ulpin: cleanUlpin,
      data: {
        ulpin: cleanUlpin,
        ownerName: originalOwner,
        mutationStatus: "Rejected"
      }
    });
  } catch (err) {
    console.error("Vercel reject mutation error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}
