import type { VercelRequest, VercelResponse } from "@vercel/node";
import { chromium as playwrightChromium } from "playwright-core";
import sparticuzChromium from "@sparticuz/chromium";
import { renderToStaticMarkup } from "react-dom/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import React from "react";
import InvoicePaper from "../../src/components/InvoicePaper.tsx";
import type { InvoiceState, LineItem } from "../../src/lib/types.ts";
import { PACKS, PRODUCTS } from "../../src/lib/types.ts";
import { existsSync } from "node:fs";
const MAX_ITEMS = 100;
const MAX_BODY_BYTES = 180_000;
const PAPER = "#F8F5EE";

function text(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function finite(value: unknown, fallback = 0, min = 0, max = 1_000_000_000): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}
function validDate(value: unknown): string {
  const v = text(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return "";
  const parsed = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === v ? v : "";
}
function normalizeInvoice(input: unknown): InvoiceState | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  if (raw.kind !== "proforma" && raw.kind !== "sales") return null;
  const number = text(raw.number, 40);
  const pattern = raw.kind === "proforma"
    ? /^MAR\/PF\/\d{4}\/\d{3}$/
    : /^MAR\/INV\/\d{2}-\d{2}\/\d{3}$/;
  if (!pattern.test(number)) return null;
  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  if (rawItems.length < 1 || rawItems.length > MAX_ITEMS) return null;
  const items: LineItem[] = [];
  for (const item of rawItems) {
    if (!item || typeof item !== "object") return null;
    const row = item as Record<string, unknown>;
    if (!PRODUCTS.includes(row.product as never) || !PACKS.includes(row.pack as never)) return null;
    items.push({
      id: text(row.id, 80) || crypto.randomUUID(),
      product: row.product as LineItem["product"],
      pack: row.pack as LineItem["pack"],
      qty: finite(row.qty, 1, 1, 100_000),
      rate: finite(row.rate),
      discount: finite(row.discount),
    });
  }
  const rawPhone = text(raw.phone, 24);
  const phoneDigits = rawPhone.replace(/\D/g, "");
  if (rawPhone && phoneDigits.length !== 10) return null;
  const phone = phoneDigits;
  return {
    kind: raw.kind,
    number,
    issueDate: validDate(raw.issueDate),
    validUntil: validDate(raw.validUntil),
    reference: text(raw.reference, 120),
    customer: text(raw.customer, 200),
    phone,
    email: text(raw.email, 200),
    address: text(raw.address, 1000),
    items,
    terms: text(raw.terms, 1000),
    notes: text(raw.notes, 1000),
  };
}

