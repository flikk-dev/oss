import { readFileSync } from "node:fs";
import { join } from "node:path";
import { RichInputDemo } from "@/components/examples/rich-input-demo";
import { RichTextareaDemo } from "@/components/examples/rich-textarea-demo";
import { RichPlainDemo } from "@/components/examples/rich-plain-demo";
import { RichTextareaPlainDemo } from "@/components/examples/rich-textarea-plain-demo";
import { RichComposedDemo } from "@/components/examples/rich-composed-demo";
import { RichAsyncDemo } from "@/components/examples/rich-async-demo";
import { JsonEditorDemo } from "@/components/examples/json-editor-demo";
import { JsonEditorVariantsDemo } from "@/components/examples/json-editor-variants-demo";
import { JsonEditorPartsDemo } from "@/components/examples/json-editor-parts-demo";
import { JsonEditorTypesDemo } from "@/components/examples/json-editor-types-demo";

/**
 * Every example, named once.
 *
 * A page names an example and gets both the component and its source, so the
 * preview and the Code tab cannot be different things. Holding a component in
 * one hand and a filename in the other is a mismatch waiting for a paste.
 */
export const DEMOS = {
  "rich-input-demo": RichInputDemo,
  "rich-textarea-demo": RichTextareaDemo,
  "rich-plain-demo": RichPlainDemo,
  "rich-textarea-plain-demo": RichTextareaPlainDemo,
  "rich-composed-demo": RichComposedDemo,
  "rich-async-demo": RichAsyncDemo,
  "json-editor-demo": JsonEditorDemo,
  "json-editor-variants-demo": JsonEditorVariantsDemo,
  "json-editor-parts-demo": JsonEditorPartsDemo,
  "json-editor-types-demo": JsonEditorTypesDemo,
} satisfies Record<string, React.ComponentType>;

export type ExampleKey = keyof typeof DEMOS;

const pascal = (key: string) => key.replace(/(^|-)([a-z])/g, (_, __, c: string) => c.toUpperCase());

/**
 * Read at render, not at import.
 *
 * At module scope this is evaluated once and cached, so in dev the preview
 * refreshes with the file while the Code tab keeps serving whatever the server
 * started with: the two drift, silently, in exactly the place that claims they
 * cannot. These pages are prerendered, so in a build this still runs once.
 */
export function source(key: ExampleKey): string {
  const file = `${key}.tsx`;
  const text = readFileSync(join(process.cwd(), "components/examples", file), "utf8")
    .replaceAll("@/registry/base-nova/ui/", "@/components/ui/")
    .trimEnd();
  // if the file stopped exporting what the preview renders, they have drifted
  const expected = `export function ${pascal(key)}(`;
  if (!text.includes(expected))
    throw new Error(`${file} does not declare ${expected.trim()}, so its preview is not its code`);
  return text;
}
