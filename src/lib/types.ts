export type DocKind = "proforma" | "sales";
export type Product = "Pak Choi Microgreens" | "Pink Radish Microgreens" | "Purple Radish Microgreens" | "Red Radish Microgreens" | "White Radish Microgreens" | "Broccoli Microgreens" | "Fenugreek Microgreens" | "Pea Shoots Microgreens" | "Sunflower Microgreens" | "Mustard Microgreens";
export interface LineItem { id: string; product: Product; pack: "50 g" | "100 g" | "250 g" | "500 g"; qty: number; rate: number; discount: number; }
export interface InvoiceState {
  kind: DocKind; number: string; issueDate: string; validUntil: string; reference: string;
  customer: string; phone: string; email: string; address: string; items: LineItem[];
  terms: string; notes: string;
}
export const PRODUCTS: Product[] = ["Pak Choi Microgreens" , "Pink Radish Microgreens" , "Purple Radish Microgreens" , "Red Radish Microgreens" , "White Radish Microgreens" , "Broccoli Microgreens" , "Fenugreek Microgreens" , "Pea Shoots Microgreens", "Sunflower Microgreens", "Mustard Microgreens"];
export const PACKS: LineItem["pack"][] = ["50 g", "100 g", "250 g", "500 g"];