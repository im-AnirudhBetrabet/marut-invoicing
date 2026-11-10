import type { InvoiceState } from "../lib/types";
import { Clock3, BadgePercent, PackageCheck, CreditCard, ReceiptText, OctagonAlert } from "lucide-react";
import { amountWords, formatIndianMobile, money } from "../lib/money";
const fmt = (d: string) => d ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${d}T00:00:00`)) : "—";
export default function InvoicePaper({ data }: { data: InvoiceState }) {
  const subtotal = data.items.reduce((sum, x) => sum + (x.qty * x.rate), 0);
  const totalDiscount = data.items.reduce(
    (sum, x) => sum + Math.min(x.discount, x.qty * x.rate),
    0
  );
  const total = Math.max(0, subtotal - totalDiscount);
  const pro = data.kind === "proforma";
  const title = pro ? "PRO FORMA INVOICE" : "SALES INVOICE";
  return <article className="invoice-paper" id="invoice-paper">
    <header className="paper-header">
      <img src="/brand/marut-logo-gold.png" alt="MARUT" className="paper-logo" />
      <div className="paper-brandline">FRESH MICROGREENS<br />GROWN RESPONSIBLY<i /></div>
    </header>
    <section className="paper-title">
      <div><h1>{title}</h1><p>{pro ? "Quotation for supply of fresh microgreens" : "Record of amount charged for goods supplied"}</p></div>
      <dl><div><dt>{pro ? "PF NO." : "INVOICE NO."}</dt><dd>{data.number || "—"}</dd></div><div><dt>ISSUE DATE</dt><dd>{fmt(data.issueDate)}</dd></div><div><dt>{pro ? "VALID UNTIL" : "PAYMENT DUE"}</dt><dd>{fmt(data.validUntil)}</dd></div>{data.reference && <div><dt>REFERENCE</dt><dd>{data.reference}</dd></div>}</dl>
    </section>
    <section className="paper-parties">
      <div><label>{pro ? "ISSUED BY" : "BILLED BY"}</label><h2>MARUT</h2><p>Annapoorneshwari Nagar<br />Nagarbhavi 2nd Block<br />Bangalore - 560072, Karnataka, India<br />Phone&nbsp;&nbsp; {formatIndianMobile("8296102009")}</p></div>
      <div><label>{pro ? "ISSUED TO" : "BILLED TO"}</label><h2>{data.customer || "Customer name"}</h2><p>{(data.address || "Customer billing address").split("\n").map((s, i) => <span key={i}>{s}<br /></span>)}</p>{data.phone && <p>Phone&nbsp;&nbsp; {formatIndianMobile(data.phone)}</p>}{data.email && <p>Email&nbsp;&nbsp; {data.email}</p>}</div>
    </section>
    <table className="paper-items"><thead><tr><th>#</th><th>ITEM / DESCRIPTION</th><th>QTY</th><th>UNIT PRICE (₹)</th><th>DISCOUNT (₹)</th><th>AMOUNT (₹)</th></tr></thead><tbody>
      {data.items.map((x, i) => <tr key={x.id}><td>{i + 1}</td><td>{x.product} ({x.pack})</td><td>{x.qty} pack</td><td>{x.rate.toFixed(2)}</td><td>{Math.min(x.discount, x.qty * x.rate) ? Math.min(x.discount, x.qty * x.rate).toFixed(2) : "—"}</td><td>{Math.max(0, x.qty * x.rate - Math.min(x.discount, x.qty * x.rate)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>)}
    </tbody></table>
    <section className="paper-summary">
      <div className="paper-terms"><label>{pro ? "COMMERCIAL TERMS" : "PAYMENT TERMS"}</label>
        {(pro
          ? [{ icon: Clock3, text: "Expected supply: Within 7 days" }, { icon: BadgePercent, text: "Prices are indicative and subject to confirmation" }, { icon: PackageCheck, text: "Subject to availability of produce" }, { icon: CreditCard, text: "Payment: UPI / Bank Transfer / Cash" }]
          : [{ icon: CreditCard, text: "Payment: UPI / Bank Transfer / Cash" }, { icon: ReceiptText, text: "Please quote invoice number with payment" }, { icon: OctagonAlert, text: "Goods once sold will not be taken back. " }]
        ).map(({ icon: Icon, text }, i) => <p className="paper-term-row" key={i}><Icon className="paper-term-icon" size={14} strokeWidth={1.7} aria-hidden="true" /><span>{text}</span></p>)}
        {data.terms && <p className="custom-terms">{data.terms}</p>}
      </div>
      <div className="paper-totals">
        <div>
          <span>{pro ? "Estimated value before discount" : "Amount before discount"}</span>
          <b>{money(subtotal)}</b>
        </div>
        <div className="paper-discount">
          <span>Total discount</span>
          <b>− {money(totalDiscount)}</b>
        </div>
        <div className="paper-grand">
          <span>{pro ? "Estimated total" : "Amount charged"}</span>
          <strong>{money(total)}</strong>
        </div>
      </div>
    </section>
    <section className="paper-words"><label>AMOUNT IN WORDS</label><p>{amountWords(total)}</p></section>
    <footer className="paper-footer">
      <div><label>{pro ? "NOTE" : "TERMS & CONDITIONS"}</label><ul>{(pro ? ["This is a Pro Forma Invoice (quotation), not proof of payment or completed supply.", "Final sales document will be issued when goods are supplied.", "Prices, availability and supply timelines are subject to confirmation."] : ["This is a commercial invoice recording the amount charged for goods supplied.", "MARUT is currently not registered under GST; no GST has been charged.", "Please notify us within 24 hours of receipt for any concerns."]).map((s, i) => <li key={i}>{s}</li>)}</ul></div>
      <div className="paper-issued"><b>Issued electronically by MARUT</b><span>System-generated document · No physical signature required</span></div>
    </footer>
    <img
      className="paper-leaves"
      src="/brand/microgreens-illustration.png"
      alt=""
      aria-hidden="true"
    />
    {data.notes && <div className="paper-extra-note">{data.notes}</div>}
  </article>;
}