"use client"

import * as React from "react"
import { useStore } from "zustand"
import type { EditorState, EditorStore } from "@/store/editor"
import type { JsonSchema, NodePatch, SchemaNode, TypeModule } from "@/store"

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
}
export const ListContext = React.createContext<ListCtx | null>(null)
export const useList = () => {
  const ctx = React.useContext(ListContext)
  if (!ctx) throw new Error("row parts must be inside <Schema.List>")
  return ctx
}
/** list variant; "default" outside a list (toolbars) */
export const useVariant = (): Variant =>
  React.useContext(ListContext)?.variant ?? "default"

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

/** ids an action applies to: the field, or the selection inside a toolbar */
export function useActionTargets(): string[] {
  const scope = useActionScope()
  const field = useFieldOptional()
  const selected = useEditorStore((s) => s.selected)
  if (scope === "toolbar") return selected
  if (!field)
    throw new Error(
      "actions outside a toolbar must be inside <SchemaField.Row>"
    )
  return [field.id]
}
