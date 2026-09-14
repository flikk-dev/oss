"use client"

import * as React from "react"
import { Reorder, useDragControls } from "motion/react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import {
  CopyIcon,
  EllipsisIcon,
  GripVerticalIcon,
  Trash2Icon,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FieldHeader, type FieldHeaderProps, type FieldMeta } from "./field-header"
import {
  contentVariants as menuContentVariants,
  itemVariants as menuItemVariants,
  textVariants as menuTextVariants,
  type TypePickerProps,
} from "./type-picker"

/* -------------------------------------------------------------------------- */
/*                                  Variants                                  */
/* -------------------------------------------------------------------------- */

/**
 * Mirrors flikk block-canvas BlockShell: the item is the hover target,
 * grip hangs off the left edge, chrome box in the middle, actions outside
 * the box on the right.
 */
const rowVariants = cva("group/row relative flex items-center gap-2", {
  variants: {
    dragHandle: {
      hover: "pl-6",
      always: "pl-6",
      /** whole row drags, no grip */
      row: "cursor-grab active:cursor-grabbing",
    },
  },
  defaultVariants: { dragHandle: "hover" },
})

const gripVariants = cva(
  "absolute top-1/2 left-0 flex size-5 -translate-y-1/2 cursor-grab touch-none items-center justify-center text-muted-foreground active:cursor-grabbing",
  {
    variants: {
      dragHandle: {
        hover: "opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-within/row:opacity-100",
        always: "",
        row: "hidden",
      },
    },
    defaultVariants: { dragHandle: "hover" },
  }
)

const chromeVariants = cva("flex min-w-0 flex-1 rounded-md border transition-shadow", {
  variants: {
    chrome: {
      /** flikk: transparent border, shows on hover */
      hover: "border-transparent bg-background px-3 py-2 hover:border-border",
      card: "border-border bg-background px-3 py-2",
      /** no box; divider drawn by list */
      divider: "border-transparent px-1 py-2",
    },
  },
  defaultVariants: { chrome: "hover" },
})

const actionsVariants = cva("flex shrink-0 items-center gap-1", {
  variants: {
    actions: {
      always: "",
      hover: "opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-within/row:opacity-100 has-[[aria-expanded=true]]:opacity-100",
    },
  },
  defaultVariants: { actions: "hover" },
})

const actionButtonVariants = cva(
  "inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-3.5",
  {
    variants: {
      actionStyle: {
        ghost: "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        /** flikk secondary button */
        secondary: "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]",
        bordered: "border border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted",
      },
      tone: {
        default: "",
        danger: "hover:bg-destructive/10 hover:text-destructive",
        /** armed: waiting for second click */
        armed: "bg-destructive/10 text-destructive hover:bg-destructive/20",
      },
    },
    defaultVariants: { actionStyle: "ghost", tone: "default" },
  }
)

