import handler from "../parcel/[ulpin]/reject.js";

export default async function rejectMutation(req, res) {
  if (req.body?.ulpin && !req.query.ulpin) {
    req.query.ulpin = req.body.ulpin;
  }
  return handler(req, res);
}
