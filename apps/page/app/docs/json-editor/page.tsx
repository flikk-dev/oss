import type { Metadata } from "next";
import { Showcase } from "@/components/showcase";
import { Usage } from "@/components/usage";
import { CodeBlock } from "@/components/code-block";
import { Article, Prose, Section } from "@/components/docs";
import type { Variant } from "@/registry/base-nova/ui/json/editor";
import { CATALOG, installCommand } from "@/lib/catalog";
import { SITE } from "@/app/layout";

const entry = CATALOG.find((e) => e.slug === "json-editor")!;

export const metadata: Metadata = { title: entry.name, description: entry.summary };

const toc = [
  { id: "installation", label: "Installation" },
  { id: "usage", label: "Usage" },
  { id: "api", label: "API reference" },
];

const USAGE = `import { JsonSchemaEditor, useJsonSchema } from "@/components/ui/json/editor"

export function Fields() {
  const schema = useJsonSchema(initialJson)
  return <JsonSchemaEditor schema={schema} variant="default" />
}`;

const API = `useJsonSchema(json, options?)   // a handle that never re-renders its owner
  schema.toJSON()                // read
  schema.subscribe(fn)           // listen
  schema.reset(json)             // replace
useJsonSchemaValue(schema)       // re-render on every change

<JsonSchemaEditor schema variant="default | compact | wide | mobile" />

defineType({
  key, icon, label, description,
  schema:   (node) => object,    // to JSON Schema
  example:  (node) => unknown,   // to an example document
  children: boolean,             // group or leaf
  accepts:  string[] | true,     // what may be dropped inside
  Extra?:   (props) => ReactNode // type owned UI
})`;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  const { variant } = await searchParams;
  return (
    <Article title={entry.name} lede={entry.summary} toc={toc}>
      <Showcase initial={(variant as Variant) ?? "default"} />

      <Section id="installation" title="Installation">
        <CodeBlock code={installCommand(SITE, entry.registry!)} />
        <Prose>
          The source lands in components/ui/json/editor, styled from the tokens in your globals.css
          and built on Base UI.
        </Prose>
      </Section>

      <Section id="usage" title="Usage">
        <CodeBlock code={USAGE} />
        <Prose>
          Draft 2020-12 in and out. Keywords the editor has no UI for stay on the field and come
          back untouched. A type is one object, and nothing inside branches on its name.
        </Prose>
        <Usage />
      </Section>

      <Section id="api" title="API reference">
        <CodeBlock code={API} />
      </Section>
    </Article>
  );
}
