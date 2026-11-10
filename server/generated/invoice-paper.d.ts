import type { ComponentType } from "react";
import type { InvoiceState } from "../../src/lib/types";

declare const InvoicePaper: ComponentType<{
    data: InvoiceState;
}>;

export default InvoicePaper;