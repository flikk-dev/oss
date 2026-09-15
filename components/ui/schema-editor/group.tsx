"use client"

import * as React from "react"
import { cn } from "cn"
import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { isGroupType } from "@/lib/schema-editor/tree"
import { List } from "./list"
import { useEditorStore, useField, useTheme, useZones } from "./root"
import { flag } from "./theme"
import { badge, groupFrame, labelText } from "./variants"

/** chevron at the end of the title line; null for non-groups or when collapsing is off */
export function GroupToggle({ className }: { className?: string }) {
  const t = useTheme()
  const { node, set } = useField()
  if (!isGroupType(node.type) || !flag(t.group.collapsible)) return null
  const open = !node.collapsed
  return (
    <Button
      data-slot="group-toggle"
      variant="ghost"
      size="icon-xs"
      aria-label={open ? "Collapse" : "Expand"}
      aria-expanded={open}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => set({ collapsed: open })}
      className={cn("ml-auto text-muted-foreground", className)}
    >
      <ChevronDownIcon className={cn("transition-transform", !open && "-rotate-90")} />
    </Button>
  )
}

export function GroupCount({ className }: { className?: string }) {
  const t = useTheme()
  const { node } = useField()
  const n = useEditorStore((s) => s.children[node.id]?.length ?? 0)
  if (!isGroupType(node.type)) return null
  const noun = node.type === "oneOf" ? (n === 1 ? "option" : "options") : n === 1 ? "field" : "fields"
  return (
    <span data-slot="group-count" className={cn(badge({ size: t.text.size }), className)}>
      {n} {noun}
    </span>
  )
}

/**
 * Children frame of an object / oneOf row, flush inside the parent box.
 * Registers as a drop zone: rows dragged over it move inside; child rows
 * dragged out of it pop up a level.
 */
export function Group({ frame, className, children }: { frame?: "none" | "tint" | "rule"; className?: string; children?: React.ReactNode }) {
  const t = useTheme()
  const zones = useZones()
  const { node, depth } = useField()
  const count = useEditorStore((s) => s.children[node.id]?.length ?? 0)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el || !isGroupType(node.type)) return
    const map = zones.current
    map.set(node.id, el)
    return () => {
      map.delete(node.id)
    }
  }, [zones, node.id, node.type])

  if (!isGroupType(node.type)) return null
  const collapsed = flag(t.group.collapsible) && node.collapsed
  const alternatives = node.type === "oneOf"

  return (
    <div
      ref={ref}
      data-slot="group"
      data-over="false"
      className={cn(groupFrame({ frame: frame ?? t.group.frame }), className)}
    >
      {collapsed ? (
        <div className={cn("px-2 py-1 opacity-60", labelText({ size: t.text.size }))}>
          {count ? `${count} ${alternatives ? "alternatives" : "fields"} hidden` : "empty — drop fields here"}
        </div>
      ) : (
        (children ?? (
          <List
            parentId={node.id}
            depth={depth + 1}
            mode={t.group.children}
            alternatives={alternatives}
          />
        ))
      )}
    </div>
  )
}
