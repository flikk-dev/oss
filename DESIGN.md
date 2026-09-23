# Schema builder: design note

Target architecture for the JSON Schema builder. Decided 2026-09-16; the current
`components/ui/schema-editor` is the prototype this replaces.

## Layers

```
core      tree model · slugs · validation · toJsonSchema / fromJsonSchema · store handle   (no React)
parts     Schema.* · SchemaField.* · SchemaAction.*  (headless-ish compound components)
presets   <JsonSchemaEditor schema={…} variant="…" />  (the four heads, ready to use)
```

Consumers import a preset. Anyone who needs a different look composes parts.
Anyone who needs a different renderer entirely uses core.

## Data flow: a handle, not value/onChange

```tsx
const schema = useJsonSchema(initialJson)     // stable store handle; never re-renders the owner
<JsonSchemaEditor schema={schema} variant="compact" />

schema.toJSON()                                // pull (e.g. on save)
schema.subscribe((json) => …)                  // push
useJsonSchemaValue(schema)                     // opt-in reactivity (preview panels)
schema.reset(json)                             // external replace
```

The handle is the store (zustand vanilla). Rows subscribe to their own node; the
owner subscribes to nothing unless it asks. Same model as react-hook-form.

The value is real JSON Schema (2020-12). `fromJsonSchema` and `toJsonSchema`
round-trip losslessly for what the types cover; unknown keywords are kept on the
node (`extra`) and written back untouched.

## Type modules

A type is a self-contained module; the editor never branches on `node.type`.

```ts
defineType({
  key: "const", icon: EqualIcon, label: "Fixed value", description: "…",
  schema: (n) => ({ const: n.key }),      // → JSON Schema
  example: (n) => n.key,                  // → example document
  children: false,                        // group or leaf
  accepts: […] | true,                    // what may be dropped inside (groups)
  examples: false,                        // takes examples?
  countLabel: (n) => …,                   // "3 options"
  Extra?: (props) => JSX,                 // type-owned UI (regex pattern, format…)
})
```

The registry passed to `Schema.Root` is the only extension point. A regex type,
a translated registry, a domain-specific field: all are entries, not editor
changes. (Same idea as `FieldModule` in flikk tables.)

## Parts

Three namespaces. Display and mutation are separate; every name carries its object.

| Namespace      | Parts                                                                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Schema`       | `Root`, `List`, `Skeleton`, `Ghost`, `AddField`, `Toolbar`, `SelectAll`, `SelectionCount`                                                                              |
| `SchemaField`  | `Row`, `Type`, `Title`, `Key`, `Description`, `Examples`, `Optional`, `Repeated`, `Nullable`, `ChildrenCount`, `Extra`, `Menu`, `Nested`, `NestedToggle`, `NestedList` |
| `SchemaAction` | `Drag`, `Select`, `ChangeType`, `Optional`, `Repeated`, `Nullable`, `Duplicate`, `Remove`, `EditDetails`, `MoveInto`, `Primitive`                                      |

`SchemaField` = bound to node data: editors (Title, Key…) and displays (badges,
Type icon, ChildrenCount). `SchemaAction` = commands: a click or gesture that
mutates (Drag → move, Select → selection, ChangeType → type, Remove…).
`SchemaField.Optional` _shows_ the state; `SchemaAction.Optional` _changes_ it.
`NestedToggle` stays a field part: `collapsed` is view state, never in the JSON.

Rules:

- Everything is children. Nothing that could be a child is a config prop.
- Every part takes `className`. `variant` lives on `List`; nested lists inherit.
- State is exposed as `data-*` only: `data-dragging`, `data-drop`, `data-state`,
  `data-selected`. You style it; you never wire it.
- No layout wrappers (`Stack`, `Inline`). Plain `div`s; rhythm comes from CSS vars
  the list sets (`--gap`, `--pad`).
- No separator part. `Menu` takes any children; use the menu primitive's own.

## Groups and recursion

A group row is an accordion, shaped like shadcn's: `Nested` (item, owns
open/closed, `data-state`) hosts `NestedToggle` (trigger, the chevron) and
`NestedList` (content). The template branches on `isGroup`:

```tsx
const Head = () => (<div>…<SchemaAction.Drag /><SchemaField.Title />…</div>)

