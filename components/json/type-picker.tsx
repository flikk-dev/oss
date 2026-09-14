"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { CheckIcon, ChevronDownIcon } from "lucide-react"
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
import { useIsMobile } from "@/hooks/use-is-mobile"
import {
  jsonTypeGroups,
  jsonTypeMap,
  jsonTypes,
  toneClasses,
  type JsonType,
  type JsonTypeKey,
} from "./types"

/* -------------------------------------------------------------------------- */
/*                                  Variants                                  */
/* -------------------------------------------------------------------------- */

const triggerVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center border border-transparent font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      trigger: {
        /** bare icon, ghost hover — sits inline with field name */
        icon: "rounded-md text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        /** icon in tinted box — reads as a type badge */
        "icon-boxed": "rounded-md",
        /** icon + label, outline button */
        label:
          "rounded-lg border-border bg-background text-foreground hover:bg-muted aria-expanded:bg-muted dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        /** pill with tinted icon + label */
        chip: "rounded-full border-border bg-background pr-2.5 hover:bg-muted aria-expanded:bg-muted dark:border-input dark:bg-input/30",
      },
      size: {
        sm: "h-6 gap-1 text-xs [&_svg:not([class*='size-'])]:size-3",
        md: "h-7 gap-1.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-8 gap-2 text-sm [&_svg:not([class*='size-'])]:size-4",
      },
    },
    compoundVariants: [
      { trigger: "icon", size: "sm", className: "w-6" },
      { trigger: "icon", size: "md", className: "w-7" },
      { trigger: "icon", size: "lg", className: "w-8" },
      { trigger: "icon-boxed", size: "sm", className: "w-6" },
      { trigger: "icon-boxed", size: "md", className: "w-7" },
      { trigger: "icon-boxed", size: "lg", className: "w-8" },
      { trigger: "label", size: "sm", className: "px-1.5" },
      { trigger: "label", size: "md", className: "px-2" },
      { trigger: "label", size: "lg", className: "px-2.5" },
      { trigger: "chip", size: "sm", className: "pl-1" },
      { trigger: "chip", size: "md", className: "pl-1" },
      { trigger: "chip", size: "lg", className: "pl-1.5" },
    ],
    defaultVariants: { trigger: "icon", size: "md" },
  }
)

const contentVariants = cva("", {
  variants: {
    layout: { list: "", compact: "", grid: "" },
    textSize: { xs: "", sm: "", md: "" },
    density: {
      compact: "p-0.5",
      tight: "p-1",
      loose: "p-1.5",
    },
  },
  compoundVariants: [
    { layout: "list", textSize: "md", className: "w-64" },
    { layout: "list", textSize: "sm", className: "w-56" },
    { layout: "list", textSize: "xs", className: "w-48" },
    { layout: "compact", textSize: "md", className: "w-44" },
    { layout: "compact", textSize: "sm", className: "w-40" },
    { layout: "compact", textSize: "xs", className: "w-36" },
    { layout: "grid", textSize: "md", className: "w-72" },
    { layout: "grid", textSize: "sm", className: "w-64" },
    { layout: "grid", textSize: "xs", className: "w-56" },
  ],
  defaultVariants: { layout: "list", textSize: "md", density: "tight" },
})

const groupVariants = cva("", {
  variants: {
    layout: {
      list: "flex flex-col",
      compact: "flex flex-col",
      grid: "grid grid-cols-3",
    },
    density: { compact: "", tight: "", loose: "" },
  },
  compoundVariants: [
    { layout: "grid", density: "compact", className: "gap-0.5" },
    { layout: "grid", density: "tight", className: "gap-1" },
    { layout: "grid", density: "loose", className: "gap-1.5" },
  ],
  defaultVariants: { layout: "list", density: "tight" },
})

const itemVariants = cva(
  "group/type-item relative flex cursor-default rounded-md outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[selected=true]:data-[selection=highlight]:bg-accent data-[selected=true]:data-[selection=both]:bg-accent",
  {
    variants: {
      layout: {
        list: "items-center",
        compact: "items-center",
        grid: "flex-col items-center justify-center text-center",
      },
      density: {
        compact: "",
        tight: "",
        loose: "",
      },
    },
    compoundVariants: [
      { layout: "list", density: "compact", className: "gap-2 px-1.5 py-0.5" },
      { layout: "list", density: "tight", className: "gap-2.5 px-2 py-1.5" },
      { layout: "list", density: "loose", className: "gap-3 px-2.5 py-2" },
      { layout: "compact", density: "compact", className: "gap-1.5 px-1.5 py-0.5" },
      { layout: "compact", density: "tight", className: "gap-2 px-2 py-1" },
      { layout: "compact", density: "loose", className: "gap-2.5 px-2.5 py-1.5" },
      { layout: "grid", density: "compact", className: "gap-1 px-0.5 py-1" },
      { layout: "grid", density: "tight", className: "gap-1.5 px-1 py-2" },
      { layout: "grid", density: "loose", className: "gap-2 px-1.5 py-2.5" },
    ],
    defaultVariants: { layout: "list", density: "tight" },
  }
)

