import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The examples' own source, read at build time.
 *
 * A Code tab holding a snippet someone typed out drifts from the thing running
 * beside it. Reading the files means the two cannot disagree.
 *
 * Read rather than imported: Turbopack's `?raw` returns nothing for a .tsx, and
 * `import.meta.glob` matched none of them. These pages are prerendered, so this
 * runs at build and nothing reaches the server bundle.
 *
 * The registry path is rewritten to where the CLI actually puts things, so what
 * you copy is what you would have written in your own app.
 */
const read = (file: string) =>
  readFileSync(join(process.cwd(), "components/examples", file), "utf8")
    .replaceAll("@/registry/base-nova/ui/", "@/components/ui/")
    .trimEnd();

export const EXAMPLES = {
  "rich-input-demo": read("rich-input-demo.tsx"),
  "rich-textarea-demo": read("rich-textarea-demo.tsx"),
  "rich-plain-demo": read("rich-plain-demo.tsx"),
  "rich-composed-demo": read("rich-composed-demo.tsx"),
} as const;
