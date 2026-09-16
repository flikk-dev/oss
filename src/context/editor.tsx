"use client"

import * as React from "react"
import { useStore } from "zustand"
import type { FieldMeta } from "@/store/tree"
import { ROOT, type EditorState, type EditorStore } from "@/store/editor"

export type Variant = "default" | "compact" | "wide" | "mobile"

/* --------------------------------- store --------------------------------- */

type EditorCtx = {
  store: EditorStore
  variant: Variant
  /** editor element; drag hit-tests query rows under it */
  root: React.RefObject<HTMLDivElement | null>
}
export const EditorContext = React.createContext<EditorCtx | null>(null)

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

