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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { defaultConfig, itemSpecs, type Axis, type ItemKey, type Tier, type VariantConfig } from "@/lib/variants"
import { useVariants, type Snapshot } from "./provider"
import { Segmented } from "./segmented"

/* ------------------------------ segmented ------------------------------- */

function AxisControl({ axis, value, onChange }: { axis: Axis; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      {axis.label && <span className="text-xs">{axis.label}</span>}
      <Segmented value={value} onChange={onChange} options={axis.options} label={axis.label} />
    </div>
  )
}

function AxisRow({ axis, item }: { axis: Axis; item: ItemKey }) {
  const { config, set } = useVariants()
  const value = (config[item] as Record<string, unknown>)[axis.key]
  if (axis.tiered) {
    const v = value as Record<Tier, string>
    return (
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-xs">{axis.label}</span>
        <div className="grid grid-cols-2 gap-2">
          {(["wide", "compact"] as const).map((tier) => (
            <div key={tier} className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground">{tier === "wide" ? "wide ≥ 560px" : "compact < 560px"}</span>
              <AxisControl axis={{ ...axis, label: "" }} value={v[tier]} onChange={(x) => set(item, axis.key, x, tier)} />
            </div>
          ))}
        </div>
      </div>
    )
  }
  return <AxisControl axis={axis} value={value as string} onChange={(x) => set(item, axis.key, x)} />
}

function ItemControls({ item }: { item: ItemKey }) {
  const { reset } = useVariants()
  const spec = itemSpecs.find((s) => s.key === item)!
  const axes = spec.axes as readonly Axis[]
  const sections = [
    { key: "all", label: "Any pointer", axes: axes.filter((a) => !a.pointer) },
    { key: "coarse", label: "Touch only", axes: axes.filter((a) => a.pointer === "coarse") },
  ].filter((s) => s.axes.length)

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs">{spec.label}</div>
          <div className="text-[11px] text-muted-foreground">{spec.description}</div>
        </div>
        <Button variant="ghost" size="icon-xs" title="Reset this primitive" onClick={() => reset(item)}>
          <RotateCcwIcon />
        </Button>
      </div>
      {sections.map((section) => (
        <div key={section.key} className="flex min-w-0 flex-col gap-3 rounded-lg border p-3">
          <span className="text-xs">{section.label}</span>
          {section.axes.map((axis) => (
            <AxisRow key={axis.key} axis={axis} item={item} />
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
    for (const axis of item.axes as readonly Axis[]) {
      const av = a[axis.key] as unknown
      const bv = b[axis.key] as unknown
      if (JSON.stringify(av) === JSON.stringify(bv)) continue
      const label = (x: unknown) => axis.options.find((o) => o.value === x)?.label ?? String(x)
      parts.push(
        av && typeof av === "object"
          ? `${axis.key}: ${label((av as Record<string, string>).wide)} / ${label((av as Record<string, string>).compact)}`
          : label(av)
      )
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
      <Button
        variant="link"
        size="xs"
        onClick={() => restore(snap.id)}
        className="h-auto min-w-0 flex-1 justify-start gap-2 overflow-hidden p-0 text-left font-normal text-foreground no-underline hover:no-underline"
      >
        <span className="w-7 shrink-0 font-mono text-muted-foreground">
          {ago(snap.at)}
        </span>
        <span className="min-w-0 truncate">{summarize(snap.config)}</span>
      </Button>
      {active ? (
        <CheckIcon className="size-3 shrink-0 text-muted-foreground" />
      ) : (
        <Button
          variant="ghost"
          size="icon-xs"
          title="Remove"
          onClick={() => remove(snap.id)}
          className="size-5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100"
        >
          <XIcon className="size-3" />
        </Button>
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
  const [active, setActive] = React.useState<ItemKey>(itemSpecs[0].key)
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
          <ToggleGroup
            variant="outline"
            size="sm"
            spacing={0}
            aria-label="Primitive"
            value={[active]}
            onValueChange={(v) => v[0] && setActive(v[0] as ItemKey)}
            className="flex-wrap"
          >
            {itemSpecs.map((item) => (
              <ToggleGroupItem key={item.key} value={item.key} className="h-6 px-2 text-[11px] font-normal data-pressed:bg-muted">
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <ItemControls item={active} />

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
