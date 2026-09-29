"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon, TerminalIcon } from "lucide-react";

export function Terminal({ commands }: { commands: Record<string, string> }) {
  const names = Object.keys(commands);
  const [on, setOn] = React.useState(names.at(-1)!);
  const [copied, setCopied] = React.useState(false);
  const command = commands[on] ?? "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* a refused clipboard is not worth an error */
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
        <span className="flex size-6 items-center justify-center rounded-sm bg-muted text-muted-foreground">
          <TerminalIcon className="size-3.5" />
        </span>
        {names.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setOn(n)}
            aria-pressed={n === on}
            className={cn(
              "rounded-sm px-2 py-0.5 font-mono text-xs",
              n === on ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={copy}
          aria-label="Copy"
          className="ml-auto rounded-sm p-1 text-muted-foreground hover:text-foreground"
        >
          {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 font-mono text-xs text-foreground">
        <code>{command}</code>
      </pre>
    </div>
  );
}
