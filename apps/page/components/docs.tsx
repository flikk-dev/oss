import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { Toc } from "./toc";

export type TocItem = { id: string; label: string; depth?: 1 | 2 };

/** a docs page: content on the left, what is on this page on the right */
export function Article({
  title,
  lede,
  toc,
  children,
}: {
  title: string;
  lede: string;
  toc: TocItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-10">
      <main className="flex min-w-0 flex-col gap-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="max-w-[62ch] text-base text-pretty text-muted-foreground">{lede}</p>
        </header>
        {children}
      </main>
      <div className="mt-10 lg:mt-0">
        <div className="flex flex-col gap-6 lg:sticky lg:top-20">
          <Toc items={toc} />
          <FlikkCard />
        </div>
      </div>
    </div>
  );
}

/** the one place on the site that points at Flikk! */
function FlikkCard() {
  return (
    <a
      href="https://flikk.dev"
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-4 transition-colors hover:bg-muted/70"
    >
      <p className="text-sm font-medium">Built while building Flikk!</p>
      <p className="text-sm text-pretty text-muted-foreground">
        Flikk turns the work you describe into software that runs it. These components came out of
        making it.
      </p>
      <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary">
        See Flikk!
        <ArrowUpRightIcon className="size-3.5 transition-transform group-hover:translate-x-px group-hover:-translate-y-px" />
      </span>
    </a>
  );
}

export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-20 flex-col gap-4">
      <h2 className="border-b border-border pb-2 text-xl font-medium">{title}</h2>
      {children}
    </section>
  );
}

export function SubSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="flex scroll-mt-20 flex-col gap-3">
      <h3 className="text-base font-medium">{title}</h3>
      {children}
    </div>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return <p className="max-w-[62ch] text-sm text-pretty text-muted-foreground">{children}</p>;
}

export { Link };
