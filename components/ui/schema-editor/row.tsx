"use client"

import * as React from "react"
import {
  animate,
  motion,
  Reorder,
  useDragControls,
  useMotionValue,
  useTransform,
} from "motion/react"
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
  useEditorCtx,
  useEditorStore,
  useField,
  useList,
  useVariant,
} from "./root"
import { isDescendant } from "./store"

const INTERACTIVE = "input, textarea, button, a, [role=button]"

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
        "min-w-0 max-w-full self-start text-xs text-muted-foreground group-data-[variant=compact]/editor:text-2xs group-data-[variant=wide]/editor:text-sm",
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
        "min-w-0 max-w-full self-start text-xs text-muted-foreground/70 group-data-[variant=compact]/editor:text-2xs group-data-[variant=wide]/editor:text-sm",
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
      onClick={
        mobile
          ? (e) => {
              // a tap opens the editor; not the release of a drag
              if (
                !e.currentTarget
                  .closest("[data-slot=row]")
                  ?.hasAttribute("data-dragging")
              )
                openSheet(node.id)
            }
          : undefined
      }
      // press and drag from anywhere on the header except inputs / buttons
      onPointerDown={(e) => {
        if (!(e.target as HTMLElement).closest(INTERACTIVE)) controls?.start(e)
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
  const { zones } = useEditorCtx()
  const { node, depth } = useField()
  const count = useEditorStore((s) => s.children[node.id]?.length ?? 0)
  const ref = React.useRef<HTMLDivElement>(null)

  // drop zone = the whole group row (header + children), so hovering anywhere over it targets it
  React.useEffect(() => {
    const el = ref.current?.closest<HTMLElement>("[data-slot=row]")
    if (!el || !isGroupType(node.type)) return
    const map = zones.current
    map.set(node.id, el)
    return () => void map.delete(node.id)
  }, [zones, node.id, node.type])

  if (!isGroupType(node.type)) return null
  const alternatives = node.type === "oneOf"
  return (
    <div
      ref={ref}
      data-slot="group"
      className={cn("flex min-w-0 flex-col border-t border-border", className)}
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

/** innermost group frame under a point, skipping own subtree */
function zoneUnder(
  zones: Map<string, HTMLElement>,
  x: number,
  y: number,
  skip: (id: string) => boolean
) {
  let best: { id: string; area: number } | null = null
  for (const [id, el] of zones) {
    if (skip(id)) continue
    const r = el.getBoundingClientRect()
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue
    const area = r.width * r.height
    if (!best || area < best.area) best = { id, area }
  }
  return best?.id ?? null
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
  const { store, zones } = useEditorCtx()
  const list = useList()
  const mobile = useVariant() === "mobile"
  const controls = useDragControls()
  const ref = React.useRef<HTMLDivElement>(null)
  // swipe-to-reveal actions (mobile)
  const swipeX = useMotionValue(0)
  // own x/y so the skeleton can counter-translate back to the slot
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const backX = useTransform(x, (v) => -v)
  const backY = useTransform(y, (v) => -v)
  const SWIPE = 88
  const node = useEditorStore((s) => s.byId[id])
  const taken = useEditorStore(
    useShallow((s) =>
      (s.children[list.parentId] ?? [])
        .filter((x) => x !== id)
        .map((x) => s.byId[x].slug)
    )
  )
  const takenSet = React.useMemo(() => new Set(taken), [taken])

  const skip = (zid: string) =>
    zid === id ||
    zid === list.parentId ||
    isDescendant(store.getState(), id, zid)
  // paint straight on the DOM — state would re-render the list mid-drag
  const paint = (active: string | null) => {
    for (const [zid, el] of zones.current)
      el.dataset.over = String(zid === active)
  }
  const onDragEnd = (x: number, y: number) => {
    const target = zoneUnder(zones.current, x, y, skip)
    paint(null)
    if (target) return store.getState().moveInto(id, target)
    const frame = zones.current.get(list.parentId)?.getBoundingClientRect()
    if (
      frame &&
      (x < frame.left || x > frame.right || y < frame.top || y > frame.bottom)
    )
      store.getState().popOut(id)
  }

  const group = isGroupType(node.type)

  return (
    <FieldProvider
      value={{
        id,
        parentId: list.parentId,
        depth: list.depth,
        taken: takenSet,
      }}
    >
      <DragControlsContext.Provider value={controls}>
        <Reorder.Item
          ref={ref}
          as="div"
          value={id}
          layout="position"
          dragListener={false}
          dragControls={controls}
          whileDrag={{ opacity: 0.9 }}
          style={{ x, y }}
          onDragStart={() => {
            ref.current?.setAttribute("data-dragging", "")
            document.body.style.userSelect = "none"
          }}
          onDrag={(_, info) =>
            paint(zoneUnder(zones.current, info.point.x, info.point.y, skip))
          }
          onDragEnd={(_, info) => {
            requestAnimationFrame(() =>
              ref.current?.removeAttribute("data-dragging")
            )
            document.body.style.userSelect = ""
            onDragEnd(info.point.x, info.point.y)
          }}
          exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }}
          data-slot="row"
          data-type={node.type}
          data-depth={list.depth}
          className={cn(
            "relative flex min-w-0 flex-col rounded-md border bg-background",
            "data-[over=true]:bg-primary/5 data-[over=true]:outline-2 data-[over=true]:outline-offset-2 data-[over=true]:outline-primary/50 data-[over=true]:outline-dashed",
            group
              ? "border-border"
              : "border-transparent has-[>[data-slot=header]:hover]:border-border",
            className
          )}
        >
          {/* skeleton at the drop slot: item is translated, this translates back */}
          <motion.div
            aria-hidden
            style={{ x: backX, y: backY }}
            className="pointer-events-none absolute -inset-px z-10 hidden rounded-md border-2 border-dashed border-primary/40 bg-primary/5 [[data-dragging]>&]:block"
          />
          {mobile ? (
            <div className="relative overflow-hidden rounded-md">
              <Actions className="absolute inset-y-0 right-0 items-start px-2 py-1 opacity-100" />
              <motion.div
                drag="x"
                dragDirectionLock
                dragConstraints={{ left: -SWIPE, right: 0 }}
                dragElastic={0.05}
                style={{ x: swipeX }}
                onDragEnd={(_, info) => {
                  const open =
                    info.offset.x < -SWIPE / 2 || info.velocity.x < -200
                  animate(swipeX, open ? -SWIPE : 0, {
                    type: "spring",
                    stiffness: 500,
                    damping: 40,
                  })
                }}
                className="relative z-10 flex min-w-0 flex-col bg-background"
              >
                {children ?? (
                  <>
                    <Header />
                    <Group />
                  </>
                )}
              </motion.div>
            </div>
          ) : (
            (children ?? (
              <>
                <Header />
                <Group />
              </>
            ))
          )}
          {/* sibling of Header: React events bubble through portals, so a click
              inside the sheet must not reach the header's open handler */}
          {mobile && <FieldSheet />}
        </Reorder.Item>
      </DragControlsContext.Provider>
    </FieldProvider>
  )
}
