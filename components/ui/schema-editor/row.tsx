"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { animate, motion, useDragControls, useMotionValue } from "motion/react"
import { cn } from "cn"
import {
  BracketsIcon,
  ChevronDownIcon,
  CircleDashedIcon,
  CircleSlashIcon,
  CopyIcon,
  EllipsisIcon,
  GripVerticalIcon,
  PencilLineIcon,
  Trash2Icon,
} from "lucide-react"
import { useShallow } from "zustand/react/shallow"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { slugify, uniqueSlug } from "@/lib/schema-editor/slug"
import { isGroupType } from "@/lib/schema-editor/tree"
import { Editable } from "./editable"
import { List } from "./list"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  OptionMenu,
  sheetClass,
  SheetEntries,
  TypeIcon,
  TypePicker,
  type MenuSection,
} from "./menu"
import {
  FieldProvider,
  ListProvider,
  useEditorCtx,
  useEditorStore,
  useField,
  useList,
  useVariant,
} from "./root"
import { ROOT } from "./store"

const BUTTONS = "button, a, [data-slot=grip]"
const FIELDS = "input, textarea"

const DragControlsContext = React.createContext<ReturnType<
  typeof useDragControls
> | null>(null)

/* --------------------------------- parts --------------------------------- */

export function Title({ className }: { className?: string }) {
  const { node, set, taken } = useField()
  const slugCase = useEditorStore((s) => s.slugCase)
  const mobile = useVariant() === "mobile"
  const readOnly = mobile && !className
  return (
    <Editable
      data-slot="title"
      readOnly={readOnly}
      value={node.title}
      onChange={(title) =>
        set({
          title,
          slug: node.slugEdited
            ? node.slug
            : uniqueSlug(slugify(title, slugCase), taken, slugCase),
        })
      }
      placeholder={isGroupType(node.type) ? "Untitled group" : "Untitled"}
      className={cn(
        "truncate text-foreground group-data-[variant=wide]/editor:text-base",
        className
      )}
    />
  )
}

export function Slug({ className }: { className?: string }) {
  const { node, set, taken } = useField()
  const mobile = useVariant() === "mobile"
  const conflict = node.slug.length > 0 && taken.has(node.slug)
  return (
    <span
      data-slot="slug"
      className={cn(
        "flex min-w-0 shrink-0 items-baseline font-mono text-2xs text-muted-foreground group-data-[variant=compact]/editor:text-3xs group-data-[variant=wide]/editor:text-xs",
        conflict && "text-destructive [&_input]:text-destructive",
        className
      )}
      title={conflict ? `"${node.slug}" already used by a sibling` : undefined}
      aria-invalid={conflict || undefined}
    >
      <span className="select-none">@</span>
      <Editable
        readOnly={mobile && !className}
        value={node.slug}
        onChange={(slug) => set({ slug, slugEdited: slug.length > 0 })}
        placeholder="slug"
      />
    </span>
  )
}

export function Description({ className }: { className?: string }) {
  const { node, set } = useField()
  const variant = useVariant()
  return (
    <Editable
      data-slot="description"
      readOnly={variant === "mobile" && !className}
      multiline={variant === "default" || !!className}
      value={node.description}
      onChange={(description) => set({ description })}
      placeholder="Add description"
      className={cn(
        "max-w-full min-w-0 self-start text-xs text-muted-foreground group-data-[variant=compact]/editor:text-2xs group-data-[variant=wide]/editor:text-sm",
        className
      )}
    />
  )
}

/** comma-separated; parsed on commit so typing "a, " is not trimmed live */
export function Examples({ className }: { className?: string }) {
  const { node, set } = useField()
  const variant = useVariant()
  const joined = node.examples.join(", ")
  const [draft, setDraft] = React.useState(joined)
  React.useEffect(() => setDraft(joined), [joined])
  return (
    <Editable
      data-slot="examples"
      readOnly={variant === "mobile" && !className}
      value={draft}
      onChange={setDraft}
      onCommit={(v) =>
        set({
          examples: v
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
        })
      }
      placeholder="Add examples"
      className={cn(
        "max-w-full min-w-0 self-start text-xs text-muted-foreground/70 group-data-[variant=compact]/editor:text-2xs group-data-[variant=wide]/editor:text-sm",
        className
      )}
    />
  )
}

