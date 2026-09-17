"use client"

import * as React from "react"
import { cn } from "cn"
import { useShallow } from "zustand/react/shallow"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { JsonSchema } from "@/store"
import {
  ActionScopeContext,
  EditorContext,
  ListContext,
  RowIdContext,
  useEditor,
  useEditorStore,
  useList,
  type RenderRow,
  type Variant,
} from "@/context/editor"
import { TypeMenu } from "./menu"
import { Row } from "./field"

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
  className,
  children,
}: {
  store: JsonSchema
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
    }),
    [schema, coarse]
  )
  return (
    <EditorContext.Provider value={ctx}>
      <div
        ref={ref}
        data-slot="json-editor"
        className={cn("min-w-0 text-sm", className)}
      >
        {children}
      </div>
    </EditorContext.Provider>
  )
}

/* ---------------------------------- list --------------------------------- */

const gap: Record<Variant, string> = {
  compact: "gap-0.5 [--row-gap:0.125rem]",
  default: "gap-1.5 [--row-gap:0.375rem]",
  wide: "gap-3 [--row-gap:0.75rem]",
  mobile: "gap-1 [--row-gap:0.25rem]",
}

const SkeletonContext = React.createContext<React.ReactElement | null>(null)

/**
 * One sibling set. `render` draws each row; nested lists inherit it (and the
 * variant) unless they set their own. Children other than rows: <Schema.Skeleton>.
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
  const ctx = React.useMemo(() => {
    const r = render ?? parent?.render
    if (!r)
      throw new Error(
        "<Schema.List> needs a render (or an enclosing list to inherit one from)"
      )
    return {
      parentId: parentId ?? parent?.parentId ?? store.getState().root,
      depth: depth ?? (parent ? parent.depth : 0),
      variant: variant ?? parent?.variant ?? (coarse ? "mobile" : "default"),
      render: r,
      ghost: parent?.ghost,
    }
  }, [render, parent, parentId, depth, variant, coarse, store])

  const ids = useEditorStore(useShallow((s) => s.children[ctx.parentId] ?? []))
  const drop = useEditorStore((s) =>
    !ctx.ghost && s.drop?.parentId === ctx.parentId ? s.drop : null
  )
  const visible = drop ? ids.filter((x) => x !== drop.id) : ids
  const custom = React.Children.toArray(children).find(
    (c) => React.isValidElement(c) && c.type === Skeleton
  ) as React.ReactElement | undefined
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
        className={cn("flex min-w-0 flex-col", gap[ctx.variant], className)}
      >
        {ids.map((id) => (
          <React.Fragment key={id}>
            {drop && visible[drop.index] === id && skeleton}
            <RowFor id={id} />
          </React.Fragment>
        ))}
        {drop && drop.index >= visible.length && skeleton}
      </div>
    </ListContext.Provider>
  )
}

/** subscribes to one node and hands it to the list's render */
function RowFor({ id }: { id: string }) {
  const { render } = useList()
  const node = useEditorStore((s) => s.byId[id])
  if (!node) return null
  return (
    <RowIdContext.Provider value={id}>
      {render({ ...node })}
    </RowIdContext.Provider>
  )
}

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
        "rounded-md border-2 border-dashed border-primary/40 bg-primary/5",
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
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const n = useEditorStore((s) => s.selected.length)
  return (
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
  const ref = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = some
  }, [some])
  return (
    <input
      ref={ref}
      data-slot="select-all"
      type="checkbox"
      aria-label="Select all"
      checked={all}
      onChange={(e) => {
        const s = store.getState()
        s.select(
          e.target.checked
            ? Object.keys(s.byId).filter((id) => id !== s.root)
            : []
        )
      }}
      className={cn("size-3.5 accent-primary", className)}
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
