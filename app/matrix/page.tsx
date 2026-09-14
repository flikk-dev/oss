import { JsonHeader } from "@/components/json/header"

type Row = {
  label: string
  props: React.ComponentProps<typeof JsonHeader>
}

const triggers: Row[] = [
  { label: "icon", props: { trigger: "icon" } },
  { label: "icon-boxed", props: { trigger: "icon-boxed" } },
  { label: "icon-boxed · tinted", props: { trigger: "icon-boxed", iconStyle: "tinted" } },
  { label: "label", props: { trigger: "label" } },
  { label: "label · chevron · tinted", props: { trigger: "label", chevron: true, iconStyle: "tinted" } },
  { label: "chip", props: { trigger: "chip" } },
  { label: "chip · tinted · chevron", props: { trigger: "chip", iconStyle: "tinted", chevron: true } },
]

const sizes: Row[] = [
  { label: "sm", props: { size: "sm", trigger: "label" } },
  { label: "md", props: { size: "md", trigger: "label" } },
  { label: "lg", props: { size: "lg", trigger: "label" } },
]

const layouts: Row[] = [
  { label: "list · boxed · check", props: { layout: "list", iconStyle: "boxed", selection: "check" } },
  { label: "list · tinted · highlight", props: { layout: "list", iconStyle: "tinted", selection: "highlight" } },
  { label: "list · plain · both · no desc", props: { layout: "list", iconStyle: "plain", selection: "both", showDescription: false } },
  { label: "list · grouped · tinted", props: { layout: "list", iconStyle: "tinted", grouped: true } },
  { label: "compact · plain", props: { layout: "compact", iconStyle: "plain" } },
  { label: "compact · boxed · grouped", props: { layout: "compact", iconStyle: "boxed", grouped: true } },
  { label: "grid · boxed", props: { layout: "grid", iconStyle: "boxed", selection: "highlight" } },
  { label: "grid · tinted · loose", props: { layout: "grid", iconStyle: "tinted", density: "loose", selection: "highlight" } },
  { label: "grid · tinted · grouped", props: { layout: "grid", iconStyle: "tinted", grouped: true, selection: "highlight" } },
]

function Section({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      <div className="flex flex-col divide-y rounded-lg border">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-6 px-3 py-2">
            <div className="w-56 shrink-0 font-mono text-[11px] text-muted-foreground">
              {r.label}
            </div>
            <JsonHeader {...r.props} />
          </div>
        ))}
      </div>
    </section>
  )
}

export default function Page() {
  return (
    <div className="flex flex-col gap-10 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-sm font-medium">Type picker · variant matrix</h1>
        <p className="text-xs text-muted-foreground">
          Every axis side by side. Pick winners on the landing page.
        </p>
      </div>
      <Section title="Trigger" rows={triggers} />
      <Section title="Size" rows={sizes} />
      <Section title="Menu layout" rows={layouts} />
    </div>
  )
}
