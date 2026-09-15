"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { cn } from "cn"

const variants = ["default", "compact", "wide", "mobile"] as const

export function SiteNav() {
  const current = useSearchParams().get("variant") ?? "default"
  return (
    <nav className="flex items-center gap-4 border-b px-6 py-2 text-sm">
      <span className="font-medium">json-editor</span>
      <div className="flex gap-1">
        {variants.map((v) => (
          <Link
            key={v}
            href={v === "default" ? "/" : `/?variant=${v}`}
            className={cn(
              "rounded-md px-2 py-1 text-muted-foreground hover:text-foreground",
              current === v && "bg-muted text-foreground"
            )}
          >
            {v}
          </Link>
        ))}
      </div>
      <span className="ml-auto font-mono text-xs text-muted-foreground">
        <kbd>d</kbd> dark
      </span>
    </nav>
  )
}