const badge =
  "shrink-0 rounded bg-muted px-1 text-2xs text-muted-foreground group-data-[variant=compact]/editor:text-3xs group-data-[variant=wide]/editor:text-xs"

function Badges() {
  const { node } = useField()
  const count = useEditorStore((s) => s.children[node.id]?.length ?? 0)
  const group = isGroupType(node.type)
  const noun =
    node.type === "oneOf"
      ? count === 1
        ? "option"
        : "options"
      : count === 1
        ? "field"
        : "fields"
  return (
    <>
      {node.isArray && (
        <span
          title="Repeated: list of this field"
          className={cn(badge, "font-mono")}
        >
          [ ]
        </span>
      )}
      {group && (
        <span className={badge}>
          {count} {noun}
        </span>
      )}
      {node.optional && <span className={badge}>optional</span>}
    </>
  )
}

function GroupToggle() {
  const { node, set } = useField()
  if (!isGroupType(node.type)) return null
  const open = !node.collapsed
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label={open ? "Collapse" : "Expand"}
      aria-expanded={open}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => set({ collapsed: open })}
      className="ml-auto size-5 text-muted-foreground group-data-[variant=wide]/editor:size-7"
    >
      <ChevronDownIcon
        className={cn("transition-transform", !open && "-rotate-90")}
      />
    </Button>
  )
}

function Grip() {
  const controls = React.useContext(DragControlsContext)
  return (
    <div
      data-slot="grip"
      role="button"
      aria-label="Drag to reorder"
      tabIndex={-1}
      onPointerDown={(e) => controls?.start(e)}
      className={cn(
        "flex h-5 w-4 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground group-data-[variant=wide]/editor:h-7 active:cursor-grabbing",
        "opacity-0 group-hover/header:opacity-100 group-data-[variant=mobile]/editor:hidden"
      )}
    >
      <GripVerticalIcon className="size-3" />
    </div>
  )
}

/* -------------------------------- actions -------------------------------- */

function useSettingsSections(): MenuSection[] {
  const { node, set } = useField()
  const { remove, duplicate } = useEditorStore(
    useShallow((s) => ({ remove: s.remove, duplicate: s.duplicate }))
  )
  return [
    {
      key: "rules",
      label: "Rules",
      entries: [
        {
          key: "optional",
          title: "Optional",
          icon: CircleDashedIcon,
          selected: node.optional,
          stayOpen: true,
          onSelect: () => set({ optional: !node.optional }),
        },
        {
          key: "array",
          title: "Repeated",
          icon: BracketsIcon,
          selected: !!node.isArray,
          stayOpen: true,
          onSelect: () => set({ isArray: !node.isArray }),
        },
        {
          key: "nullable",
          title: "Allow null",
          icon: CircleSlashIcon,
          selected: node.nullable,
          stayOpen: true,
          onSelect: () => set({ nullable: !node.nullable }),
        },
      ],
    },
    {
      key: "actions",
      label: "Actions",
      entries: [
        {
          key: "duplicate",
          title: "Duplicate",
          icon: CopyIcon,
          onSelect: () => duplicate(node.id),
        },
        {
          key: "delete",
          title: "Delete",
          icon: Trash2Icon,
          destructive: true,
          onSelect: () => remove(node.id),
        },
      ],
    },
  ]
}

/** labelled fields for text the row hides inline; dialog (compact) / sheet (mobile) */
function DetailFields({ all }: { all?: boolean }) {
  const label = "flex flex-col gap-1 text-2xs text-muted-foreground"
  const field = cn(
    "w-full rounded-md border px-2 py-1.5 text-xs",
    all && "h-10 px-3 text-sm"
  )
  return (
    <div className="flex flex-col gap-3">
      {all && (
        <>
          <label className={label}>
            Title
            <Title className={field} />
          </label>
          <label className={label}>
            Key
            <Slug className={field} />
          </label>
        </>
      )}
      <label className={label}>
        Description
        <Description className={field} />
      </label>
      <label className={label}>
        Examples
        <Examples className={field} />
      </label>
    </div>
  )
}

