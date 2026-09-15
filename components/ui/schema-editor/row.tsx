"use client"

import * as React from "react"
import { animate, motion, Reorder, useDragControls, useMotionValue } from "motion/react"
import { cn } from "cn"
import { GripVerticalIcon } from "lucide-react"
import { useShallow } from "zustand/react/shallow"
import { isGroupType } from "@/lib/schema-editor/tree"
import { Actions, FieldSheet } from "./actions"
import { Inserter } from "./add"
import { Group } from "./group"
import { Header } from "./header"
import {
  DragControlsContext,
  FieldProvider,
  hoverProps,
  useEditorStore,
  useEnv,
  useField,
  useList,
  useTheme,
  useZones,
} from "./root"
import { flag } from "./theme"
import {
  grip as gripCva,
  lineHeight,
  padVars,
  rowShell,
  surface as surfaceCva,
  whileDragStyles,
} from "./variants"

/* ------------------------------- drag mode ------------------------------- */

/** resolved "from" for the current pointer; arrange mode off → no grips at all */
export function useDragFrom() {
  const t = useTheme()
  const { pointer } = useEnv()
  return pointer === "coarse" ? t.drag.coarseFrom : t.drag.from
}

function useGutter() {
  const t = useTheme()
  const from = useDragFrom()
  const arrange = useEditorStore((s) => s.arrange)
  if (from === "longpress") return "none" as const
  if (from === "arrange") return arrange ? ("narrow" as const) : ("none" as const)
  if (from === "handle") return t.drag.gutter === "none" ? ("narrow" as const) : t.drag.gutter
  return t.drag.gutter
}

/* ---------------------------------- grip --------------------------------- */

export function Grip({ className }: { className?: string }) {
  const from = useDragFrom()
  const gutter = useGutter()
  const { depth } = useList()
  const controls = React.useContext(DragControlsContext)
  return (
    <div
      data-slot="grip"
      role="button"
      aria-label="Drag to reorder"
      tabIndex={-1}
      {...hoverProps}
      onPointerDown={(e) => controls?.start(e)}
      className={cn(gripCva({ from, gutter, nested: depth > 0 }), className)}
    >
      <GripVerticalIcon />
    </div>
  )
}

/* -------------------------------- surface -------------------------------- */

const INTERACTIVE = "input, textarea, button, a, [role=button], [contenteditable=true]"

/** the box; whole-row drag must not swallow pointer on inputs / buttons */
export function Surface({
  chrome,
  padding,
  className,
  children,
}: {
  chrome?: "hover" | "card" | "divider"
  padding?: "normal" | "tight" | "none"
  className?: string
  children?: React.ReactNode
}) {
  const t = useTheme()
  const { pointer } = useEnv()
  const { node, depth } = useField()
  const openSheet = useEditorStore((s) => s.openSheet)
  const arrange = useEditorStore((s) => s.arrange)
  const tapSheet = pointer === "coarse" && t.surface.coarseTap === "sheet" && !arrange
  const plain = depth > 0 && t.group.childChrome !== "same" && !isGroupType(node.type)
  return (
    <div
      data-slot="surface"
      className={cn(
        surfaceCva({
          chrome: chrome ?? (plain ? "plain" : t.surface.chrome),
          groupChrome: t.surface.groupChrome,
          padding: padding ?? t.surface.padding,
        }),
        tapSheet && "cursor-pointer",
        className
      )}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest(INTERACTIVE)) e.stopPropagation()
      }}
      onClick={(e) => {
        const el = e.target as HTMLElement
        if (!tapSheet || el.closest(INTERACTIVE) || el.closest("[data-slot=row]")?.hasAttribute("data-dragging")) return
        openSheet(node.id)
      }}
    >
      {children ?? (
        <>
          <Header />
          <Group />
        </>
      )}
      {tapSheet && <FieldSheet />}
    </div>
  )
}

/* ---------------------------------- row ---------------------------------- */

export type RowProps = {
  id: string
  index: number
  className?: string
  /** custom composition; default = Grip + Surface + Actions */
  children?: React.ReactNode
  /** extra absolute content on the top seam (e.g. "or" for oneOf) */
  seam?: React.ReactNode
}

