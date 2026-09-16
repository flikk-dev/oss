"use client"

import * as React from "react"
import { cn } from "cn"
import { PlusIcon } from "lucide-react"
import { useShallow } from "zustand/react/shallow"
import { Button } from "@/components/ui/button"
import { OptionMenu, typeSections } from "./menu"
import { ListProvider, useEditorStore, useList, useVariant } from "./root"
import { ROOT } from "./store"

/** creates a field at the end of the enclosing list */
export function Add({ className }: { className?: string }) {
  const { parentId, depth } = useList()
  const insert = useEditorStore((s) => s.insert)
  const inChoice = useEditorStore((s) => s.byId[parentId]?.type === "oneOf")
  const text = inChoice
    ? "Add option"
    : depth
      ? "Add nested field"
      : "Add field"
  return (
    <OptionMenu
      title="New field type"
      sections={typeSections((type) => insert(parentId, type))}
      trigger={
        <Button
          data-slot="add"
          variant="ghost"
          size="xs"
          className={cn(
            "text-muted-foreground hover:text-foreground",
            className
          )}
        >
          <PlusIcon /> {text}
        </Button>
      }
    />
  )
}

/** One sibling set. Groups render their own List. */
export function List({
  parentId = ROOT,
  depth = 0,
  alternatives = false,
  className,
}: {
  parentId?: string
  depth?: number
  /** children are oneOf alternatives: "or" between rows */
  alternatives?: boolean
  className?: string
}) {
  const variant = useVariant()
  const { ghost } = useList()
  const ids = useEditorStore(useShallow((s) => s.children[parentId] ?? []))
  // live drag: the slot the dragged row would take in this list
  const drop = useEditorStore((s) =>
    !ghost && s.drop?.parentId === parentId ? s.drop : null
  )
  const visible = drop ? ids.filter((x) => x !== drop.id) : ids
  const skeleton = drop && (
    <div
      key="__drop"
      aria-hidden
      style={{ height: drop.height }}
      className="rounded-md border-2 border-dashed border-primary/40 bg-primary/5"
    />
  )

  return (
    <ListProvider value={{ parentId, depth, ghost }}>
      <div
        data-slot="list"
        data-depth={depth}
        className={cn("flex min-w-0 flex-col", className)}
      >
        <div
          className={cn(
            "flex flex-col",
            {
              compact: "gap-0.5 [--row-gap:0.125rem]",
              default: "gap-1.5 [--row-gap:0.375rem]",
              wide: "gap-3 [--row-gap:0.75rem]",
              mobile: "gap-1 [--row-gap:0.25rem]",
            }[variant]
          )}
        >
          {ids.map((id, i) => (
            <React.Fragment key={id}>
              {drop && visible[drop.index] === id && skeleton}
              <Row id={id}>
                {alternatives && i > 0 && (
                  <span className="pointer-events-none absolute inset-x-0 top-0 z-10 flex -translate-y-1/2 justify-center">
                    <span className="rounded-full border border-border bg-background px-1.5 text-2xs text-muted-foreground">
                      or
                    </span>
                  </span>
                )}
              </Row>
            </React.Fragment>
          ))}
          {drop && drop.index >= visible.length && skeleton}
        </div>
        {!ghost && (
          <div className={cn("flex", depth ? "justify-end pt-1" : "pt-1")}>
            <Add />
          </div>
        )}
      </div>
    </ListProvider>
  )
}

// after List so the cycle (row → group → list → row) resolves at call time
import { Row } from "./row"
