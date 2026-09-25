import type { Metadata } from "next";
import { Showcase } from "@/components/showcase";
import { Usage } from "@/components/usage";
import { CodeBlock } from "@/components/code-block";
import type { Variant } from "@/registry/base-nova/ui/json/editor";
import { CATALOG, installCommand } from "@/lib/catalog";
import { SITE } from "@/app/layout";

const entry = CATALOG.find((e) => e.slug === "json-editor")!;

export const metadata: Metadata = {
  title: entry.name,
  description: entry.summary,
};

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
    body: "The code lands in components/ui, styled from the tokens in your globals.css, built on Base UI. You edit it like anything else in your app.",
  },
];

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  const { variant } = await searchParams;
  return (
    <main className="flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{entry.name}</h1>
        <p className="max-w-[62ch] text-sm text-pretty text-muted-foreground">{entry.summary}</p>
        <CodeBlock code={installCommand(SITE, entry.registry!)} compact className="max-w-full" />
      </header>

      <section id="demo" className="flex scroll-mt-16 flex-col gap-4">
        <h2 className="text-lg font-medium">Try it</h2>
        <Showcase initial={(variant as Variant) ?? "default"} />
      </section>

      <section id="usage" className="flex scroll-mt-16 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-medium">Three ways in</h2>
          <p className="text-sm text-muted-foreground">
            You choose how much of it you want to own.
          </p>
        </div>
        <Usage />
      </section>

      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {features.map((f) => (
          <div key={f.title} className="flex flex-col gap-1">
            <h3 className="text-sm font-medium">{f.title}</h3>
            <p className="text-sm text-pretty text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
