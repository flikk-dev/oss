"use client"

import * as React from "react"
import { cn } from "cn"
import { CheckIcon, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useVariant } from "./root"
import {
  jsonTypeGroups,
  jsonTypeMap,
  jsonTypes,
  type JsonTypeKey,
} from "./types"

/* ---------------------------------- menu --------------------------------- */

export type MenuEntry = {
  key: string
  title: string
  /** shown under the title on `wide` */
  description?: string
  icon?: LucideIcon
  /** tailwind classes for the icon tile (type accents) */
  color?: string
  selected?: boolean
  destructive?: boolean
  /** keep menu open after click (toggles) */
  stayOpen?: boolean
  onSelect: () => void
}

export type MenuSection = { key: string; label: string; entries: MenuEntry[] }

/** type icon on a tinted tile */
export function TypeIcon({
  type,
  className,
}: {
  type: JsonTypeKey
  className?: string
}) {
  const t = jsonTypeMap[type]
  return (
    <span
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-md [&_svg]:size-3",
        "group-data-[variant=compact]/editor:size-4 group-data-[variant=compact]/editor:bg-transparent",
        "group-data-[variant=wide]/editor:size-7 group-data-[variant=wide]/editor:[&_svg]:size-4",
        t.color,
        className
      )}
    >
      <t.icon />
    </span>
  )
}

/** dropdown density per variant (content is portaled, so no group-data-*) */
export const menuStyle = {
  compact: {
    content: "w-36 p-0.5",
    label: "px-1.5 py-0.5 text-3xs",
    item: "gap-1.5 px-1.5 py-0.5 text-2xs",
    icon: "size-3.5 bg-transparent!",
    svg: "size-2.5",
  },
  default: {
    content: "w-44",
    label: "text-2xs",
    item: "gap-2 px-2 py-1 text-xs",
    icon: "size-5",
    svg: "size-3",
  },
  wide: {
    content: "w-64 p-1.5",
    label: "px-2 py-1 text-xs",
    item: "gap-2.5 px-2 py-1.5 text-sm",
    icon: "size-7",
    svg: "size-4",
  },
  mobile: {
    content: "",
    label: "text-2xs",
    item: "h-11 justify-start gap-3 rounded-none px-3 text-left text-sm font-normal",
    icon: "size-6",
    svg: "size-3.5",
  },
} as const

function EntryBody({ e }: { e: MenuEntry }) {
  const variant = useVariant()
  const st = menuStyle[variant]
  return (
    <>
      {e.icon && (
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-md",
            st.icon,
            e.destructive
              ? "text-destructive"
              : (e.color ?? "text-muted-foreground")
          )}
        >
          <e.icon className={st.svg} />
        </span>
      )}
      <span
        className={cn("min-w-0 flex-1", e.destructive && "text-destructive")}
      >
        <span className="block truncate">{e.title}</span>
        {variant === "wide" && e.description && (
          <span className="block truncate text-xs text-muted-foreground">
            {e.description}
          </span>
        )}
      </span>
      {e.selected && (
        <CheckIcon className="size-3.5 shrink-0 text-muted-foreground" />
      )}
    </>
  )
}

/** bottom sheet shell shared by menus and the field editor */
export const sheetClass =
  "max-h-[85vh] gap-4 overflow-y-auto rounded-t-2xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"

/** sections as plain buttons; used inside sheets (Base UI menu parts need Menu.Root) */
export function SheetEntries({
  sections,
  onClose,
}: {
  sections: MenuSection[]
  onClose: () => void
}) {
  const st = menuStyle.mobile
  return sections.map((s) => (
    <div key={s.key} className="flex flex-col gap-1">
      <div className={cn("text-muted-foreground", st.label)}>{s.label}</div>
      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border">
        {s.entries.map((e) => (
          <Button
            key={e.key}
            variant="ghost"
            onClick={() => {
              e.onSelect()
              if (!e.stayOpen) onClose()
            }}
            className={st.item}
          >
            <EntryBody e={e} />
          </Button>
        ))}
      </div>
    </div>
  ))
}

/** one menu engine for every dropdown; bottom sheet on mobile */
export function OptionMenu({
  sections,
  trigger,
  title,
  align = "start",
  children,
}: {
  sections: MenuSection[]
  trigger: React.ReactElement
  /** sheet heading on mobile */
  title: string
  align?: "start" | "end"
  /** free content above the sections (inline editables) */
  children?: React.ReactNode
}) {
  const variant = useVariant()
  const st = menuStyle[variant]
  const [open, setOpen] = React.useState(false)
  // inputs inside a menu: keep typing away from the menu's typeahead
  const free = children && (
    <div onKeyDown={(e) => e.stopPropagation()} className="flex flex-col">
      {children}
    </div>
  )

  if (variant === "mobile")
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        {React.cloneElement(
          trigger as React.ReactElement<Record<string, unknown>>,
          {
            "aria-haspopup": "dialog",
            "aria-expanded": open,
            onClick: () => setOpen(true),
          }
        )}
        <SheetContent side="bottom" className={sheetClass}>
          <SheetHeader className="p-0">
            <SheetTitle className="text-sm font-normal">{title}</SheetTitle>
          </SheetHeader>
          {free}
          <SheetEntries sections={sections} onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent align={align} className={st.content}>
        {free}
        {sections.map((s, i) => (
          <React.Fragment key={s.key}>
            {(i > 0 || free) && <DropdownMenuSeparator />}
            <DropdownMenuGroup>
              <DropdownMenuLabel
                className={cn("font-normal text-muted-foreground", st.label)}
              >
                {s.label}
              </DropdownMenuLabel>
              {s.entries.map((e) => (
                <DropdownMenuItem
                  key={e.key}
                  closeOnClick={!e.stayOpen}
                  onClick={e.onSelect}
                  className={st.item}
                >
                  <EntryBody e={e} />
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ------------------------------ type picker ------------------------------ */

/** sections of every JSON type; shared by picker and add */
export function typeSections(
  onPick: (t: JsonTypeKey) => void,
  current?: JsonTypeKey
): MenuSection[] {
  return jsonTypeGroups.map((g) => ({
    key: g.key,
    label: g.label,
    entries: jsonTypes
      .filter((t) => t.group === g.key)
      .map((t) => ({
        key: t.key,
        title: t.title,
        description: t.description,
        icon: t.icon,
        color: t.color,
        selected: t.key === current,
        onSelect: () => onPick(t.key),
      })),
  }))
}

export function TypePicker({
  value,
  onChange,
  label,
  className,
}: {
  value: JsonTypeKey
  onChange: (t: JsonTypeKey) => void
  /** show type name next to the icon */
  label?: boolean
  className?: string
}) {
  const title = jsonTypeMap[value].title
  return (
    <OptionMenu
      title="Field type"
      sections={typeSections(onChange, value)}
      trigger={
        <Button
          data-slot="type-picker"
          variant={label ? "outline" : "ghost"}
          size={label ? "sm" : "icon-xs"}
          aria-label={`Type: ${title}`}
          title={title}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            !label && "size-auto p-0 hover:bg-transparent",
            label && "gap-1.5 pl-1",
            className
          )}
        >
          <TypeIcon type={value} className={cn(label && "size-5!")} />
          {label && title}
        </Button>
      }
    />
  )
}
