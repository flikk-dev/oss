"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Entry } from "@/lib/catalog";

export function DocsNav({ entries }: { entries: Entry[] }) {
  const here = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {entries.map((e) => {
        const href = `/docs/${e.slug}`;
        const on = here === href;
        return (
          <Link
            key={e.slug}
            href={href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-2 py-1 text-sm whitespace-nowrap",
              on
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {e.name}
          </Link>
        );
      })}
    </nav>
  );
}
