import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { CATALOG } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Components",
  description: "The components Flikk! has open sourced, and how to install them.",
};

/** the running order, stated here and enforced by <ComponentPage> */
const SHAPE = [
  { title: "Example", body: "the component running, with the file behind it one click away." },
  { title: "Installation", body: "the CLI command, and the manual copy for when you want it." },
  { title: "Usage", body: "the imports and the smallest thing that works." },
  { title: "Composition", body: "how the parts nest, and what each one is for." },
  { title: "Examples", body: "one running demo per idea, each with its own file." },
  { title: "API reference", body: "the whole surface, as a signature." },
];

export default function DocsIndex() {
  return (
    <main className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Components</h1>
        <p className="max-w-[60ch] text-sm text-muted-foreground">
          Each one is source you copy into your app, not a package you depend on. Pick a component
          to see it running, read how it is put together, and take it.
        </p>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2">
        {CATALOG.map((e) => (
          <li key={e.slug}>
            <Link
              href={`/docs/${e.slug}`}
              className="group flex h-full flex-col gap-1.5 rounded-lg border border-border p-4 transition-colors hover:border-foreground/25 hover:bg-muted/40"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                {e.name}
                <ArrowRightIcon className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
              <span className="text-sm text-pretty text-muted-foreground">{e.summary}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="flex flex-col gap-3 border-t border-border pt-8">
        <h2 className="text-lg font-medium">Every page reads the same way</h2>
        <p className="max-w-[62ch] text-sm text-pretty text-muted-foreground">
          Component pages are not written freehand. They are rendered from one shape, so the section
          you want is where it was on the last page you read, and a page cannot quietly drop
          Installation or invent a heading of its own.
        </p>
        <ol className="flex max-w-[62ch] flex-col gap-2 text-sm">
          {SHAPE.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="w-4 shrink-0 font-mono text-xs text-muted-foreground">{i + 1}</span>
              <span>
                <span className="font-medium">{s.title}</span>
                <span className="text-muted-foreground"> {s.body}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="max-w-[62ch] text-sm text-muted-foreground">
          Every Code tab holds the example&apos;s whole file, read from disk at build, with the
          import path rewritten to where the CLI puts it. Nothing on these pages is a snippet typed
          out beside the thing it claims to show.
        </p>
      </section>
    </main>
  );
}
