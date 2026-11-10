export const money = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(Number.isFinite(n) ? n : 0);
const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
function under1000(n: number): string {
  const out: string[] = [];
  if (n >= 100) { out.push(`${ones[Math.floor(n / 100)]} Hundred`); n %= 100; }
  if (n >= 20) out.push(`${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ""}`);
  else if (n) out.push(ones[n]);
  return out.join(" ");
}
export function amountWords(value: number) {
  let n = Math.round(value * 100) / 100;
  const rupees = Math.floor(n), paise = Math.round((n - rupees) * 100);
  if (!rupees && !paise) return "Zero Rupees Only";
  let rem = rupees; const out: string[] = [];
  for (const [factor, label] of [[10000000, "Crore"], [100000, "Lakh"], [1000, "Thousand"], [1, ""]] as [number,string][]) {
    const part = Math.floor(rem / factor);
    if (part) { out.push(`${under1000(part)}${label ? ` ${label}` : ""}`); rem %= factor; }
  }
  return `${out.join(" ")} Rupees${paise ? ` and ${under1000(paise)} Paise` : ""} Only`;
}
export function financialYear(date: string) {
  const d = date ? new Date(`${date}T00:00:00`) : new Date();
  const start = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  const end = (start + 1) % 100;
  return { compact: `${String(start).slice(-2)}${String(start + 1).slice(-2)}`, hyphenated: `${String(start).slice(-2)}-${String(end).padStart(2,"0")}` };
}
export function documentNumber(kind: "proforma" | "sales", date: string, serial: string) {
  const digits = serial.replace(/\D/g, "").slice(0, 3);
  if (!digits) return "";
  const sequence = digits.padStart(3, "0");
  const fy = financialYear(date);
  return kind === "proforma" ? `MAR/PF/${fy.compact}/${sequence}` : `MAR/INV/${fy.hyphenated}/${sequence}`;
}
export function serialFromNumber(number: string) {
  return number.match(/(\d{1,3})$/)?.[1] ?? "";
}
export function cleanIndianMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  const local = digits.length > 10 && digits.startsWith("91") ? digits.slice(2) : digits;
  return local.slice(0, 10);
}
export function formatIndianMobile(value: string) {
  const digits = cleanIndianMobile(value);
  if (!digits) return "";
  return `+(91) ${digits.length > 5 ? `${digits.slice(0,5)} ${digits.slice(5)}` : digits}`;
}
