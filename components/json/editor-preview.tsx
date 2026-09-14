"use client"

import * as React from "react"
import { cn } from "cn"
import { toProps } from "@/lib/variants"
import { useVariants } from "@/components/variants/provider"
import { TypePicker, type TypePickerProps } from "./type-picker"
import type { JsonTypeKey } from "./types"

type Field = { name: string; type: JsonTypeKey; depth?: number }

const sample: Field[] = [
  { name: "id", type: "integer" },
  { name: "name", type: "string" },
  { name: "email", type: "email" },
  { name: "active", type: "boolean" },
  { name: "role", type: "enum" },
  { name: "address", type: "object" },
  { name: "street", type: "string", depth: 1 },
  { name: "zip", type: "string", depth: 1 },
  { name: "tags", type: "array" },
  { name: "createdAt", type: "date" },
]

function Row({
  field,
  picker,
}: {
  field: Field
  picker: Omit<TypePickerProps, "value" | "onChange">
}) {
  const [type, setType] = React.useState<JsonTypeKey>(field.type)
  return (
    <div
      className="flex items-center gap-2 py-1"
      style={{ paddingLeft: (field.depth ?? 0) * 20 }}
    >
      <TypePicker value={type} onChange={setType} {...picker} />
      <span className="font-mono text-sm">{field.name}</span>
    </div>
  )
}

/** Live editor mock; every item reads its variants from config */
export function EditorPreview() {
  const { config, viewport } = useVariants()
  const phone = viewport === "phone"
  const picker = {
    ...(toProps(config.typePicker) as Omit<TypePickerProps, "value" | "onChange">),
    // undefined → media query decides
    mobile: phone ? true : undefined,
  }

  const rows = (
    <div className={cn("flex flex-col rounded-xl border bg-card", phone ? "p-3" : "p-4")}>
      {sample.map((f) => (
        <Row key={f.name} field={f} picker={picker} />
      ))}
    </div>
  )

  if (!phone) return rows

  return (
    <div className="flex justify-center">
      <div className="w-[390px] max-w-full rounded-[2rem] border-8 border-foreground/80 bg-background p-3 shadow-xl">
        <div className="mx-auto mb-3 h-1.5 w-20 rounded-full bg-foreground/20" />
        {rows}
      </div>
    </div>
  )
}
