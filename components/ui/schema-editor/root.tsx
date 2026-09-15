"use client"

import * as React from "react"
import { cn } from "cn"
import { useStore } from "zustand"
import type { FieldMeta, FieldTree } from "@/lib/schema-editor/tree"
import { createEditorStore, ROOT, toTree, type EditorState, type EditorStore } from "./store"
import {
  defaultTheme,
  mergeTheme,
  resolveTheme,
  type PartialTheme,
  type Pointer,
  type ResolvedTheme,
  type SchemaEditorTheme,
  type Tier,
} from "./theme"

/* ------------------------------ environment ------------------------------ */

/** container width below which the compact tier applies */
const COMPACT_BELOW = 560

type Env = { pointer: Pointer; tier: Tier }
const EnvContext = React.createContext<Env>({ pointer: "fine", tier: "wide" })
export const useEnv = () => React.useContext(EnvContext)

function usePointer(forced?: Pointer): Pointer {
  const [coarse, setCoarse] = React.useState(false)
  React.useEffect(() => {
    if (forced) return
    const mq = window.matchMedia("(pointer: coarse)")
    const update = () => setCoarse(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [forced])
  return forced ?? (coarse ? "coarse" : "fine")
}

function useTier(ref: React.RefObject<HTMLElement | null>, forced?: Tier): Tier {
  const [tier, setTier] = React.useState<Tier>("wide")
  React.useEffect(() => {
    if (forced || !ref.current) return
    const ro = new ResizeObserver(([e]) => setTier(e.contentRect.width < COMPACT_BELOW ? "compact" : "wide"))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [forced, ref])
  return forced ?? tier
}

/* --------------------------------- theme --------------------------------- */

const ThemeContext = React.createContext<SchemaEditorTheme>(defaultTheme())

/** resolved for the current tier; every axis a single value */
export function useTheme(): ResolvedTheme {
  const theme = React.useContext(ThemeContext)
  const { tier } = useEnv()
  return React.useMemo(() => resolveTheme(theme, tier), [theme, tier])
}

/** cascade: override axes for a subtree */
export function Variants({ children, ...over }: PartialTheme & { children: React.ReactNode }) {
  const base = React.useContext(ThemeContext)
  const value = React.useMemo(() => mergeTheme(base, over), [base, over])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/* --------------------------------- store --------------------------------- */

type EditorCtx = {
  store: EditorStore
  /** group frames that accept drops, keyed by node id */
  zones: React.MutableRefObject<Map<string, HTMLElement>>
}
const EditorContext = React.createContext<EditorCtx | null>(null)

function useEditorCtx() {
  const ctx = React.useContext(EditorContext)
  if (!ctx) throw new Error("SchemaEditor parts must be inside <SchemaEditor>")
  return ctx
}

/** subscribe to a slice of the editor store */
export function useEditorStore<T>(selector: (s: EditorState) => T): T {
  return useStore(useEditorCtx().store, selector)
}

/** actions + transient state for host chrome (toolbars, previews) */
export function useSchemaEditor() {
  const { store } = useEditorCtx()
  const arrange = useStore(store, (s) => s.arrange)
  const { setArrange, insert, openSheet } = store.getState()
  return { arrange, setArrange, insert, openSheet, store }
}

export const useZones = () => useEditorCtx().zones

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
  const set = React.useCallback((patch: Partial<FieldMeta>) => store.getState().update(ctx.id, patch), [store, ctx.id])
  return { ...ctx, node, set }
}
/** same as useField, but null outside a row (standalone parts) */
export function useFieldOptional() {
  const ctx = React.useContext(FieldContext)
  const { store } = useEditorCtx()
  const node = useStore(store, (s) => (ctx ? s.byId[ctx.id] : undefined))
  const set = React.useCallback(
    (patch: Partial<FieldMeta>) => ctx && store.getState().update(ctx.id, patch),
    [store, ctx]
  )
  return ctx && node ? { ...ctx, node, set } : null
}

export type ListCtx = { parentId: string; depth: number }
const ListContext = React.createContext<ListCtx>({ parentId: ROOT, depth: 0 })
export const ListProvider = ListContext.Provider
export const useList = () => React.useContext(ListContext)

/* ---------------------------------- root --------------------------------- */

export type SchemaEditorProps = {
  value: FieldTree
  onChange: (next: FieldTree) => void
  /** partial theme merged over defaults */
  theme?: PartialTheme
  /** force environment (previews / tests); default = detected */
  pointer?: Pointer
  tier?: Tier
  className?: string
  children?: React.ReactNode
}

export function SchemaEditorRoot({ value, onChange, theme, pointer, tier, className, children }: SchemaEditorProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const env: Env = { pointer: usePointer(pointer), tier: useTier(ref, tier) }
  const merged = React.useMemo(() => mergeTheme(defaultTheme(), theme), [theme])
  const zones = React.useRef(new Map<string, HTMLElement>())

  const [store] = React.useState(() => createEditorStore(value, merged.slug.case))
  const arrange = useStore(store, (s) => s.arrange)

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
  React.useEffect(() => store.getState().setSlugCase(merged.slug.case), [store, merged.slug.case])

  return (
    <ThemeContext.Provider value={merged}>
      <EnvContext.Provider value={env}>
        <EditorContext.Provider value={{ store, zones }}>
          <div
            ref={ref}
            data-slot="schema-editor"
            data-pointer={env.pointer}
            data-tier={env.tier}
            data-arrange={arrange}
            className={cn("group/editor @container/editor min-w-0", className)}
          >
            {children}
          </div>
        </EditorContext.Provider>
      </EnvContext.Provider>
    </ThemeContext.Provider>
  )
}
