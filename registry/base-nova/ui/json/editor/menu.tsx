"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { XIcon } from "lucide-react"
import { CheckIcon } from "lucide-react"
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  typeGroups,
  type TypeModule,
} from "@/registry/base-nova/ui/json/core/types"
import {
  useEditor,
  useVariant,
  type Variant,
} from "@/registry/base-nova/ui/json/editor/context"

/**
 * One popup engine for every menu: dropdown on desktop, bottom sheet on
 * mobile. Density follows the list variant. Children are the items.
 */

/** content is portaled, so variant classes are looked up, not inherited */
export const menuStyle: Record<
  Variant,
  { content: string; label: string; item: string; icon: string; svg: string }
> = {
  compact: {
    content: "w-36 p-0.5",
    label: "px-1.5 py-0.5 text-2xs",
    item: "gap-1.5 px-1.5 py-0.5 text-xs",
    icon: "size-3.5",
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
}

/**
 * Bottom sheet for the mobile variant, on Base UI's Dialog. Same look as
 * shadcn's <Sheet side="bottom">, plus a `container`: hand it a frame (a phone
 * mock, a panel) and the sheet stays inside it.
 */
export function EditorSheet({
  open,
  onOpenChange,
  title,
  container,
  className,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  container?: SheetPrimitive.Portal.Props["container"]
  className?: string
  children: React.ReactNode
}) {
  return (
    <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <SheetPrimitive.Portal container={container}>
        <SheetPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs" />
        <SheetPrimitive.Popup
          data-slot="editor-sheet"
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col gap-4 overflow-y-auto rounded-t-2xl border-t bg-popover p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-sm text-popover-foreground shadow-lg transition duration-200 ease-in-out data-ending-style:translate-y-10 data-ending-style:opacity-0 data-starting-style:translate-y-10 data-starting-style:opacity-0",
            className
          )}
        >
          <SheetPrimitive.Title className="text-sm font-normal">
            {title}
          </SheetPrimitive.Title>
          {children}
          <SheetPrimitive.Close
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-3 right-3"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        </SheetPrimitive.Popup>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  )
}

type MenuCtx = { close: () => void; sheet: boolean }
export const MenuContext = React.createContext<MenuCtx | null>(null)

export function Menu({
  trigger,
  title,
  align = "start",
  className,
  children,
}: {
  trigger: React.ReactElement
  /** sheet heading on mobile */
  title: string
  align?: "start" | "end"
  className?: string
  children: React.ReactNode
}) {
  const variant = useVariant()
  const { portal } = useEditor()
  const st = menuStyle[variant]
  const [open, setOpen] = React.useState(false)
  const ctx = React.useMemo(
    () => ({ close: () => setOpen(false), sheet: variant === "mobile" }),
    [variant]
  )

  if (variant === "mobile")
    return (
      <MenuContext.Provider value={ctx}>
        {React.cloneElement(
          trigger as React.ReactElement<Record<string, unknown>>,
          {
            "aria-haspopup": "dialog",
            "aria-expanded": open,
            onClick: () => setOpen(true),
          }
        )}
        <EditorSheet
          open={open}
          onOpenChange={setOpen}
          title={title}
          container={portal}
        >
          <div
            className={cn(
              "flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border",
              className
            )}
          >
            {children}
          </div>
        </EditorSheet>
      </MenuContext.Provider>
    )

  return (
    <MenuContext.Provider value={ctx}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger render={trigger} />
        <DropdownMenuContent
          align={align}
          className={cn(st.content, className)}
        >
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </MenuContext.Provider>
  )
}

/** one item: a Button inside a sheet, a DropdownMenuItem otherwise. Density from the variant. */
export function MenuItem({
  onClick,
  className,
  children,
  ...rest
}: {
  onClick: (e: React.MouseEvent) => void
  className?: string
  children: React.ReactNode
  render?: React.ComponentProps<typeof Button>["render"]
} & Record<`data-${string}` | `aria-${string}`, unknown>) {
  const st = menuStyle[useVariant()]
  const menu = React.useContext(MenuContext)
  return menu?.sheet ? (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(st.item, className)}
      {...(rest as object)}
    >
      {children}
    </Button>
  ) : (
    <DropdownMenuItem
      closeOnClick={false}
      onClick={onClick}
      className={cn(st.item, className)}
      {...(rest as object)}
    >
      {children}
    </DropdownMenuItem>
  )
}

/** section heading inside a Menu */
export function MenuLabel({ children }: { children: React.ReactNode }) {
  const st = menuStyle[useVariant()]
  return (
    <div
      className={cn("px-2 py-1 font-normal text-muted-foreground", st.label)}
    >
      {children}
    </div>
  )
}

/** icon tile used by type triggers and menu items */
export function IconTile({
  icon: Icon,
  color,
  size,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  color?: string
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}) {
  const tile = { xs: "size-3.5", sm: "size-4", md: "size-5", lg: "size-7" }[
    size ?? "md"
  ]
  const svg = { xs: "size-2.5", sm: "size-3", md: "size-3", lg: "size-4" }[
    size ?? "md"
  ]
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md",
        tile,
        color ?? "text-muted-foreground",
        className
      )}
    >
      <Icon className={svg} />
    </span>
  )
}

/* -------------------------------- type menu ------------------------------ */

/** every registered type, grouped; used by the type picker and Add field */
export function TypeMenu({
  trigger,
  title,
  current,
  onPick,
}: {
  trigger: React.ReactElement
  title: string
  current?: string
  onPick: (key: string) => void
}) {
  const { types } = useEditor()
  const v = useVariant()
  const known = new Set(typeGroups.flatMap((g) => g.types))
  const groups = typeGroups
    .map((g) => ({
      ...g,
      mods: g.types
        .map((k) => types.find((t) => t.key === k))
        .filter((t): t is TypeModule => !!t),
    }))
    .filter((g) => g.mods.length)
  const custom = types.filter((t) => !known.has(t.key))
  if (custom.length)
    groups.push({ key: "custom", label: "Custom", types: [], mods: custom })
  return (
    <Menu title={title} trigger={trigger}>
      {groups.map((g, i) => (
        <React.Fragment key={g.key}>
          {i > 0 && v !== "mobile" && <DropdownMenuSeparator />}
          <DropdownMenuGroup>
            <MenuLabel>{g.label}</MenuLabel>
            {g.mods.map((t) => (
              <TypeItem
                key={t.key}
                mod={t}
                selected={t.key === current}
                onSelect={() => onPick(t.key)}
              />
            ))}
          </DropdownMenuGroup>
        </React.Fragment>
      ))}
    </Menu>
  )
}

function TypeItem({
  mod,
  selected,
  onSelect,
}: {
  mod: TypeModule
  selected: boolean
  onSelect: () => void
}) {
  const v = useVariant()
  const menu = React.useContext(MenuContext)
  return (
    <MenuItem
      onClick={() => {
        onSelect()
        menu?.close()
      }}
    >
      <IconTile
        icon={mod.icon}
        color={mod.color}
        size={v === "wide" ? "lg" : v === "compact" ? "xs" : "md"}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate">{mod.label}</span>
        {v === "wide" && (
          <span className="block truncate text-xs text-muted-foreground">
            {mod.description}
          </span>
        )}
      </span>
      {selected && (
        <CheckIcon className="size-3.5 shrink-0 text-muted-foreground" />
      )}
    </MenuItem>
  )
}
