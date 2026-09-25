import Link from "next/link";
import { ArrowRightIcon, ArrowUpRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATALOG } from "@/lib/catalog";

const GITHUB = "https://github.com/flikk-dev/oss";

export default function Page() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-16 px-6 pt-20 pb-24">
      <section className="flex flex-col gap-6">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          The parts of flikk that were never ours to keep.
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
          We keep building pieces that are useful well outside our product. Those get published here
          under MIT. One command copies the source into your app, and it is yours from there.
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
        <h2 className="text-sm font-medium">What is out</h2>
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
                <span className="text-sm text-pretty text-muted-foreground">{e.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <footer className="flex flex-wrap items-center gap-4 border-t border-border pt-6 text-xs text-muted-foreground">
        <span>MIT</span>
        <a href={GITHUB} className="hover:text-foreground" target="_blank" rel="noreferrer">
          github.com/flikk-dev/oss
        </a>
      </footer>
    </main>
  );
}
