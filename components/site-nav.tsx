"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"
import { MonitorIcon, SmartphoneIcon, SquareIcon } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
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
        <ToggleGroup
          variant="outline"
          size="sm"
          spacing={0}
          aria-label="Preview viewport"
          value={[viewport]}
          onValueChange={(v) => v[0] && setViewport(v[0] as "auto" | "compact" | "phone")}
        >
          {(
            [
              { v: "auto", Icon: MonitorIcon, title: "Desktop (follows window width)" },
              { v: "compact", Icon: SquareIcon, title: "Compact box, 500×500 → compact tier" },
              { v: "phone", Icon: SmartphoneIcon, title: "Phone frame, 390px, coarse pointer" },
            ] as const
          ).map(({ v, Icon, title }) => (
            <ToggleGroupItem key={v} value={v} title={title} className="h-6 w-7 min-w-0 px-0 data-pressed:bg-muted">
              <Icon className="size-3.5" />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <VariantDialog />
      </div>
    </nav>
  )
}
