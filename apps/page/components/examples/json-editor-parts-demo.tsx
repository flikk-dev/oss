"use client";

import {
  Schema,
  SchemaAction,
  SchemaField,
  useJsonSchema,
} from "@/registry/base-nova/ui/json/editor";
import type { Json, SchemaNode } from "@/registry/base-nova/ui/json/core";

const initial: Json = {
  type: "object",
  properties: {
    fullName: { type: "string", title: "Full name" },
    address: {
      type: "object",
      title: "Address",
      properties: {
        street: { type: "string", title: "Street" },
        city: { type: "string", title: "City" },
      },
    },
  },
  required: ["fullName"],
};

/**
 * You write the row once.
 *
 * A group reuses the same row for its children through NestedList, so depth
 * costs nothing: the row has no idea how far down it is.
 */
const row = (node: SchemaNode) => (
  <SchemaField.Row>
    <div className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5">
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
    </div>
    {node.isGroup && (
      <SchemaField.Nested>
        <SchemaField.NestedToggle />
        <SchemaField.NestedList />
      </SchemaField.Nested>
    )}
  </SchemaField.Row>
);

export function JsonEditorPartsDemo() {
  const schema = useJsonSchema(initial);
  return (
    <Schema.Root store={schema}>
      <Schema.Toolbar className="mb-2 flex flex-wrap items-center gap-1">
        <Schema.SelectAll />
        <Schema.SelectionCount className="mr-2 text-xs text-muted-foreground" />
        <SchemaAction.MoveInto />
        <SchemaAction.Duplicate />
        <SchemaAction.Remove />
        <SchemaAction.ClearSelection className="ml-auto" />
      </Schema.Toolbar>
      <Schema.List variant="default" render={row}>
        <Schema.Column side="left" className="mr-1.5">
          <SchemaAction.Select />
        </Schema.Column>
      </Schema.List>
      <Schema.AddField className="mt-2" />
    </Schema.Root>
  );
}
