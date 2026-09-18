import { SITE } from "../layout"

/** llms.txt: what this site is, for agents and LLM crawlers (llmstxt.org) */
export function GET() {
  const body = `# flikk UI

> Open-source React components from flikk (https://flikk.dev), shipped the shadcn way: one command copies the source into your app and you own it from there. The first component is a JSON Schema builder.

Site: ${SITE}
Source: https://github.com/flikk-dev/json-editor
License: MIT
Stack: React 19, Tailwind 4, Base UI (via shadcn), zustand, motion

## JSON Schema builder

Install: \`npx shadcn@latest add ${SITE}/r/json-editor.json\`. It lands in \`components/ui/json/editor\`.

Three ways in:

- Preset: \`const schema = useJsonSchema(json); <JsonSchemaEditor schema={schema} variant="default|compact|wide|mobile" />\`. The handle is ref-like and never re-renders its owner: \`schema.toJSON()\`, \`schema.subscribe(fn)\`, \`schema.reset(json)\`, and \`useJsonSchemaValue(schema)\` to subscribe a component.
- Parts: \`Schema.{Root, List, Column, Skeleton, AddField, Toolbar, SelectionMenu, SelectAll, SelectionCount}\`, \`SchemaField.{Row, Type, Title, Key, Description, Examples, Optional, Repeated, Nullable, ChildrenCount, Extra, Menu, Nested, NestedToggle, NestedList, NestedSummary}\`, \`SchemaAction.{Drag, Select, ChangeType, Optional, Repeated, Nullable, Duplicate, Remove, EditDetails, MoveInto, ClearSelection, Command, Primitive}\`. SchemaField parts show or edit the field; SchemaAction parts run a command. You write the row once and \`SchemaField.NestedList\` reuses it one level down. Every part takes \`className\` and exposes state as \`data-*\`. You swap elements with \`render\` (Base UI style) or compose \`onClick\`. You translate each part in place (children, placeholder).
- Hooks: \`useSchema()\` → \`{ schema, setSchema, fields.{get,add,update,drop,duplicate,move}, selectedFields, setSelectedFields, issues, types, toJSON, toExample }\` (fields addressed by slug path, e.g. "address.street"); \`useField()\` → \`{ field, type, update, drop, duplicate, childrenCount, issue, selected, select }\` inside a row.

Model: JSON Schema draft 2020-12 in and out. Keywords the editor has no UI for stay on the field and come back untouched. A type is one object (\`defineType\`): icon, label, schema(), example(), children, accepts, examples, countLabel, Extra UI. The list is one CSS grid and each row a subgrid, so a declared column (a selection checkbox, say) lines up at every depth.

Interaction: you drag a row to any depth, a group as one piece, or a selection as a batch, with a ghost and a skeleton. You select with a click, a shift-click for a range, or a long press on touch, then act on the selection from the toolbar. The mobile preset adds swipe-to-reveal actions and a tap-to-edit sheet.

## Links

- flikk: https://flikk.dev
- GitHub: https://github.com/flikk-dev/json-editor
`
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  })
}