/** trash + ⋯, revealed on header hover */
export function Actions({ className }: { className?: string }) {
  const { node } = useField()
  const compact = useVariant() === "compact"
  const remove = useEditorStore((s) => s.remove)
  const [details, setDetails] = React.useState(false)
  const sections = useSettingsSections()
  if (compact)
    sections.unshift({
      key: "text",
      label: "Text",
      entries: [
        {
          key: "details",
          title: "Description & examples",
          icon: PencilLineIcon,
          onSelect: () => setDetails(true),
        },
      ],
    })
  const btn =
    "size-5 text-muted-foreground group-data-[variant=wide]/editor:size-7 group-data-[variant=mobile]/editor:size-9"
  return (
    <div
      data-slot="actions"
      className={cn(
        "flex shrink-0 items-center gap-0.5 opacity-0 group-hover/header:opacity-100 group-data-[variant=wide]/editor:gap-1 has-[[aria-expanded=true]]:opacity-100",
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Delete field"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => remove(node.id)}
        className={cn(btn, "hover:bg-destructive/10 hover:text-destructive")}
      >
        <Trash2Icon />
      </Button>
      <OptionMenu
        title={node.title || "Field settings"}
        sections={sections}
        align="end"
        trigger={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Field settings"
            onPointerDown={(e) => e.stopPropagation()}
            className={btn}
          >
            <EllipsisIcon />
          </Button>
        }
      />
      {compact && (
        <Dialog open={details} onOpenChange={setDetails}>
          <DialogContent className="max-w-sm gap-3 p-4">
            <DialogTitle className="text-xs font-medium">
              {node.title || "Untitled"}
            </DialogTitle>
            <DetailFields />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

/** mobile: the row is a summary, this sheet is the editor */
function FieldSheet() {
  const { node, set } = useField()
  const open = useEditorStore((s) => s.sheet === node.id)
  const openSheet = useEditorStore((s) => s.openSheet)
  const sections = useSettingsSections()
  return (
    <Sheet open={open} onOpenChange={(o) => openSheet(o ? node.id : null)}>
      <SheetContent side="bottom" className={sheetClass}>
        <SheetHeader className="flex-row items-center gap-2 p-0">
          <TypePicker
            value={node.type}
            onChange={(type) => set({ type })}
            label
          />
          <SheetTitle className="text-sm font-normal">Edit field</SheetTitle>
        </SheetHeader>
        <DetailFields all />
        <SheetEntries sections={sections} onClose={() => openSheet(null)} />
      </SheetContent>
    </Sheet>
  )
}

/* --------------------------------- header -------------------------------- */

/** compact: description lives in a hover popover on the title */
function Tooltip({ children }: { children: React.ReactElement }) {
  const { node } = useField()
  if (useVariant() !== "compact" || !(node.description || node.examples.length))
    return children
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={300}
        nativeButton={false}
        render={<span className="flex min-w-0" />}
      >
        {children}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="flex w-56 flex-col gap-1 p-2 text-xs text-muted-foreground"
      >
        {node.description && <span>{node.description}</span>}
        {node.examples.length > 0 && (
          <span className="text-muted-foreground/70">
            e.g. {node.examples.join(", ")}
          </span>
        )}
      </PopoverContent>
    </Popover>
  )
}

/**
 * Type · title · key · description · actions. Sets the hover scope: a
 * group's grip/actions light only when its own header is hovered, not a child's.
 */
export function Header({ className }: { className?: string }) {
  const { node, set } = useField()
  const variant = useVariant()
  const openSheet = useEditorStore((s) => s.openSheet)
  const mobile = variant === "mobile"
  const controls = React.useContext(DragControlsContext)
  const type = mobile ? (
    <TypeIcon type={node.type} />
  ) : (
    <TypePicker value={node.type} onChange={(t) => set({ type: t })} />
  )

  return (
    <div
      data-slot="header"
      /**
       * Press and drag from anywhere on the header: buttons excluded, an
       * unfocused input drags too (a click without movement focuses it below).
       */
      onPointerDown={(e) => {
        const t = e.target as HTMLElement
        if (t.closest(BUTTONS)) return
        const field = t.closest<HTMLElement>(FIELDS)
        if (field && field === document.activeElement) return
        if (field) e.preventDefault()
        controls?.start(e)
      }}
      onClick={(e) => {
        const dragged = e.currentTarget
          .closest("[data-slot=row]")
          ?.hasAttribute("data-dragging")
        if (dragged) return
        if (mobile) return openSheet(node.id)
        ;(e.target as HTMLElement).closest<HTMLElement>(FIELDS)?.focus()
      }}
      className={cn(
        "group/header flex items-start gap-1.5 px-3 py-2",
        !mobile && "cursor-grab select-none active:cursor-grabbing",
        "group-data-[variant=compact]/editor:gap-1 group-data-[variant=compact]/editor:px-1.5 group-data-[variant=compact]/editor:py-1",
        "group-data-[variant=wide]/editor:gap-3 group-data-[variant=wide]/editor:px-4 group-data-[variant=wide]/editor:py-3",
        mobile && "touch-none select-none active:bg-muted/60",
        className
      )}
    >
      <Grip />
      {type}
      <div className="flex min-w-0 flex-1 flex-col group-data-[variant=default]/editor:gap-0.5 group-data-[variant=wide]/editor:gap-1">
        <div className="flex min-h-5 min-w-0 items-center gap-1.5 group-data-[variant=wide]/editor:min-h-7 group-data-[variant=wide]/editor:gap-2">
          <Tooltip>
            <Title />
          </Tooltip>
          <Slug />
          <Badges />
          <GroupToggle />
        </div>
        {variant !== "compact" && (
          <>
            <Description />
            <Examples />
          </>
        )}
      </div>
      {!mobile && <Actions />}
    </div>
  )
}

/* --------------------------------- group --------------------------------- */

/** children frame of an object / oneOf row; registers as a drop zone */
export function Group({ className }: { className?: string }) {
  const { node, depth } = useField()
  const count = useEditorStore((s) => s.children[node.id]?.length ?? 0)
  if (!isGroupType(node.type)) return null
  const alternatives = node.type === "oneOf"
  return (
    <div
      data-slot="group"
      data-group={node.id}
      className={cn(
        "flex min-w-0 flex-col border-t border-border bg-group p-1.5",
        "group-data-[variant=compact]/editor:p-1 group-data-[variant=wide]/editor:p-2",
        className
      )}
    >
      {node.collapsed ? (
        <div className="px-3 py-1 text-2xs text-muted-foreground">
          {count
            ? `${count} ${alternatives ? "alternatives" : "fields"} hidden`
            : "empty — drop fields here"}
        </div>
      ) : (
        <List
          parentId={node.id}
          depth={depth + 1}
          alternatives={alternatives}
        />
      )}
    </div>
  )
}

/* ---------------------------------- row ---------------------------------- */

const inside = (r: DOMRect, x: number, y: number) =>
  x >= r.left && x <= r.right && y >= r.top && y <= r.bottom

/**
 * Where a row dragged to (x, y) lands, any depth. Walk every row in document
 * order (= visual order); the first whose header centre is below the pointer
 * is the row we insert before. If the pointer is still inside a group frame
 * whose rows are all above it (its padding / add-field area), append there.
 */
function resolveDrop(
  root: HTMLElement,
  self: HTMLElement,
  x: number,
  y: number
) {
  const live = (el: Element) =>
    !self.contains(el) && !el.closest("[data-ghost]")
  const rows = Array.from(
    root.querySelectorAll<HTMLElement>("[data-slot=row]")
  ).filter(live)
  const before = rows.find((r) => {
    const h = r.querySelector("[data-slot=header]")!.getBoundingClientRect()
    return y < h.top + h.height / 2
  })
  let frame: HTMLElement | null = null
  for (const f of root.querySelectorAll<HTMLElement>("[data-slot=group]")) {
    if (!live(f) || !inside(f.getBoundingClientRect(), x, y)) continue
    if (!frame || frame.contains(f)) frame = f
  }
  if (frame && !(before && frame.contains(before)))
    return { parentId: frame.dataset.group!, beforeId: null }
  return {
    parentId: before?.dataset.parent ?? ROOT,
    beforeId: before?.dataset.id ?? null,
  }
}

/** the card: header + children; `children` is extra content (e.g. the "or" seam). Shared by the row and its ghost. */
function Card({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  const mobile = useVariant() === "mobile"
  const { node } = useField()
  const swipeX = useMotionValue(0)
  const SWIPE = 88
  return (
    <div
      data-slot="card"
      className={cn(
        "relative flex min-w-0 flex-col rounded-md border bg-background",
        isGroupType(node.type)
          ? "border-border"
          : "border-transparent has-[>[data-slot=header]:hover]:border-border",
        className
      )}
    >
      {children}
      {mobile ? (
        // swipe wrapper holds only the header, so a dragged row is never clipped by an ancestor
        <div className="relative overflow-hidden rounded-md">
          <Actions className="absolute inset-y-0 right-0 items-start px-2 py-1 opacity-100" />
          <motion.div
            drag="x"
            dragDirectionLock
            dragConstraints={{ left: -SWIPE, right: 0 }}
            dragElastic={0.05}
            style={{ x: swipeX }}
            onDragEnd={(_, info) => {
              const open = info.offset.x < -SWIPE / 2 || info.velocity.x < -200
              animate(swipeX, open ? -SWIPE : 0, {
                type: "spring",
                stiffness: 500,
                damping: 40,
              })
            }}
            className="relative z-10 flex min-w-0 flex-col bg-background"
          >
            <Header />
          </motion.div>
        </div>
      ) : (
        <Header />
      )}
      <Group />
    </div>
  )
}

export function Row({
  id,
  className,
  children,
}: {
  id: string
  className?: string
  children?: React.ReactNode
}) {
  const { store, root } = useEditorCtx()
  const list = useList()
  const mobile = useVariant() === "mobile"
  const controls = useDragControls()
  const ref = React.useRef<HTMLDivElement>(null)
  const ghostRef = React.useRef<HTMLDivElement>(null)
  const grab = React.useRef({ x: 0, y: 0, w: 0, h: 0 })
  const began = React.useRef(false)
  const dir = React.useRef<"x" | "y" | null>(null)
  const [dragging, setDragging] = React.useState(false)
  // bumped on settle: remounts the element so it appears in the slot with no "from" position to animate
  const [gen, setGen] = React.useState(0)
  const node = useEditorStore((s) => s.byId[id])
  const taken = useEditorStore(
    useShallow((s) =>
      (s.children[list.parentId] ?? [])
        .filter((x) => x !== id)
        .map((x) => s.byId[x].slug)
    )
  )
  const takenSet = React.useMemo(() => new Set(taken), [taken])
  const field = {
    id,
    parentId: list.parentId,
    depth: list.depth,
    taken: takenSet,
  }

  const place = (px: number, py: number) => {
    const el = ref.current
    if (!el || !root.current) return null
    const x = px - window.scrollX
    const y = py - window.scrollY
    const g = ghostRef.current
    if (g)
      g.style.transform = `translate(${x - grab.current.x}px, ${y - grab.current.y}px)`
    const { parentId, beforeId } = resolveDrop(root.current, el, x, y)
    const siblings = store.getState().children[parentId].filter((s) => s !== id)
    const index = beforeId ? siblings.indexOf(beforeId) : siblings.length
    store.getState().setDrop({ id, parentId, index, height: grab.current.h })
    return { parentId, index }
  }

  if (list.ghost)
    return (
      <FieldProvider value={field}>
        <Card>{children}</Card>
      </FieldProvider>
    )

  return (
    <FieldProvider value={field}>
      <DragControlsContext.Provider value={controls}>
        <motion.div
          key={gen}
          ref={ref}
          // y only: leaves motion's x lock to the mobile swipe layer; the ghost follows the pointer on both axes anyway
          drag="y"
          dragListener={false}
          dragControls={controls}
          dragSnapToOrigin
          dragMomentum={false}
          dragElastic={0}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragDirectionLock={mobile}
          layout="position"
          onDirectionLock={(axis) => (dir.current = axis)}
          onDrag={(_, info) => {
            // mobile: a horizontal gesture is a swipe, not a drag
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
            store.getState().setDrop(null)
            if (at) store.getState().move(id, at.parentId, at.index)
          }}
          data-slot="row"
          data-id={id}
          data-parent={list.parentId}
          data-type={node.type}
          data-depth={list.depth}
          className={cn(
            "relative flex min-w-0 flex-col",
            // collapsed, not display:none: motion keeps a sane layout snapshot, so no fly-in on settle
            dragging &&
              "invisible [margin-top:calc(var(--row-gap)*-1)] h-0 overflow-hidden",
            className
          )}
        >
          <Card>{children}</Card>
        </motion.div>
      </DragControlsContext.Provider>
      {dragging &&
        createPortal(
          <div
            ref={ghostRef}
            data-ghost
            aria-hidden
            style={{ width: grab.current.w }}
            className="pointer-events-none fixed top-0 left-0 z-50 opacity-90 shadow-lg"
          >
            <ListProvider value={{ ...list, ghost: true }}>
              <Row id={id}>{children}</Row>
            </ListProvider>
          </div>,
          document.body
        )}
    </FieldProvider>
  )
}
