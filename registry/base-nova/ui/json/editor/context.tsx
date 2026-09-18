"use client"

import * as React from "react"
import { useStore } from "zustand"
import type {
  EditorState,
  EditorStore,
} from "@/registry/base-nova/ui/json/core/editor"
import type {
  JsonSchema,
  NodePatch,
  SchemaNode,
  TypeModule,
} from "@/registry/base-nova/ui/json/core"

export type Variant = "default" | "compact" | "wide" | "mobile"

/* --------------------------------- editor -------------------------------- */

export type EditorCtx = {
  schema: JsonSchema
  store: EditorStore
  types: TypeModule[]
  /** editor element; drag hit-tests query rows under it */
  root: React.RefObject<HTMLDivElement | null>
  /** coarse pointer detected → lists default to `mobile` */
  coarse: boolean
  /** where popups (menus, sheets, dialogs) portal to; default document body */
  portal?: React.RefObject<HTMLElement | null>
}
export const EditorContext = React.createContext<EditorCtx | null>(null)

export function useEditor() {
  const ctx = React.useContext(EditorContext)
  if (!ctx) throw new Error("Schema parts must be inside <Schema.Root>")
  return ctx
}

/** subscribe to a slice of the store */
export function useEditorStore<T>(selector: (s: EditorState) => T): T {
  return useStore(useEditor().store, selector)
}

export const useTypeModule = (type: string) => {
  const { types } = useEditor()
  const mod = types.find((t) => t.key === type)
  if (!mod) throw new Error(`unknown type "${type}"`)
  return mod
}

/* ---------------------------------- list --------------------------------- */

export type RenderRow = (node: SchemaNode) => React.ReactNode

export type ListCtx = {
  parentId: string
  depth: number
  variant: Variant
  /** how rows in this list (and nested ones, by default) are drawn */
  render: RenderRow
  /** inside the drag ghost: render only, no drag / hit-test participation */
  ghost?: boolean
  /** <Schema.Column> cells every row draws beside its content; nested lists inherit */
  columns?: { left: React.ReactElement[]; right: React.ReactElement[] }
  /** the grid this list's rows are laid on: [left | content | right] when columns are declared */
  cols: 1 | 3
}
export const ListContext = React.createContext<ListCtx | null>(null)
export const useList = () => {
  const ctx = React.useContext(ListContext)
  if (!ctx) throw new Error("row parts must be inside <Schema.List>")
  return ctx
}
/** variant outside a list (a toolbar's), set by <Schema.Toolbar variant> */
export const VariantContext = React.createContext<Variant | null>(null)
/** list variant; outside a list the toolbar's, else "default" */
export const useVariant = (): Variant => {
  const list = React.useContext(ListContext)
  const outer = React.useContext(VariantContext)
  return list?.variant ?? outer ?? "default"
}

/* ---------------------------------- field -------------------------------- */

/** id of the node a <SchemaField.Row> draws; set by the list per row */
export const RowIdContext = React.createContext<string | null>(null)

export type FieldCtx = {
  id: string
  /** a <SchemaField.Handle> is mounted → the row drags only from it */
  hasHandle: boolean
  setHasHandle: (on: boolean) => void
  /** drag start, wired by Row */
  startDrag: (e: React.PointerEvent | PointerEvent) => void
}
export const FieldContext = React.createContext<FieldCtx | null>(null)

/** current row, internal: node + patch + drag wiring. Parts that only need the model use hooks.useField */
export function useFieldContext() {
  const ctx = React.useContext(FieldContext)
  if (!ctx) throw new Error("field parts must be inside <SchemaField.Row>")
  const { store } = useEditor()
  const node = useStore(store, (s) => s.byId[ctx.id])
  const set = React.useCallback(
    (patch: NodePatch) => store.getState().update(ctx.id, patch),
    [store, ctx.id]
  )
  return { ...ctx, node, set }
}
export const useFieldOptional = () => React.useContext(FieldContext)

/* -------------------------------- scopes --------------------------------- */

/** where an action renders decides its look and its targets */
export type ActionScope = "row" | "menu" | "toolbar"
export const ActionScopeContext = React.createContext<ActionScope>("row")
export const useActionScope = () => React.useContext(ActionScopeContext)

/** true under <Schema.Toolbar>: actions there (menus included) apply to the selection */
export const ToolbarContext = React.createContext(false)

/** ids an action applies to: the field, or the selection inside a toolbar */
export function useActionTargets(): string[] {
  const scope = useActionScope()
  const toolbar = React.useContext(ToolbarContext)
  const field = useFieldOptional()
  const selected = useEditorStore((s) => s.selected)
  if (scope === "toolbar" || toolbar) return selected
  if (!field)
    throw new Error(
      "actions outside a toolbar must be inside <SchemaField.Row>"
    )
  return [field.id]
}
