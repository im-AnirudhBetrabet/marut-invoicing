import { build } from "esbuild";
import { mkdir } from "node:fs/promises";

await mkdir("server/generated", { recursive: true });

await build({
    entryPoints: ["src/components/InvoicePaper.tsx"],
    outfile: "server/generated/invoice-paper.js",
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    jsx: "automatic",
    external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "lucide-react"
    ]
});

console.log("InvoicePaper successfully bundled.");