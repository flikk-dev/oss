"use client"

import * as React from "react"
import { cn } from "cn"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OptionMenu } from "./menu"
import { useEditorStore, useList, useTheme } from "./root"
import { typeSections } from "./type-picker"
import type { JsonTypeKey } from "./types"
import { addExtras, addVariant, labelText } from "./variants"

export type AddProps = {
  /** index in the enclosing list; default = end */
  at?: number
  /** target list; default = enclosing list (root when used outside) */
  parentId?: string
  label?: string
  style?: "ghost" | "dashed" | "icon"
  className?: string
}

/** creates a field in the enclosing list */
export function Add({ at, parentId, label, style, className }: AddProps) {
  const t = useTheme()
  const list = useList()
  const insert = useEditorStore((s) => s.insert)
  const target = parentId ?? list.parentId
  const text = label ?? (list.depth ? "Add nested field" : "Add field")
  const look = style ?? t.add.style
  const onAdd = (type: JsonTypeKey) => insert(target, type, at)

  const button = (
    <Button
      data-slot="add"
      variant={addVariant[look]}
      size={look === "icon" ? (t.actions.size === "md" ? "icon-sm" : "icon-xs") : t.actions.size === "md" ? "sm" : "xs"}
      aria-label={text}
      title={text}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={t.add.behavior === "instant" ? () => onAdd("string") : undefined}
      className={cn(addExtras({ style: look }), labelText({ size: t.text.size }), className)}
    >
      <PlusIcon />
      {look !== "icon" && text}
    </Button>
  )

  if (t.add.behavior === "instant") return button
  return <OptionMenu title="New field type" sections={typeSections(onAdd)} trigger={button} align="start" />
}

/** thin hover zone on the seam above a row; + appears centred */
export function Inserter({ at }: { at: number }) {
  return (
    <div data-slot="inserter" className="group/ins absolute inset-x-0 top-0 z-10 h-3 -translate-y-1/2">
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border opacity-0 transition-opacity group-hover/ins:opacity-100" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/ins:opacity-100 has-[[aria-expanded=true]]:opacity-100">
        <Add at={at} style="icon" label="Insert field here" className="border border-border bg-background shadow-sm" />
      </div>
    </div>
  )
}
