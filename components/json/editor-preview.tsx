"use client"

import * as React from "react"
import { cn } from "cn"
import { useVariants } from "@/components/variants/provider"
import { Segmented } from "@/components/variants/segmented"
import { SchemaEditor, type FieldNode, type FieldTree } from "@/components/ui/schema-editor"
import { toExample, toJsonSchema } from "@/lib/schema-editor/schema"
import { validate } from "@/lib/schema-editor/validate"

const mk = (
  id: string,
  type: FieldNode["type"],
  title: string,
  slug: string,
  description: string,
  examples: string[] = [],
  extra: Partial<FieldNode> = {}
): FieldNode => ({
  id,
  type,
  title,
  slug,
  slugEdited: false,
  description,
  examples,
  optional: false,
  nullable: false,
  ...extra,
})

const sample: FieldTree = [
  mk("id", "integer", "ID", "id", "Unique numeric identifier", ["1042"]),
  mk("name", "string", "Full name", "fullName", "Display name shown in the app", ["Ada Lovelace"]),
  mk("email", "email", "Email", "email", "Primary contact address", ["ada@example.com"]),
  mk("active", "boolean", "Active", "active", "Whether account can sign in", ["true"]),
  mk("role", "enum", "Role", "role", "Permission level", ["admin", "editor", "viewer"], { optional: true }),
  mk("address", "object", "Address", "address", "Postal address", [], {
    optional: true,
    children: [
      mk("street", "string", "Street", "street", "", ["12 Grimmauld Place"]),
      mk("zip", "string", "ZIP", "zip", "Postal code", ["10115"]),
    ],
  }),
  mk("tags", "string", "Tags", "tags", "Free-form labels", ["vip"], { optional: true, isArray: true }),
  mk("contact", "oneOf", "Contact", "contact", "How to reach them", [], {
    children: [
      mk("phone", "string", "Phone", "phone", "E.164 number", ["+41791234567"]),
      mk("handle", "object", "Social", "social", "Network handle", [], {
        children: [
          mk("network", "enum", "Network", "network", "", ["x", "bluesky"]),
          mk("user", "string", "Username", "username", "", ["ada"]),
        ],
      }),
    ],
  }),
  mk("createdAt", "date", "Created at", "createdAt", "When record was created", ["2026-09-14T10:00:00Z"]),
]

type Shape = "off" | "schema" | "example"

function ShapePanel({ tree, shape }: { tree: FieldTree; shape: Shape }) {
  const json = React.useMemo(
    () => JSON.stringify(shape === "schema" ? toJsonSchema(tree) : toExample(tree), null, 2),
    [tree, shape]
  )
  const { issues } = React.useMemo(() => validate(tree), [tree])
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {issues.length > 0 && (
        <ul className="rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-[11px] text-destructive">
          {issues.map((i) => (
            <li key={i.id + i.code}>{i.message}</li>
          ))}
        </ul>
      )}
      <pre className="max-h-[80vh] overflow-auto rounded-xl border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
        {json}
      </pre>
    </div>
  )
}

/** Live editor; parts read the theme picked in the lab */
export function EditorPreview() {
  const { config, viewport } = useVariants()
  const [tree, setTree] = React.useState<FieldTree>(sample)
  const [shape, setShape] = React.useState<Shape>("off")
  const phone = viewport === "phone"

  const editor = (
    <div className={cn("rounded-xl border bg-card", phone || viewport === "compact" ? "p-2" : "p-3")}>
      <SchemaEditor value={tree} onChange={setTree} theme={config} pointer={phone ? "coarse" : undefined}>
        {phone && (
          <div className="mb-2 flex justify-end">
            <SchemaEditor.ArrangeToggle />
          </div>
        )}
        <SchemaEditor.List />
      </SchemaEditor>
    </div>
  )

  const framed =
    viewport === "compact" ? (
      <div className="flex flex-col items-center gap-2">
        <div className="size-[500px] max-w-full overflow-y-auto rounded-lg border-2 border-dashed border-foreground/30 bg-background p-1">
          {editor}
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">500 × 500 — compact tier via container width</span>
      </div>
    ) : phone ? (
      <div className="flex justify-center">
        <div className="w-[390px] max-w-full rounded-[2rem] border-8 border-foreground/80 bg-background p-3 shadow-xl">
          <div className="mx-auto mb-3 h-1.5 w-20 rounded-full bg-foreground/20" />
          {editor}
        </div>
      </div>
    ) : (
      editor
    )

  return (
    <div className="flex flex-col gap-3">
      <Segmented
        label="Shape preview"
        value={shape}
        onChange={(v) => setShape(v as Shape)}
        options={[
          { value: "off", label: "Editor only" },
          { value: "schema", label: "JSON Schema" },
          { value: "example", label: "Example JSON" },
        ]}
        className="w-fit"
      />
      <div className={cn("grid gap-4", shape !== "off" && "lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]")}>
        {framed}
        {shape !== "off" && <ShapePanel tree={tree} shape={shape} />}
      </div>
    </div>
  )
}
