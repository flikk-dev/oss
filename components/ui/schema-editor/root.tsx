"use client"

import * as React from "react"
import { cn } from "cn"
import { useStore } from "zustand"
import type { SlugCase } from "@/lib/schema-editor/slug"
import type { FieldMeta, FieldTree } from "@/lib/schema-editor/tree"
import {
  createEditorStore,
  ROOT,
  toTree,
  type EditorState,
  type EditorStore,
} from "./store"

export type Variant = "default" | "compact" | "wide" | "mobile"

/* --------------------------------- store --------------------------------- */

type EditorCtx = {
  store: EditorStore
  variant: Variant
  /** editor element; drag hit-tests query rows under it */
  root: React.RefObject<HTMLDivElement | null>
}
const EditorContext = React.createContext<EditorCtx | null>(null)

export function useEditorCtx() {
  const ctx = React.useContext(EditorContext)
  if (!ctx) throw new Error("SchemaEditor parts must be inside <SchemaEditor>")
  return ctx
}

export const useVariant = () => useEditorCtx().variant

/** subscribe to a slice of the editor store */
export function useEditorStore<T>(selector: (s: EditorState) => T): T {
  return useStore(useEditorCtx().store, selector)
}

/** actions + transient state for host chrome (toolbars, previews) */
export function useSchemaEditor() {
  const { store, variant } = useEditorCtx()
  const { insert, openSheet } = store.getState()
  return { variant, insert, openSheet, store }
}

/* ---------------------------------- row ---------------------------------- */

export type FieldCtx = {
  id: string
  parentId: string
  depth: number
  /** slugs of siblings, excluding self */
  taken: Set<string>
}
const FieldContext = React.createContext<FieldCtx | null>(null)
export const FieldProvider = FieldContext.Provider

/** current row: node + patch; re-renders only when this node changes */
export function useField() {
  const ctx = React.useContext(FieldContext)
  if (!ctx) throw new Error("Row parts must be inside <SchemaEditor.Row>")
  const { store } = useEditorCtx()
  const node = useStore(store, (s) => s.byId[ctx.id])
  const set = React.useCallback(
    (patch: Partial<FieldMeta>) => store.getState().update(ctx.id, patch),
    [store, ctx.id]
  )
  return { ...ctx, node, set }
}

export type ListCtx = {
  parentId: string
  depth: number
  /** inside the drag ghost: render only, no drag / hit-test participation */
  ghost?: boolean
}
const ListContext = React.createContext<ListCtx>({ parentId: ROOT, depth: 0 })
export const ListProvider = ListContext.Provider
export const useList = () => React.useContext(ListContext)

/* ---------------------------------- root --------------------------------- */

export type SchemaEditorProps = {
  value: FieldTree
  onChange: (next: FieldTree) => void
  /** default: `mobile` on a coarse pointer, else `default` */
  variant?: Variant
  slugCase?: SlugCase
  className?: string
  children?: React.ReactNode
}

function useCoarsePointer() {
  const [coarse, setCoarse] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)")
    const update = () => setCoarse(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])
  return coarse
}

export function SchemaEditorRoot({
  value,
  onChange,
  variant,
  slugCase = "camel",
  className,
  children,
}: SchemaEditorProps) {
  const coarse = useCoarsePointer()
  const resolved: Variant = variant ?? (coarse ? "mobile" : "default")
  const ref = React.useRef<HTMLDivElement>(null)
  const [store] = React.useState(() => createEditorStore(value, slugCase))

  // value → store (external change), store → onChange (internal change), no echo
  const emitted = React.useRef(value)
  React.useEffect(() => {
    if (value !== emitted.current) store.getState().replaceTree(value)
  }, [value, store])
  React.useEffect(
    () =>
      store.subscribe(
        (s) => [s.byId, s.children] as const,
        (slice) => {
          const next = toTree({ byId: slice[0], children: slice[1] })
          emitted.current = next
          onChange(next)
        },
        { equalityFn: (a, b) => a[0] === b[0] && a[1] === b[1] }
      ),
    [store, onChange]
  )
  React.useEffect(
    () => store.getState().setSlugCase(slugCase),
    [store, slugCase]
  )

  const ctx = React.useMemo(
    () => ({ store, variant: resolved, root: ref }),
    [store, resolved]
  )

  return (
    <EditorContext.Provider value={ctx}>
      <div
        ref={ref}
        data-slot="schema-editor"
        data-variant={resolved}
        className={cn(
          "group/editor min-w-0 text-sm data-[variant=compact]:text-xs",
          className
        )}
      >
        {children}
      </div>
    </EditorContext.Provider>
  )
}