/** innermost group frame under a point, skipping own subtree */
function zoneUnder(
  zones: Map<string, HTMLElement>,
  x: number,
  y: number,
  selfId: string,
  isInside: (id: string) => boolean
) {
  let best: { id: string; area: number } | null = null
  for (const [id, el] of zones) {
    if (id === selfId || isInside(id)) continue
    const r = el.getBoundingClientRect()
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue
    const area = r.width * r.height
    if (!best || area < best.area) best = { id, area }
  }
  return best?.id ?? null
}

export function Row({ id, index, className, children, seam }: RowProps) {
  const t = useTheme()
  const { pointer } = useEnv()
  const list = useList()
  const zones = useZones()
  const controls = useDragControls()
  const from = useDragFrom()
  const gutter = useGutter()
  const node = useEditorStore((s) => s.byId[id])
  const taken = useEditorStore(
    useShallow((s) => (s.children[list.parentId] ?? []).filter((x) => x !== id).map((x) => s.byId[x].slug))
  )
  const takenSet = React.useMemo(() => new Set(taken), [taken])
  const { moveInto, popOut } = useEditorStore(useShallow((s) => ({ moveInto: s.moveInto, popOut: s.popOut })))
  const parentOf = useEditorStore((s) => s.parentOf)
  const isInside = (gid: string) => {
    let p = parentOf[gid]
    while (p) {
      if (p === id) return true
      p = parentOf[p]
    }
    return false
  }

  // paint straight on the DOM — state would re-render the list mid-drag
  const paint = (active: string | null) => {
    for (const [zid, el] of zones.current) el.dataset.over = String(zid === active)
  }
  const onDragEnd = (x: number, y: number) => {
    const target = zoneUnder(zones.current, x, y, id, isInside)
    paint(null)
    if (target) return moveInto(id, target)
    const frame = zones.current.get(list.parentId)?.getBoundingClientRect()
    if (frame && (x < frame.left || x > frame.right || y < frame.top || y > frame.bottom)) popOut(id)
  }

  /* swipe-to-reveal (coarse) */
  const swipe = pointer === "coarse" && t.actions.coarseReveal === "swipe"
  const x = useMotionValue(0)
  const SWIPE_W = t.actions.size === "md" ? 64 : 56

  const between = t.add.placement === "between" || t.add.placement === "both"
  const showAdd = list.depth === 0 || flag(t.add.nested)

  const body = children ?? (
    <>
      <Grip />
      {swipe ? (
        <div className="relative flex min-w-0 flex-1 overflow-hidden rounded-md">
          <Actions />
          <motion.div
            drag="x"
            dragDirectionLock
            dragConstraints={{ left: -SWIPE_W, right: 0 }}
            dragElastic={0.05}
            style={{ x }}
            onDragEnd={(_, info) => {
              const open = info.offset.x < -SWIPE_W / 2 || info.velocity.x < -200
              animate(x, open ? -SWIPE_W : 0, { type: "spring", stiffness: 500, damping: 40 })
            }}
            className="relative z-10 flex min-w-0 flex-1 bg-background"
          >
            <Surface />
          </motion.div>
        </div>
      ) : (
        <>
          <Surface />
          <Actions />
        </>
      )}
    </>
  )

  return (
    <FieldProvider value={{ id, parentId: list.parentId, depth: list.depth, taken: takenSet }}>
      <DragControlsContext.Provider value={controls}>
        <Reorder.Item
          value={id}
          layout="position"
          // drags start from the Header (drag anywhere / long-press) or the Grip, never from children
          dragListener={false}
          dragControls={controls}
          whileDrag={whileDragStyles[t.drag.whileDrag]}
          onDrag={(_, info) => paint(zoneUnder(zones.current, info.point.x, info.point.y, id, isInside))}
          onDragEnd={(_, info) => onDragEnd(info.point.x, info.point.y)}
          exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }}
          data-slot="row"
          data-type={node.type}
          data-group={isGroupType(node.type) ? "" : undefined}
          data-depth={list.depth}
          data-collapsed={node.collapsed || undefined}
          data-array={node.isArray || undefined}
          data-optional={node.optional || undefined}
          className={cn(
            rowShell({ from, gutter, actionSize: t.actions.size, nested: list.depth > 0, placement: t.actions.placement }),
            padVars({ padding: t.surface.padding }),
            lineHeight({ size: t.icon.size }),
            className
          )}
        >
          {between && showAdd && index > 0 && <Inserter at={index} />}
          {seam}
          {body}
        </Reorder.Item>
      </DragControlsContext.Provider>
    </FieldProvider>
  )
}
