"use client"

import * as React from "react"
import { SchemaEditor, type PartialTheme } from "@/components/ui/schema-editor"
import type { JsonTypeKey } from "@/components/ui/schema-editor/types"

type Row = { label: string; theme: PartialTheme }

const triggers: Row[] = [
  { label: "icon · ghost", theme: { icon: { trigger: "icon" } } },
  { label: "icon-boxed · tinted", theme: { icon: { trigger: "icon-boxed", style: "tinted" } } },
  { label: "icon-boxed · boxed", theme: { icon: { trigger: "icon-boxed", style: "boxed" } } },
  { label: "label · chevron", theme: { icon: { trigger: "label", chevron: "true" } } },
  { label: "chip · tinted", theme: { icon: { trigger: "chip", style: "tinted" } } },
]

const sizes: Row[] = [
  { label: "xs", theme: { icon: { size: "xs", trigger: "label" }, text: { size: "xs" } } },
  { label: "sm", theme: { icon: { size: "sm", trigger: "label" }, text: { size: "sm" } } },
  { label: "md", theme: { icon: { size: "md", trigger: "label" }, text: { size: "md" } } },
  { label: "lg", theme: { icon: { size: "lg", trigger: "label" }, text: { size: "lg" } } },
]

const menus: Row[] = [
  { label: "list · tight · grouped", theme: { menu: { layout: "list", density: "tight", grouped: "true" } } },
  { label: "compact · compact · plain icons", theme: { menu: { layout: "compact", density: "compact" }, icon: { style: "plain" } } },
  { label: "grid · loose · highlight", theme: { menu: { layout: "grid", density: "loose", selection: "highlight" } } },
  { label: "compact · xs text · no groups", theme: { menu: { layout: "compact", grouped: "false" }, text: { size: "xs" } } },
]

function Picker({ theme }: { theme: PartialTheme }) {
  const [type, setType] = React.useState<JsonTypeKey>("string")
  return (
    <SchemaEditor.Variants {...theme}>
      <div className="flex items-center gap-2">
        <SchemaEditor.TypePicker value={type} onChange={setType} />
        <span className="font-mono text-xs">fieldName</span>
      </div>
    </SchemaEditor.Variants>
  )
}

function Section({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs tracking-wide text-muted-foreground uppercase">{title}</h2>
      <div className="flex flex-col divide-y rounded-lg border">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-6 px-3 py-2">
            <div className="w-56 shrink-0 font-mono text-[11px] text-muted-foreground">{r.label}</div>
            <Picker theme={r.theme} />
          </div>
        ))}
      </div>
    </section>
  )
}

export default function Page() {
  return (
    <SchemaEditor value={[]} onChange={() => {}}>
      <div className="flex flex-col gap-10 p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-sm">Type picker · primitive matrix</h1>
          <p className="text-xs text-muted-foreground">
            Each row overrides single axes via <code>SchemaEditor.Variants</code>.
          </p>
        </div>
        <Section title="icon.trigger / icon.style" rows={triggers} />
        <Section title="icon.size + text.size" rows={sizes} />
        <Section title="menu.*" rows={menus} />
      </div>
    </SchemaEditor>
  )
}
