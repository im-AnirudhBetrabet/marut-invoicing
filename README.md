# MARUT Invoice Studio — Standalone

A standalone, database-free React + TypeScript invoice tool with server-verified shared-password access and session-only working data.

## Security model

- The password is configured only as the Vercel environment variable `INVOICE_APP_PASSWORD`. It is never included in client-side JavaScript.
- Password comparison happens in a serverless function using fixed-length SHA-256 digests and a timing-safe comparison.
- Successful login creates a signed HMAC-SHA256 session cookie. On reload, `/api/auth/session` verifies it server-side before showing the workspace. Cookie is `HttpOnly`, `Secure`, `SameSite=Strict`, path `/`, and expires after 8 hours.
- Vercel middleware validates the cookie before serving application routes. API routes are also protected by middleware.
- Logout clears the cookie and in-memory state.
- No database, localStorage, analytics, third-party auth provider or cloud invoice storage is used.
- Invoice content and the session invoice list exist only in React memory. Reloading, closing the tab or logging out clears them.

## Required environment variables

Set these in Vercel Project → Settings → Environment Variables:

- `INVOICE_APP_PASSWORD`: a unique random password of at least 16 characters. Prefer 24+ characters.
- `SESSION_SECRET`: a separate cryptographically random secret of at least 32 characters. Generate with `openssl rand -base64 48`.

Never use the same value for both variables. Do not commit `.env` files or secrets. If using local development, create `.env.local` (gitignored) with both variables. The local Vite server does not emulate Vercel serverless authentication; use `vercel dev` for end-to-end login testing.

## Deploy to Vercel

1. Create a new private GitHub repository owned by MARUT and place this project in it.
2. Import it as a separate Vercel project. Do not connect it to the public MARUT website or admin deployment.
3. Add both environment variables to Production and Preview. For additional security, consider disabling Preview deployments or setting separate credentials.
4. Deploy. Vercel middleware protects the app routes and the serverless login function validates the password.
5. Test an unauthenticated visit, correct and incorrect passwords, expiry, logout and a direct route reload.

## Important security hardening

A shared password means all authorised team members share one credential and cannot be individually audited or revoked. Rotate it when a team member leaves. Use a long unique password and never share it in source code or chat.

This application does not implement persistent rate limiting because there is deliberately no database or shared state. Before production, enable request rate limiting / WAF protection for `/api/auth/login` at the edge (e.g. Cloudflare in front of the Vercel domain). Set a low threshold and temporary block for repeated failures. Also enable Vercel deployment protection for Preview deployments and keep the repository private. A login page alone is not a substitute for these controls.

The HMAC cookie is stateless: there is no server-side revocation list. Logout removes the browser cookie; a copied cookie remains valid until its 8-hour expiry or until `SESSION_SECRET` is rotated.

## Invoice behaviour and GST guard

- Pro Forma Invoice and non-GST Commercial Sales Invoice are enabled.
- GST Tax Invoice is not offered in this version.
- Pro Forma numbers follow `MAR/PF/YYZZ/XXX`; Sales Invoice numbers follow `MAR/INV/YY-YY/XXX`, with the financial year derived from the issue date.
- The user enters the three-digit sequence. There is no central numbering service or duplicate prevention across devices.
- Customer mobile numbers accept up to 10 Indian digits and display with the `+(91)` country prefix. If entered, exactly 10 digits are required before saving or printing.
- The Sales Invoice records the amount charged for goods supplied and does not calculate or collect GST.
- The current MARUT supplier details in the preview are provisional display values; verify legal name, constitution, registered/business address and contact details before using the documents with customers.
- Invoice numbers are entered manually. There is no central numbering service or duplicate prevention across devices.
- This is not an accounting ledger or statutory invoice archive. Download each PDF and retain it in MARUT's approved business records location.
- Confirm with MARUT's CA which document should accompany supplies made before GST registration, and what particulars must appear on that document. Do not issue a Tax Invoice or collect GST before the registration is effective.

## PDF generation

Click **Generate PDF**. The authenticated `/api/invoice/pdf` serverless endpoint renders the same React invoice component to static markup and uses Playwright + the bundled Chromium runtime to create the A4 PDF. The PDF is returned as a download; the user's browser print dialog is not opened.

- A4 portrait, warm ivory page background and controlled margins.
- Custom MARUT logo/tagline header and page-number footer are rendered by Playwright.
- No browser-generated timestamp, tab title, URL, or print-dialog header/footer.
- Table headings repeat across pages; item rows and summary/footer sections are kept together where possible.
- Logo and botanical photograph are embedded from bundled WebP assets; no third-party image request is needed.
- Request payload is validated server-side and capped at 100 line items / 180 KB.

The PDF endpoint is protected by the same signed, HTTP-only session cookie as the rest of the application. It does not persist invoice data.

## Local development

```bash
npm install
npm run dev
```

For Vercel function + middleware testing, install Vercel CLI and use `vercel dev` after configuring `.env.local`.

## Scope deliberately excluded

No database, cloud file storage, email delivery, customer directory, persistent invoice register, automatic invoice numbering, or multi-user identity management.


Before using any document as the invoice for goods already supplied, ask MARUT's CA to confirm the correct document type and mandatory particulars while GST registration is pending. A Pro Forma Invoice is a quotation / preliminary estimate, not a substitute for the actual supply document.

The application provides a commercial invoice format, not a GST Tax Invoice or statutory Bill of Supply. MARUT should confirm the applicable document wording, GST registration liability and product tax treatment with its CA before issuing invoices. The fact that GST is not shown on the document does not itself establish that registration is not required.


## Multi-page A4 PDF rendering

The authenticated Playwright endpoint renders the React invoice component as a continuous A4 document:
- Playwright supplies a controlled MARUT header and page-number footer on every page.
- Browser-generated timestamp, application title, URL and print-dialog headers are not part of the PDF.
- The item table repeats its header on subsequent pages and keeps each item row together.
- Totals, amount-in-words and terms/footer are kept together where possible and flow after the final item.
- The warm ivory background is printed across the page; the botanical image is placed after the invoice footer on the final page.
- The PDF is downloaded directly from the authenticated API. The browser print dialog is not opened.

The same React invoice component powers the live preview and the PDF, so document data and calculations remain consistent.

## Playwright deployment notes

The PDF endpoint uses `playwright-core` with `@sparticuz/chromium`, suitable for Vercel Node serverless functions. Vercel's function configuration includes the optimized local WebP brand assets. Deploy with a Node.js runtime supported by the selected Chromium package. Test the PDF endpoint through `vercel dev` or a Vercel preview deployment after login; plain `vite dev` does not emulate Vercel API routes or middleware.
