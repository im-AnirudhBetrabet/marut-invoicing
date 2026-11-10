import type { VercelRequest, VercelResponse } from "@vercel/node";
import { COOKIE_NAME, requirePost } from "../../server/session.js";
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) return;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
  return res.status(200).json({ ok: true });
}