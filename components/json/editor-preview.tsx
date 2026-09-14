"use client"

import * as React from "react"
import { cn } from "cn"
import { toProps } from "@/lib/variants"
import { useVariants } from "@/components/variants/provider"
import { FieldList, type FieldListProps } from "./field-list"
import type { FieldNode } from "./field-row"
import type { FieldHeaderProps } from "./field-header"
import type { TypePickerProps } from "./type-picker"

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

const sample: FieldNode[] = [
  mk("id", "integer", "ID", "id", "Unique numeric identifier", ["1042"]),
  mk("name", "string", "Full name", "fullName", "Display name shown in the app", ["Ada Lovelace"]),
  mk("email", "email", "Email", "email", "Primary contact address", ["ada@example.com"]),
  mk("active", "boolean", "Active", "active", "Whether account can sign in", ["true"]),
  mk("role", "enum", "Role", "role", "Permission level", ["admin", "editor", "viewer"], { optional: true }),
  mk("address", "object", "Address", "address", "Postal address, nested fields below", [], {
    optional: true,
    children: [
      mk("street", "string", "Street", "street", "", ["12 Grimmauld Place"]),
      mk("zip", "string", "ZIP", "zip", "Postal code", ["10115"]),
    ],
  }),
  mk("tags", "array", "Tags", "tags", "Free-form labels", [], { optional: true }),
  mk("createdAt", "date", "Created at", "createdAt", "When record was created", ["2026-09-14T10:00:00Z"]),
]

/** Live editor mock; every item reads its variants from config */
export function EditorPreview() {
  const { config, viewport } = useVariants()
  const phone = viewport === "phone"
  const picker = {
    ...(toProps(config.typePicker) as Omit<TypePickerProps, "value" | "onChange">),
    // undefined → media query decides
    mobile: phone ? true : undefined,
  }
  const header = {
    ...(toProps(config.fieldHeader) as Omit<
      FieldHeaderProps,
      "field" | "onChange" | "picker" | "taken"
    >),
    picker,
  }
  const row: FieldListProps["row"] = {
    ...(toProps(config.fieldRow) as Omit<FieldListProps["row"], "header" | "menu">),
    header,
    // settings menu matches type picker menu
    menu: {
      density: picker.density,
      textSize: picker.textSize,
      weight: picker.weight,
    },
  }

  const [fields, setFields] = React.useState<FieldNode[]>(sample)

  const list = (
    <div className={cn("rounded-xl border bg-card", phone ? "p-2" : "p-3")}>
      <FieldList nodes={fields} onChange={setFields} row={row} />
    </div>
  )

  if (!phone) return list

  return (
    <div className="flex justify-center">
      <div className="w-[390px] max-w-full rounded-[2rem] border-8 border-foreground/80 bg-background p-3 shadow-xl">
        <div className="mx-auto mb-3 h-1.5 w-20 rounded-full bg-foreground/20" />
        {list}
      </div>
    </div>
  )
}
