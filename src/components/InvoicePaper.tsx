import type { InvoiceState, DeliveryDay } from "../lib/types";
import { Clock3, Info, PackageCheck, CreditCard, ReceiptText, OctagonAlert, CalendarDays, Sprout } from "lucide-react";
import { amountWords, formatIndianMobile, money } from "../lib/money";
const fmt = (d: string) => d ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${d}T00:00:00`)) : "—";
const DELIVERY_DAYS: DeliveryDay[] = [ "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", ];
export default function InvoicePaper({ data }: { data: InvoiceState }) {
  const subtotal = data.items.reduce((sum, x) => sum + (x.qty * x.rate), 0);
  const total = subtotal;
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
      <div><label>{pro ? "ISSUED BY" : "BILLED BY"}</label><h2>MARUT</h2><p>Annapoorneshwari Nagar<br />Nagarbhavi 2nd Block<br />Bangalore - 560072, Karnataka, India<br />Phone&nbsp;&nbsp; {formatIndianMobile("8296102009")}</p>{data.showGstin && data.gstin && <p><strong>GSTIN&nbsp;&nbsp;</strong>{data.gstin}</p>}</div>
      <div><label>{pro ? "ISSUED TO" : "BILLED TO"}</label><h2>{data.customer || "Customer name"}</h2><p>{(data.address || "Customer billing address").split("\n").map((s, i) => <span key={i}>{s}<br /></span>)}</p>{data.customerGstin && <p><strong>GSTIN&nbsp;&nbsp;</strong>{data.customerGstin}</p>}{data.phone && <p>Phone&nbsp;&nbsp; {formatIndianMobile(data.phone)}</p>}{data.email && <p>Email&nbsp;&nbsp; {data.email}</p>}</div>
    </section>
    <table className="paper-items"><thead><tr><th>#</th><th>ITEM / DESCRIPTION</th><th>QTY</th><th>UNIT PRICE (Rs.)</th><th>AMOUNT (Rs.)</th></tr></thead><tbody>
      {data.items.map((x, i) => <tr key={x.id}><td>{i + 1}</td><td>{x.product} ({x.pack})</td><td>{x.qty} pack</td><td>{x.rate.toFixed(2)}</td><td>{(x.qty * x.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>)}
    </tbody></table>
    <section className="paper-summary">
      <div className="paper-terms"><label>{pro ? "COMMERCIAL TERMS" : "PAYMENT TERMS"}</label>
        {(pro
          ? [{ icon: Clock3, text: "Expected supply: Within 7 days" }, { icon: Info, text: "Prices are indicative and subject to confirmation" },  { icon: CreditCard, text: "Payment: UPI / Bank Transfer / Cash" }]
          : [{ icon: CreditCard, text: "Payment: UPI / Bank Transfer / Cash" }, { icon: ReceiptText, text: "Please quote invoice number with payment" }, { icon: OctagonAlert, text: "Goods once sold will not be taken back. " }]
        ).map(({ icon: Icon, text }, i) => <p className="paper-term-row" key={i}><Icon className="paper-term-icon" size={14} strokeWidth={1.7} aria-hidden="true" /><span>{text}</span></p>)}
        {data.terms && <p className="custom-terms">{data.terms}</p>}
        {pro && (
        <p className="paper-term-row">
          <CalendarDays
            className="paper-term-icon"
            size={14}
            strokeWidth={1.7}
            aria-hidden="true"
          />
          <span>
            <strong>Delivery days:</strong>{" "}
            {data.deliveryDays.length > 0
              ? DELIVERY_DAYS
                  .filter(day => data.deliveryDays.includes(day))
                  .join(", ")
              : "To be confirmed"}
          </span>
        </p>
      )}
      {pro && data.orderConfirmed && (
        <p className="paper-term-row">
          <Sprout className="paper-term-icon" size={14} strokeWidth={1.7} aria-hidden="true" />
          <span>
            <strong>Order Confirmed:</strong> {" "}Your seeds are now soaking and officially entering germination for a fresh, made-to-order harvest.
          </span>
        </p>
      )}
      </div>
      <div className="paper-totals">
        <div className="paper-grand">
          <span>{pro ? "Estimated total (Rs.)" : "Amount charged (Rs.)"}</span>
          <strong>{money(total)}</strong>
        </div>
        <section className="paper-words"><label>AMOUNT IN WORDS</label><p>{amountWords(total)}</p></section>
      </div>
    </section>
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