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
    // 1. Fetch current legal owner and pending transferee
    const checkRes = await query(
      "SELECT owner_name, pending_owner FROM parcels WHERE UPPER(TRIM(ulpin)) = UPPER($1) LIMIT 1",
      [cleanUlpin]
    );

    const currentLegalOwner = checkRes.rows[0]?.owner_name || "Registered Landholder";
    const targetOwner = (
      req.body?.newOwnerName ||
      checkRes.rows[0]?.pending_owner ||
      "Verified Landholder"
    ).trim();

    // 2. Legally transfer title in PostGIS: set previous_owner, update owner_name, clear pending_owner, mark Approved
    await query(
      `UPDATE parcels 
       SET previous_owner = $1, 
           owner_name = $2, 
           pending_owner = NULL, 
           mutation_status = 'Approved', 
           updated_at = NOW() 
       WHERE UPPER(TRIM(ulpin)) = UPPER($3)`,
      [currentLegalOwner, targetOwner, cleanUlpin]
    );

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
    console.error("Vercel approve mutation error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}
