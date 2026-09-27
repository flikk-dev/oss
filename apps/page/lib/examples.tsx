import { readFileSync } from "node:fs";
import { join } from "node:path";
import { RichInputDemo } from "@/components/examples/rich-input-demo";
import { RichTextareaDemo } from "@/components/examples/rich-textarea-demo";
import { RichPlainDemo } from "@/components/examples/rich-plain-demo";
import { RichTextareaPlainDemo } from "@/components/examples/rich-textarea-plain-demo";
import { RichComposedDemo } from "@/components/examples/rich-composed-demo";
import { RichAsyncDemo } from "@/components/examples/rich-async-demo";

/**
 * Every example, bound to its own source.
 *
 * The component and the code are one entry, so a page names an example once and
 * cannot pair the preview with somebody else's file. The alternative, a page
 * holding a component in one hand and a filename in the other, is a mismatch
 * waiting for a copy and paste.
 *
 * The source is read at build (these pages are prerendered) and its registry
 * import is rewritten to where the CLI puts the files, so what you copy is what
 * you would have written in your own app.
 */

const pascal = (key: string) => key.replace(/(^|-)([a-z])/g, (_, __, c: string) => c.toUpperCase());

function read(key: string) {
  const file = `${key}.tsx`;
  const text = readFileSync(join(process.cwd(), "components/examples", file), "utf8")
    .replaceAll("@/registry/base-nova/ui/", "@/components/ui/")
    .trimEnd();
  // the preview renders this name; if the file stopped exporting it, the two
  // have drifted and the page would show one thing while running another
  const expected = `export function ${pascal(key)}(`;
  if (!text.includes(expected))
    throw new Error(`${file} does not declare ${expected.trim()}, so its preview is not its code`);
  return text;
}

const bind = <T extends Record<string, React.ComponentType>>(demos: T) =>
  Object.fromEntries(
    Object.entries(demos).map(([key, Demo]) => [key, { Demo, code: read(key) }]),
  ) as { [K in keyof T]: { Demo: T[K]; code: string } };

export const EXAMPLES = bind({
  "rich-input-demo": RichInputDemo,
  "rich-textarea-demo": RichTextareaDemo,
  "rich-plain-demo": RichPlainDemo,
  "rich-textarea-plain-demo": RichTextareaPlainDemo,
  "rich-composed-demo": RichComposedDemo,
  "rich-async-demo": RichAsyncDemo,
});

export type ExampleKey = keyof typeof EXAMPLES;
