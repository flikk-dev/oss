"use client"

import * as React from "react"
import { AnimatePresence, Reorder } from "motion/react"
import { cn } from "cn"
import { useShallow } from "zustand/react/shallow"
import { Actions } from "./actions"
import { Add } from "./add"
import { Group } from "./group"
import { Badges, Description, Slug, Title } from "./header"
import { ListProvider, useEditorStore, useTheme } from "./root"
import { ROOT } from "./store"
import { flag } from "./theme"
import { TypePicker } from "./type-picker"
import { labelText, listGap } from "./variants"

export type ListProps = {
  /** default root */
  parentId?: string
  depth?: number
  /** "table": one CSS grid, rows are subgrids → columns align */
  mode?: "rows" | "table"
  /** children are oneOf alternatives: "or" between rows */
  alternatives?: boolean
  /** custom row composition */
  renderRow?: (id: string, index: number) => React.ReactNode
  className?: string
}

/** icon · title · key · description · actions */
const TABLE_COLS = "grid-cols-[auto_minmax(6rem,1fr)_auto_minmax(0,2fr)_auto]"

function OrSeam() {
  const t = useTheme()
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex -translate-y-1/2 justify-center">
      <span className={cn("rounded-full border border-border bg-background px-1.5", labelText({ size: t.text.size }))}>
        or
      </span>
    </div>
  )
}

/** One Reorder.Group per sibling set. Groups render their own List. */
export function List({ parentId = ROOT, depth = 0, mode, alternatives = false, renderRow, className }: ListProps) {
  const t = useTheme()
  const ids = useEditorStore(useShallow((s) => s.children[parentId] ?? []))
  const reorder = useEditorStore((s) => s.reorder)
  const bottom = t.add.placement === "bottom" || t.add.placement === "both"
  const showAdd = depth === 0 || flag(t.add.nested)
  const table = (mode ?? "rows") === "table"

  const row = (id: string, i: number) => {
    const seam = alternatives && i > 0 ? <OrSeam /> : undefined
    if (renderRow) return renderRow(id, i)
    if (!table) return <Row key={id} id={id} index={i} seam={seam} />
    return (
      <Row key={id} id={id} index={i} seam={seam} className="col-span-full grid grid-cols-subgrid items-center">
        <Grip />
        <Surface className="col-span-full grid grid-cols-subgrid items-center gap-x-2">
          <TypePicker />
          <div className="flex min-w-0 items-center gap-1.5">
            <Title />
            <Badges />
          </div>
          <Slug />
          <Description multiline={false} />
          <Actions />
          <Group className="col-span-full" />
        </Surface>
      </Row>
    )
  }

  return (
    <ListProvider value={{ parentId, depth }}>
      <div data-slot="list" data-depth={depth} className={cn("flex min-w-0 flex-col", className)}>
        {table && flag(t.group.tableHeader) && (
          <div className="border-b border-border pl-(--gutter)">
            <div className={cn("grid gap-x-2 px-(--sx) py-0.5", TABLE_COLS, labelText({ size: t.text.size }))}>
              <span />
              <span>Field</span>
              <span>Key</span>
              <span>Description</span>
              <span />
            </div>
          </div>
        )}
        <Reorder.Group
          axis="y"
          values={ids}
          onReorder={(next) => reorder(parentId === ROOT ? null : parentId, next)}
          className={cn(listGap({ chrome: t.surface.chrome, gap: t.surface.gap }), table && cn("grid", TABLE_COLS))}
        >
          <AnimatePresence initial={false}>{ids.map(row)}</AnimatePresence>
        </Reorder.Group>

        {bottom && showAdd && (
          <div className={cn("flex", depth ? "pt-0.5" : "pt-1", t.add.style !== "dashed" && "pl-1")}>
            <Add label={alternatives ? "Add alternative" : undefined} />
          </div>
        )}
      </div>
    </ListProvider>
  )
}

// after List so the cycle (row → group → list → row) resolves at call time
import { Grip, Row, Surface } from "./row"
