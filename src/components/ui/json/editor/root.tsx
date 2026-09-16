"use client"

import * as React from "react"
import { cn } from "cn"
import { useStore } from "zustand"
import type { SlugCase } from "@/store/slug"
import type { FieldTree } from "@/store/tree"
import { createEditorStore, toTree } from "@/store/editor"
import { EditorContext, type Variant } from "@/context/editor"

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
        data-slot="json-editor"
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
