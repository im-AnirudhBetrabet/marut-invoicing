
import { next } from "@vercel/functions";

const COOKIE = "marut_invoice_session";

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(
    normalized + "=".repeat((4 - normalized.length % 4) % 4)
  );
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

function encodeBase64Url(bytes: ArrayBuffer) {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function verify(token: string, secret: string) {
  try {
    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra) return false;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signed = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(payload)
    );

    if (encodeBase64Url(signed) !== signature) return false;

    const data = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(payload))
    );

    return (
      data.v === 1 &&
      Number.isFinite(data.exp) &&
      data.exp > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

export default async function middleware(request: Request) {
  const url = new URL(request.url);

  // Public authentication endpoints and login page
  if (
    url.pathname === "/login" ||
    url.pathname === "/api/auth/login" ||
    url.pathname === "/api/auth/session"
  ) {
    return next();
  }

  const cookieHeader = request.headers.get("cookie") || "";

  const token = cookieHeader
    .split(";")
    .map(x => x.trim())
    .find(x => x.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);

  const secret = process.env.SESSION_SECRET || "";

  if (
    secret.length >= 32 &&
    token &&
    await verify(decodeURIComponent(token), secret)
  ) {
    return next();
  }

  // Reject unauthenticated API requests
  if (url.pathname.startsWith("/api/")) {
    return new Response(
      JSON.stringify({ error: "Unauthorised" }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );
  }

  // Redirect unauthenticated page requests
  return Response.redirect(new URL("/login", request.url), 307);
}


export const config = {
  matcher: [
    "/((?!assets/|brand/|@vite/|@react-refresh|@id/|@fs/|src/|node_modules/|favicon.ico|robots.txt).*)"
  ]
};