const PDF_CSS = `
  @page {
    size: A4 portrait;
    margin: 40mm 13mm 48mm;
    background: ${PAPER};
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; width: 100%; background: ${PAPER}; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { color: #29271f; font-family: Manrope, sans-serif; font-size: 10pt; line-height: 1.45; position: relative; }
  body::before {
    content: "";
    position: fixed;
    inset: -40mm -13mm -48mm;
    background: ${PAPER};
    z-index: -1;
  }
  .invoice-paper {
    position: relative; width: 100%; max-width: none; min-height: 0;
    margin: 0; padding: 0 0 0; overflow: visible;
    background: ${PAPER}; color: #29271f; font-family: Manrope, sans-serif;
    font-size: 9pt; box-shadow: none;
  }
  main {
    position: relative;
    z-index: 1;
  }

  /* Hide the old decorative sprig */
  .paper-leaves {
    display: none !important;
  }

  /* Permanent botanical footer on every PDF page */
  .pdf-botanical-footer {
    position: fixed;

    left: -13mm;
    bottom: -45mm;

    width: 210mm;
    height: 41mm;

    object-fit: cover;
    object-position: center bottom;

    opacity: 1;
    pointer-events: none;
    z-index: 0;

    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .paper-header { display: none !important; }
  .paper-title {
    display: grid; grid-template-columns: 1.2fr .8fr; gap: 6mm; align-items: center;
    padding: 0 0 8mm; border-bottom: 1px solid #cfc6b6;
    break-inside: avoid; page-break-inside: avoid;
  }
  .paper-title h1 { font-family: Manrope, sans-serif; font-size: 28pt; line-height: 1.15; font-weight: 600; letter-spacing: -1pt; margin: 0 0 2mm; white-space: nowrap; }
  .paper-title p { font-size: 9pt; color: #716d64; margin: 0; }
  .paper-title dl { border-left: 1px solid #d2c9b8; padding-left: 5mm; margin: 0; display: grid; gap: 2mm; }
  .paper-title dl div { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm; }
  .paper-title dt { font-size: 6.5pt; letter-spacing: .7pt; color: #676256; }
  .paper-title dd { margin: 0; font-size: 7pt; font-weight: 700; }
  .paper-parties { font-size: 10pt; display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; padding: 7mm 0; border-bottom: 1px solid #d9d1c3; break-inside: avoid; page-break-inside: avoid; }
  .paper-parties > div + div { border-left: 1px solid #d1c8b8; padding-left: 5mm; }
  .paper-parties label, .paper-terms label, .paper-words label, .paper-footer label { font-size: 6.5pt; font-weight: 700; letter-spacing: 1.5pt; }
  .paper-parties h2 { font-size: 10pt; font-weight: 700; margin: 3mm 0 1.5mm; }
  .paper-parties h3 { font-size: 12pt; }
  .paper-items th { font-size: 9pt; }
  .paper-parties p { font-size: 7pt; line-height: 1.55; margin: 1mm 0; color: #4c4941; }
  .paper-items { width: 100%; border-collapse: collapse; margin: 7mm 0 0; font-size: 7pt; break-inside: auto; page-break-inside: auto; }
  .paper-items thead { display: table-header-group; }
  .paper-items tfoot { display: table-footer-group; }
  .paper-items tr { break-inside: avoid; page-break-inside: avoid; }
  .paper-items th, .paper-items td { break-inside: avoid; }
  .paper-items th { background: #e9e5d2; text-align: left; padding: 3mm 2mm; letter-spacing: .35pt; white-space: nowrap; font-size: 10pt; line-height: 1.4; padding-top: 3.2mm; padding-bottom: 3.2mm;}
  .paper-items th:first-child { border-radius: 2mm 0 0 2mm; }
  .paper-items th:last-child { border-radius: 0 2mm 2mm 0; text-align: right; }
  .paper-items td { padding: 3mm 2mm; border-bottom: 1px solid #ded7ca; vertical-align: top; }
  .paper-items td:last-child { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .paper-items td:nth-child(3), .paper-items td:nth-child(4), .paper-items td:nth-child(5) { white-space: nowrap; }
  .paper-items th,
  .paper-items td {
    break-inside: avoid;
  }
  .paper-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; margin-top: 10mm; break-inside: avoid; page-break-inside: avoid; }
  .paper-terms { border-right: 1px solid #d1c8b8; padding-right: 5mm; }
  .paper-terms label { display: block; margin-bottom: 3mm; }
  .paper-terms p { display: flex; gap: 3mm; align-items: flex-start; font-size: 7pt; line-height: 1.4; margin: 2.5mm 0; }
  .paper-term-row { display:flex; align-items:flex-start; gap:3mm; }
  .paper-term-icon { flex:0 0 3.7mm; width:3.7mm; height:3.7mm; color:#a47b3f; stroke-width:1.7; }
  .paper-term-row span { color:#39372f; }
  .paper-terms .custom-terms { padding-top: 2mm; border-top: 1px solid #ded7ca; color: #686254; }
  .paper-totals { padding-left: 1mm; }
  .paper-totals > div { display: flex; justify-content: space-between; gap: 3mm; padding: 3mm 2.5mm; border-bottom: 1px solid #ded7ca; font-size: 7.5pt; }
  .paper-totals b { font-weight: 600; white-space: nowrap; }
  .paper-totals .paper-discount b { color: #8a6c3e; }
  .paper-totals .paper-grand { background: #e9e5d2; border: 0; border-radius: 2mm; margin-top: 2mm; font-weight: 700; font-size: 10pt; }
  .paper-words { margin-top: 8mm; padding-bottom: 6mm; border-bottom: 1px solid #cfc6b6; break-inside: avoid; page-break-inside: avoid; }
  .paper-words label { color: #8a6c3e; }
  .paper-words p { font: italic 10pt Georgia, serif; margin: 2mm 0 0; }
  .paper-footer { display: grid; grid-template-columns: 1.05fr .95fr; gap: 6mm; padding-top: 7mm; break-inside: avoid; page-break-inside: avoid; }
  .paper-footer ul { margin: 3mm 0 0; padding-left: 4mm; font-size: 6.5pt; line-height: 1.7; max-width: 90mm; }
  .paper-issued { border-left: 1px solid #d1c8b8; padding: 7mm 0 2mm 5mm; display: flex; flex-direction: column; gap: 1.5mm; align-self: stretch; justify-content: center; }
  .paper-issued b { font-size: 7.5pt; }
  .paper-issued span { font-size: 6pt; color: #716d64; }

.invoice-paper > *:not(.paper-leaves) {
    position: relative;
    z-index: 1;
}
  .paper-extra-note { position: relative; z-index: 1; font-size: 6.5pt; color: #696456; margin-top: 3mm; max-width: 70%; }
  @media print { body { background: ${PAPER}; } }
`;

