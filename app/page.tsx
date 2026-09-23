import { Showcase } from "@/components/showcase";
import { Usage } from "@/components/usage";
import { CodeBlock } from "@/components/code-block";
import type { Variant } from "@/registry/base-nova/ui/json/editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRightIcon, SparklesIcon } from "lucide-react";

const GITHUB = "https://github.com/flikk-dev/oss";

const INSTALL = "npx shadcn@latest add https://oss.flikk.dev/ui/r/json-editor.json";

const features = [
  {
    title: "You get real JSON Schema back",
    body: "Draft 2020-12 in and out. Keywords the editor has no UI for stay on the field and come back untouched.",
  },
  {
    title: "You drag any field anywhere",
    body: "One model for the whole tree: a row to any depth, a group as one piece, a selection as a batch. A skeleton marks the slot, the siblings make room, and the row lands where the skeleton was.",
  },
  {
    title: "You edit ten fields at once",
    body: "Select with a click, shift-click for a range, or a long press on touch. Then toggle flags, move into a group, duplicate, or remove the lot.",
  },
  {
    title: "You add your own types",
    body: "A type is one object: icon, label, schema, example, what it accepts, its own extra UI. The editor picks it up; nothing inside branches on the type name.",
  },
  {
    title: "You choose how deep to go",
    body: "Ship the preset, compose the parts, or build your own rows on two hooks. The built-in parts are written on the same hooks.",
  },
  {
    title: "You own the source",
    body: "The shadcn way: the code lands in components/ui, styled from the tokens in your globals.css, built on Base UI. You edit it like anything else in your app.",
  },
];

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  const { variant } = await searchParams;
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pt-14 pb-24">
      <section className="flex flex-col gap-6">
        <Badge variant="outline" className="w-fit gap-1.5 font-mono font-normal">
          <SparklesIcon className="size-3 text-primary" />
          oss.flikk.dev/ui · open source
        </Badge>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          Use flikk&apos;s components
          <br />
          <span className="text-primary">in your own projects.</span>
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
          The components we build for{" "}
          <a
            href="https://flikk.dev"
            className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
          >
            flikk
          </a>
          , shipped the shadcn way. You run one command, the source lands in your app, and you own
          it from there. The first one is a JSON Schema builder.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <CodeBlock code={INSTALL} compact className="max-w-full" />
          <Button
            variant="outline"
            nativeButton={false}
            render={<a href={GITHUB} target="_blank" rel="noreferrer" />}
          >
            GitHub <ArrowUpRightIcon />
          </Button>
        </div>
      </section>

      <section id="demo" className="flex scroll-mt-16 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-medium">JSON Schema builder</h2>
          <p className="text-sm text-muted-foreground">
            You edit the schema as a tree and get valid JSON Schema back. Four presets, one set of
            parts.
          </p>
        </div>
        <Showcase initial={(variant as Variant) ?? "default"} />
      </section>

      <section id="usage" className="flex scroll-mt-16 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-medium">Three ways in</h2>
          <p className="text-sm text-muted-foreground">
            You choose how much of it you want to own.
          </p>
        </div>
        <Usage />
      </section>

      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="flex flex-col gap-1">
            <h3 className="text-sm font-medium">{f.title}</h3>
            <p className="text-sm text-pretty text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="flex flex-wrap items-center gap-4 border-t border-border pt-6 text-xs text-muted-foreground">
        <a href="https://flikk.dev" className="hover:text-foreground">
          flikk.dev
        </a>
        <span>MIT</span>
        <a href={GITHUB} className="hover:text-foreground" target="_blank" rel="noreferrer">
          github.com/flikk-dev/oss
        </a>
      </footer>
    </main>
  );
}
