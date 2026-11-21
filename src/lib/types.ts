export type DocKind                    = "proforma" | "sales";
export type Product                    = "Pak Choi Microgreens" | "Pink Radish Microgreens" | "Purple Radish Microgreens" | "Red Radish Microgreens" | "White Radish Microgreens" | "Broccoli Microgreens" | "Fenugreek Microgreens" | "Pea Shoots Microgreens" | "Sunflower Microgreens" | "Mustard Microgreens" | "Mixed Microgreens" | "Green Moong dal Sprouts" | "Black Channa Sprouts" | "Horsegram Sprouts" | "Black Eyed Pea Sprouts" | "Green Pea Sprouts" | "Fenugreek Sprouts" | "Mixed Sprouts";
export const PRODUCTS: Product[]       = ["Pak Choi Microgreens" , "Pink Radish Microgreens" , "Purple Radish Microgreens" , "Red Radish Microgreens" , "White Radish Microgreens" , "Broccoli Microgreens" , "Fenugreek Microgreens" , "Pea Shoots Microgreens", "Sunflower Microgreens", "Mustard Microgreens", "Mixed Microgreens", "Green Moong dal Sprouts", "Black Channa Sprouts", "Horsegram Sprouts", "Black Eyed Pea Sprouts", "Green Pea Sprouts", "Fenugreek Sprouts", "Mixed Sprouts"];
export const PACKS: LineItem["pack"][] = ["50 g", "100 g", "250 g", "500 g"];
export type DeliveryDay                = | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
export interface LineItem { 
  id     : string; 
  product: Product; 
  pack   : "50 g" | "100 g" | "250 g" | "500 g"; 
  qty    : number; 
  rate   : number; 
}
export interface InvoiceState {
  kind          : DocKind; 
  number        : string; 
  issueDate     : string; 
  validUntil    : string; 
  reference     : string;
  customer      : string; 
  phone         : string; 
  email         : string; 
  address       : string; 
  items         : LineItem[];
  deliveryDays  : DeliveryDay[];
  terms         : string;
  notes         : string;
  orderConfirmed: boolean;
}