function safeFilename(value: string) {
  return value.replace(/[^A-Za-z0-9_-]+/g, "_").slice(0, 80) || "MARUT_invoice";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const rawLength = Number(req.headers["content-length"] || 0);
  const serializedBody = JSON.stringify(req.body ?? null) || "null";
  const parsedLength = Buffer.byteLength(serializedBody, "utf8");
  if (rawLength > MAX_BODY_BYTES || parsedLength > MAX_BODY_BYTES) {
    return res.status(413).json({ error: "Invoice payload is too large." });
  }

  const invoice = normalizeInvoice(req.body);
  if (!invoice || !invoice.customer || !invoice.issueDate) {
    return res.status(400).json({ error: "Invoice data is incomplete or invalid. Check the document number, customer, dates and line items." });
  }

  let browser: Awaited<ReturnType<typeof playwrightChromium.launch>> | undefined;
  try {
    const [logo, botanical] = await Promise.all([
      readFile(join(process.cwd(), "public/brand/marut-logo-gold.png")),
      readFile(join(process.cwd(), "public/brand/microgreens-illustration.png")),
    ]);
    const markup = renderToStaticMarkup(React.createElement(InvoicePaper, { data: invoice }));
    const botanicalDataUri = `data:image/png;base64,${botanical.toString("base64")}`;
    const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <style>${PDF_CSS}</style>
      </head>
      <body>
        <main>
          ${markup
        .replaceAll(
          "/brand/marut-logo-gold.png",
          `data:image/png;base64,${logo.toString("base64")}`
        )
        .replaceAll(
          "/brand/microgreens-illustration.png",
          botanicalDataUri
        )}
        </main>
      </body>
    </html>`;

    if (process.platform === "win32") {
      // Local Windows development: use installed Google Chrome.
      const chromeCandidates = [
        process.env.CHROME_EXECUTABLE_PATH,
        process.env.PROGRAMFILES
          ? join(process.env.PROGRAMFILES, "Google/Chrome/Application/chrome.exe")
          : undefined,
        process.env["PROGRAMFILES(X86)"]
          ? join(process.env["PROGRAMFILES(X86)"], "Google/Chrome/Application/chrome.exe")
          : undefined,
        process.env.LOCALAPPDATA
          ? join(process.env.LOCALAPPDATA, "Google/Chrome/Application/chrome.exe")
          : undefined,
      ].filter((path): path is string => Boolean(path));

      const chromePath = chromeCandidates.find(path => existsSync(path));

      if (!chromePath) {
        throw new Error(
          "Google Chrome not found. Set CHROME_EXECUTABLE_PATH in .env.local."
        );
      }

      browser = await playwrightChromium.launch({
        executablePath: chromePath,
        headless: true,
      });

    } else {
      // Vercel Linux production: use Sparticuz Chromium.
      const executablePath = await sparticuzChromium.executablePath();

      browser = await playwrightChromium.launch({
        args: sparticuzChromium.args,
        executablePath,
        headless: true,
      });
    }

    const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "load", timeout: 20_000 });
    await page.evaluate(async () => {
      await document.fonts.ready;
      const images = Array.from(document.images);
      await Promise.all(images.map(img => img.decode().catch(() => undefined)));
    });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,

      headerTemplate: `
        <div style="
          width: 100%;
          height: 31mm;
          padding: 0 13mm;
          margin: 0;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: Manrope, sans-serif;
          color: #29271f;
          background-color: #F8F5EE;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        ">
          <img
            src="data:image/png;base64,${logo.toString("base64")}"
            style="
              width: 50mm;
              height: 45mm;
              object-fit: contain;
              object-position: left center;
            "
          />
          <div style="
            text-align: right;
            font-size: 7pt;
            line-height: 1.8;
            letter-spacing: 2pt;
            font-weight: 600;
          ">
            FRESH MICROGREENS
            <br />
            GROWN RESPONSIBLY
            <div style="
              width: 9mm;
              height: 0;
              border-top: 1.5px solid #a47b3f;
              margin: 2mm 0 0 auto;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            "></div>
          </div>
        </div>
      `,




      footerTemplate: `
        <div style="
          position: relative;
          width: 100%;
          height: 48mm;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: Manrope, sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        ">

          <div style="
            position: absolute;
            top: 10mm;
            right: 13mm;
            font-size: 7pt;
            color: #716d64;
            white-space: nowrap;
          ">
            Page
            <span class="pageNumber" style="margin: 0 3px;"></span>
            of
            <span class="totalPages" style="margin-left: 3px;"></span>
          </div>

          <img
            src="${botanicalDataUri}"
            style="
              position: absolute;
              bottom: 0;
              left: 0;
              width: 100%;
              height: 50mm;
              object-position: center bottom;
              display: block;
            "
          />

        </div>
      `,



      margin: {
        top: "40mm",
        right: "13mm",
        bottom: "48mm",
        left: "13mm",
      },
      preferCSSPageSize: false,
    });
    const filename = `${safeFilename(invoice.number)}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", String(pdf.byteLength));
    return res.status(200).send(Buffer.from(pdf));
  } catch (error) {
    console.error("Invoice PDF generation failed:", error);
    return res.status(500).json({ error: "PDF generation failed. Please try again." });
  } finally {
    if (browser) await browser.close().catch(() => undefined);
  }
}

export const config = { maxDuration: 60, memory: 1024 };
