"use client"

import * as React from "react"
import { cn } from "cn"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Variant } from "@/components/ui/json/editor"
import { EditorPreview } from "./editor-preview"

const variants: { key: Variant; label: string }[] = [
  { key: "default", label: "Default" },
  { key: "compact", label: "Compact" },
  { key: "wide", label: "Wide" },
  { key: "mobile", label: "Mobile" },
]

/** the live editor with its variant switch */
export function Showcase({ initial = "default" }: { initial?: Variant }) {
  const [variant, setVariant] = React.useState<Variant>(initial)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ToggleGroup
          variant="outline"
          size="sm"
          spacing={0}
          aria-label="Variant"
          value={[variant]}
          onValueChange={(v) => v[0] && setVariant(v[0] as Variant)}
          className="w-fit"
        >
          {variants.map((v) => (
            <ToggleGroupItem
              key={v.key}
              value={v.key}
              className={cn(
                "h-7 px-3 text-xs font-normal data-pressed:bg-muted"
              )}
            >
              {v.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-xs text-muted-foreground">
          Drag a row anywhere in the tree. Shift-click selects a range. On
          touch, long-press selects.
        </p>
      </div>
      <EditorPreview variant={variant} />
    </div>
  )
}
