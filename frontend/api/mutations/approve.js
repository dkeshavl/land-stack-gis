import handler from "../parcel/[ulpin]/approve.js";

export default async function approveMutation(req, res) {
  if (req.body?.ulpin && !req.query.ulpin) {
    req.query.ulpin = req.body.ulpin;
  }
  return handler(req, res);
}
