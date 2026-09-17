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
  FolderInputIcon,
  GripVerticalIcon,
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
  useField,
  useFieldOptional,
  useTypeModule,
  useVariant,
} from "@/context/editor"
import { isDescendant } from "@/store/editor"
import { DetailFields, Type } from "./field"
import {
  IconTile,
  Menu,
  MenuContext,
  MenuItem,
  menuStyle,
  sheetClass,
  TypeMenu,
} from "./menu"

type RenderProp = Parameters<typeof useRender>[0]["render"]

export type ActionProps = {
  /** replaces the built-in label */
  children?: React.ReactNode
  /** composes with the built-in handler; `preventDefault()` cancels it */
  onClick?: (e: React.MouseEvent) => void
  /** replaces the element; behaviour and `data-state` are merged onto it */
  render?: RenderProp
  className?: string
  ref?: React.Ref<HTMLButtonElement>
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
  ref,
  ...rest
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
  // `rest` is what a popup trigger merges in (aria-haspopup, data-popup-open…)
  const pass = { ref, ...(rest as object) }
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
      ...pass,
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
        {...pass}
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
        {...pass}
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
      {...pass}
    >
      <Icon />
    </Button>
  )
}

/* ------------------------------ row gestures ----------------------------- */

/** drag handle; when mounted the row drags only from here */
export function Drag({ className }: { className?: string }) {
  const { startDrag, setHasHandle } = useField()
  const v = useVariant()
  React.useEffect(() => {
    setHasHandle(true)
    return () => setHasHandle(false)
  }, [setHasHandle])
  const size = {
    compact: "h-4 w-3",
    default: "h-5 w-4",
    wide: "h-7 w-5",
    mobile: "h-6 w-5",
  }[v]
  return (
    <div
      data-slot="drag"
      role="button"
      aria-label="Drag to reorder"
      tabIndex={-1}
      onPointerDown={(e) => startDrag(e)}
      className={cn(
        "flex shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground active:cursor-grabbing",
        size,
        className
      )}
    >
      <GripVerticalIcon className="size-3" />
    </div>
  )
}

/** selection checkbox; shift-click extends in document order */
export function Select({ className }: { className?: string }) {
  const { id } = useField()
  const { store } = useEditor()
  const on = useEditorStore((s) => s.selected.includes(id))
  return (
    <input
      data-slot="select"
      type="checkbox"
      aria-label="Select field"
      checked={on}
      onChange={(e) => {
        // React's checkbox onChange is backed by the click event → modifiers are there
        const shift = (e.nativeEvent as MouseEvent).shiftKey
        if (shift) store.getState().selectRange(id)
        else store.getState().toggleSelect(id, e.target.checked)
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn("size-3.5 shrink-0 accent-primary", className)}
    />
  )
}

/** type picker; trigger shows <SchemaField.Type> unless given children */
export function ChangeType({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  const { node, set } = useField()
  const mod = useTypeModule(node.type)
  return (
    <TypeMenu
      title="Field type"
      current={node.type}
      onPick={(type) => set({ type })}
      trigger={
        <Button
          data-slot="change-type"
          variant="ghost"
          size="icon-xs"
          aria-label={`Type: ${mod.label}`}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn("size-auto p-0 hover:bg-transparent", className)}
        >
          {children ?? <Type />}
        </Button>
      }
    />
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

/**
 * Moves the targets to the end of a picked group. Targets, their subtrees and
 * leaves are not offered. Bulk-only by design, but works in a row too.
 */
export function MoveInto({
  topLabel = "Top level",
  ...props
}: ActionProps & { topLabel?: string }) {
  const { store, types } = useEditor()
  const ids = useActionTargets()
  const groups = useEditorStore(
    useShallow((s) =>
      Object.keys(s.byId).filter(
        (id) =>
          s.byId[id].isGroup &&
          !ids.includes(id) &&
          !ids.some((x) => isDescendant(s, x, id))
      )
    )
  )
  const s = store.getState()
  const label = (id: string) =>
    id === s.root ? topLabel : s.byId[id].title || s.byId[id].key
  return (
    <Menu
      title="Move into"
      trigger={
        <ActionPrimitive
          icon={FolderInputIcon}
          label="Move into"
          run={() => {}}
          {...props}
        />
      }
    >
      {groups.map((id) => (
        <MoveTarget
          key={id}
          id={id}
          label={label(id)}
          onPick={() => {
            for (const x of ids)
              store.getState().move(x, id, store.getState().children[id].length)
          }}
        />
      ))}
    </Menu>
  )
}

function MoveTarget({
  id,
  label,
  onPick,
}: {
  id: string
  label: string
  onPick: () => void
}) {
  const mod = useTypeModule(useEditorStore((s) => s.byId[id].type))
  const menu = React.useContext(MenuContext)
  return (
    <MenuItem
      onClick={() => {
        onPick()
        menu?.close()
      }}
    >
      <IconTile icon={mod.icon} color={mod.color} size="sm" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </MenuItem>
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
