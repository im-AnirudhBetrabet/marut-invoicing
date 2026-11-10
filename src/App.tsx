import { useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, FileText, Leaf, LogOut, Plus, ReceiptText, RotateCcw, ShieldCheck, Trash2, X, LockKeyhole } from "lucide-react";
import Login from "./components/Login";
import InvoicePaper from "./components/InvoicePaper";
import type { InvoiceState, LineItem } from "./lib/types";
import { PACKS, PRODUCTS } from "./lib/types";
import { cleanIndianMobile, documentNumber, formatIndianMobile, money, serialFromNumber } from "./lib/money";

const today = () => new Date().toISOString().slice(0, 10);
const newLine = (): LineItem => ({ id: crypto.randomUUID(), product: PRODUCTS[0], pack: "100 g", qty: 1, rate: 0, discount: 0 });
const initial = (): InvoiceState => ({ kind: "proforma", number: "", issueDate: today(), validUntil: "", reference: "", customer: "", phone: "", email: "", address: "", items: [newLine()], terms: "", notes: "" });
type Saved = { id: string; number: string; customer: string; total: number; kind: string; date: string; data: InvoiceState };
export default function App() {
  const [authed, setAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => { fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store" }).then(r => setAuthed(r.ok)).catch(() => setAuthed(false)).finally(() => setAuthChecked(true)); }, []);
  const [data, setData] = useState<InvoiceState>(initial);
  const [page, setPage] = useState<"create" | "session" | "settings">("create");
  const [saved, setSaved] = useState<Saved[]>([]);
  const [notice, setNotice] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [serialInput, setSerialInput] = useState(() => serialFromNumber(initial().number));

  const subtotal = useMemo(() => data.items.reduce((s, x) => s + Math.max(0, x.qty * x.rate - Math.min(x.discount, x.qty * x.rate)), 0), [data.items]);
  const update = (key: keyof InvoiceState, value: any) => setData(d => ({ ...d, [key]: value }));
  const setKind = (kind: "proforma" | "sales") => setData(d => ({ ...d, kind, number: documentNumber(kind, d.issueDate, serialInput) }));
  const setIssueDate = (date: string) => setData(d => ({ ...d, issueDate: date, number: documentNumber(d.kind, date, serialInput) }));
  const setSerial = (value: string) => { const clean = value.replace(/\D/g, "").slice(0, 3); setSerialInput(clean); setData(d => ({ ...d, number: documentNumber(d.kind, d.issueDate, clean) })); };
  const updateLine = (id: string, key: keyof LineItem, value: any) => setData(d => ({ ...d, items: d.items.map(x => x.id === id ? { ...x, [key]: value } : x) }));
  const addLine = () => update("items", [...data.items, newLine()]);
  const reset = () => { setData(initial()); setSerialInput(""); setNotice("A fresh invoice has been started."); };
  const saveSession = () => {
    if (!data.customer.trim() || !data.number.trim() || !data.items.length) { setNotice("Add an invoice sequence, customer and at least one item."); return; }
    if (data.phone && data.phone.length !== 10) { setNotice("Enter a complete 10-digit Indian mobile number, or leave the field blank."); return; }
    const total = data.items.reduce((s, x) => s + Math.max(0, x.qty * x.rate - Math.min(x.discount, x.qty * x.rate)), 0);
    setSaved(s => [{ id: crypto.randomUUID(), number: data.number, customer: data.customer, total, kind: data.kind, date: data.issueDate, data: structuredClone(data) }, ...s]);
    setNotice("Invoice added to this browser session only.");
  };
  const logout = async () => { try { await fetch("/api/auth/logout", { method: "POST" }); } finally { setAuthed(false); setSaved([]); setData(initial()); setSerialInput(""); } };
  const print = async () => {
    if (!data.customer.trim() || !data.number.trim() || !data.items.length) { setNotice("Complete the invoice sequence, customer and at least one item before generating the PDF."); return; }
    if (data.phone && data.phone.length !== 10) { setNotice("Enter a complete 10-digit Indian mobile number, or leave the field blank."); return; }
    setPdfBusy(true); setNotice("Generating your A4 PDF securely…");
    try {
      const response = await fetch("/api/invoice/pdf", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", cache: "no-store", body: JSON.stringify(data) });
      if (!response.ok) { let message = "PDF generation failed. Please try again."; try { const payload = await response.json(); if (payload.error) message = payload.error; } catch { } throw new Error(message); }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = `${data.number.replace(/[^A-Za-z0-9_-]+/g, "_")}.pdf`;
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      setNotice("PDF generated successfully.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to generate PDF."); }
    finally { setPdfBusy(false); }
  };
  if (!authChecked) return <main className="auth-loading"><div className="loading-mark">MARUT</div><span>Checking secure session…</span></main>;
  if (!authed) return <Login onLogin={() => setAuthed(true)} />;
  return <div className="studio-shell">
    <aside className="sidebar">
      <div className="sidebar-brand"><img src="/brand/marut-logo-gold.png" alt="MARUT" /><span>INVOICE STUDIO</span></div>
      <nav><button className={page === "create" ? "active" : ""} onClick={() => setPage("create")}><Plus />Create Invoice</button><button className={page === "session" ? "active" : ""} onClick={() => setPage("session")}><FileText />Invoices (Session)<em>{saved.length}</em></button><button className={page === "settings" ? "active" : ""} onClick={() => setPage("settings")}><ShieldCheck />Security & Info</button></nav>
      <div className="sidebar-bottom"><Leaf /><span>GROWN WITH INTENTION</span><small>Private workspace · v1.0</small></div>
    </aside>
    <main className="workspace">
      <header className="topbar"><div><div className="eyebrow">MARUT · PRIVATE WORKSPACE</div><h1>{page === "create" ? "Create Invoice" : page === "session" ? "Session Invoices" : "Security & Information"}</h1><p>{page === "create" ? "Prepare a customer document and generate a print-ready A4 PDF." : page === "session" ? "Documents retained in this browser session only." : "How this standalone application protects your information."}</p></div><div className="top-actions"><span className="session-pill"><ShieldCheck size={15} /> Session only</span><button className="icon-button" onClick={logout} title="Log out"><LogOut size={17} /></button></div></header>
      {notice && <div className="notice">{notice}<button onClick={() => setNotice("")}><X size={14} /></button></div>}
      {page === "create" && <div className="builder-grid">
        <section className="editor">
          <div className="doc-tabs"><button className={data.kind === "proforma" ? "selected" : ""} onClick={() => setKind("proforma")}><FileText size={16} />Pro Forma Invoice</button><button className={data.kind === "sales" ? "selected" : ""} onClick={() => setKind("sales")}><ReceiptText size={16} />Sales Invoice</button></div>
          <div className="section-card"><h2><span>01</span> Invoice details</h2><div className="form-grid four">
            <label>{data.kind === "proforma" ? "PF sequence *" : "Invoice sequence *"}<input inputMode="numeric" maxLength={3} value={serialInput} onChange={e => setSerial(e.target.value)} placeholder="001" /><small className="field-hint">{data.kind === "proforma" ? "MAR/PF/YYZZ/XXX" : "MAR/INV/YY-YY/XXX"}</small></label>
            <label>Issue date *<input type="date" value={data.issueDate} onChange={e => setIssueDate(e.target.value)} /></label>
            <label>{data.kind === "proforma" ? "Valid until" : "Payment due"}<input type="date" value={data.validUntil} onChange={e => update("validUntil", e.target.value)} /></label>
            <label>Reference<input value={data.reference} onChange={e => update("reference", e.target.value)} placeholder="Order / PO reference" /></label>
          </div></div>
          <div className="section-card"><h2><span>02</span> Customer details</h2><div className="form-grid two">
            <label>Customer / business name *<input value={data.customer} onChange={e => update("customer", e.target.value)} placeholder="Customer name" /></label>
            <label>Mobile number<input type="tel" inputMode="numeric" maxLength={14} value={data.phone} onChange={e => update("phone", cleanIndianMobile(e.target.value))} placeholder="10-digit mobile number" /><small className="field-hint">Displayed as {formatIndianMobile(data.phone) || "+(91) XXXXX XXXXX"}</small></label>
            <label>Email<input type="email" value={data.email} onChange={e => update("email", e.target.value)} placeholder="customer@example.com" /></label>
            <label className="span-two">Billing address<textarea value={data.address} onChange={e => update("address", e.target.value)} placeholder={"Street / locality\nCity, State – PIN, India"} rows={2} /></label>
          </div></div>
          <div className="section-card"><div className="section-heading"><h2><span>03</span> Line items</h2><button className="small-add" onClick={addLine}><Plus size={14} /> Add item</button></div>
            <div className="item-head"><span>PRODUCT</span><span>PACK</span><span>QTY</span><span>UNIT PRICE (Rs.)</span><span>DISCOUNT (Rs.)</span><span>AMOUNT</span><span /></div>
            {data.items.map(item => <div className="item-row" key={item.id}>
              <select value={item.product} onChange={e => updateLine(item.id, "product", e.target.value)}>{PRODUCTS.map(p => <option key={p}>{p}</option>)}</select>
              <select value={item.pack} onChange={e => updateLine(item.id, "pack", e.target.value)}>{PACKS.map(p => <option key={p}>{p}</option>)}</select>
              <input type="number" min="1" value={item.qty} onChange={e => updateLine(item.id, "qty", Math.max(1, Number(e.target.value)))} />
              <input type="number" min="0" step=".01" value={item.rate || ""} placeholder="0.00" onChange={e => updateLine(item.id, "rate", Math.max(0, Number(e.target.value)))} />
              <input type="number" min="0" step=".01" value={item.discount || ""} placeholder="0.00" onChange={e => updateLine(item.id, "discount", Math.max(0, Number(e.target.value)))} />
              <b>{money(Math.max(0, item.qty * item.rate - item.discount))}</b>
              <button className="remove-item" onClick={() => update("items", data.items.filter(x => x.id !== item.id))} aria-label="Remove item"><Trash2 size={15} /></button>
            </div>)}
            <div className="items-foot"><span>{data.items.length} line item(s)</span><b>{data.kind === "proforma" ? "Estimated value" : "Amount charged"} <strong>{money(Math.max(0, subtotal))}</strong></b></div>
          </div>
          <div className="section-card"><h2><span>04</span> Commercial terms & notes</h2><div className="form-grid two">
            <label>Additional terms<textarea rows={2} value={data.terms} onChange={e => update("terms", e.target.value)} placeholder="Delivery schedule, payment terms…" /></label>
            <label>Customer note<textarea rows={2} value={data.notes} onChange={e => update("notes", e.target.value)} placeholder="Optional note printed on the document" /></label>
          </div></div>
          <div className="editor-actions"><button className="secondary-button" onClick={reset}><RotateCcw size={15} /> Reset</button><button className="secondary-button" onClick={saveSession}>Save to session</button><button className="primary-button" onClick={print} disabled={pdfBusy}><ArrowDownToLine size={16} />{pdfBusy ? "Generating PDF…" : "Generate PDF"}</button></div>
        </section>
        <section className="preview-panel"><div className="preview-head"><div><span className="eyebrow">LIVE DOCUMENT</span><h2>Preview</h2></div><span className="a4-pill">A4 · PORTRAIT</span></div><div className="preview-scroll"><InvoicePaper data={data} /></div><div className="preview-foot"><span>Preview updates as you edit</span><button className="primary-button" onClick={print} disabled={pdfBusy}><ArrowDownToLine size={16} />{pdfBusy ? "Generating PDF…" : "Download PDF"}</button></div></section>
      </div>}
      {page === "session" && <section className="section-card session-list"><h2>Invoices in this session</h2>{saved.length === 0 ? <div className="empty-state"><FileText size={32} /><h3>No session invoices yet</h3><p>Use “Save to session” to keep a temporary copy until you log out or close the tab.</p><button className="primary-button" onClick={() => setPage("create")}>Create an invoice</button></div> : saved.map(x => <div className="saved-row" key={x.id}><div><b>{x.number}</b><span>{x.customer} · {x.date}</span></div><strong>{money(x.total)}</strong><button className="secondary-button" onClick={() => { setData(structuredClone(x.data)); setSerialInput(serialFromNumber(x.data.number)); setPage("create"); }}>Open</button></div>)}</section>}
      {page === "settings" && <section className="section-card info-card"><h2>Privacy & security</h2><div className="info-row"><ShieldCheck /><div><b>Server-verified password</b><p>The password is stored only as a Vercel environment variable and is never shipped to the browser.</p></div></div><div className="info-row"><LockKeyhole /><div><b>Signed session cookie</b><p>HTTP-only, Secure, SameSite=Strict cookie. Session expires after 8 hours.</p></div></div><div className="info-row"><FileText /><div><b>No database or cloud invoice storage</b><p>Invoice details stay in memory. Saved session invoices disappear when you log out or close the tab.</p></div></div><div className="info-row"><ReceiptText /><div><b>Non-GST commercial invoices</b><p>Pro Forma and Sales Invoice documents are available. GST is not calculated or collected. Confirm MARUT's registration obligations and invoice wording with its CA.</p></div></div><div className="info-row"><ArrowDownToLine /><div><b>Server-generated PDF</b><p>Playwright renders the invoice on the server as an A4 PDF. Browser timestamps, application titles and print-dialog headers are never included.</p></div></div></section>}
    </main>
  </div>;
}