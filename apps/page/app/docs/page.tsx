import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { CATALOG } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Components",
  description: "The components flikk has open-sourced, and how to install them.",
};

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
                {e.status === "in progress" && (
                  <span className="rounded-xs border border-border px-1 font-mono text-3xs tracking-wide text-muted-foreground uppercase">
                    wip
                  </span>
                )}
                <ArrowRightIcon className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
              <span className="text-sm text-pretty text-muted-foreground">{e.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
