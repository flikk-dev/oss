"use client"

import * as React from "react"
import { cn } from "cn"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  JsonSchemaEditor,
  useJsonSchema,
  useJsonSchemaValue,
  type Variant,
} from "@/components/ui/json/editor"
import {
  fromJsonSchema,
  toExample,
  validate,
  type Json,
  type JsonSchema,
} from "@/store"

const sample: Json = {
  type: "object",
  properties: {
    id: {
      type: "integer",
      title: "ID",
      description: "Unique numeric identifier",
      examples: ["1042"],
    },
    fullName: {
      type: "string",
      title: "Full name",
      description: "Display name shown in the app",
      examples: ["Ada Lovelace"],
    },
    email: {
      type: "string",
      format: "email",
      title: "Email",
      description: "Primary contact address",
      examples: ["ada@example.com"],
    },
    active: {
      type: "boolean",
      title: "Active",
      description: "Whether account can sign in",
      examples: ["true"],
    },
    role: {
      type: "string",
      title: "Role",
      description: "Permission level",
      oneOf: [
        { const: "admin", title: "Admin", description: "Full access" },
        { const: "editor", title: "Editor", description: "Can change content" },
        { const: "viewer", title: "Viewer", description: "Read only" },
      ],
    },
    address: {
      type: "object",
      title: "Address",
      description: "Postal address",
      properties: {
        street: {
          type: "string",
          title: "Street",
          examples: ["12 Grimmauld Place"],
        },
        zip: {
          type: "string",
          title: "ZIP",
          description: "Postal code",
          examples: ["10115"],
        },
      },
      required: ["street", "zip"],
      additionalProperties: false,
    },
    tags: {
      type: "array",
      title: "Tags",
      items: {
        type: "string",
        title: "Tags",
        description: "Free-form labels",
        examples: ["vip"],
      },
    },
    contact: {
      title: "Contact",
      description: "How to reach them",
      oneOf: [
        {
          type: "string",
          title: "Phone",
          description: "E.164 number",
          examples: ["+41791234567"],
        },
        {
          type: "object",
          title: "Social",
          description: "Network handle",
          properties: {
            network: {
              type: "string",
              title: "Network",
              oneOf: [
                { const: "x", title: "X" },
                { const: "bluesky", title: "Bluesky" },
              ],
            },
            username: { type: "string", title: "Username", examples: ["ada"] },
          },
          required: ["network", "username"],
          additionalProperties: false,
        },
      ],
    },
    createdAt: {
      type: "string",
      format: "date-time",
      title: "Created at",
      description: "When record was created",
      examples: ["2026-09-14T10:00:00Z"],
    },
  },
  required: [
    "id",
    "fullName",
    "email",
    "active",
    "address",
    "contact",
    "createdAt",
  ],
  additionalProperties: false,
}

type Shape = "off" | "schema" | "example"

/** the one reactive consumer: opts in with useJsonSchemaValue */
function ShapePanel({ schema, shape }: { schema: JsonSchema; shape: Shape }) {
  const json = useJsonSchemaValue(schema)
  const text = React.useMemo(
    () =>
      JSON.stringify(
        shape === "schema" ? json : toExample(fromJsonSchema(json)),
        null,
        2
      ),
    [json, shape]
  )
  const { issues } = React.useMemo(() => validate(fromJsonSchema(json)), [json])
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
        {text}
      </pre>
    </div>
  )
}

export function EditorPreview({ variant }: { variant: Variant }) {
  const schema = useJsonSchema(sample)
  const [shape, setShape] = React.useState<Shape>("off")
  const mobile = variant === "mobile"

  const editor = (
    <div className={cn("rounded-xl border bg-card", mobile ? "p-2" : "p-3")}>
      <JsonSchemaEditor schema={schema} variant={variant} />
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          variant="outline"
          size="sm"
          spacing={0}
          aria-label="Shape preview"
          value={[shape]}
          onValueChange={(v) => v[0] && setShape(v[0] as Shape)}
          className="w-fit"
        >
          {(["off", "schema", "example"] as const).map((v) => (
            <ToggleGroupItem
              key={v}
              value={v}
              className="h-6 px-2 text-[11px] font-normal data-pressed:bg-muted"
            >
              {
                {
                  off: "Editor only",
                  schema: "JSON Schema",
                  example: "Example JSON",
                }[v]
              }
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div
        className={cn(
          "grid gap-4",
          shape !== "off" && "lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
        )}
      >
        {mobile ? (
          <div className="flex justify-center">
            <div className="w-[390px] max-w-full rounded-[2rem] border-8 border-foreground/80 bg-background p-3 shadow-xl">
              <div className="mx-auto mb-3 h-1.5 w-20 rounded-full bg-foreground/20" />
              {editor}
            </div>
          </div>
        ) : (
          editor
        )}
        {shape !== "off" && <ShapePanel schema={schema} shape={shape} />}
      </div>
    </div>
  )
}
