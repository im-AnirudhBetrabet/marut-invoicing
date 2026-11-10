import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_NAME = "marut_invoice_session";
export const SESSION_SECONDS = 8 * 60 * 60;

function b64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}
export function sessionSecret() {
  const secret = process.env.SESSION_SECRET || "";
  if (secret.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters.");
  return secret;
}
export function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}
export function makeSession() {
  const payload = b64url(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS, v: 1 }));
  return `${payload}.${sign(payload)}`;
}
export function validSession(token?: string) {
  if (!token) return false;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return false;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.v === 1 && Number.isFinite(data.exp) && data.exp > Math.floor(Date.now() / 1000);
  } catch { return false; }
}
export function cookieHeader(token: string, maxAge = SESSION_SECONDS) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}
export function getCookie(req: VercelRequest, name = COOKIE_NAME) {
  const raw = req.headers.cookie || "";
  const match = raw.split(";").map(x => x.trim()).find(x => x.startsWith(`${name}=`));
  if (!match) return undefined;
  try { return decodeURIComponent(match.slice(name.length + 1)); } catch { return undefined; }
}
export function requirePost(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); res.status(405).json({ error: "Method not allowed" }); return false; }
  return true;
}