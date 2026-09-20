export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { ulpin } = req.query;
  const cleanUlpin = String(ulpin || "").replace(/[^a-zA-Z0-9]/g, "").trim().toUpperCase();

  return res.status(200).json({
    success: true,
    message: `Mutation for parcel ${cleanUlpin} rejected successfully.`,
    ulpin: cleanUlpin,
    data: {
      ulpin: cleanUlpin,
      mutationStatus: "Rejected"
    }
  });
}
