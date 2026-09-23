"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { motion, useDragControls } from "motion/react"
import { useShallow } from "zustand/react/shallow"
import { useRender } from "@base-ui/react/use-render"
import { ChevronDownIcon, EllipsisIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { uniqueSlug } from "@/registry/base-nova/ui/json/core/slug"
import type { DetailField } from "@/registry/base-nova/ui/json/core/editor"
import {
  ActionScopeContext,
  FieldContext,
  ListContext,
  RowIdContext,
  useEditor,
  useEditorStore,
  useFieldContext,
  useList,
  useTypeModule,
  useVariant,
  type Variant,
} from "@/registry/base-nova/ui/json/editor/context"
import { Editable, type EditableProps, type RenderProp } from "./editable"
import { useField } from "./hooks"
import { EditorSheet, IconTile, Menu, TypeMenu } from "./menu"

type Size = Record<Variant, string>
const text: Size = {
  compact: "text-sm",
  default: "text-sm",
  wide: "text-base",
  mobile: "text-sm",
}
const small: Size = {
  compact: "text-xs",
  default: "text-xs",
  wide: "text-sm",
  mobile: "text-xs",
}
const tiny: Size = {
  compact: "text-2xs",
  default: "text-2xs",
  wide: "text-xs",
  mobile: "text-2xs",
}
const tile: Record<Variant, "xs" | "sm" | "md" | "lg"> = {
  compact: "sm",
  default: "md",
  wide: "lg",
  mobile: "md",
}

type Part = { className?: string }
/** `render` swaps the element for yours (Base UI style); behaviour is merged in, our styling is not */
type Rendered = Part & { render?: RenderProp }
type Field = Rendered &
  Pick<EditableProps, "placeholder" | "readOnly" | "variant">
/** flag / count badges */
type BadgeVariant = "muted" | "outline" | "secondary"
const badgeLook: Record<BadgeVariant, string> = {
  muted: "bg-muted text-muted-foreground",
  outline: "border border-border text-muted-foreground",
  secondary: "bg-secondary text-secondary-foreground",
}

/* --------------------------------- text ---------------------------------- */

export function Title({
  className,
  placeholder = "Untitled",
  readOnly,
  render,
  variant,
}: Field) {
  const { field: node, update: set } = useField()
  const v = useVariant()
  return (
    <Editable
      data-slot="title"
      aria-label="Title"
      readOnly={readOnly}
      render={render}
      variant={variant}
      value={node.title}
      onChange={(title) => set({ title })}
      placeholder={placeholder}
      className={
        render ? className : cn("truncate text-foreground", text[v], className)
      }
    />
  )
}

export function Key({
  className,
  placeholder = "key",
  readOnly,
  render,
  variant,
}: Field) {
  const { field: node, update: set } = useField()
  const id = node.id
  const v = useVariant()
  const { store } = useEditor()
  const conflict = useEditorStore((s) => {
    const siblings = s.children[s.parentOf[id]] ?? []
    return (
      node.key.length > 0 &&
      siblings.some((x) => x !== id && s.byId[x].key === node.key)
    )
  })
  const conflictTitle = conflict
    ? `"${node.key}" already used by a sibling`
    : undefined
  const input = (
    <Editable
      aria-label="Key"
      readOnly={readOnly}
      render={render}
      variant={variant}
      value={node.key}
      onChange={(key) => set({ key })}
      onCommit={(key) => {
        // conflicts are marked live; on commit, resolve by suffix
        const s = store.getState()
        const taken = new Set(
          (s.children[s.parentOf[id]] ?? [])
            .filter((x) => x !== id)
            .map((x) => s.byId[x].key)
        )
        if (taken.has(key)) set({ key: uniqueSlug(key, taken, s.slugCase) })
      }}
      placeholder={placeholder}
      {...(render || variant === "input"
        ? {
            "data-slot": "key",
            className: cn(
              variant === "input" && "font-mono",
              conflict && "text-destructive",
              className
            ),
            title: conflictTitle,
            "aria-invalid": conflict || undefined,
          }
        : {})}
    />
  )
  // your element and the input variant stand alone; inline gets the "@" prefix
  if (render || variant === "input") return input
  return (
    <span
      data-slot="key"
      className={cn(
        "flex min-w-0 shrink-0 items-baseline font-mono text-muted-foreground",
        tiny[v],
        conflict && "text-destructive [&_input]:text-destructive",
        className
      )}
      title={conflictTitle}
      aria-invalid={conflict || undefined}
    >
      <span data-slot="key-prefix" className="select-none">
        @
      </span>
      {input}
    </span>
  )
}

export function Description({
  className,
  placeholder = "Add description",
  readOnly,
  multiline,
  render,
  variant,
}: Field & { multiline?: boolean }) {
  const { field: node, update: set } = useField()
  const v = useVariant()
  return (
    <Editable
      data-slot="description"
      aria-label="Description"
      readOnly={readOnly}
      multiline={multiline}
      render={render}
      variant={variant}
      value={node.description}
      onChange={(description) => set({ description })}
      placeholder={placeholder}
      className={
        render
          ? className
          : cn("min-w-0 self-start text-muted-foreground", small[v], className)
      }
    />
  )
}

/** comma-separated; parsed on commit so typing "a, " is not trimmed live */
export function Examples({
  className,
  placeholder = "Add examples",
  readOnly,
  render,
  variant,
}: Field) {
  const { field: node, update: set } = useField()
  const v = useVariant()
  const mod = useTypeModule(node.type)
  const joined = node.examples.join(", ")
  const [draft, setDraft] = React.useState(joined)
  React.useEffect(() => setDraft(joined), [joined])
  if (!mod.examples) return null
  return (
    <Editable
      data-slot="examples"
      aria-label="Examples"
      readOnly={readOnly}
      render={render}
      variant={variant}
      value={draft}
      onChange={setDraft}
      onCommit={(s) =>
        set({
          examples: s
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
        })
      }
      placeholder={placeholder}
      className={
        render
          ? className
          : cn(
              "min-w-0 self-start text-muted-foreground/70",
              small[v],
              className
            )
      }
    />
  )
}

/** labelled inputs for the details dialog / sheet */
export function DetailFields({
  fields = ["title", "key", "description", "examples"],
}: {
  fields?: DetailField[]
}) {
  const label = "flex flex-col gap-1 text-2xs text-muted-foreground"
  const parts = {
    title: ["Title", <Title key="t" variant="input" />],
    key: ["Key", <Key key="k" variant="input" />],
    description: [
      "Description",
      <Description key="d" multiline variant="input" />,
    ],
    examples: ["Examples", <Examples key="e" variant="input" />],
  } as const
  return (
    <div className="flex flex-col gap-3">
      {fields.map((f) => (
        <label key={f} className={label}>
          {parts[f][0]}
          {parts[f][1]}
        </label>
      ))}
    </div>
  )
}

/** the row's details overlay: dialog, or a bottom sheet on mobile; opened by <SchemaAction.EditDetails> */
function DetailsOverlay() {
  const { id } = useFieldContext()
  const { store, portal } = useEditor()
  const details = useEditorStore((s) =>
    s.details?.id === id ? s.details : null
  )
  const title = useEditorStore((s) => s.byId[id]?.title)
  const mobile = useVariant() === "mobile"
  const onOpenChange = (o: boolean) => {
    if (!o) store.getState().openDetails(null)
  }
  if (!details) return null
  const body = <DetailFields fields={details.fields} />
  return mobile ? (
    <EditorSheet
      open
      onOpenChange={onOpenChange}
      title={title || "Edit field"}
      container={portal}
    >
      {body}
    </EditorSheet>
  ) : (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-3 p-4">
        <DialogTitle className="text-xs font-medium">
          {title || "Untitled"}
        </DialogTitle>
        {body}
      </DialogContent>
    </Dialog>
  )
}

/* -------------------------------- badges --------------------------------- */

type BadgeProps = Rendered & {
  children?: React.ReactNode
  title?: string
  variant?: BadgeVariant
}

/** flag badge; `render` swaps the element (shadcn <Badge />), children the text */
function Badge({
  on,
  slot,
  label,
  className,
  children,
  title,
  render,
  variant = "muted",
}: BadgeProps & { on: boolean; slot: string; label: string }) {
  const v = useVariant()
  return useRender({
    render,
    enabled: on,
    defaultTagName: "span",
    props: {
      "data-slot": slot,
      "data-variant": variant,
      title,
      children: children ?? label,
      className: render
        ? className
        : cn("shrink-0 rounded px-1", badgeLook[variant], tiny[v], className),
    },
  })
}

export function Optional(props: BadgeProps) {
  const { field: node } = useField()
  return (
    <Badge on={node.optional} slot="optional" label="optional" {...props} />
  )
}

export function Repeated(props: BadgeProps) {
  const { field: node } = useField()
  return (
    <Badge
      on={node.repeated}
      slot="repeated"
      label="[ ]"
      title="Repeated: list of this field"
      {...props}
      className={cn(!props.render && "font-mono", props.className)}
    />
  )
}

export function Nullable(props: BadgeProps) {
  const { field: node } = useField()
  return (
    <Badge on={node.nullable} slot="nullable" label="nullable" {...props} />
  )
}

export function ChildrenCount({
  className,
  render,
  variant = "muted",
}: Rendered & { variant?: BadgeVariant }) {
  const { field: node } = useField()
  const id = node.id
  const mod = useTypeModule(node.type)
  const count = useEditorStore((s) => s.children[id]?.length ?? 0)
  const v = useVariant()
  const el = useRender({
    render,
    state: { count },
    defaultTagName: "span",
    props: {
      "data-slot": "children-count",
      "data-variant": variant,
      className: render
        ? className
        : cn("shrink-0 rounded px-1", badgeLook[variant], tiny[v], className),
      children: mod.countLabel ? mod.countLabel(count) : String(count),
    },
    enabled: node.isGroup,
  })
  return el
}

/* --------------------------------- type ---------------------------------- */

const typeBadge: Size = {
  compact: "h-4 gap-1 pr-1.5 text-2xs",
  default: "h-5 gap-1 pr-1.5 text-xs",
  wide: "h-7 gap-1.5 pr-2 text-sm",
  mobile: "h-6 gap-1 pr-2 text-xs",
}

/**
 * The field's type. `icon` (default): the tile alone. `badge`: tile + label in
 * an outlined pill. Pick with <SchemaAction.ChangeType>.
 */
export function Type({
  className,
  render,
  variant = "icon",
}: Rendered & { variant?: "icon" | "badge" }) {
  const { field: node } = useField()
  const mod = useTypeModule(node.type)
  const v = useVariant()
  const badge = variant === "badge"
  return useRender({
    render,
    defaultTagName: "span",
    props: {
      "data-slot": "type",
      "data-variant": variant,
      title: mod.label,
      className: render
        ? className
        : cn(
            "flex shrink-0 items-center",
            badge &&
              cn(
                "rounded-md border border-border text-foreground",
                typeBadge[v]
              ),
            className
          ),
      children: (
        <>
          <IconTile
            icon={mod.icon}
            color={
              v === "compact" ? mod.color.replace(/bg-\S+/, "") : mod.color
            }
            size={tile[v]}
          />
          {badge && mod.label}
        </>
      ),
    },
  })
}

/** the type module's own UI, if it has one */
export function Extra(props: Part) {
  const { field: node, update: set } = useField()
  const mod = useTypeModule(node.type)
  if (!mod.Extra) return null
  return (
    <div data-slot="extra" className={props.className}>
      <mod.Extra node={{ ...node }} set={set} />
    </div>
  )
}

/* ---------------------------- menu / nested ----------------------------- */

/** the ⋯ menu; children are SchemaAction.* (or anything) */
export function MenuPart({
  className,
  children,
  label = "Field settings",
}: Part & { children: React.ReactNode; label?: string }) {
  const { field: node } = useField()
  const v = useVariant()
  const size = {
    compact: "size-5",
    default: "size-5",
    wide: "size-7",
    mobile: "size-9",
  }[v]
  return (
    <ActionScopeContext.Provider value="menu">
      <Menu
        title={node.title || label}
        align="end"
        trigger={
          <Button
            data-slot="menu"
            variant="ghost"
            size="icon-xs"
            aria-label={label}
            onPointerDown={(e) => e.stopPropagation()}
            className={cn(size, "text-muted-foreground", className)}
          >
            <EllipsisIcon />
          </Button>
        }
      >
        {children}
      </Menu>
    </ActionScopeContext.Provider>
  )
}

/** set inside <SchemaField.Nested>; NestedToggle / NestedList refuse to render outside it */
const NestedContext = React.createContext(false)
const useNested = (part: string) => {
  if (!React.useContext(NestedContext))
    throw new Error(`<SchemaField.${part}> must be inside <SchemaField.Nested>`)
}

/**
 * The accordion of a group row: owns open / closed, hosts the toggle and the
 * list. Null on leaves. Free-form children: put the toggle where you like.
 */
export function Nested({
  className,
  children,
}: Part & { children: React.ReactNode }) {
  const { node } = useFieldContext()
  if (!node.isGroup) return null
  return (
    <NestedContext.Provider value={true}>
      <div
        data-slot="nested"
        data-state={node.collapsed ? "closed" : "open"}
        className={cn("contents", className)}
      >
        {children}
      </div>
    </NestedContext.Provider>
  )
}

/** the chevron that opens / closes NestedList */
export function NestedToggle({
  className,
  render,
}: Part & { render?: React.ComponentProps<typeof Button>["render"] }) {
  useNested("NestedToggle")
  const { node, set } = useFieldContext()
  const v = useVariant()
  const open = !node.collapsed
  const size = {
    compact: "size-4",
    default: "size-5",
    wide: "size-7",
    mobile: "size-8",
  }[v]
  const props = {
    "data-slot": "nested-toggle",
    "data-state": open ? "open" : "closed",
    "aria-label": open ? "Collapse" : "Expand",
    "aria-expanded": open,
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
    onClick: () => set({ collapsed: open }),
  }
  return (
    <Button
      {...props}
      variant="ghost"
      size="icon-xs"
      render={render}
      className={cn(size, "text-muted-foreground", className)}
    >
      <ChevronDownIcon
        className={cn("transition-transform", !open && "-rotate-90")}
      />
    </Button>
  )
}

/**
 * Children frame of a group. Empty → recurses with the enclosing list's
 * render. Give it a <Schema.List> to change template / variant from here down.
 */
export function NestedList({
  className,
  children,
  open: forced,
}: Part & {
  children?: React.ReactNode
  /** always draw the rows, for when something else (a panel) hides the list */
  open?: boolean
}) {
  useNested("NestedList")
  const { node, id } = useFieldContext()
  const list = useList()
  const v = useVariant()
  const open = forced || !node.collapsed
  const pad = {
    compact: "[--frame-pad:--spacing(1)]",
    default: "[--frame-pad:--spacing(1.5)]",
    wide: "[--frame-pad:--spacing(2)]",
    mobile: "[--frame-pad:--spacing(1.5)]",
  }[v]
  return (
    <div
      data-slot="nested-list"
      data-state={open ? "open" : "closed"}
      style={{ "--depth": list.depth + 1 } as React.CSSProperties}
      className={cn(
        // spans the row's grid so nested cells reach the outer columns; the frame is drawn on the content column only
        "relative col-span-full! row-start-2! mx-0! grid min-w-0 grid-cols-subgrid py-(--frame-pad)",
        "[&>*]:relative [&>*]:[grid-column:var(--content-col)] [&>*]:mx-[calc(var(--depth)*var(--indent))] [&>*+*]:mt-(--row-gap)",
        pad,
        className
      )}
    >
      <div
        aria-hidden
        data-slot="nested-frame"
        // absolute inside its grid area: the content column (both lines explicit, `auto` would mean the container's edge), full height, no row of its own
        className="absolute! inset-0 [grid-column:var(--content-col)/calc(var(--content-col)+1)]! mx-[calc((var(--depth)-1)*var(--indent))]! rounded-b-md border-x border-b border-border bg-group"
      />
      {open ? (
        // an explicit <Schema.List> child inherits this group as its parent; none → same template, next level
        <ListContext.Provider
          value={{ ...list, parentId: id, depth: list.depth + 1 }}
        >
          {children ?? <List />}
        </ListContext.Provider>
      ) : (
        <NestedSummary />
      )}
    </div>
  )
}

/** "3 hidden" / "empty" line of a collapsed group; null while open */
export function NestedSummary({ className }: Part) {
  useNested("NestedSummary")
  const { node, id } = useFieldContext()
  const v = useVariant()
  const count = useEditorStore((s) => s.children[id]?.length ?? 0)
  if (!node.collapsed) return null
  return (
    <div
      data-slot="nested-summary"
      className={cn(
        "relative px-2 py-1 text-muted-foreground",
        tiny[v],
        className
      )}
    >
      {count ? `${count} hidden` : "empty, drop fields here"}
    </div>
  )
}

/* ---------------------------------- row ---------------------------------- */

const BUTTONS = "button, a, [data-slot=drag], [data-slot=select]"
const FIELDS = "input, textarea"
const ROWS = "[data-slot=row]"

const inside = (r: DOMRect, x: number, y: number) =>
  x >= r.left && x <= r.right && y >= r.top && y <= r.bottom

/**
 * What a drag hit-tests against, walked once at drag start: the DOM does not
 * change while dragging (the skeleton is not a row), only where things are.
 * Rects are read per frame; the queries are not.
 */
type DragGeometry = {
  rows: { el: HTMLElement; nested: HTMLElement | null }[]
  frames: HTMLElement[]
}

function snapshot(root: HTMLElement, self: HTMLElement): DragGeometry {
  const live = (el: Element) =>
    !self.contains(el) && !el.closest("[data-ghost]")
  const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-slot=row]"))
    .filter(live)
    .map((el) => {
      const nested = el.querySelector<HTMLElement>(
        ":scope [data-slot=nested-list]"
      )
      return {
        el,
        nested:
          nested && nested.closest("[data-slot=row]") === el ? nested : null,
      }
    })
  const frames = Array.from(
    root.querySelectorAll<HTMLElement>(
      "[data-slot=nested-list][data-state=open]"
    )
  ).filter(live)
  return { rows, frames }
}

