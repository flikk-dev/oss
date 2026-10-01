"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { TocItem } from "./docs";

/**
 * What is on this page, and where you are in it.
 *
 * The rail is one line with a segment on it rather than a highlighted row: the
 * segment can sit across a section and its subsections at once, which a
 * selected row cannot, and it moves rather than blinks between them.
 */
export function Toc({ items }: { items: TocItem[] }) {
  const [here, setHere] = React.useState(items[0]?.id);
  const links = React.useRef(new Map<string, HTMLAnchorElement>());
  const [segment, setSegment] = React.useState<{ top: number; height: number } | null>(null);

  React.useEffect(() => {
    if (!items.length) return;
    const seen = new Map<string, number>();
    const watcher = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.intersectionRatio);
        // the heading nearest the top that is still on screen owns the rail
        const onScreen = items.filter((i) => (seen.get(i.id) ?? 0) > 0);
        if (onScreen[0]) setHere(onScreen[0].id);
      },
      // only the top slice counts, so a section claims the rail as it arrives
      { rootMargin: "-80px 0px -70% 0px", threshold: [0, 1] },
    );
    for (const i of items) {
      const el = document.getElementById(i.id);
      if (el) watcher.observe(el);
    }
    return () => watcher.disconnect();
  }, [items]);

  React.useLayoutEffect(() => {
    const link = here ? links.current.get(here) : null;
    setSegment(link ? { top: link.offsetTop, height: link.offsetHeight } : null);
  }, [here, items]);

  if (!items.length) return null;
  return (
    <nav aria-label="On this page" className="hidden flex-col gap-2 lg:flex">
      <p className="text-xs font-medium">On this page</p>
      <div className="relative">
        <span aria-hidden className="absolute inset-y-0 left-0 w-px bg-border" />
        {segment && (
          <span
            aria-hidden
            style={{ top: segment.top, height: segment.height }}
            className="absolute left-0 w-px bg-foreground transition-all duration-200"
          />
        )}
        <ul className="flex flex-col text-sm">
          {items.map((i) => (
            <li key={i.id}>
              <a
                ref={(el) => {
                  if (el) links.current.set(i.id, el);
                  else links.current.delete(i.id);
                }}
                href={`#${i.id}`}
                aria-current={here === i.id ? "location" : undefined}
                onClick={() => setHere(i.id)}
                className={cn(
                  "block py-1 transition-colors",
                  i.depth === 2 ? "pl-6" : "pl-3",
                  here === i.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {i.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
