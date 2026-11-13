// src/components/InvoicePaper.tsx
import { Clock3, Info, PackageCheck, CreditCard, ReceiptText, OctagonAlert } from "lucide-react";

// src/lib/money.ts
var money = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(Number.isFinite(n) ? n : 0);
var ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
var tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
function under1000(n) {
  const out = [];
  if (n >= 100) {
    out.push(`${ones[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) out.push(`${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ""}`);
  else if (n) out.push(ones[n]);
  return out.join(" ");
}
function amountWords(value) {
  let n = Math.round(value * 100) / 100;
  const rupees = Math.floor(n), paise = Math.round((n - rupees) * 100);
  if (!rupees && !paise) return "Zero Rupees Only";
  let rem = rupees;
  const out = [];
  for (const [factor, label] of [[1e7, "Crore"], [1e5, "Lakh"], [1e3, "Thousand"], [1, ""]]) {
    const part = Math.floor(rem / factor);
    if (part) {
      out.push(`${under1000(part)}${label ? ` ${label}` : ""}`);
      rem %= factor;
    }
  }
  return `${out.join(" ")} Rupees${paise ? ` and ${under1000(paise)} Paise` : ""} Only`;
}
function cleanIndianMobile(value) {
  const digits = value.replace(/\D/g, "");
  const local = digits.length > 10 && digits.startsWith("91") ? digits.slice(2) : digits;
  return local.slice(0, 10);
}
function formatIndianMobile(value) {
  const digits = cleanIndianMobile(value);
  if (!digits) return "";
  return `+(91) ${digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits}`;
}

// src/components/InvoicePaper.tsx
import { jsx, jsxs } from "react/jsx-runtime";
var fmt = (d) => d ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(/* @__PURE__ */ new Date(`${d}T00:00:00`)) : "\u2014";
function InvoicePaper({ data }) {
  const subtotal = data.items.reduce((sum, x) => sum + x.qty * x.rate, 0);
  const total = subtotal;
  const pro = data.kind === "proforma";
  const title = pro ? "PRO FORMA INVOICE" : "SALES INVOICE";
  return /* @__PURE__ */ jsxs("article", { className: "invoice-paper", id: "invoice-paper", children: [
    /* @__PURE__ */ jsxs("header", { className: "paper-header", children: [
      /* @__PURE__ */ jsx("img", { src: "/brand/marut-logo-gold.png", alt: "MARUT", className: "paper-logo" }),
      /* @__PURE__ */ jsxs("div", { className: "paper-brandline", children: [
        "FRESH MICROGREENS",
        /* @__PURE__ */ jsx("br", {}),
        "GROWN RESPONSIBLY",
        /* @__PURE__ */ jsx("i", {})
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "paper-title", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { children: title }),
        /* @__PURE__ */ jsx("p", { children: pro ? "Quotation for supply of fresh microgreens" : "Record of amount charged for goods supplied" })
      ] }),
      /* @__PURE__ */ jsxs("dl", { children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { children: pro ? "PF NO." : "INVOICE NO." }),
          /* @__PURE__ */ jsx("dd", { children: data.number || "\u2014" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { children: "ISSUE DATE" }),
          /* @__PURE__ */ jsx("dd", { children: fmt(data.issueDate) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { children: pro ? "VALID UNTIL" : "PAYMENT DUE" }),
          /* @__PURE__ */ jsx("dd", { children: fmt(data.validUntil) })
        ] }),
        data.reference && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { children: "REFERENCE" }),
          /* @__PURE__ */ jsx("dd", { children: data.reference })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "paper-parties", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { children: pro ? "ISSUED BY" : "BILLED BY" }),
        /* @__PURE__ */ jsx("h2", { children: "MARUT" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Annapoorneshwari Nagar",
          /* @__PURE__ */ jsx("br", {}),
          "Nagarbhavi 2nd Block",
          /* @__PURE__ */ jsx("br", {}),
          "Bangalore - 560072, Karnataka, India",
          /* @__PURE__ */ jsx("br", {}),
          "Phone\xA0\xA0 ",
          formatIndianMobile("8296102009")
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { children: pro ? "ISSUED TO" : "BILLED TO" }),
        /* @__PURE__ */ jsx("h2", { children: data.customer || "Customer name" }),
        /* @__PURE__ */ jsx("p", { children: (data.address || "Customer billing address").split("\n").map((s, i) => /* @__PURE__ */ jsxs("span", { children: [
          s,
          /* @__PURE__ */ jsx("br", {})
        ] }, i)) }),
        data.phone && /* @__PURE__ */ jsxs("p", { children: [
          "Phone\xA0\xA0 ",
          formatIndianMobile(data.phone)
        ] }),
        data.email && /* @__PURE__ */ jsxs("p", { children: [
          "Email\xA0\xA0 ",
          data.email
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("table", { className: "paper-items", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { children: "#" }),
        /* @__PURE__ */ jsx("th", { children: "ITEM / DESCRIPTION" }),
        /* @__PURE__ */ jsx("th", { children: "QTY" }),
        /* @__PURE__ */ jsx("th", { children: "UNIT PRICE (Rs.)" }),
        /* @__PURE__ */ jsx("th", { children: "AMOUNT (Rs.)" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: data.items.map((x, i) => /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("td", { children: i + 1 }),
        /* @__PURE__ */ jsxs("td", { children: [
          x.product,
          " (",
          x.pack,
          ")"
        ] }),
        /* @__PURE__ */ jsxs("td", { children: [
          x.qty,
          " pack"
        ] }),
        /* @__PURE__ */ jsx("td", { children: x.rate.toFixed(2) }),
        /* @__PURE__ */ jsx("td", { children: (x.qty * x.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 }) })
      ] }, x.id)) })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "paper-summary", children: [
      /* @__PURE__ */ jsxs("div", { className: "paper-terms", children: [
        /* @__PURE__ */ jsx("label", { children: pro ? "COMMERCIAL TERMS" : "PAYMENT TERMS" }),
        (pro ? [{ icon: Clock3, text: "Expected supply: Within 7 days" }, { icon: Info, text: "Prices are indicative and subject to confirmation" }, { icon: PackageCheck, text: "Subject to availability of produce" }, { icon: CreditCard, text: "Payment: UPI / Bank Transfer / Cash" }] : [{ icon: CreditCard, text: "Payment: UPI / Bank Transfer / Cash" }, { icon: ReceiptText, text: "Please quote invoice number with payment" }, { icon: OctagonAlert, text: "Goods once sold will not be taken back. " }]).map(({ icon: Icon, text }, i) => /* @__PURE__ */ jsxs("p", { className: "paper-term-row", children: [
          /* @__PURE__ */ jsx(Icon, { className: "paper-term-icon", size: 14, strokeWidth: 1.7, "aria-hidden": "true" }),
          /* @__PURE__ */ jsx("span", { children: text })
        ] }, i)),
        data.terms && /* @__PURE__ */ jsx("p", { className: "custom-terms", children: data.terms })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "paper-totals", children: /* @__PURE__ */ jsxs("div", { className: "paper-grand", children: [
        /* @__PURE__ */ jsx("span", { children: pro ? "Estimated total" : "Amount charged" }),
        /* @__PURE__ */ jsx("strong", { children: money(total) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "paper-words", children: [
      /* @__PURE__ */ jsx("label", { children: "AMOUNT IN WORDS" }),
      /* @__PURE__ */ jsx("p", { children: amountWords(total) })
    ] }),
    /* @__PURE__ */ jsxs("footer", { className: "paper-footer", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { children: pro ? "NOTE" : "TERMS & CONDITIONS" }),
        /* @__PURE__ */ jsx("ul", { children: (pro ? ["This is a Pro Forma Invoice (quotation), not proof of payment or completed supply.", "Final sales document will be issued when goods are supplied.", "Prices, availability and supply timelines are subject to confirmation."] : ["This is a commercial invoice recording the amount charged for goods supplied.", "MARUT is currently not registered under GST; no GST has been charged.", "Please notify us within 24 hours of receipt for any concerns."]).map((s, i) => /* @__PURE__ */ jsx("li", { children: s }, i)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "paper-issued", children: [
        /* @__PURE__ */ jsx("b", { children: "Issued electronically by MARUT" }),
        /* @__PURE__ */ jsx("span", { children: "System-generated document \xB7 No physical signature required" })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      "img",
      {
        className: "paper-leaves",
        src: "/brand/microgreens-illustration.png",
        alt: "",
        "aria-hidden": "true"
      }
    ),
    data.notes && /* @__PURE__ */ jsx("div", { className: "paper-extra-note", children: data.notes })
  ] });
}
export {
  InvoicePaper as default
};
