"use client";

import * as React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { JsonSchemaEditor, useJsonSchema, type Variant } from "@/registry/base-nova/ui/json/editor";
import type { Json } from "@/registry/base-nova/ui/json/core";

const initial: Json = {
  type: "object",
  properties: {
    fullName: { type: "string", title: "Full name" },
    email: { type: "string", format: "email", title: "Email" },
    address: {
      type: "object",
      title: "Address",
      properties: { street: { type: "string", title: "Street" } },
    },
  },
  required: ["fullName"],
};

const VARIANTS: Variant[] = ["default", "compact", "wide", "mobile"];

export function JsonEditorVariantsDemo() {
  const schema = useJsonSchema(initial);
  const [variant, setVariant] = React.useState<Variant>("compact");
  return (
    <div className="flex flex-col gap-3">
      <ToggleGroup
        variant="outline"
        size="sm"
        spacing={0}
        aria-label="Variant"
        value={[variant]}
        onValueChange={(v) => v[0] && setVariant(v[0] as Variant)}
        className="w-fit"
      >
        {VARIANTS.map((v) => (
          <ToggleGroupItem key={v} value={v} className="h-7 px-3 text-xs font-normal">
            {v}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {/* one schema, four heads: the handle does not care which is on */}
      <JsonSchemaEditor schema={schema} variant={variant} />
    </div>
  );
}
