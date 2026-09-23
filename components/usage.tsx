"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";

const tabs = [
  {
    key: "preset",
    label: "Preset",
    blurb: "One line. JSON Schema in, JSON Schema out.",
    code: `import { JsonSchemaEditor, useJsonSchema } from "@/registry/base-nova/ui/json/editor"

function SchemaPage({ initial }) {
  const schema = useJsonSchema(initial)          // a handle; it never re-renders the owner
  return (
    <>
      <JsonSchemaEditor schema={schema} variant="compact" />
      <button onClick={() => save(schema.toJSON())}>Save</button>
    </>
  )
}`,
  },
  {
    key: "parts",
    label: "Parts",
    blurb: "You write the row once. Groups reuse it for their children.",
    code: `import { Schema, SchemaField, SchemaAction } from "@/registry/base-nova/ui/json/editor"

const row = (field) => (
  <SchemaField.Row>
    <SchemaAction.Drag />
    <SchemaAction.ChangeType />
    <SchemaField.Title placeholder="Untitled" />
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
        <SchemaField.NestedList />          {/* the same row, one level down */}
      </SchemaField.Nested>
    )}
  </SchemaField.Row>
)

<Schema.Root store={schema}>
  <Schema.Toolbar>
    <Schema.SelectAll /> <SchemaAction.Remove /> <SchemaAction.MoveInto />
  </Schema.Toolbar>
  <Schema.List variant="default" render={row}>
    <Schema.Column side="left"><SchemaAction.Select /></Schema.Column>
  </Schema.List>
  <Schema.AddField />
</Schema.Root>`,
  },
  {
    key: "hooks",
    label: "Hooks",
    blurb: "Two hooks, your own markup.",
    code: `import { useSchema, useField } from "@/registry/base-nova/ui/json/editor"

function MyRow() {
  const { field, type, update, drop, issue } = useField()
  return (
    <div>
      <type.icon />
      <input value={field.title} onChange={(e) => update({ title: e.target.value })} />
      {issue && <mark>{issue.message}</mark>}
      <button onClick={drop}>Remove</button>
    </div>
  )
}

function Sidebar() {
  const { schema, fields, selectedFields, issues } = useSchema()
  fields.add({ type: "string", title: "Nickname" }, "profile")
  fields.update("profile.email", { optional: true })
  fields.move(selectedFields, "archive")
  return <pre>{JSON.stringify(schema.fields, null, 2)}</pre>
}`,
  },
] as const;

export function Usage() {
  const [key, setKey] = React.useState<(typeof tabs)[number]["key"]>("preset");
  const tab = tabs.find((t) => t.key === key)!;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setKey(t.key)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm",
              t.key === key
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
        <span className="ml-auto hidden text-xs text-muted-foreground sm:block">{tab.blurb}</span>
      </div>
      <CodeBlock code={tab.code} />
    </div>
  );
}
