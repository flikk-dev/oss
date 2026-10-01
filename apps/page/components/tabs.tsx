"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Tabs({
  tabs,
}: {
  tabs: { id: string; label: string; content: React.ReactNode }[];
}) {
  const [on, setOn] = React.useState(tabs[0]?.id);
  const showing = tabs.find((t) => t.id === on) ?? tabs[0];
  if (!showing) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-4 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setOn(t.id)}
            aria-pressed={t.id === showing.id}
            className={cn(
              "-mb-px border-b-2 pb-2 text-sm",
              t.id === showing.id
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {showing.content}
    </div>
  );
}
