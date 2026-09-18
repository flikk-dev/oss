# flikk UI: JSON Schema builder

Open-source React components from [flikk](https://flikk.dev), shipped the shadcn way. You run one command, the source lands in your app, and you own it from there.

The first one is a JSON Schema builder. You edit the schema as a tree and get valid JSON Schema back.

Demo: [oss.flikk.dev/ui](https://oss.flikk.dev/ui)

```bash
npx shadcn@latest add https://oss.flikk.dev/ui/r/json-editor.json
```

It lands in `components/ui/json/editor`, styled from the tokens in your `globals.css`, built on [Base UI](https://base-ui.com).

## Why we built it

Flikk needs a schema every time you describe a shape: what a form collects, what an AI step returns, what a table stores. The editors we tried treated the schema as a form with nested forms inside. We wanted a tree: you drag a field anywhere, you select ten and move them together, and the JSON stays valid.

## Three ways in

You choose how much of it you want to own.

### The preset

```tsx
import { JsonSchemaEditor, useJsonSchema } from "@/components/ui/json/editor"

const schema = useJsonSchema(initialJson) // a handle; it never re-renders the owner
<JsonSchemaEditor schema={schema} variant="compact" /> // default, compact, wide, mobile

schema.toJSON()            // read
schema.subscribe(fn)       // listen
schema.reset(json)         // replace
useJsonSchemaValue(schema) // subscribe a component to every change
```

On a touch device the preset picks `mobile` for you.

### The parts

You write the row once. Groups reuse it for their children.

```tsx
import { Schema, SchemaField, SchemaAction } from "@/components/ui/json/editor"

const row = (field) => (
  <SchemaField.Row>
    <SchemaAction.Drag />
    <SchemaAction.ChangeType />
    <SchemaField.Title />
    <SchemaField.Key />
    <SchemaField.Optional />
    <SchemaField.Menu>
      <SchemaAction.Optional />
      <SchemaAction.Duplicate />
      <SchemaAction.Remove />
    </SchemaField.Menu>
    {field.isGroup && (
      <SchemaField.Nested>
        <SchemaField.NestedToggle />
        <SchemaField.NestedList /> {/* the same row, one level down */}
      </SchemaField.Nested>
    )}
  </SchemaField.Row>
)

<Schema.Root store={schema}>
  <Schema.Toolbar>
    <Schema.SelectAll /> <Schema.SelectionCount />
    <SchemaAction.Optional /> <SchemaAction.MoveInto /> <SchemaAction.Remove />
  </Schema.Toolbar>
  <Schema.List variant="default" render={row}>
    <Schema.Column side="left"><SchemaAction.Select /></Schema.Column>
  </Schema.List>
  <Schema.AddField />
</Schema.Root>
```

| Namespace | Parts |
|---|---|
| `Schema` | `Root` `List` `Column` `Skeleton` `AddField` `Toolbar` `SelectionMenu` `SelectAll` `SelectionCount` |
| `SchemaField` | `Row` `Type` `Title` `Key` `Description` `Examples` `Optional` `Repeated` `Nullable` `ChildrenCount` `Extra` `Menu` `Nested` `NestedToggle` `NestedList` `NestedSummary` |
| `SchemaAction` | `Drag` `Select` `ChangeType` `Optional` `Repeated` `Nullable` `Duplicate` `Remove` `EditDetails` `MoveInto` `ClearSelection` `Command` `Primitive` |

`SchemaField` parts show or edit the field. `SchemaAction` parts run a command. Where you place an action decides its shape: an icon button in a row, an item in a menu, a labelled button in a toolbar. Inside a toolbar it runs on the selection.

What every part promises:

- It takes `className`. It exposes state as `data-*` (`data-selected`, `data-dragging`, `data-state`), so you style it in CSS.
- You can swap its element with `render` (Base UI style: your element, with the behaviour merged in) or compose its `onClick`. Calling `preventDefault()` replaces the built-in.
- You translate it in place: `<SchemaAction.Optional>Facultatif</SchemaAction.Optional>`, `<SchemaField.Title placeholder="Sans titre" />`.
- `Schema.Column` cells line up in one column at every depth, because the list is one CSS grid and each row is a subgrid.

### The hooks

Two hooks, your own markup.

```tsx
import { useSchema, useField } from "@/components/ui/json/editor"

const { schema, setSchema, fields, selectedFields, setSelectedFields, issues } = useSchema()
schema.fields                                         // the tree, live
fields.add({ type: "string", title: "Nickname" }, "profile")
fields.update("profile.email", { optional: true })   // fields are addressed by slug path
fields.move(selectedFields, "archive")
fields.drop(["profile.age"])

const { field, type, update, drop, duplicate, childrenCount, issue, selected, select } = useField() // inside a row
```

We wrote the built-in parts on these two hooks, so you can rebuild any of them.

## What it does

- **Real JSON Schema.** Draft 2020-12 in and out. Keywords the editor has no UI for stay on the field and come back untouched.
- **Drag anything anywhere.** One model for the whole tree: you move a row to any depth, a group as one piece, a selection as a batch. A ghost follows your pointer, a skeleton marks the slot, the siblings make room, and the row lands where the skeleton was.
- **Bulk actions.** You select with a click, a shift-click for a range, or a long press on touch. Then you toggle flags, move into a group, duplicate, or remove, all at once.
- **Type modules.** A type is one object: icon, label, `schema()`, `example()`, what it accepts, its own extra UI. You add one and the editor picks it up; nothing in the editor branches on the type name.

```ts
defineType({
  key: "regex", label: "Pattern", icon: RegexIcon,
  schema: (n) => ({ type: "string", pattern: n.extra?.pattern }),
  example: () => "abc",
  children: false,
  Extra: ({ node, set }) => <input value={node.extra?.pattern ?? ""} onChange={…} />,
})
useJsonSchema(json, { types: [...defaultTypes, regex] })
```

- **Mobile.** You press and drag to reorder, swipe left for the actions, tap to edit in a sheet, long-press to select. The toolbar floats within thumb reach.

## Develop

```bash
bun install
bun run dev        # demo on :4721
bun test           # core + DX tests
bun run typecheck
```

```
src/components/ui/json/editor   parts, presets, hooks, contexts
src/components/ui/json/core     tree, JSON Schema in and out, type modules, the handle (no React)
registry.json                   the shadcn registry item; `bun run registry:build` writes demo/public/r
demo                            the landing page (Next.js), which also serves the registry
test                            core and DX tests
```

The registry mirrors the source tree: what you install lands in `components/ui/json/{editor,core}`, the same paths as here.

Design notes live in [DESIGN.md](DESIGN.md).

## License

MIT. Made by [flikk](https://flikk.dev).
