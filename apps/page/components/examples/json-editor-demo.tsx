"use client";

import * as React from "react";
import {
  JsonSchemaEditor,
  useJsonSchema,
  useJsonSchemaValue,
} from "@/registry/base-nova/ui/json/editor";
import type { Json } from "@/registry/base-nova/ui/json/core";

const initial: Json = {
  type: "object",
  properties: {
    id: { type: "integer", title: "ID", description: "Unique numeric identifier" },
    fullName: { type: "string", title: "Full name", examples: ["Ada Lovelace"] },
    email: { type: "string", format: "email", title: "Email" },
    active: { type: "boolean", title: "Active" },
    role: {
      type: "string",
      title: "Role",
      oneOf: [
        { const: "admin", title: "Admin" },
        { const: "editor", title: "Editor" },
        { const: "viewer", title: "Viewer" },
      ],
    },
    address: {
      type: "object",
      title: "Address",
      properties: {
        street: { type: "string", title: "Street" },
        city: { type: "string", title: "City" },
      },
      required: ["street"],
    },
    tags: { type: "array", title: "Tags", items: { type: "string" } },
  },
  required: ["id", "fullName", "email"],
};

export function JsonEditorDemo() {
  // a handle, not a value: it never re-renders this component
  const schema = useJsonSchema(initial);
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <JsonSchemaEditor schema={schema} variant="default" />
      <Output schema={schema} />
    </div>
  );
}

/** the only thing here that re-renders as you edit, because it asked to */
function Output({ schema }: { schema: ReturnType<typeof useJsonSchema> }) {
  const value = useJsonSchemaValue(schema);
  return (
    <pre className="max-h-[28rem] overflow-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs text-muted-foreground">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