const row = (node) => (
  <SchemaField.Row>
    {node.isGroup ? (
      <SchemaField.Nested>
        <div className="flex"><Head /><SchemaField.NestedToggle /></div>
        <SchemaField.NestedList />          // renders <Schema.List render={row}>, the same row one level down
      </SchemaField.Nested>
    ) : (
      <Head />
    )}
  </SchemaField.Row>
)
<Schema.List variant="default" render={row} />
```

`NestedList` reuses the enclosing list's `render` from context. No depth limit,
nothing repeated. Give it its own `<Schema.List …>` child to change the template
from that level down. Toggle and list throw outside `Nested`.

## Overrides

Base UI conventions, which shadcn already uses.

```tsx
<SchemaAction.Optional />                                    // stock
<SchemaAction.Optional>Facultatif</SchemaAction.Optional>    // own label
<SchemaAction.Optional render={<Switch />} />                // own element; handlers + data-state merged in
<SchemaAction.Optional onClick={(e) => { track() }} />       // composes with the built-in
<SchemaAction.Optional onClick={(e) => { e.preventDefault(); custom() }} />   // replaces it
<SchemaField.ChildrenCount render={(props, { count }) => <Badge {...props}>{count} champs</Badge>} />
```

`render` is an element or `(props, state) => element`. The part never renders its
own DOM around it. No function-as-children anywhere.

## Localisation

Per part, at the use site. No global dictionary.

```tsx
<SchemaField.Title placeholder="Sans titre" />
<SchemaAction.Optional>Facultatif</SchemaAction.Optional>
<Schema.AddField>Ajouter un champ</Schema.AddField>
```

Type labels live on the type modules. Because the template is one function
reused recursively, localising a head means editing that function.

## Drag and drop

One tree-wide model, owned by `Schema.Root`:

- Starts from `SchemaAction.Drag` when present, else from anywhere on the row
  (buttons excluded; an unfocused input drags, a click still focuses it).
- The dragged row collapses in place; a ghost follows the pointer (portal, never
  clipped, always on top).
- Drop slot = first row header, any depth, document order, whose centre is below
  the pointer → insert before it in its list. Pointer inside a group frame with
  nothing below → append to that group. One `Skeleton` marks the slot; siblings
  animate to make room; the dropped row appears instantly.
- Rules come from type modules (`accepts`). No `canDrop`.
- `List orientation="horizontal"` switches the axis (chips of fixed values).
- Mobile: same engine, `y` only with direction lock so horizontal = swipe.

## Selection and bulk actions

```tsx
<Schema.Toolbar>
  {" "}
  // data-state="empty|active"
  <Schema.SelectAll /> <Schema.SelectionCount />
  <SchemaAction.Optional /> <SchemaAction.Remove /> <SchemaAction.MoveInto />
</Schema.Toolbar>
```

`SchemaAction.Select` in a row (shift-click = range); selection lives in the store. The same
`SchemaAction.*` components apply to the field when inside a `Row` and to the
selection when inside a `Toolbar`. Mixed toggles show `aria-checked="mixed"`.
Dragging a selected row moves the selection.

## Presets

`default`, `compact`, `wide`, `mobile`, each a short head on the parts.
`mobile` is auto on a coarse pointer unless overridden.

## Migration

1. Core: extract `store`, `tree`, `slug`, `validate`, compilers; add
   `fromJsonSchema`, the handle (`useJsonSchema`), type modules.
2. Parts: new folder alongside the current component.
3. Presets: port the four variants onto the parts; visual parity.
4. Delete `components/ui/schema-editor`.