/** motion props while dragging */
const dragStyles = {
  fade: { opacity: 0.9, borderRadius: 12 },
  lift: { scale: 1.01, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", borderRadius: 12, zIndex: 10 },
} as const

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

export type FieldNode = FieldMeta & {
  id: string
  optional: boolean
  nullable: boolean
  children?: FieldNode[]
}

export type RequiredMark = "none" | "optionalTag" | "asterisk"

/** menu look shared with type picker so both dropdowns match */
export type MenuLook = Pick<TypePickerProps, "density" | "textSize" | "weight">

export type FieldRowProps = {
  node: FieldNode
  onChange: (next: FieldNode) => void
  onDelete: () => void
  onDuplicate: () => void
  taken: Set<string>
  /** how optional / required shows in header */
  requiredMark?: RequiredMark
  deleteConfirm?: "immediate" | "twice"
  whileDrag?: keyof typeof dragStyles
  header: Omit<FieldHeaderProps, "field" | "onChange" | "taken">
  menu?: MenuLook
  /** nested rows for object / array children */
  children?: React.ReactNode
  className?: string
} & VariantProps<typeof rowVariants> &
  VariantProps<typeof chromeVariants> &
  VariantProps<typeof actionsVariants> &
  Pick<VariantProps<typeof actionButtonVariants>, "actionStyle">

const lineHeight: Record<NonNullable<TypePickerProps["size"]>, string> = {
  sm: "[--line:24px]",
  md: "[--line:28px]",
  lg: "[--line:32px]",
}

export function FieldRow({
  node,
  onChange,
  onDelete,
  onDuplicate,
  taken,
  requiredMark = "none",
  deleteConfirm = "immediate",
  whileDrag = "fade",
  header,
  menu,
  children,
  className,
  chrome,
  dragHandle,
  actions,
  actionStyle,
}: FieldRowProps) {
  const controls = useDragControls()
  const byHandle = dragHandle !== "row"
  const [armed, setArmed] = React.useState(false)

  React.useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 2000)
    return () => clearTimeout(t)
  }, [armed])

  const del = () => {
    if (deleteConfirm === "twice" && !armed) return setArmed(true)
    onDelete()
  }

  const mark =
    requiredMark === "optionalTag" && node.optional ? (
      <span className="rounded bg-muted px-1 text-[10px] leading-4 text-muted-foreground">
        optional
      </span>
    ) : requiredMark === "asterisk" && !node.optional ? (
      <span className="text-xs leading-4 text-destructive">*</span>
    ) : null

  // menu classes shared with type picker
  const menuContent = cn(
    menuContentVariants({ layout: "compact", density: menu?.density, textSize: menu?.textSize }),
    "w-44"
  )
  const menuItem = cn(
    menuItemVariants({ layout: "compact", density: menu?.density }),
    menuTextVariants({ textSize: menu?.textSize }),
    "text-(--title) [&_svg]:size-3.5"
  )

  return (
    <Reorder.Item
      value={node}
      // position-only: size changes from typing must not animate (flicker)
      layout="position"
      dragListener={!byHandle}
      dragControls={controls}
      whileDrag={dragStyles[whileDrag]}
      exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }}
      className={cn(rowVariants({ dragHandle }), className)}
    >
      {byHandle && (
        <div
          role="button"
          aria-label="Drag to reorder"
          tabIndex={-1}
          onPointerDown={(e) => controls.start(e)}
          className={gripVariants({ dragHandle })}
        >
          <GripVerticalIcon className="size-4" />
        </div>
      )}

      <div className={chromeVariants({ chrome })}>
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col gap-2",
            lineHeight[header.picker?.size ?? "md"]
          )}
        >
          <div className="flex min-w-0 items-start gap-2">
            <FieldHeader
              field={node}
              taken={taken}
              onChange={(next) => onChange({ ...node, ...next })}
              className="min-w-0 flex-1"
              {...header}
            />
            {mark && (
              <div className="flex h-(--line) shrink-0 items-center">{mark}</div>
            )}
          </div>
          {children}
        </div>
      </div>

      <div className={actionsVariants({ actions })}>
        <button
          type="button"
          aria-label={armed ? "Click again to delete" : "Delete field"}
          title={armed ? "Click again to delete" : "Delete"}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={del}
          className={actionButtonVariants({
            actionStyle,
            tone: armed ? "armed" : "danger",
          })}
        >
          <Trash2Icon />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Field settings"
            onPointerDown={(e) => e.stopPropagation()}
            className={actionButtonVariants({ actionStyle })}
          >
            <EllipsisIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={menuContent}>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2 py-1 text-[11px]">Settings</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={node.optional}
                onCheckedChange={(optional) => onChange({ ...node, optional })}
                className={cn(menuItem, "pr-7")}
              >
                Optional
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={node.nullable}
                onCheckedChange={(nullable) => onChange({ ...node, nullable })}
                className={cn(menuItem, "pr-7")}
              >
                Allow null
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDuplicate} className={menuItem}>
              <CopyIcon /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onDelete} className={menuItem}>
              <Trash2Icon /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Reorder.Item>
  )
}

export {
  rowVariants,
  gripVariants,
  chromeVariants,
  actionsVariants,
  actionButtonVariants,
  dragStyles,
}
