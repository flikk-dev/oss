"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"
import { MonitorIcon, SmartphoneIcon } from "lucide-react"
import { VariantDialog } from "@/components/variants/controls"
import { useVariants } from "@/components/variants/provider"

const links = [
  { href: "/", label: "Editor" },
  { href: "/matrix", label: "Matrix" },
]

export function SiteNav() {
  const path = usePathname()
  const { viewport, setViewport } = useVariants()
  return (
    <nav className="flex items-center gap-4 border-b px-6 py-2 text-sm">
      <span className="font-medium">json-editor</span>
      <div className="flex gap-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "rounded-md px-2 py-1 text-muted-foreground hover:text-foreground",
              path === l.href && "bg-muted text-foreground"
            )}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-3">
        <span className="font-mono text-xs text-muted-foreground">
          <kbd>d</kbd> dark
        </span>
        <div
          role="radiogroup"
          aria-label="Preview viewport"
          className="flex gap-0.5 rounded-md bg-muted p-0.5"
        >
          {(
            [
              { v: "auto", Icon: MonitorIcon, title: "Desktop (follows window width)" },
              { v: "phone", Icon: SmartphoneIcon, title: "Phone frame, 390px, forces mobile behaviour" },
            ] as const
          ).map(({ v, Icon, title }) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={viewport === v}
              title={title}
              onClick={() => setViewport(v)}
              className={cn(
                "flex size-6 items-center justify-center rounded transition-colors",
                viewport === v
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
            </button>
          ))}
        </div>
        <VariantDialog />
      </div>
    </nav>
  )
}
