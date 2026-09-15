"use client"

import * as React from "react"
import { cn } from "cn"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export type SegmentedOption = { value: string; label: React.ReactNode; hint?: string }

/** single-select pill strip on shadcn ToggleGroup */
export function Segmented({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: string
  onChange: (v: string) => void
  options: readonly SegmentedOption[]
  label?: string
  className?: string
}) {
  return (
    <ToggleGroup
      variant="outline"
      size="sm"
      spacing={0}
      aria-label={label}
      value={[value]}
      onValueChange={(v) => v[0] && onChange(v[0])}
      className={cn("w-full", className)}
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          title={o.hint}
          className="h-6 min-w-0 flex-1 truncate px-2 text-[11px] font-normal data-pressed:bg-muted"
        >
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
