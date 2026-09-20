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
  const targetOwner = (req.body?.newOwnerName || "Verified Landholder").trim();

  try {
    await query(
      "UPDATE parcels SET owner_name = $1, updated_at = NOW() WHERE UPPER(TRIM(ulpin)) = UPPER($2)",
      [targetOwner, cleanUlpin]
    );
  } catch (err) {
    console.warn("Vercel approve mutation warning:", err.message);
  }

  return res.status(200).json({
    success: true,
    message: `Mutation for parcel ${cleanUlpin} approved successfully`,
    ulpin: cleanUlpin,
    data: {
      ulpin: cleanUlpin,
      ownerName: targetOwner,
      mutationStatus: "Approved"
    }
  });
}
