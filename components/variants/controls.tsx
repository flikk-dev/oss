"use client"

import * as React from "react"
import { cn } from "cn"
import {
  CheckIcon,
  CopyIcon,
  RotateCcwIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  defaultConfig,
  itemSpecs,
  type Axis,
  type ItemKey,
  type VariantConfig,
} from "@/lib/variants"
import { useVariants, type Snapshot } from "./provider"

/* ------------------------------ segmented ------------------------------- */

function Segmented({
  axis,
  value,
  onChange,
}: {
  axis: Axis
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-xs">{axis.label}</span>
      <div
        role="radiogroup"
        className="flex min-w-0 flex-wrap gap-0.5 rounded-md bg-muted p-0.5"
      >
        {axis.options.map((o) => {
          const on = o.value === value
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              title={o.hint}
              onClick={() => onChange(o.value)}
              className={cn(
                "h-6 min-w-0 flex-1 truncate rounded px-2 text-[11px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                on
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ItemControls({ item }: { item: ItemKey }) {
  const { config, set, reset } = useVariants()
  const spec = itemSpecs.find((s) => s.key === item)!
  const values = config[item] as Record<string, string>

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-medium">{spec.label}</div>
          <div className="text-[11px] text-muted-foreground">
            {spec.description}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          title="Reset this item to defaults"
          onClick={() => reset(item)}
        >
          <RotateCcwIcon />
        </Button>
      </div>

      {spec.sections.map((section) => (
        <div
          key={section.key}
          className="flex min-w-0 flex-col gap-3 rounded-lg border p-3"
        >
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-medium">{section.label}</span>
            <span className="text-[11px] text-muted-foreground">
              {section.hint}
            </span>
          </div>
          {spec.axes
            .filter((a) => a.section === section.key)
            .map((axis) => (
              <Segmented
                key={axis.key}
                axis={axis}
                value={values[axis.key]}
                onChange={(v) => set(item, axis.key, v)}
              />
            ))}
        </div>
      ))}
    </div>
  )
}

/* ------------------------------- history -------------------------------- */

/** only axes that differ from defaults, e.g. "trigger=chip · layout=grid" */
function summarize(config: VariantConfig) {
  const d = defaultConfig()
  const parts: string[] = []
  for (const item of itemSpecs) {
    const a = config[item.key] as Record<string, string>
    const b = d[item.key] as Record<string, string>
    for (const axis of item.axes) {
      if (a[axis.key] === b[axis.key]) continue
      const opt = axis.options.find((o) => o.value === a[axis.key])
      parts.push(opt?.label ?? a[axis.key])
    }
  }
  return parts.length ? parts.join(" · ") : "defaults"
}

function ago(ts: number) {
  const s = Math.max(0, (Date.now() - ts) / 1000)
  if (s < 60) return "now"
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

function HistoryRow({ snap, active }: { snap: Snapshot; active: boolean }) {
  const { restore, remove } = useVariants()
  return (
    <div
      className={cn(
        "group flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 text-[11px]",
        active ? "bg-muted" : "hover:bg-muted/60"
      )}
    >
      <button
        type="button"
        onClick={() => restore(snap.id)}
        className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-left outline-none"
      >
        <span className="w-7 shrink-0 font-mono text-muted-foreground">
          {ago(snap.at)}
        </span>
        <span className="min-w-0 truncate">{summarize(snap.config)}</span>
      </button>
      {active ? (
        <CheckIcon className="size-3 shrink-0 text-muted-foreground" />
      ) : (
        <button
          type="button"
          title="Remove"
          onClick={() => remove(snap.id)}
          className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground"
        >
          <XIcon className="size-3" />
        </button>
      )}
    </div>
  )
}

function History() {
  const { config, history } = useVariants()
  const cur = JSON.stringify(config)
  if (!history.length)
    return (
      <p className="text-[11px] text-muted-foreground">
        Empty. Each combination you settle on shows up here.
      </p>
    )
  return (
    <div className="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
      {history.map((s) => (
        <HistoryRow
          key={s.id}
          snap={s}
          active={JSON.stringify(s.config) === cur}
        />
      ))}
    </div>
  )
}

/* -------------------------------- dialog -------------------------------- */

function CopyConfig() {
  const { config } = useVariants()
  const [copied, setCopied] = React.useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {}
  }
  return (
    <Button variant="outline" size="xs" onClick={copy}>
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? "Copied" : "Copy JSON"}
    </Button>
  )
}

export function VariantDialog() {
  const { reset } = useVariants()
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <SlidersHorizontalIcon /> Variants
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Variants</DialogTitle>
          <DialogDescription>
            Each choice applies to preview immediately. Past combinations
            listed under History — click one to go back.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-w-0 flex-col gap-5">
          {itemSpecs.map((item) => (
            <ItemControls key={item.key} item={item.key} />
          ))}

          <div className="flex flex-col gap-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">History</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="xs" onClick={() => reset()}>
                  <RotateCcwIcon /> Reset all
                </Button>
                <CopyConfig />
              </div>
            </div>
            <History />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
