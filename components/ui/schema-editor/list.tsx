"use client"

import * as React from "react"
import { AnimatePresence, Reorder } from "motion/react"
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
  const text = depth ? "Add nested field" : "Add field"
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

/** One Reorder.Group per sibling set. Groups render their own List. */
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
  const ids = useEditorStore(useShallow((s) => s.children[parentId] ?? []))
  const reorder = useEditorStore((s) => s.reorder)

  return (
    <ListProvider value={{ parentId, depth }}>
      <div
        data-slot="list"
        data-depth={depth}
        className={cn("flex min-w-0 flex-col", className)}
      >
        <Reorder.Group
          as="div"
          axis="y"
          values={ids}
          onReorder={(next) => reorder(parentId, next)}
          className={cn(
            "flex flex-col",
            {
              compact: "gap-0.5",
              default: "gap-1.5",
              wide: "gap-3",
              mobile: "gap-1",
            }[variant]
          )}
        >
          <AnimatePresence initial={false}>
            {ids.map((id, i) => (
              <Row key={id} id={id}>
                {alternatives && i > 0 && (
                  <span className="pointer-events-none absolute inset-x-0 top-0 z-10 flex -translate-y-1/2 justify-center">
                    <span className="rounded-full border border-border bg-background px-1.5 text-2xs text-muted-foreground">
                      or
                    </span>
                  </span>
                )}
                <Header />
                <Group />
              </Row>
            ))}
          </AnimatePresence>
        </Reorder.Group>
        <div className={cn("flex", depth ? "justify-end px-2 py-1" : "pt-1")}>
          <Add />
        </div>
      </div>
    </ListProvider>
  )
}

// after List so the cycle (row → group → list → row) resolves at call time
import { Group, Header, Row } from "./row"
