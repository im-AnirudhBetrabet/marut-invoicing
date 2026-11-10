import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getCookie, validSession } from "../../server/session.js";
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") { res.setHeader("Allow","GET"); return res.status(405).json({ok:false}); }
  return res.status(validSession(getCookie(req)) ? 200 : 401).json({ ok: validSession(getCookie(req)) });
}