"use client"

import * as React from "react"
import { cn } from "cn"
import { CheckIcon, type LucideIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useEnv, useTheme } from "./root"
import { flag } from "./theme"
import { toneClasses, type JsonType } from "./types"
import { descText, iconBox, labelText, menuContent, menuGroup, menuItem, textWeight, titleText } from "./variants"

/**
 * One menu engine for every dropdown. Look comes from the `menu`, `icon`
 * and `text` primitives; a caller may pin single axes (settings menu pins
 * plain rows). Coarse pointer → bottom sheet.
 */

export type MenuEntry = {
  key: string
  title: string
  description?: string
  icon?: LucideIcon
  tone?: JsonType["tone"]
  selected?: boolean
  destructive?: boolean
  /** keep menu open after click (toggles) */
  stayOpen?: boolean
  onSelect: () => void
}

export type MenuSection = { key: string; label: string; entries: MenuEntry[] }

export type OptionMenuProps = {
  sections: MenuSection[]
  trigger: React.ReactElement
  /** sheet heading on coarse pointer */
  title: string
  align?: "start" | "end"
  pin?: {
    layout?: "list" | "compact" | "grid"
    iconStyle?: "plain" | "boxed" | "tinted"
    iconSize?: "xs" | "sm" | "md" | "lg"
    weight?: "regular" | "medium" | "semibold"
  }
}

export function MenuIcon({
  icon: Icon,
  tone,
  style,
  size,
  className,
}: {
  icon: LucideIcon
  tone?: JsonType["tone"]
  style: "plain" | "boxed" | "tinted"
  size: "xs" | "sm" | "md" | "lg"
  className?: string
}) {
  return (
    <span className={cn(iconBox({ style, size }), style === "tinted" && toneClasses[tone ?? "gray"], className)}>
      <Icon />
    </span>
  )
}

export function OptionMenu({ sections, trigger, title, align = "start", pin }: OptionMenuProps) {
  const t = useTheme()
  const { pointer } = useEnv()
  const coarse = pointer === "coarse"
  const layout = pin?.layout ?? t.menu.layout
  const iconStyle = pin?.iconStyle ?? t.icon.style
  const iconSize = pin?.iconSize ?? (layout === "grid" ? "lg" : t.icon.size)
  const weight = pin?.weight ?? t.text.weight
  const selection = t.menu.selection
  const useSheet = coarse && t.menu.coarseOpen === "sheet"
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const itemClass = menuItem({ layout, density: t.menu.density, tap: coarse ? t.menu.coarseTap : "same" })
  const groupClass = menuGroup({ layout, density: t.menu.density })
  const contentClass = menuContent({ layout, density: t.menu.density, textSize: t.text.size })

  const body = (e: MenuEntry) => (
    <>
      {e.icon && <MenuIcon icon={e.icon} tone={e.destructive ? "rose" : e.tone} style={iconStyle} size={iconSize} />}
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "truncate",
            textWeight({ weight }),
            layout === "grid" ? descText({ size: t.text.size }) : titleText({ size: t.text.size }),
            e.destructive && "text-destructive"
          )}
        >
          {e.title}
        </div>
        {layout === "list" && e.description && (
          <div className={cn("truncate", descText({ size: t.text.size }))}>{e.description}</div>
        )}
      </div>
      {e.selected && (selection === "check" || selection === "both") && layout !== "grid" && (
        <CheckIcon className="size-3.5 shrink-0 text-muted-foreground" />
      )}
    </>
  )

  const renderEntry = (e: MenuEntry) => {
    const data = {
      "data-selected": e.selected ?? false,
      "data-selection": selection,
      "data-tone": e.destructive ? "destructive" : undefined,
    }
    if (useSheet)
      return (
        <Button
          key={e.key}
          variant="ghost"
          {...data}
          onClick={() => {
            e.onSelect()
            if (!e.stayOpen) setSheetOpen(false)
          }}
          className={cn(itemClass, "h-auto w-full justify-start rounded-md font-normal active:bg-accent")}
        >
          {body(e)}
        </Button>
      )
    return (
      <DropdownMenuItem key={e.key} {...data} closeOnClick={!e.stayOpen} onClick={e.onSelect} className={itemClass}>
        {body(e)}
      </DropdownMenuItem>
    )
  }

  // Base UI menu parts can't live outside Menu.Root → plain divs in sheet
  const Group = useSheet ? "div" : DropdownMenuGroup
  const Label = useSheet ? (p: React.ComponentProps<"div">) => <div {...p} /> : DropdownMenuLabel
  const Sep = useSheet ? () => <div className="-mx-1 my-1 h-px bg-border" /> : DropdownMenuSeparator
  const labelClass = cn("px-2 py-1 font-normal", labelText({ size: t.text.size }))

  const content = flag(t.menu.grouped) ? (
    sections.map((s, i) => (
      <React.Fragment key={s.key}>
        {i > 0 && <Sep />}
        <Group>
          <Label className={labelClass}>{s.label}</Label>
          <div className={groupClass}>{s.entries.map(renderEntry)}</div>
        </Group>
      </React.Fragment>
    ))
  ) : (
    <Group>
      <div className={groupClass}>{sections.flatMap((s) => s.entries).map(renderEntry)}</div>
    </Group>
  )

  if (useSheet)
    return (
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        {React.cloneElement(trigger as React.ReactElement<Record<string, unknown>>, {
          "aria-haspopup": "dialog",
          "aria-expanded": sheetOpen,
          onClick: () => setSheetOpen(true),
        })}
        <SheetContent
          side="bottom"
          className="max-h-[80vh] gap-2 overflow-y-auto rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="pb-0">
            <SheetTitle className="text-sm font-normal">{title}</SheetTitle>
          </SheetHeader>
          <div className={cn("flex w-full flex-col", contentClass)}>{content}</div>
        </SheetContent>
      </Sheet>
    )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent align={align} className={contentClass}>
        {content}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
