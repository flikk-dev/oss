"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Highlight } from "./highlight";

/** monospace block with a copy button; no highlighter, tokens from globals.css */
export function CodeBlock({
  code,
  className,
  compact,
}: {
  code: string;
  className?: string;
  /** one-liner: inline padding, no scroll, no colours */
  compact?: boolean;
}) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    await navigator.clipboard?.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className={cn("group/code relative rounded-lg border border-border bg-card", className)}>
      <pre
        className={cn(
          "overflow-x-auto font-mono text-xs leading-relaxed text-foreground",
          compact ? "px-3 py-2 pr-10" : "p-4 pr-10",
        )}
      >
        <code>{compact ? code : <Highlight code={code} />}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Copy"
        onClick={copy}
        className="absolute top-1.5 right-1.5 text-muted-foreground opacity-0 group-hover/code:opacity-100 focus-visible:opacity-100"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </div>
  );
}
