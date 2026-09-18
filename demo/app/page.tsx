import { Showcase } from "@demo/components/showcase"
import { Usage } from "@demo/components/usage"
import { CodeBlock } from "@demo/components/code-block"
import type { Variant } from "@/components/ui/json/editor"

const INSTALL =
  "npx shadcn@latest add https://oss.flikk.dev/ui/r/json-editor.json"

const features = [
  {
    title: "Real JSON Schema",
    body: "2020-12 in, 2020-12 out. Round-trips losslessly; keywords the editor has no UI for ride along untouched.",
  },
  {
    title: "Drag anything, anywhere",
    body: "One tree-wide model: any row to any depth, whole groups as one, selections in bulk. Ghost, skeleton, no surprises.",
  },
  {
    title: "Bulk actions",
    body: "Select with click, shift-range or long-press. Toggle flags, move into a group, duplicate, remove — all at once.",
  },
  {
    title: "Type modules",
    body: "A type is a self-contained module: icon, schema, example, what it accepts. Add your own; the editor never branches on type.",
  },
  {
    title: "Presets, parts, hooks",
    body: "Ship the preset, compose the parts, or go headless with two hooks. Same core, your choice of surface.",
  },
  {
    title: "Yours to own",
    body: "shadcn-style: the source lands in components/ui. Tailwind tokens from your globals.css, Base UI underneath, no theme system to learn.",
  },
]

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>
}) {
  const { variant } = await searchParams
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pt-14 pb-24">
      <section className="flex flex-col gap-5">
        <p className="font-mono text-xs text-muted-foreground">
          oss.flikk.dev/ui
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Use flikk&apos;s components in your own projects.
        </h1>
        <p className="max-w-xl text-lg text-pretty text-muted-foreground">
          The pieces we build for flikk, open source and shadcn-style: one
          command copies the source into your app, and it&apos;s yours. First
          up, a JSON Schema builder.
        </p>
        <CodeBlock code={INSTALL} compact className="w-fit max-w-full" />
      </section>

      <section id="demo" className="flex scroll-mt-16 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-medium">JSON Schema builder</h2>
          <p className="text-sm text-muted-foreground">
            A schema, edited as a tree. Four presets from one set of parts.
          </p>
        </div>
        <Showcase initial={(variant as Variant) ?? "default"} />
      </section>

      <section id="usage" className="flex scroll-mt-16 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-medium">Three ways in</h2>
          <p className="text-sm text-muted-foreground">
            Pick how much you want to own.
          </p>
        </div>
        <Usage />
      </section>

      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="flex flex-col gap-1">
            <h3 className="text-sm font-medium">{f.title}</h3>
            <p className="text-sm text-pretty text-muted-foreground">
              {f.body}
            </p>
          </div>
        ))}
      </section>

      <footer className="flex flex-wrap items-center gap-4 border-t border-border pt-6 text-xs text-muted-foreground">
        <span>flikk</span>
        <span>MIT</span>
        <a
          href="https://github.com/flikk-dev/json-editor"
          className="hover:text-foreground"
          target="_blank"
          rel="noreferrer"
        >
          github.com/flikk-dev/json-editor
        </a>
      </footer>
    </main>
  )
}
