"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";

/** a running example with its source one click away, the way shadcn shows them */
export function Example({ code, children }: { code: string; children: React.ReactNode }) {
  const [showing, setShowing] = React.useState<"preview" | "code">("preview");
  const tab = (key: "preview" | "code", label: string) => (
    <button
      type="button"
      onClick={() => setShowing(key)}
      aria-pressed={showing === key}
      className={cn(
        "rounded-sm px-2 py-1 text-xs",
        showing === key
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1">
        {tab("preview", "Preview")}
        {tab("code", "Code")}
      </div>
      {showing === "preview" ? <div className="py-2">{children}</div> : <CodeBlock code={code} />}
    </div>
  );
}
