import Link from "next/link";
import { CATALOG } from "@/lib/catalog";
import { DocsNav } from "@/components/docs-nav";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:flex-row lg:gap-12">
      <aside className="lg:w-52 lg:shrink-0">
        <div className="lg:sticky lg:top-20">
          <p className="mb-2 font-mono text-2xs tracking-widest text-muted-foreground uppercase">
            Components
          </p>
          <DocsNav entries={CATALOG} />
          <p className="mt-6 text-2xs text-muted-foreground">
            More to come. Everything here is MIT —{" "}
            <Link href="/" className="underline decoration-border underline-offset-2">
              why we publish it
            </Link>
            .
          </p>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