/** a row's "head" = its box minus its nested frame, if any */
function headCentre({ el, nested }: DragGeometry["rows"][number]) {
  const r = el.getBoundingClientRect()
  const bottom = nested ? nested.getBoundingClientRect().top : r.bottom
  return (r.top + bottom) / 2
}

/**
 * Where a row dragged to (x, y) lands, any depth. Walk every row in document
 * order (= visual order); the first whose head centre is below the pointer is
 * the row we insert before. If the pointer is still inside a nested frame whose
 * rows are all above it (its padding / add-field area), append there.
 */
function resolveDrop(
  { rows, frames }: DragGeometry,
  x: number,
  y: number,
  rootId: string
) {
  const before = rows.find((r) => y < headCentre(r))?.el
  let frame: HTMLElement | null = null
  for (const f of frames) {
    if (!inside(f.getBoundingClientRect(), x, y)) continue
    if (!frame || frame.contains(f)) frame = f
  }
  if (frame && !(before && frame.contains(before)))
    return {
      parentId: frame.closest<HTMLElement>("[data-slot=row]")!.dataset.id!,
      beforeId: null,
    }
  return {
    parentId: before?.dataset.parent ?? rootId,
    beforeId: before?.dataset.id ?? null,
  }
}

export type RowProps = {
  className?: string
  children?: React.ReactNode
  /** default: only from a mounted <SchemaAction.Drag>, else anywhere on the row */
  dragFrom?: "handle" | "anywhere"
}

