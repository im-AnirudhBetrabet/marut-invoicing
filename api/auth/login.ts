import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookieHeader, makeSession, requirePost, sessionSecret } from "../../server/session.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;
  res.setHeader("Cache-Control", "no-store");
  const configured = process.env.INVOICE_APP_PASSWORD || "";
  if (configured.length < 16 || !process.env.SESSION_SECRET) {
    return res.status(503).json({ error: "Invoice Studio authentication is not configured." });
  }
  try { sessionSecret(); } catch { return res.status(503).json({ error: "Session signing is not configured securely." }); }
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const expectedHash = createHash("sha256").update(configured).digest();
  const suppliedHash = createHash("sha256").update(password).digest();
  if (!password || !timingSafeEqual(expectedHash, suppliedHash)) {
    return res.status(401).json({ error: "Incorrect password. Please try again." });
  }
  res.setHeader("Set-Cookie", cookieHeader(makeSession()));
  return res.status(200).json({ ok: true });
}