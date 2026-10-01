"use client";

import * as React from "react";
import { RulerIcon } from "lucide-react";
import { JsonSchemaEditor, useJsonSchema } from "@/registry/base-nova/ui/json/editor";
import { defaultTypes, defineType, type Json } from "@/registry/base-nova/ui/json/core";

/**
 * A type is one object, and the editor never branches on its name.
 *
 * Everything a field can do lives here: what it turns into, what an example of
 * it looks like, whether it holds children. Add it to `types` and rows, menus
 * and the type picker pick it up.
 */
const duration = defineType({
  key: "duration",
  icon: RulerIcon,
  label: "Duration",
  description: "An ISO 8601 span, like P3DT2H",
  color: "bg-type-string/10 text-type-string",
  schema: () => ({ type: "string", format: "duration" }),
  example: () => "P3DT2H",
  children: false,
});

const initial: Json = {
  type: "object",
  properties: {
    name: { type: "string", title: "Name" },
    timeout: { type: "string", format: "duration", title: "Timeout" },
  },
};

export function JsonEditorTypesDemo() {
  // the type set belongs to the handle: it is how a schema is read and written,
  // not how it is drawn
  const schema = useJsonSchema(initial, { types: [...defaultTypes, duration] });
  return <JsonSchemaEditor schema={schema} variant="compact" />;
}
