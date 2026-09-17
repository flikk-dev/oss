"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "cn"
import { motion, useDragControls } from "motion/react"
import { useRender } from "@base-ui/react/use-render"
import { ChevronDownIcon, EllipsisIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { uniqueSlug } from "@/store/slug"
import {
  ActionScopeContext,
  FieldContext,
  ListContext,
  RowIdContext,
  useEditor,
  useEditorStore,
  useField,
  useList,
  useTypeModule,
  useVariant,
  type Variant,
} from "@/context/editor"
import { Editable, type EditableProps, type RenderProp } from "./editable"
import { IconTile, Menu, TypeMenu } from "./menu"

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
type Field = Rendered & Pick<EditableProps, "placeholder" | "readOnly">

/* --------------------------------- text ---------------------------------- */

export function Title({
  className,
  placeholder = "Untitled",
  readOnly,
  render,
}: Field) {
  const { node, set } = useField()
  const v = useVariant()
  return (
    <Editable
      data-slot="title"
      aria-label="Title"
      readOnly={readOnly}
      render={render}
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
}: Field) {
  const { node, set, id } = useField()
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
      {...(render
        ? {
            "data-slot": "key",
            className,
            title: conflictTitle,
            "aria-invalid": conflict || undefined,
          }
        : {})}
    />
  )
  // your element stands alone; ours gets the "@" prefix and the conflict tint
  if (render) return input
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
      <span className="select-none">@</span>
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
}: Field & { multiline?: boolean }) {
  const { node, set } = useField()
  const v = useVariant()
  return (
    <Editable
      data-slot="description"
      aria-label="Description"
      readOnly={readOnly}
      multiline={multiline}
      render={render}
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
}: Field) {
  const { node, set } = useField()
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
  fields?: ("title" | "key" | "description" | "examples")[]
}) {
  const label = "flex flex-col gap-1 text-2xs text-muted-foreground"
  const field = "w-full rounded-md border px-2 py-1.5 text-xs"
  const parts = {
    title: ["Title", <Title key="t" className={field} />],
    key: ["Key", <Key key="k" className={field} />],
    description: [
      "Description",
      <Description key="d" multiline className={field} />,
    ],
    examples: ["Examples", <Examples key="e" className={field} />],
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

/* -------------------------------- badges --------------------------------- */

type BadgeProps = Rendered & { children?: React.ReactNode; title?: string }

/** flag badge; `render` swaps the element (shadcn <Badge />), children the text */
function Badge({
  on,
  slot,
  label,
  className,
  children,
  title,
  render,
}: BadgeProps & { on: boolean; slot: string; label: string }) {
  const v = useVariant()
  return useRender({
    render,
    enabled: on,
    defaultTagName: "span",
    props: {
      "data-slot": slot,
      title,
      children: children ?? label,
      className: render
        ? className
        : cn(
            "shrink-0 rounded bg-muted px-1 text-muted-foreground",
            tiny[v],
            className
          ),
    },
  })
}

export function Optional(props: BadgeProps) {
  const { node } = useField()
  return (
    <Badge on={node.optional} slot="optional" label="optional" {...props} />
  )
}

export function Repeated(props: BadgeProps) {
  const { node } = useField()
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
  const { node } = useField()
  return (
    <Badge on={node.nullable} slot="nullable" label="nullable" {...props} />
  )
}

export function ChildrenCount({
  className,
  render,
}: Part & { render?: Parameters<typeof useRender>[0]["render"] }) {
  const { node, id } = useField()
  const mod = useTypeModule(node.type)
  const count = useEditorStore((s) => s.children[id]?.length ?? 0)
  const v = useVariant()
  const el = useRender({
    render,
    state: { count },
    defaultTagName: "span",
    props: {
      "data-slot": "children-count",
      className: cn(
        "shrink-0 rounded bg-muted px-1 text-muted-foreground",
        tiny[v],
        className
      ),
      children: mod.countLabel ? mod.countLabel(count) : String(count),
    },
    enabled: node.isGroup,
  })
  return el
}

/* --------------------------------- type ---------------------------------- */

/** the field's type as icon (+ label); pick with <SchemaAction.ChangeType> */
export function Type({
  className,
  label,
  render,
}: Rendered & { label?: boolean }) {
  const { node } = useField()
  const mod = useTypeModule(node.type)
  const v = useVariant()
  return useRender({
    render,
    defaultTagName: "span",
    props: {
      "data-slot": "type",
      title: mod.label,
      className: render
        ? className
        : cn("flex shrink-0 items-center gap-1.5", className),
      children: (
        <>
          <IconTile
            icon={mod.icon}
            color={
              v === "compact" ? mod.color.replace(/bg-\S+/, "") : mod.color
            }
            size={label ? "md" : tile[v]}
          />
          {label && mod.label}
        </>
      ),
    },
  })
}

/** the type module's own UI, if it has one */
export function Extra(props: Part) {
  const { node, set } = useField()
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
  const { node } = useField()
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
 * list. Null on leaves. Free-form children — put the toggle where you like.
 */
export function Nested({
  className,
  children,
}: Part & { children: React.ReactNode }) {
  const { node } = useField()
  if (!node.isGroup) return null
  return (
    <NestedContext.Provider value={true}>
      <div
        data-slot="nested"
        data-state={node.collapsed ? "closed" : "open"}
        className={cn("flex min-w-0 flex-col", className)}
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
  const { node, set } = useField()
  const v = useVariant()
  const open = !node.collapsed
  const size = {
    compact: "size-4",
    default: "size-5",
    wide: "size-7",
    mobile: "size-8",
  }[v]
  return (
    <Button
      data-slot="nested-toggle"
      data-state={open ? "open" : "closed"}
      variant="ghost"
      size="icon-xs"
      aria-label={open ? "Collapse" : "Expand"}
      aria-expanded={open}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => set({ collapsed: open })}
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
  /** always draw the rows — when something else (an accordion panel) hides the list */
  open?: boolean
}) {
  useNested("NestedList")
  const { node, id } = useField()
  const list = useList()
  const v = useVariant()
  const open = forced || !node.collapsed
  const pad = {
    compact: "p-1",
    default: "p-1.5",
    wide: "p-2",
    mobile: "p-1.5",
  }[v]
  return (
    <div
      data-slot="nested-list"
      data-state={open ? "open" : "closed"}
      className={cn(
        "flex min-w-0 flex-col border-t border-border bg-group",
        pad,
        className
      )}
    >
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
  const { node, id } = useField()
  const v = useVariant()
  const count = useEditorStore((s) => s.children[id]?.length ?? 0)
  if (!node.collapsed) return null
  return (
    <div
      data-slot="nested-summary"
      className={cn("px-2 py-1 text-muted-foreground", tiny[v], className)}
    >
      {count ? `${count} hidden` : "empty — drop fields here"}
    </div>
  )
}

/* ---------------------------------- row ---------------------------------- */

const BUTTONS = "button, a, [data-slot=drag], [data-slot=select]"
const FIELDS = "input, textarea"

const inside = (r: DOMRect, x: number, y: number) =>
  x >= r.left && x <= r.right && y >= r.top && y <= r.bottom

/** a row's "head" = its box minus its nested frame, if any */
function headCentre(row: HTMLElement) {
  const r = row.getBoundingClientRect()
  const nested = row.querySelector<HTMLElement>(
    ":scope [data-slot=nested-list]"
  )
  const bottom =
    nested && row.contains(nested) && nested.closest("[data-slot=row]") === row
      ? nested.getBoundingClientRect().top
      : r.bottom
  return (r.top + bottom) / 2
}

/**
 * Where a row dragged to (x, y) lands, any depth. Walk every row in document
 * order (= visual order); the first whose head centre is below the pointer is
 * the row we insert before. If the pointer is still inside a nested frame whose
 * rows are all above it (its padding / add-field area), append there.
 */
function resolveDrop(
  root: HTMLElement,
  self: HTMLElement,
  x: number,
  y: number,
  rootId: string
) {
  const live = (el: Element) =>
    !self.contains(el) && !el.closest("[data-ghost]")
  const rows = Array.from(
    root.querySelectorAll<HTMLElement>("[data-slot=row]")
  ).filter(live)
  const before = rows.find((r) => y < headCentre(r))
  let frame: HTMLElement | null = null
  for (const f of root.querySelectorAll<HTMLElement>(
    "[data-slot=nested-list][data-state=open]"
  )) {
    if (!live(f) || !inside(f.getBoundingClientRect(), x, y)) continue
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
  const { store, root } = useEditor()
  const list = useList()
  const mobile = list.variant === "mobile"
  const controls = useDragControls()
  const ref = React.useRef<HTMLDivElement>(null)
  const ghostRef = React.useRef<HTMLDivElement>(null)
  const grab = React.useRef({ x: 0, y: 0, w: 0, h: 0 })
  const began = React.useRef(false)
  // the click that ends a drag must not reach row content (e.g. a tap-to-open summary)
  const justDragged = React.useRef(false)
  const dir = React.useRef<"x" | "y" | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const [gen, setGen] = React.useState(0)
  const [mounted, setHasHandle] = React.useState(false)
  const hasHandle = dragFrom ? dragFrom === "handle" : mounted
  const node = useEditorStore((s) => s.byId[id])
  const selected = useEditorStore((s) => s.selected.includes(id))
  const startDrag = React.useCallback(
    (e: React.PointerEvent | PointerEvent) => controls.start(e as PointerEvent),
    [controls]
  )
  const ctx = React.useMemo(
    () => ({ id, hasHandle, setHasHandle, startDrag }),
    [id, hasHandle, startDrag]
  )

  const place = (px: number, py: number) => {
    const el = ref.current
    if (!el || !root.current) return null
    const x = px - window.scrollX
    const y = py - window.scrollY
    const g = ghostRef.current
    if (g)
      g.style.transform = `translate(${x - grab.current.x}px, ${y - grab.current.y}px)`
    const { parentId, beforeId } = resolveDrop(
      root.current,
      el,
      x,
      y,
      store.getState().root
    )
    const siblings = store.getState().children[parentId].filter((s) => s !== id)
    const index = beforeId ? siblings.indexOf(beforeId) : siblings.length
    store.getState().setDrop({ id, parentId, index, height: grab.current.h })
    return { parentId, index }
  }

  if (!node) return null
  if (list.ghost)
    return (
      <FieldContext.Provider value={ctx}>
        <div data-slot="row" className={className}>
          {children}
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
        dragDirectionLock={mobile}
        onDirectionLock={(axis) => (dir.current = axis)}
        layout="position"
        onDrag={(_, info) => {
          if (mobile && dir.current !== "y") return
          if (!began.current) {
            began.current = true
            const r = ref.current!.getBoundingClientRect()
            grab.current = {
              x: info.point.x - window.scrollX - r.left,
              y: info.point.y - window.scrollY - r.top,
              w: r.width,
              h: r.height,
            }
            document.body.style.userSelect = "none"
            setDragging(true)
          }
          place(info.point.x, info.point.y)
        }}
        onDragEnd={(_, info) => {
          dir.current = null
          if (!began.current) return
          began.current = false
          const at = place(info.point.x, info.point.y)
          document.body.style.userSelect = ""
          setDragging(false)
          setGen((g) => g + 1)
          justDragged.current = true
          requestAnimationFrame(() => (justDragged.current = false))
          store.getState().setDrop(null)
          if (at) store.getState().move(id, at.parentId, at.index)
        }}
        // press and drag from anywhere unless a Drag handle is mounted; buttons excluded, an unfocused input drags too
        onPointerDown={(e) => {
          if (hasHandle) return
          const t = e.target as HTMLElement
          if (t.closest(BUTTONS)) return
          const field = t.closest<HTMLElement>(FIELDS)
          if (field && field === document.activeElement) return
          if (field) e.preventDefault()
          controls.start(e)
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
        data-dragging={dragging ? "" : undefined}
        className={cn(
          "group/row relative flex min-w-0 flex-col",
          !hasHandle &&
            !mobile &&
            "cursor-grab select-none active:cursor-grabbing",
          mobile && "touch-none select-none",
          // collapsed, not display:none: motion keeps a sane layout snapshot, so no fly-in on settle
          dragging &&
            "invisible [margin-top:calc(var(--row-gap)*-1)] h-0 overflow-hidden",
          className
        )}
      >
        {children}
      </motion.div>
      {dragging &&
        createPortal(
          <div
            ref={ghostRef}
            data-ghost
            aria-hidden
            style={{ width: grab.current.w }}
            className="pointer-events-none fixed top-0 left-0 z-100 opacity-90 shadow-lg"
          >
            <ListContext.Provider value={{ ...list, ghost: true }}>
              <RowImpl id={id} className={className}>
                {children}
              </RowImpl>
            </ListContext.Provider>
          </div>,
          document.body
        )}
    </FieldContext.Provider>
  )
}

// after Row so the cycle (row → nested → list → row) resolves at call time
import { List } from "./schema"