/** title / description sizes inside menu */
const textVariants = cva("", {
  variants: {
    textSize: {
      xs: "[--title:11px] [--desc:10px]",
      sm: "[--title:12px] [--desc:11px]",
      md: "[--title:14px] [--desc:11px]",
    },
  },
  defaultVariants: { textSize: "md" },
})

const iconBoxVariants = cva(
  "flex shrink-0 items-center justify-center [&_svg]:shrink-0",
  {
    variants: {
      iconStyle: {
        plain: "bg-transparent text-muted-foreground group-focus/type-item:text-accent-foreground",
        boxed: "rounded-md bg-muted text-muted-foreground group-data-[selected=true]/type-item:bg-primary/10 group-data-[selected=true]/type-item:text-primary",
        tinted: "rounded-md",
      },
      size: {
        xs: "size-4 [&_svg]:size-2.5",
        sm: "size-5 [&_svg]:size-3",
        md: "size-6 [&_svg]:size-3.5",
        lg: "size-8 [&_svg]:size-4",
      },
    },
    defaultVariants: { iconStyle: "boxed", size: "md" },
  }
)

/** type-name weight, button label + menu title */
const weightVariants = cva("", {
  variants: {
    weight: {
      regular: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
  },
  defaultVariants: { weight: "medium" },
})

/** phone-only overrides: bigger rows so thumbs hit */
const mobileItemVariants = cva("", {
  variants: {
    mobileTap: {
      same: "",
      large: "min-h-11 px-3",
    },
    layout: { list: "", compact: "", grid: "" },
  },
  compoundVariants: [
    { mobileTap: "large", layout: "grid", className: "min-h-16" },
  ],
  defaultVariants: { mobileTap: "same" },
})

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

type TriggerVariants = VariantProps<typeof triggerVariants>
type ContentVariants = VariantProps<typeof contentVariants>
type IconBoxVariants = VariantProps<typeof iconBoxVariants>
type TextVariants = VariantProps<typeof textVariants>
type WeightVariants = VariantProps<typeof weightVariants>
type MobileItemVariants = VariantProps<typeof mobileItemVariants>

export type TypePickerProps = {
  value?: JsonTypeKey
  onChange?: (type: JsonTypeKey) => void
  /** split types under group labels */
  grouped?: boolean
  /** how selected item is marked */
  selection?: "check" | "highlight" | "both" | "none"
  /** show description line (list only) */
  showDescription?: boolean
  /** show chevron on label / chip triggers */
  chevron?: boolean
  /** icon tile size inside menu */
  iconSize?: IconBoxVariants["size"]
  /** force phone behaviour on/off; undefined → media query */
  mobile?: boolean
  /** phone: keep dropdown or open bottom sheet */
  mobileMenu?: "dropdown" | "sheet"
  className?: string
} & TriggerVariants &
  ContentVariants &
  TextVariants &
  WeightVariants &
  Pick<MobileItemVariants, "mobileTap"> &
  Pick<IconBoxVariants, "iconStyle">

export function TypePicker({
  value = "string",
  onChange,
  trigger,
  size,
  layout,
  density,
  textSize,
  iconSize,
  iconStyle,
  weight,
  mobile,
  mobileMenu = "sheet",
  mobileTap = "large",
  grouped = false,
  selection = "check",
  showDescription = true,
  chevron = false,
  className,
}: TypePickerProps) {
  const selected = jsonTypeMap[value] ?? jsonTypeMap.string
  const SelectedIcon = selected.icon
  const resolvedLayout = layout ?? "list"
  const resolvedIconStyle = iconStyle ?? "boxed"
  const resolvedSize = size ?? "md"
  const resolvedDensity = density ?? "tight"
  const resolvedTextSize = textSize ?? "md"
  const resolvedIconSize =
    iconSize ??
    (resolvedLayout === "grid" ? "lg" : resolvedLayout === "compact" ? "sm" : "md")
  const mq = useIsMobile()
  const isMobile = mobile ?? mq
  const useSheet = isMobile && mobileMenu === "sheet"
  const [sheetOpen, setSheetOpen] = React.useState(false)

  // trigger icon box size tracks trigger size
  const triggerIconSize = resolvedSize === "lg" ? "md" : "sm"

  const renderIcon = (
    t: JsonType,
    opts: { iconStyle: IconBoxVariants["iconStyle"]; size: IconBoxVariants["size"] }
  ) => {
    const Icon = t.icon
    return (
      <span
        className={cn(
          iconBoxVariants(opts),
          opts.iconStyle === "tinted" && toneClasses[t.tone]
        )}
      >
        <Icon />
      </span>
    )
  }

  const renderItem = (t: JsonType) => {
    const isSelected = t.key === value
    const itemClass = cn(
      itemVariants({ layout: resolvedLayout, density: resolvedDensity }),
      textVariants({ textSize: resolvedTextSize }),
      isMobile && mobileItemVariants({ mobileTap, layout: resolvedLayout })
    )
    const body = (
      <>
        {renderIcon(t, { iconStyle: resolvedIconStyle, size: resolvedIconSize })}

        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "truncate leading-4",
              weightVariants({ weight }),
              resolvedLayout === "grid" ? "text-(--desc)" : "text-(--title)"
            )}
          >
            {t.title}
          </div>
          {resolvedLayout === "list" && showDescription && (
            <div className="truncate text-(--desc) leading-4 text-muted-foreground">
              {t.description}
            </div>
          )}
        </div>

        {isSelected &&
          (selection === "check" || selection === "both") &&
          resolvedLayout !== "grid" && (
            <CheckIcon className="size-3.5 shrink-0 text-muted-foreground" />
          )}
      </>
    )

    if (useSheet) {
      return (
        <button
          key={t.key}
          type="button"
          data-selected={isSelected}
          data-selection={selection}
          onClick={() => {
            onChange?.(t.key)
            setSheetOpen(false)
          }}
          className={cn(itemClass, "w-full text-left active:bg-accent")}
        >
          {body}
        </button>
      )
    }

    return (
      <DropdownMenuItem
        key={t.key}
        data-selected={isSelected}
        data-selection={selection}
        onClick={() => onChange?.(t.key)}
        className={itemClass}
      >
        {body}
      </DropdownMenuItem>
    )
  }

  /** grouped or flat list of items; menu primitives in dropdown, plain divs in sheet */
  const renderItems = () => {
    const Group = useSheet ? "div" : DropdownMenuGroup
    const Label = useSheet
      ? (p: React.ComponentProps<"div">) => (
          <div
            {...p}
            className={cn("px-2 py-1 text-[11px] font-medium text-muted-foreground", p.className)}
          />
        )
      : DropdownMenuLabel
    const Sep = useSheet
      ? () => <div className="-mx-1 my-1 h-px bg-border" />
      : DropdownMenuSeparator

    if (!grouped)
      return (
        <Group>
          <div className={groupVariants({ layout, density })}>
            {jsonTypes.map(renderItem)}
          </div>
        </Group>
      )

    return jsonTypeGroups.map((g, i) => {
      const items = jsonTypes.filter((t) => t.group === g.key)
      if (!items.length) return null
      return (
        <React.Fragment key={g.key}>
          {i > 0 && <Sep />}
          <Group>
            <Label className="px-2 py-1 text-[11px]">{g.label}</Label>
            <div className={groupVariants({ layout, density })}>
              {items.map(renderItem)}
            </div>
          </Group>
        </React.Fragment>
      )
    })
  }

  const renderTriggerContent = () => {
    switch (trigger ?? "icon") {
      case "icon":
        return <SelectedIcon />
      case "icon-boxed":
        return (
          <span
            className={cn(
              "flex size-full items-center justify-center rounded-md",
              resolvedIconStyle === "tinted"
                ? toneClasses[selected.tone]
                : "bg-muted text-muted-foreground"
            )}
          >
            <SelectedIcon />
          </span>
        )
      case "label":
        return (
          <>
            <SelectedIcon
              className={cn(
                resolvedIconStyle === "tinted"
                  ? toneClasses[selected.tone].split(" ").filter((c) => !c.startsWith("bg-")).join(" ")
                  : "text-muted-foreground"
              )}
            />
            <span className={weightVariants({ weight })}>{selected.title}</span>
            {chevron && <ChevronDownIcon className="size-3 text-muted-foreground" />}
          </>
        )
      case "chip":
        return (
          <>
            {renderIcon(selected, {
              iconStyle: resolvedIconStyle === "plain" ? "boxed" : resolvedIconStyle,
              size: triggerIconSize,
            })}
            <span className={weightVariants({ weight })}>{selected.title}</span>
            {chevron && <ChevronDownIcon className="size-3 text-muted-foreground" />}
          </>
        )
    }
  }

  const triggerClass = cn(
    triggerVariants({ trigger, size }),
    isMobile && mobileTap === "large" && trigger !== "icon" && trigger !== "icon-boxed" && "h-9",
    className
  )

  if (useSheet) {
    return (
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <button
          type="button"
          aria-label={`Type: ${selected.title}`}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          onClick={() => setSheetOpen(true)}
          className={triggerClass}
        >
          {renderTriggerContent()}
        </button>
        <SheetContent
          side="bottom"
          className="max-h-[80vh] gap-2 overflow-y-auto rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="pb-0">
            <SheetTitle className="text-sm">Field type</SheetTitle>
          </SheetHeader>
          <div className={cn("flex flex-col", contentVariants({ layout, density, textSize }), "w-full")}>
            {renderItems()}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Type: ${selected.title}`}
        title={selected.title}
        className={triggerClass}
      >
        {renderTriggerContent()}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className={cn(contentVariants({ layout, density, textSize }))}
      >
        {renderItems()}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export {
  triggerVariants,
  contentVariants,
  itemVariants,
  iconBoxVariants,
  textVariants,
  weightVariants,
  mobileItemVariants,
}
