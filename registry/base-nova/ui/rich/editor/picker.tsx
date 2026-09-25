"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A ready-made list for `renderPicker`.
 *
 * The component deliberately knows nothing about pickers, which leaves every
 * host writing the same arrow keys, the same wrap-around, the same Escape, and
 * the same care about a slow search landing after a faster one. This is that
 * code, written once: say how to find things, and what to do with one.
 *
 * Skip it and render your own list whenever the arrangement matters; it is a
 * convenience, not the interface.
 */

export type PickerItem = {
  /** what replaces the text being typed */
  value: string;
  label: React.ReactNode;
  /** a dimmer trailing note, usually the raw form */
  hint?: React.ReactNode;
  icon?: React.ReactNode;
};

export function RichPicker({
  query = "",
  items,
  search,
  onPick,
  close,
  className,
}: {
  /** what is being typed, for `search` */
  query?: string;
  /** a fixed list, when everything is already in hand */
  items?: PickerItem[];
  /** or a lookup, run as the query changes */
  search?: (query: string) => PickerItem[] | Promise<PickerItem[]>;
  onPick: (value: string) => void;
  close: () => void;
  className?: string;
}) {
  const [found, setFound] = React.useState<PickerItem[]>(items ?? []);
  const [loading, setLoading] = React.useState(false);
  const [at, setAt] = React.useState(0);

  /**
   * Only the newest search may write.
   *
   * Two keystrokes are two lookups, and the first can land last. Stamping each
   * one and ignoring anything stale is what stops the list flicking back to
   * results for a query that is already gone.
   */
  const newest = React.useRef(0);
  React.useEffect(() => {
    if (!search) return;
    const mine = ++newest.current;
    const out = search(query);
    if (!(out instanceof Promise)) {
      setFound(out);
      setLoading(false);
      return;
    }
    setLoading(true);
    out
      .then((list) => {
        if (mine !== newest.current) return;
        setFound(list);
        setAt(0);
      })
      .catch(() => mine === newest.current && setFound([]))
      .finally(() => mine === newest.current && setLoading(false));
  }, [query, search]);

  const list = items ?? found;
  const here = Math.min(at, Math.max(0, list.length - 1));

  React.useEffect(() => {
    if (!list.length) return;
    const onKey = (e: KeyboardEvent) => {
      // Tab walks the list like the arrows, rather than leaving the field
      const step =
        e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)
          ? 1
          : e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)
            ? -1
            : 0;
      if (step) {
        e.preventDefault();
        setAt((n) => (Math.min(n, list.length - 1) + step + list.length) % list.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        onPick(list[here]!.value);
      } else if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    // capture, so the field does not see the key first and insert it
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [list, here, onPick, close]);

  if (!list.length && !loading) return null;
  return (
    <div
      className={cn(
        "absolute z-50 mt-1 max-h-64 min-w-56 overflow-y-auto rounded-md border border-border",
        "bg-popover p-1 text-popover-foreground shadow-md",
        className,
      )}
    >
      {loading && !list.length ? (
        <p className="px-2 py-1.5 text-sm text-muted-foreground">Searching</p>
      ) : (
        <ul role="listbox" aria-busy={loading || undefined}>
          {list.map((item, i) => (
            <li key={item.value}>
              <button
                type="button"
                role="option"
                aria-selected={i === here}
                onMouseDown={(e) => {
                  // mousedown, not click: a click would blur the field first
                  e.preventDefault();
                  onPick(item.value);
                }}
                onMouseEnter={() => setAt(i)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm",
                  i === here ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
                {item.hint && (
                  <span className="ml-auto font-mono text-xs text-muted-foreground">
                    {item.hint}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
