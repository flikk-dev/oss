"use client"

import * as React from "react"
import { cn } from "cn"
import { useShallow } from "zustand/react/shallow"
import { useRender } from "@base-ui/react/use-render"
import {
  BracketsIcon,
  CircleDashedIcon,
  CircleSlashIcon,
  CopyIcon,
  PencilLineIcon,
  Trash2Icon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  useActionScope,
  useActionTargets,
  useEditor,
  useEditorStore,
  useFieldOptional,
  useVariant,
} from "@/context/editor"
import { DetailFields } from "./field"
import { MenuContext, MenuItem, menuStyle, sheetClass } from "./menu"

type RenderProp = Parameters<typeof useRender>[0]["render"]

export type ActionProps = {
  /** replaces the built-in label */
  children?: React.ReactNode
  /** composes with the built-in handler; `preventDefault()` cancels it */
  onClick?: (e: React.MouseEvent) => void
  /** replaces the element; behaviour and `data-state` are merged onto it */
  render?: RenderProp
  className?: string
}

/**
 * Every action is this primitive with an icon and a label. Where it renders
 * decides its shape: icon button in a row, item in a menu, button in a toolbar.
 * `state` (for toggles) is exposed as `data-state` / `aria-pressed`.
 */
export function ActionPrimitive({
  icon: Icon,
  label,
  run,
  state,
  destructive,
  keepOpen,
  children,
  onClick,
  render,
  className,
}: ActionProps & {
  icon: React.ComponentType<{ className?: string }>
  label: string
  run: () => void
  /** toggle state; undefined = plain command */
  state?: boolean | "mixed"
  destructive?: boolean
  /** menu stays open after click (toggles) */
  keepOpen?: boolean
}) {
  const scope = useActionScope()
  const variant = useVariant()
  const menu = React.useContext(MenuContext)
  const handle = (e: React.MouseEvent) => {
    onClick?.(e)
    if (e.defaultPrevented) return
    run()
    if (scope === "menu" && !keepOpen) menu?.close()
  }
  const toggle = state !== undefined
  const stateProps = toggle
    ? {
        "data-state": state === "mixed" ? "mixed" : state ? "on" : "off",
        "aria-pressed": state === "mixed" ? ("mixed" as const) : state,
      }
    : {}
  const text = children ?? label
  // a string child is the label everywhere, including the icon-only row button's accessible name
  const name = typeof children === "string" ? children : label

  // a custom element carries behaviour + state only — none of the button chrome
  const custom = useRender({
    render,
    enabled: !!render,
    defaultTagName: "button",
    props: {
      "aria-label": name,
      title: name,
      onClick: handle,
      className,
      ...stateProps,
    },
  })
  if (render) return custom

  if (scope === "menu")
    return (
      <MenuItem
        aria-label={name}
        onClick={handle}
        className={className}
        {...stateProps}
      >
        <Icon
          className={cn(
            menuStyle[variant].svg,
            destructive ? "text-destructive" : "text-muted-foreground"
          )}
        />
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            destructive && "text-destructive"
          )}
        >
          {text}
        </span>
        {toggle && state && (
          <span className="text-2xs text-muted-foreground">
            {state === "mixed" ? "–" : "✓"}
          </span>
        )}
      </MenuItem>
    )

  if (scope === "toolbar")
    return (
      <Button
        variant={toggle && state ? "default" : "outline"}
        size="xs"
        aria-label={name}
        onClick={handle}
        className={cn(destructive && "text-destructive", className)}
        {...stateProps}
      >
        <Icon /> {text}
      </Button>
    )

  const size = {
    compact: "size-5",
    default: "size-5",
    wide: "size-7",
    mobile: "size-9",
  }[variant]
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label={name}
      title={name}
      onClick={handle}

      className={cn(
        size,
        "text-muted-foreground",
        destructive && "hover:bg-destructive/10 hover:text-destructive",
        className
      )}
      {...stateProps}
    >
      <Icon />
    </Button>
  )
}

/* -------------------------------- toggles -------------------------------- */

function useToggle(flag: "optional" | "repeated" | "nullable") {
  const { store } = useEditor()
  const ids = useActionTargets()
  const values = useEditorStore(
    useShallow((s) => ids.map((id) => s.byId[id]?.[flag] ?? false))
  )
  const on = values.every(Boolean)
  const state: boolean | "mixed" = on
    ? true
    : values.some(Boolean)
      ? "mixed"
      : false
  // mixed → everything on first
  const run = () =>
    ids.forEach((id) => store.getState().update(id, { [flag]: !on }))
  return { state, run }
}

export function Optional(props: ActionProps) {
  const { state, run } = useToggle("optional")
  return (
    <ActionPrimitive
      icon={CircleDashedIcon}
      label="Optional"
      state={state}
      run={run}
      keepOpen
      {...props}
    />
  )
}

export function Repeated(props: ActionProps) {
  const { state, run } = useToggle("repeated")
  return (
    <ActionPrimitive
      icon={BracketsIcon}
      label="Repeated"
      state={state}
      run={run}
      keepOpen
      {...props}
    />
  )
}

export function Nullable(props: ActionProps) {
  const { state, run } = useToggle("nullable")
  return (
    <ActionPrimitive
      icon={CircleSlashIcon}
      label="Allow null"
      state={state}
      run={run}
      keepOpen
      {...props}
    />
  )
}

/* -------------------------------- commands ------------------------------- */

export function Duplicate(props: ActionProps) {
  const { store } = useEditor()
  const ids = useActionTargets()
  return (
    <ActionPrimitive
      icon={CopyIcon}
      label="Duplicate"
      run={() => ids.forEach((id) => store.getState().duplicate(id))}
      {...props}
    />
  )
}

export function Remove(props: ActionProps) {
  const { store } = useEditor()
  const ids = useActionTargets()
  return (
    <ActionPrimitive
      icon={Trash2Icon}
      label="Remove"
      destructive
      run={() => store.getState().remove(ids)}
      {...props}
    />
  )
}

/** opens the field's details (title, key, description, examples) in a dialog, or a sheet on mobile */
export function EditDetails({
  fields,
  ...props
}: ActionProps & {
  fields?: ("title" | "key" | "description" | "examples")[]
}) {
  const field = useFieldOptional()
  const title = useEditorStore((s) => (field ? s.byId[field.id]?.title : ""))
  const mobile = useVariant() === "mobile"
  const [open, setOpen] = React.useState(false)
  if (!field) throw new Error("<SchemaAction.EditDetails> must be inside a row")
  const body = <DetailFields fields={fields} />
  return (
    <>
      <ActionPrimitive
        icon={PencilLineIcon}
        label="Edit details"
        run={() => setOpen(true)}
        {...props}
      />
      {mobile ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className={sheetClass}>
            <SheetHeader className="p-0">
              <SheetTitle className="text-sm font-normal">
                {title || "Edit field"}
              </SheetTitle>
            </SheetHeader>
            {body}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-sm gap-3 p-4">
            <DialogTitle className="text-xs font-medium">
              {title || "Untitled"}
            </DialogTitle>
            {body}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
