import type { Metadata } from "next";
import { ComponentPage, type ComponentDoc } from "@/components/component-page";
import { Prose } from "@/components/docs";
import { CATALOG, installCommand } from "@/lib/catalog";
import { SITE } from "@/app/layout";

const entry = CATALOG.find((e) => e.slug === "json-editor")!;

export const metadata: Metadata = { title: entry.name, description: entry.summary };

const doc: ComponentDoc = {
  name: entry.name,
  lede: entry.summary,
  example: "json-editor-demo",

  install: {
    cli: installCommand(SITE, entry.registry!).replace("npx ", ""),
    manual: `git clone https://github.com/flikk-dev/oss
cp -r oss/registry/base-nova/ui/json components/ui/json`,
  },

  usage: {
    imports: `import { JsonSchemaEditor, useJsonSchema } from "@/components/ui/json/editor"`,
    code: `export function Fields({ initial }) {
  // a handle, not a value: it never re-renders this component
  const schema = useJsonSchema(initial)

  return (
    <>
      <JsonSchemaEditor schema={schema} variant="default" />
      <button onClick={() => save(schema.toJSON())}>Save</button>
    </>
  )
}`,
  },

  composition: {
    tree: `Schema.Root
├── Schema.Toolbar              shown while a selection is active
│   ├── Schema.SelectAll
│   ├── Schema.SelectionCount
│   └── SchemaAction.*          runs against the selection
├── Schema.List
│   ├── Schema.Column           a gutter every row lines up in
│   ├── Schema.Skeleton         the slot a dragged row will land in
│   └── SchemaField.Row         your row, drawn once
│       ├── SchemaAction.Drag
│       ├── SchemaAction.ChangeType
│       ├── SchemaField.Title
│       ├── SchemaField.Key
│       ├── SchemaField.Optional | Repeated | Nullable
│       ├── SchemaField.Menu
│       │   └── SchemaAction.*  runs against this field
│       └── SchemaField.Nested          groups only
│           ├── SchemaField.NestedToggle
│           ├── SchemaField.NestedSummary
│           └── SchemaField.NestedList  the same row, one level down
└── Schema.AddField`,
    notes: (
      <>
        <Prose>
          The row is written once. A group hands it to its own children through NestedList, so depth
          costs nothing and a row never learns how far down it is.
        </Prose>
        <Prose>
          The whole tree is one CSS grid and every list a subgrid, which is what lets a declared
          Column line up at every depth: a checkbox on a field nested three deep sits in the same
          gutter as one at the top.
        </Prose>
      </>
    ),
  },

  examples: [
    {
      id: "variants",
      title: "Variants",
      about:
        "Four heads over one core. The handle does not know which is on, so switching costs nothing and a touch device gets the mobile one on its own.",
      example: "json-editor-variants-demo",
    },
    {
      id: "parts",
      title: "Parts",
      about:
        "When the preset is not the shape you want, compose it. This is the preset's own row, written out: the same parts, arranged differently.",
      example: "json-editor-parts-demo",
    },
    {
      id: "types",
      title: "Your own types",
      about:
        "A type is one object. Add it to the handle and rows, menus and the type picker pick it up, because nothing inside branches on the type name.",
      example: "json-editor-types-demo",
    },
  ],

  api: [
    {
      code: `useJsonSchema(json, { types?, slugCase? })   // a stable handle
  schema.toJSON()        // read, on save
  schema.toExample()     // an example document
  schema.subscribe(fn)   // listen
  schema.reset(json)     // replace
  schema.selected()      // ids
useJsonSchemaValue(schema)   // opt in to re-rendering on every change`,
      notes: (
        <Prose>
          A handle, not value and onChange. Rows subscribe to their own node and the owner
          subscribes to nothing, so typing in one field does not re-render the page around it. Ask
          for the value when you need it, or opt in with useJsonSchemaValue.
        </Prose>
      ),
    },
    {
      code: `<JsonSchemaEditor schema variant="default | compact | wide | mobile" portalContainer />

useSchema()   // { schema, setSchema, fields, selectedFields, issues, types, toJSON, toExample }
useField()    // { field, type, update, drop, duplicate, childrenCount, issue, selected, select }`,
      notes: (
        <Prose>
          The built-in parts are written on these two hooks and nothing else, so a row of your own
          has everything the shipped one had.
        </Prose>
      ),
    },
    {
      code: `defineType({
  key, icon, label, description, color,
  schema:   (node) => object,     // to JSON Schema
  example:  (node) => unknown,    // to an example document
  children: boolean,              // group or leaf
  accepts?: string[] | true,      // what may be dropped inside
  examples?: boolean,
  countLabel?: (node) => string,
  Extra?:   (props) => ReactNode, // UI the type owns
})`,
      notes: (
        <Prose>
          Draft 2020-12 in and out. Keywords the editor has no UI for stay on the field and come
          back untouched, so a schema does not lose anything by being opened here.
        </Prose>
      ),
    },
  ],
};

export default function Page() {
  return <ComponentPage doc={doc} />;
}