export function Row(props: RowProps) {
  const id = React.useContext(RowIdContext)
  if (!id)
    throw new Error("<SchemaField.Row> must be rendered by <Schema.List>")
  return <RowImpl id={id} {...props} />
}

function RowImpl({
  id,
  className,
  children,
  dragFrom,
}: RowProps & { id: string }) {
  const { store, root, coarse } = useEditor()
  const list = useList()
  const controls = useDragControls()
  // pointer type of the gesture in flight, and whether a touch hold armed it
  const touch = React.useRef(false)
  const armed = React.useRef(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const ghostRef = React.useRef<HTMLDivElement>(null)
  const grab = React.useRef({ x: 0, y: 0, w: 0, h: 0, gap: 0 })
  const began = React.useRef(false)
  // the click that ends a drag must not reach row content (e.g. a tap-to-open summary)
  const justDragged = React.useRef(false)
  const dir = React.useRef<"x" | "y" | null>(null)
  // pointer events outrun frames; one hit-test per frame is plenty
  const frame = React.useRef<{ raf: number; x: number; y: number } | null>(null)
  const placeSoon = (x: number, y: number) => {
    if (frame.current) {
      frame.current.x = x
      frame.current.y = y
      return
    }
    frame.current = {
      x,
      y,
      raf: requestAnimationFrame(() => {
        const f = frame.current!
        frame.current = null
        place(f.x, f.y)
      }),
    }
  }
  const cancelFrame = () => {
    if (frame.current) cancelAnimationFrame(frame.current.raf)
    frame.current = null
  }
  // touch: a press held still selects the row and arms the drag; the page
  // keeps the gesture (and may scroll) until then
  const press = React.useRef<{
    timer: number
    fired: boolean
    x: number
    y: number
  } | null>(null)
  const cancelPress = () => {
    if (press.current) window.clearTimeout(press.current.timer)
    press.current = null
  }
  const [isArmed, setArmed] = React.useState(false)
  const disarm = () => {
    armed.current = false
    setArmed(false)
  }
  const [dragging, setDragging] = React.useState(false)
  const [gen, setGen] = React.useState(0)
  // touch-action is read when the finger lands, so flipping it at the hold is
  // too late for the gesture already in flight: hold the scroll off by hand
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const stop = (e: TouchEvent) => armed.current && e.preventDefault()
    el.addEventListener("touchmove", stop, { passive: false })
    return () => el.removeEventListener("touchmove", stop)
  }, [gen])
  const [mounted, setHasHandle] = React.useState(false)
  const hasHandle = dragFrom ? dragFrom === "handle" : mounted
  const node = useEditorStore((s) => s.byId[id])
  const selected = useEditorStore((s) => s.selected.includes(id))
  // this row travels with a selection someone else is dragging
  const carried = useEditorStore(
    (s) =>
      !list.ghost && !!s.drop && s.drop.id !== id && s.drop.ids.includes(id)
  )
  // everything this drag carries, document order, for the ghost
  const ghostIds = useEditorStore(
    useShallow((s) => (s.drop?.id === id ? s.drop.ids : [id]))
  )
  const count = ghostIds.length
  const startDrag = React.useCallback(
    (e: React.PointerEvent | PointerEvent) => controls.start(e as PointerEvent),
    [controls]
  )
  const ctx = React.useMemo(
    () => ({ id, hasHandle, setHasHandle, startDrag }),
    [id, hasHandle, startDrag]
  )

  const geometry = React.useRef<DragGeometry | null>(null)
  const place = (px: number, py: number) => {
    const el = ref.current
    if (!el || !root.current) return null
    const x = px - window.scrollX
    const y = py - window.scrollY
    const g = ghostRef.current
    if (g)
      g.style.transform = `translate(${x - grab.current.x}px, ${y - grab.current.y}px)`
    geometry.current ??= snapshot(root.current, el)
    const { parentId, beforeId } = resolveDrop(
      geometry.current,
      x,
      y,
      store.getState().root
    )
    const st = store.getState()
    const ids = st.moving(id)
    const siblings = st.children[parentId].filter((s) => !ids.includes(s))
    const index = beforeId ? siblings.indexOf(beforeId) : siblings.length
    st.setDrop({
      id,
      ids,
      parentId,
      index,
      height: grab.current.h + grab.current.gap * (ids.length - 1),
    })
    return { ids, parentId, index }
  }

  if (!node) return null
  // the row is a subgrid: [left cells | template | right cells]; the template's
  // elements go on the content column, inset by depth; a NestedList spans all
  const body = (
    <>
      {list.columns?.left.length ? (
        <div
          data-slot="columns"
          data-side="left"
          className="col-start-1 row-start-1 flex items-start"
        >
          {list.columns.left}
        </div>
      ) : null}
      <div
        data-slot="row-content"
        className={cn(
          "contents",
          "[&>*]:[grid-column:var(--content-col)] [&>*]:row-start-1 [&>*]:mx-[calc(var(--depth)*var(--indent))]",
          "[&>[data-slot=nested]>*]:[grid-column:var(--content-col)] [&>[data-slot=nested]>*]:row-start-1 [&>[data-slot=nested]>*]:mx-[calc(var(--depth)*var(--indent))]"
        )}
      >
        {children}
      </div>
      {list.columns?.right.length ? (
        <div
          data-slot="columns"
          data-side="right"
          className="col-start-3 row-start-1 flex items-start"
        >
          {list.columns.right}
        </div>
      ) : null}
    </>
  )
  const layout =
    "relative col-span-full! mx-0! grid min-w-0 grid-cols-subgrid items-start"
  const depthVar = { "--depth": list.depth } as React.CSSProperties
  if (list.ghost)
    return (
      <FieldContext.Provider value={ctx}>
        <div data-slot="row" style={depthVar} className={cn(layout, className)}>
          {body}
        </div>
      </FieldContext.Provider>
    )

  return (
    <FieldContext.Provider value={ctx}>
      <motion.div
        key={gen}
        ref={ref}
        // y only: leaves motion's x lock to a swipe layer; the ghost follows the pointer on both axes anyway
        drag="y"
        dragListener={false}
        dragControls={controls}
        dragSnapToOrigin
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragDirectionLock={coarse}
        onDirectionLock={(axis) => (dir.current = axis)}
        layout="position"
        onDrag={(_, info) => {
          if (touch.current && dir.current !== "y") return
          if (!began.current) {
            cancelPress()
            began.current = true
            const r = ref.current!.getBoundingClientRect()
            // the slot is as tall as everything that moves: this row, or the selection it belongs to
            const moving = store.getState().moving(id)
            const gapVar = getComputedStyle(ref.current!)
              .getPropertyValue("--row-gap")
              .trim()
            const gap =
              (parseFloat(gapVar) || 0) *
              (gapVar.endsWith("rem")
                ? parseFloat(
                    getComputedStyle(document.documentElement).fontSize
                  )
                : 1)
            const h = moving.reduce((sum, m) => {
              const el = root.current?.querySelector<HTMLElement>(
                `[data-slot=row][data-id="${m}"]`
              )
              return sum + (el ? el.getBoundingClientRect().height : 0)
            }, 0)
            grab.current = {
              x: info.point.x - window.scrollX - r.left,
              y: info.point.y - window.scrollY - r.top,
              w: r.width,
              h: h || r.height,
              gap,
            }
            document.body.style.userSelect = "none"
            setDragging(true)
          }
          placeSoon(info.point.x, info.point.y)
        }}
        onDragEnd={(_, info) => {
          dir.current = null
          cancelPress()
          cancelFrame()
          if (!began.current) return
          began.current = false
          const at = place(info.point.x, info.point.y)
          geometry.current = null
          document.body.style.userSelect = ""
          disarm()
          setDragging(false)
          setGen((g) => g + 1)
          justDragged.current = true
          requestAnimationFrame(() => (justDragged.current = false))
          store.getState().setDrop(null)
          if (at) store.getState().move(at.ids, at.parentId, at.index)
        }}
        // press and drag from anywhere unless a Drag handle is mounted; buttons excluded, an unfocused input drags too
        onPointerDown={(e) => {
          if (hasHandle) return
          const t = e.target as HTMLElement
          // a nested row's press bubbles here: it owns it, not us
          if (t.closest(ROWS) !== ref.current) return
          if (t.closest(BUTTONS)) return
          const field = t.closest<HTMLElement>(FIELDS)
          if (field && field === document.activeElement) return
          if (field) e.preventDefault()
          touch.current = e.pointerType === "touch"
          // fine pointer: the press is the drag
          if (!touch.current) return controls.start(e)
          // touch: hold still to select and arm; move first and the page scrolls
          cancelPress()
          const native = e.nativeEvent
          const p = { timer: 0, fired: false, x: e.clientX, y: e.clientY }
          p.timer = window.setTimeout(() => {
            p.fired = true
            armed.current = true
            setArmed(true)
            store.getState().toggleSelect(id)
            navigator.vibrate?.(10)
            // the tap that ends the press must not open anything
            justDragged.current = true
            controls.start(native)
          }, LONG_PRESS)
          press.current = p
        }}
        onPointerMove={(e) => {
          const p = press.current
          if (!p || p.fired) return
          // travelled before the hold landed: this was a scroll, not a drag
          if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > SLOP) cancelPress()
        }}
        onPointerUp={() => {
          if (press.current?.fired)
            requestAnimationFrame(() => (justDragged.current = false))
          cancelPress()
          if (!began.current) disarm()
        }}
        onPointerCancel={() => {
          cancelPress()
          disarm()
        }}
        onClickCapture={(e) => {
          if (justDragged.current) e.stopPropagation()
        }}
        onClick={(e) => {
          ;(e.target as HTMLElement).closest<HTMLElement>(FIELDS)?.focus()
        }}
        data-slot="row"
        data-id={id}
        data-parent={list.parentId}
        data-type={node.type}
        data-depth={list.depth}
        data-variant={list.variant}
        data-selected={selected ? "" : undefined}
        data-drag-from={hasHandle ? "handle" : "row"}
        data-dragging={dragging ? "" : carried ? "carried" : undefined}
        style={depthVar}
        className={cn(
          "group/row",
          layout,
          !hasHandle &&
            !coarse &&
            "cursor-grab select-none active:cursor-grabbing",
          coarse && "select-none",
          isArmed && "touch-none",
          // collapsed, not display:none: motion keeps a sane layout snapshot, so no fly-in on settle
          (dragging || carried) && "invisible mt-0! h-0 overflow-hidden",
          className
        )}
      >
        {body}
      </motion.div>
      {!list.ghost && <DetailsOverlay />}
      {dragging &&
        createPortal(
          <div
            ref={ghostRef}
            data-ghost
            aria-hidden
            style={{
              width: grab.current.w,
              gap: grab.current.gap,
              gridTemplateColumns: gridCols(list.cols),
              ...({ "--content-col": list.cols === 3 ? 2 : 1 } as object),
            }}
            className="pointer-events-none fixed top-0 left-0 z-100 grid opacity-90 shadow-lg"
          >
            {count > 1 && (
              <span
                data-slot="drag-count"
                className="absolute -top-2 -right-2 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-2xs font-medium text-primary-foreground"
              >
                {count}
              </span>
            )}
            <ListContext.Provider value={{ ...list, ghost: true }}>
              {ghostIds.slice(0, GHOST_MAX).map((gid) =>
                gid === id ? (
                  <RowImpl key={gid} id={id} className={className}>
                    {children}
                  </RowImpl>
                ) : (
                  <GhostRow key={gid} id={gid} />
                )
              )}
              {ghostIds.length > GHOST_MAX && (
                <div
                  data-slot="ghost-more"
                  className={cn(
                    "px-2 py-1 text-center text-muted-foreground",
                    tiny[list.variant]
                  )}
                >
                  +{ghostIds.length - GHOST_MAX} more
                </div>
              )}
            </ListContext.Provider>
          </div>,
          document.body
        )}
    </FieldContext.Provider>
  )
}

/** touch: hold this long without moving to select the row and arm its drag */
const LONG_PRESS = 400

/** touch: travel further than this before the hold lands and it was a scroll */
const SLOP = 8

/** ghost shows at most this many carried rows, then "+N more" */
const GHOST_MAX = 3

/** a carried row drawn in the ghost with the list's own template */
function GhostRow({ id }: { id: string }) {
  const { render } = useList()
  const node = useEditorStore((s) => s.byId[id])
  if (!node) return null
  return (
    <RowIdContext.Provider value={id}>
      {render({ ...node })}
    </RowIdContext.Provider>
  )
}

// after Row so the cycle (row → nested → list → row) resolves at call time
import { List, gridCols } from "./schema"
