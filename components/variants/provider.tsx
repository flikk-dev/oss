"use client"

import * as React from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { defaultConfig, itemSpecs, type Axis, type ItemKey, type Tier, type VariantConfig } from "@/lib/variants"

const HISTORY_MAX = 30

export type Snapshot = { id: string; at: number; config: VariantConfig }
export type Viewport = "auto" | "compact" | "phone"

type LabState = {
  config: VariantConfig
  history: Snapshot[]
  viewport: Viewport
  set: (item: ItemKey, axis: string, value: string, tier?: Tier) => void
  reset: (item?: ItemKey) => void
  restore: (id: string) => void
  remove: (id: string) => void
  setViewport: (v: Viewport) => void
}

/** merge stored config over defaults; drops unknown keys, fills missing ones */
function hydrate(stored: unknown): VariantConfig {
  const base = defaultConfig() as Record<string, Record<string, unknown>>
  if (!stored || typeof stored !== "object") return base as VariantConfig
  for (const item of itemSpecs) {
    const s = (stored as Record<string, unknown>)[item.key]
    if (!s || typeof s !== "object") continue
    for (const axis of item.axes as readonly Axis[]) {
      const v = (s as Record<string, unknown>)[axis.key]
      const ok = (x: unknown) => typeof x === "string" && axis.options.some((o) => o.value === x)
      if (axis.tiered) {
        const cur = base[item.key][axis.key] as Record<Tier, string>
        if (v && typeof v === "object") {
          const o = v as Record<string, unknown>
          if (ok(o.wide)) cur.wide = o.wide as string
          if (ok(o.compact)) cur.compact = o.compact as string
        } else if (ok(v)) cur.wide = cur.compact = v as string
      } else if (ok(v)) base[item.key][axis.key] = v
    }
  }
  return base as VariantConfig
}

const same = (a: VariantConfig, b: VariantConfig) => JSON.stringify(a) === JSON.stringify(b)

let commitTimer: ReturnType<typeof setTimeout> | null = null

export const useLab = create<LabState>()(
  persist(
    (set, get) => {
      /** debounced: rapid clicks collapse into one snapshot; newest first, deduped, capped */
      const commit = (config: VariantConfig) => {
        if (commitTimer) clearTimeout(commitTimer)
        commitTimer = setTimeout(() => {
          const prev = get().history
          if (prev.some((s) => same(s.config, config))) return
          set({
            history: [{ id: Math.random().toString(36).slice(2, 10), at: Date.now(), config }, ...prev].slice(
              0,
              HISTORY_MAX
            ),
          })
        }, 1500)
      }
      const apply = (config: VariantConfig, record = true) => {
        set({ config })
        if (record) commit(config)
      }
      return {
        config: defaultConfig(),
        history: [],
        viewport: "auto",
        set: (item, axis, value, tier) => {
          const cur = get().config as Record<string, Record<string, unknown>>
          const prev = cur[item][axis]
          const next =
            prev && typeof prev === "object" ? { ...(prev as object), [tier ?? "wide"]: value } : value
          apply({ ...cur, [item]: { ...cur[item], [axis]: next } } as VariantConfig)
        },
        reset: (item) => {
          const d = defaultConfig()
          apply(item ? { ...get().config, [item]: d[item] } : d)
        },
        restore: (id) => {
          const snap = get().history.find((s) => s.id === id)
          if (snap) apply(snap.config, false)
        },
        remove: (id) => set({ history: get().history.filter((s) => s.id !== id) }),
        setViewport: (viewport) => set({ viewport }),
      }
    },
    {
      name: "schema-editor-lab-v2",
      partialize: (s) => ({ config: s.config, history: s.history, viewport: s.viewport }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<LabState>
        return {
          ...current,
          config: hydrate(p.config),
          history: (p.history ?? []).map((h) => ({ ...h, config: hydrate(h.config) })),
          viewport: p.viewport ?? "auto",
        }
      },
    }
  )
)

/** kept for existing call sites */
export function useVariants() {
  return useLab()
}

export function VariantProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
