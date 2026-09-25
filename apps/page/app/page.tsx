import Link from "next/link";
import { ArrowRightIcon, ArrowUpRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CATALOG } from "@/lib/catalog";

const GITHUB = "https://github.com/flikk-dev/oss";

/** why any of this is public, in the order someone would ask */
const why = [
  {
    title: "It was never Flikk-specific",
    body: "A schema editor or a text field with objects in it has nothing to do with our product. Building it here forces it to stay generic, because nothing about Flikk is in scope.",
  },
  {
    title: "You own the source",
    body: "One command copies the files into your app. No package to depend on, no version to chase, no wrapper around someone else's decisions — you edit it like anything else you wrote.",
  },
  {
    title: "MIT, with no catch",
    body: "Use it commercially, fork it, strip our name off it. We are not building a business on this code; we are building one on what we make with it.",
  },
];

export default function Page() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-20 px-6 pt-16 pb-24">
      <section className="flex flex-col gap-6">
        <Badge variant="outline" className="w-fit gap-1.5 font-mono font-normal">
          MIT · open source
        </Badge>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          The parts of{" "}
          <a href="https://flikk.dev" className="text-primary hover:underline">
            flikk
          </a>{" "}
          that were never ours to keep.
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
          We keep building pieces that are useful well outside our product. Those get published here
          under MIT, shipped the shadcn way: you run one command, the source lands in your app, and
          it is yours from there.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button nativeButton={false} render={<Link href="/docs" />}>
            Browse components <ArrowRightIcon />
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<a href={GITHUB} target="_blank" rel="noreferrer" />}
          >
            GitHub <ArrowUpRightIcon />
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-medium">What&apos;s out</h2>
          <Link
            href="/docs"
            className="text-sm text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
          >
            All components
          </Link>
        </div>
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
                <span className="text-sm text-pretty text-muted-foreground">{e.blurb}</span>
              </Link>
            </li>
          ))}
          <li className="flex h-full flex-col justify-center gap-1 rounded-lg border border-dashed border-border p-4">
            <span className="text-sm font-medium text-muted-foreground">
              And whatever&apos;s next
            </span>
            <span className="text-sm text-pretty text-muted-foreground">
              Components for now. Anything else we build that outgrows our own use will land here
              the same way.
            </span>
          </li>
        </ul>
      </section>

      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
        {why.map((w) => (
          <div key={w.title} className="flex flex-col gap-1">
            <h3 className="text-sm font-medium">{w.title}</h3>
            <p className="text-sm text-pretty text-muted-foreground">{w.body}</p>
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
