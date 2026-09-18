"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { cn } from "cn"

const variants = ["default", "compact", "wide", "mobile"] as const
const groupModes = ["nested", "accordion"] as const

export function SiteNav() {
  const params = useSearchParams()
  const current = params.get("variant") ?? "default"
  const groups = params.get("groups") ?? "nested"
  const href = (variant: string, g: string) => {
    const q = new URLSearchParams()
    if (variant !== "default") q.set("variant", variant)
    if (g !== "nested") q.set("groups", g)
    const qs = q.toString()
    return qs ? `/?${qs}` : "/"
  }
  return (
    <nav className="flex items-center gap-4 border-b px-6 py-2 text-sm">
      <span className="font-medium">json-editor</span>
      <div className="flex gap-1">
        {variants.map((v) => (
          <Link
            key={v}
            href={href(v, groups)}
            className={cn(
              "rounded-md px-2 py-1 text-muted-foreground hover:text-foreground",
              current === v && "bg-muted text-foreground"
            )}
          >
            {v}
          </Link>
        ))}
      </div>
      <div className="flex gap-1">
        {groupModes.map((g) => (
          <Link
            key={g}
            href={href(current, g)}
            className={cn(
              "rounded-md px-2 py-1 text-muted-foreground hover:text-foreground",
              groups === g && "bg-muted text-foreground"
            )}
          >
            {g}
          </Link>
        ))}
      </div>
      <span className="ml-auto font-mono text-xs text-muted-foreground">
        <kbd>d</kbd> dark
      </span>
    </nav>
  )
}
