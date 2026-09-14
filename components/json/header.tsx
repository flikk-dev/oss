"use client"

import * as React from "react"
import { TypePicker, type TypePickerProps } from "./type-picker"
import type { JsonTypeKey } from "./types"

export function JsonHeader({
  name = "fieldName",
  ...pickerProps
}: { name?: string } & Omit<TypePickerProps, "value" | "onChange">) {
  const [type, setType] = React.useState<JsonTypeKey>("string")

  return (
    <div className="flex h-fit items-center gap-1.5">
      <TypePicker value={type} onChange={setType} {...pickerProps} />
      <span className="font-mono text-sm">{name}</span>
    </div>
  )
}
