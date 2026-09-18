"use client"

import * as React from "react"
import { useStore } from "zustand"
import { cn } from "@/lib/utils"
import { useShallow } from "zustand/react/shallow"
import { EllipsisIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { JsonSchema } from "@/components/ui/json/core"
import {
  ActionScopeContext,
  EditorContext,
  ListContext,
  RowIdContext,
  ToolbarContext,
  VariantContext,
  useEditor,
  useEditorStore,
  useList,
  type RenderRow,
  type Variant,
  useVariant,
} from "@/components/ui/json/editor/context"
import { Menu, TypeMenu } from "./menu"
import { Row } from "./field"
import { Checkbox } from "@/components/ui/checkbox"

/* ---------------------------------- root --------------------------------- */

function useCoarsePointer() {
  const [coarse, setCoarse] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia?.("(pointer: coarse)")
    if (!mq) return
    const update = () => setCoarse(mq.matches)
    update()
    mq.addEventListener?.("change", update)
    return () => mq.removeEventListener?.("change", update)
  }, [])
  return coarse
}

export function Root({
  store: schema,
  portalContainer,
  className,
  children,
}: {
  store: JsonSchema
  /** where popups render; hand it a frame to keep sheets and menus inside (a phone mock, a panel) */
  portalContainer?: React.RefObject<HTMLElement | null>
  className?: string
  children: React.ReactNode
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const coarse = useCoarsePointer()
  const ctx = React.useMemo(
    () => ({
      schema,
      store: schema.store,
      types: schema.types,
      root: ref,
      coarse,
      portal: portalContainer,
    }),
    [schema, coarse, portalContainer]
  )
  const selecting = useStore(schema.store, (s) => s.selected.length > 0)
  return (
    <EditorContext.Provider value={ctx}>
      <div
        ref={ref}
        data-slot="json-editor"
        data-selection={selecting ? "active" : "empty"}
        className={cn("group/editor min-w-0 text-sm", className)}
      >
        {children}
      </div>
    </EditorContext.Provider>
  )
}

/* ---------------------------------- list --------------------------------- */

/**
 * Layout is one grid for the whole tree: `[left | content | right]` when
 * <Schema.Column>s are declared, else a single column. Nested lists and rows
 * are subgrids, so a cell at depth 3 sits in the same column as one at depth
 * 0; nesting shows as inset on the content column (`--depth` × `--indent`).
 */
const gap: Record<Variant, string> = {
  compact: "[--row-gap:0.125rem]",
  default: "[--row-gap:0.375rem]",
  wide: "[--row-gap:0.75rem]",
  mobile: "[--row-gap:0.25rem]",
}
/** what one level of nesting insets the content column: the frame's padding + its border */
const indent: Record<Variant, string> = {
  compact: "[--indent:calc(--spacing(1)+1px)]",
  default: "[--indent:calc(--spacing(1.5)+1px)]",
  wide: "[--indent:calc(--spacing(2)+1px)]",
  mobile: "[--indent:calc(--spacing(1.5)+1px)]",
}
export const gridCols = (cols: 1 | 3) =>
  cols === 3 ? "auto minmax(0,1fr) auto" : "minmax(0,1fr)"

const SkeletonContext = React.createContext<React.ReactElement | null>(null)

/** children with fragments unwrapped, so `<>{cols}</>` still declares columns */
const flatten = (children: React.ReactNode): React.ReactNode[] =>
  React.Children.toArray(children).flatMap((c) =>
    React.isValidElement(c) && c.type === React.Fragment
      ? flatten((c.props as { children?: React.ReactNode }).children)
      : [c]
  )

/**
 * One sibling set. `render` draws each row; nested lists inherit it (and the
 * variant) unless they set their own. Children: <Schema.Column>s every row
 * draws beside its content, a <Schema.Skeleton> to restyle the drop slot;
 * anything else renders after the rows.
 */
export function List({
  parentId,
  depth,
  variant,
  render,
  className,
  children,
}: {
  parentId?: string
  depth?: number
  variant?: Variant
  render?: RenderRow
  className?: string
  children?: React.ReactNode
}) {
  const { store, coarse } = useEditor()
  const parent = React.useContext(ListContext)
  const kids = flatten(children)
  const isSkeleton = (c: React.ReactNode) =>
    React.isValidElement(c) && c.type === Skeleton
  const isColumn = (c: React.ReactNode): c is React.ReactElement<ColumnProps> =>
    React.isValidElement(c) && c.type === Column
  const custom = kids.find(isSkeleton) as React.ReactElement | undefined
  const cols = kids.filter(isColumn)
  // anything else (an AddField, your own bar) lands after the rows, inside the list's context
  const rest = kids.filter((c) => !isSkeleton(c) && !isColumn(c))
  const columns = React.useMemo(
    () =>
      cols.length
        ? {
            left: cols.filter((c) => (c.props.side ?? "left") === "left"),
            right: cols.filter((c) => c.props.side === "right"),
          }
        : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [children]
  )
  const ctx = React.useMemo(() => {
    const r = render ?? parent?.render
    if (!r)
      throw new Error(
        "<Schema.List> needs a render (or an enclosing list to inherit one from)"
      )
    const cols = columns ?? parent?.columns
    return {
      parentId: parentId ?? parent?.parentId ?? store.getState().root,
      depth: depth ?? (parent ? parent.depth : 0),
      variant: variant ?? parent?.variant ?? (coarse ? "mobile" : "default"),
      render: r,
      ghost: parent?.ghost,
      columns: cols,
      cols: (cols ? 3 : 1) as 1 | 3,
    }
  }, [render, columns, parent, parentId, depth, variant, coarse, store])
  // a list that starts a grid: the root, or one declaring columns its parent lacks
  const own = !parent || ctx.cols !== parent.cols

  const ids = useEditorStore(useShallow((s) => s.children[ctx.parentId] ?? []))
  const drop = useEditorStore((s) =>
    !ctx.ghost && s.drop?.parentId === ctx.parentId ? s.drop : null
  )
  const visible = drop ? ids.filter((x) => !drop.ids.includes(x)) : ids
  const skeleton = drop && (
    <SkeletonContext.Provider value={custom ?? null}>
      <SkeletonSlot height={drop.height} />
    </SkeletonContext.Provider>
  )

  return (
    <ListContext.Provider value={ctx}>
      <div
        data-slot="list"
        data-depth={ctx.depth}
        data-variant={ctx.variant}
        style={
          {
            "--depth": ctx.depth,
            ...(own && {
              gridTemplateColumns: gridCols(ctx.cols),
              "--content-col": ctx.cols === 3 ? 2 : 1,
            }),
          } as React.CSSProperties
        }
        className={cn(
          "grid min-w-0",
          own
            ? cn(gap[ctx.variant], indent[ctx.variant])
            : "col-span-full! mx-0! grid-cols-subgrid",
          // row rhythm as margins, so a collapsed (dragged) row takes no space;
          // anything that is not a row (an AddField, your bar) sits on the content column, inset like a row
          "[&>*]:relative [&>*]:[grid-column:var(--content-col)] [&>*]:mx-[calc(var(--depth)*var(--indent))] [&>*+*]:mt-(--row-gap)",
          className
        )}
      >
        {ids.map((id) => (
          <React.Fragment key={id}>
            {drop && visible[drop.index] === id && skeleton}
            <RowFor id={id} />
          </React.Fragment>
        ))}
        {drop && drop.index >= visible.length && skeleton}
        {rest}
      </div>
    </ListContext.Provider>
  )
}

/**
 * Subscribes to one node and hands it to the list's render. Memoised: while a
 * drag moves the skeleton the list re-renders, the rows must not.
 */
const RowFor = React.memo(function RowFor({ id }: { id: string }) {
  const { render } = useList()
  const node = useEditorStore((s) => s.byId[id])
  if (!node) return null
  return (
    <RowIdContext.Provider value={id}>
      {render({ ...node })}
    </RowIdContext.Provider>
  )
})

function SkeletonSlot({ height }: { height: number }) {
  const custom = React.useContext(SkeletonContext)
  return custom ? (
    React.cloneElement(
      custom as React.ReactElement<{ style?: React.CSSProperties }>,
      { style: { height } }
    )
  ) : (
    <Skeleton style={{ height }} />
  )
}

export type ColumnProps = {
  /** which side of the row content; default left */
  side?: "left" | "right"
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}

/**
 * A cell every row of the list draws beside its content, outside the
 * template: `<Schema.Column side="left"><SchemaAction.Select /></Schema.Column>`.
 * Declared as a child of <Schema.List>; rendered per row, inside the row (it
 * moves with it and sees its context). Nested lists inherit.
 */
export function Column({ side = "left", className, children }: ColumnProps) {
  return (
    <div
      data-slot="column"
      data-side={side}
      className={cn("shrink-0", className)}
    >
      {children}
    </div>
  )
}

/** drop-slot placeholder; place inside <Schema.List> to restyle it */
export function Skeleton({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      aria-hidden
      data-slot="skeleton"
      style={style}
      className={cn(
        "col-span-full! mx-0! rounded-md border-2 border-dashed border-primary/40 bg-primary/5",
        className
      )}
    />
  )
}

/* ---------------------------------- add ---------------------------------- */

/** creates a field at the end of the enclosing list (root when used outside one) */
export function AddField({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  const { store } = useEditor()
  const list = React.useContext(ListContext)
  const parentId = list?.parentId ?? store.getState().root
  // one step under the field title of the variant
  const size = {
    compact: "h-4 gap-1 px-1 text-2xs [&_svg]:size-2.5",
    default: "h-5 gap-1 px-1.5 text-2xs [&_svg]:size-3",
    wide: "h-7 gap-1.5 px-2 text-xs [&_svg]:size-3.5",
    mobile: "h-8 gap-1.5 px-2 text-xs [&_svg]:size-3.5",
  }[useVariant()]
  return (
    <TypeMenu
      title="New field type"
      onPick={(type) => store.getState().insert(parentId, type)}
      trigger={
        <Button
          data-slot="add-field"
          variant="ghost"
          size="xs"
          className={cn(
            "text-muted-foreground hover:text-foreground",
            size,
            className
          )}
        >
          <PlusIcon /> {children ?? "Add field"}
        </Button>
      }
    />
  )
}

/* -------------------------------- toolbar -------------------------------- */

/** hosts SchemaAction.* that apply to the selection; data-state tells if there is one */
export function Toolbar({
  variant,
  className,
  children,
}: {
  /** density of the actions inside; mobile makes menus bottom sheets */
  variant?: Variant
  className?: string
  children: React.ReactNode
}) {
  const n = useEditorStore((s) => s.selected.length)
  return (
    <VariantContext.Provider value={variant ?? null}>
      <ToolbarContext.Provider value={true}>
        <ActionScopeContext.Provider value="toolbar">
          <div
            role="toolbar"
            data-slot="toolbar"
            data-state={n ? "active" : "empty"}
            className={cn("flex items-center gap-1", className)}
          >
            {children}
          </div>
        </ActionScopeContext.Provider>
      </ToolbarContext.Provider>
    </VariantContext.Provider>
  )
}

/** the ⋯ menu of a toolbar: SchemaAction.* inside apply to the selection */
export function SelectionMenu({
  className,
  children,
  label = "More",
}: {
  className?: string
  children: React.ReactNode
  label?: string
}) {
  return (
    <ActionScopeContext.Provider value="menu">
      <Menu
        title={label}
        align="end"
        trigger={
          <Button
            data-slot="selection-menu"
            variant="outline"
            size="icon-xs"
            aria-label={label}
            className={cn("size-7", className)}
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

export function SelectAll({ className }: { className?: string }) {
  const { store } = useEditor()
  const { all, some } = useEditorStore(
    useShallow((s) => {
      const ids = Object.keys(s.byId).filter((id) => id !== s.root)
      const n = s.selected.length
      return { all: n > 0 && n === ids.length, some: n > 0 && n < ids.length }
    })
  )
  return (
    <Checkbox
      data-slot="select-all"
      aria-label="Select all"
      checked={all}
      indeterminate={some}
      onCheckedChange={(checked) => {
        const s = store.getState()
        s.select(
          checked ? Object.keys(s.byId).filter((id) => id !== s.root) : []
        )
      }}
      className={className}
    />
  )
}

export function SelectionCount({
  className,
  render,
}: {
  className?: string
  render?: (
    props: React.HTMLAttributes<HTMLElement>,
    state: { count: number }
  ) => React.ReactElement
}) {
  const count = useEditorStore((s) => s.selected.length)
  const props = {
    "data-slot": "selection-count",
    className: cn("text-xs text-muted-foreground", className),
  }
  if (render) return render(props, { count })
  return <span {...props}>{count} selected</span>
}

export { Row }
