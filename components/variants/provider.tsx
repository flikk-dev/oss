"use client"

import * as React from "react"
import {
  defaultConfig,
  itemSpecs,
  type ItemKey,
  type VariantConfig,
} from "@/lib/variants"

const STORAGE_KEY = "json-editor:variants"
const HISTORY_KEY = "json-editor:variants:history"
const VIEWPORT_KEY = "json-editor:viewport"
const HISTORY_MAX = 30

export type Viewport = "auto" | "phone"

export type Snapshot = { id: string; at: number; config: VariantConfig }

type Ctx = {
  config: VariantConfig
  history: Snapshot[]
  /** preview frame; "phone" forces mobile behaviour in a 390px frame */
  viewport: Viewport
  setViewport: (v: Viewport) => void
  set: (item: ItemKey, axis: string, value: string) => void
  reset: (item?: ItemKey) => void
  restore: (id: string) => void
  remove: (id: string) => void
}

const VariantContext = React.createContext<Ctx | null>(null)

/** merge stored config over defaults; drops unknown keys, fills missing ones */
function hydrate(stored: unknown): VariantConfig {
  const base = defaultConfig()
  if (!stored || typeof stored !== "object") return base
  for (const item of itemSpecs) {
    const s = (stored as Record<string, unknown>)[item.key]
    if (!s || typeof s !== "object") continue
    for (const axis of item.axes) {
      const v = (s as Record<string, unknown>)[axis.key]
      if (typeof v === "string" && axis.options.some((o) => o.value === v)) {
        ;(base[item.key] as Record<string, string>)[axis.key] = v
      }
    }
  }
  return base
}

const same = (a: VariantConfig, b: VariantConfig) =>
  JSON.stringify(a) === JSON.stringify(b)

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export function VariantProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = React.useState<VariantConfig>(defaultConfig)
  const [history, setHistory] = React.useState<Snapshot[]>([])
  const [viewport, setViewportState] = React.useState<Viewport>("auto")
  const commitTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // load after mount so SSR markup matches
  React.useEffect(() => {
    setConfig(hydrate(read(STORAGE_KEY, null)))
    setViewportState(read<Viewport>(VIEWPORT_KEY, "auto") === "phone" ? "phone" : "auto")
    const h = read<Snapshot[]>(HISTORY_KEY, [])
    setHistory(
      Array.isArray(h)
        ? h
            .filter((s) => s && typeof s.id === "string")
            .map((s) => ({ ...s, config: hydrate(s.config) }))
        : []
    )
  }, [])

  /**
   * Push config into history, debounced — rapid clicks through several
   * options collapse into one snapshot. Newest first, deduped, capped.
   */
  const commit = React.useCallback((next: VariantConfig) => {
    if (commitTimer.current) clearTimeout(commitTimer.current)
    commitTimer.current = setTimeout(() => {
      setHistory((prev) => {
        if (prev.some((s) => same(s.config, next))) return prev
        const snap: Snapshot = {
          id: Math.random().toString(36).slice(2, 10),
          at: Date.now(),
          config: next,
        }
        const out = [snap, ...prev].slice(0, HISTORY_MAX)
        write(HISTORY_KEY, out)
        return out
      })
    }, 1500)
  }, [])

  const apply = (next: VariantConfig, record = true) => {
    setConfig(next)
    write(STORAGE_KEY, next)
    if (record) commit(next)
  }

  const set: Ctx["set"] = (item, axis, value) =>
    apply({ ...config, [item]: { ...config[item], [axis]: value } })

  const reset: Ctx["reset"] = (item) => {
    const d = defaultConfig()
    apply(item ? { ...config, [item]: d[item] } : d)
  }

  const restore: Ctx["restore"] = (id) => {
    const snap = history.find((s) => s.id === id)
    if (snap) apply(snap.config, false)
  }

  const remove: Ctx["remove"] = (id) => {
    setHistory((prev) => {
      const out = prev.filter((s) => s.id !== id)
      write(HISTORY_KEY, out)
      return out
    })
  }

  const setViewport = (v: Viewport) => {
    setViewportState(v)
    write(VIEWPORT_KEY, v)
  }

  return (
    <VariantContext.Provider
      value={{ config, history, viewport, setViewport, set, reset, restore, remove }}
    >
      {children}
    </VariantContext.Provider>
  )
}

export function useVariants() {
  const ctx = React.useContext(VariantContext)
  if (!ctx) throw new Error("useVariants outside VariantProvider")
  return ctx
}
