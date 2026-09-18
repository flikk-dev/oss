"use client"

import * as React from "react"
import { cn } from "cn"
import { useShallow } from "zustand/react/shallow"
import { useRender } from "@base-ui/react/use-render"
import {
  BracketsIcon,
  CircleDashedIcon,
  CircleDotIcon,
  CircleSlashIcon,
  CopyIcon,
  FolderInputIcon,
  GripVerticalIcon,
  PencilLineIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  useActionScope,
  useActionTargets,
  useEditor,
  useEditorStore,
  useFieldContext,
  useFieldOptional,
  useTypeModule,
  useVariant,
} from "@/context/editor"
import { isDescendant, type DetailField } from "@/store/editor"
import type { JsonSchema, SchemaNode } from "@/store"
import { Type } from "./field"
import { useField } from "./hooks"
import {
  IconTile,
  Menu,
  MenuContext,
  MenuItem,
  menuStyle,
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
  run: (e: React.MouseEvent) => void
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
    run(e)
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
      // your children win over the element's own; none → the element's stay
      ...(children !== undefined ? { children } : {}),
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

/* -------------------------------- command -------------------------------- */

export type CommandContext = {
  /** the field, or the selection inside a toolbar */
  ids: string[]
  nodes: SchemaNode[]
  schema: JsonSchema
}

/**
 * Your own action. Same shapes as the built-ins (icon button in a row, item in
 * a menu, button in a toolbar); `onClick` gets the targets and the handle.
 */
export function Command({
  icon = CircleDotIcon,
  children,
  onClick,
  destructive,
  keepOpen,
  state,
  render,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>
  /** the label */
  children: React.ReactNode
  onClick: (ctx: CommandContext, e: React.MouseEvent) => void
  destructive?: boolean
  /** menu stays open after click */
  keepOpen?: boolean
  /** show as a toggle */
  state?: boolean | "mixed"
  render?: RenderProp
  className?: string
}) {
  const { schema } = useEditor()
  const ids = useActionTargets()
  const label = typeof children === "string" ? children : schema && "Command"
  let event: React.MouseEvent | null = null
  return (
    <ActionPrimitive
      icon={icon}
      label={label}
      destructive={destructive}
      keepOpen={keepOpen}
      state={state}
      render={render}
      className={className}
      onClick={(e) => {
        event = e
      }}
      run={() =>
        onClick(
          {
            ids,
            nodes: ids.map((id) => schema.get(id)!).filter(Boolean),
            schema,
          },
          event!
        )
      }
    >
      {children}
    </ActionPrimitive>
  )
}

/* ------------------------------ row gestures ----------------------------- */

/** drag handle; when mounted the row drags only from here. `render` swaps the element, children the icon */
export function Drag({
  className,
  children,
  render,
}: {
  className?: string
  children?: React.ReactNode
  render?: RenderProp
}) {
  const { startDrag, setHasHandle } = useFieldContext()
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
  return useRender({
    render,
    defaultTagName: "div",
    props: {
      "data-slot": "drag",
      role: "button",
      "aria-label": "Drag to reorder",
      tabIndex: -1,
      onPointerDown: (e: React.PointerEvent) => startDrag(e),
      children: children ?? <GripVerticalIcon className="size-3" />,
      className: render
        ? cn("cursor-grab touch-none active:cursor-grabbing", className)
        : cn(
            "flex shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground active:cursor-grabbing",
            size,
            className
          ),
    },
  })
}

/**
 * Selection checkbox; shift-click extends in document order. `render` takes a
 * Base UI style checkbox (`checked` / `onCheckedChange`), e.g. shadcn <Checkbox />.
 */
export function Select({
  className,
  render,
}: {
  className?: string
  render?: React.ComponentProps<typeof Checkbox>["render"]
}) {
  const { id } = useFieldContext()
  const { store } = useEditor()
  const on = useEditorStore((s) => s.selected.includes(id))
  // a group with selected rows inside, itself unselected → partial
  const partial = useEditorStore(
    (s) =>
      !on &&
      !!s.children[id]?.length &&
      s.selected.some((x) => isDescendant(s, id, x))
  )
  return (
    <Checkbox
      data-slot="select"
      aria-label="Select field"
      checked={on}
      indeterminate={partial}
      onCheckedChange={(checked, { event }) => {
        // shift extends the range from the last hand-toggled row
        if ((event as MouseEvent).shiftKey) store.getState().selectRange(id)
        else store.getState().toggleSelect(id, checked)
      }}
      onPointerDown={(e) => e.stopPropagation()}
      render={render}
      className={className}
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
  const { field: node, update: set } = useField()
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

/** empties the selection; for toolbars */
export function ClearSelection(props: ActionProps) {
  const { store } = useEditor()
  return (
    <ActionPrimitive
      icon={XIcon}
      label="Clear selection"
      run={() => store.getState().select([])}
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

/**
 * Opens the field's details (title, key, description, examples) in a dialog,
 * or a sheet on mobile. The overlay is mounted by the row, so this works from
 * inside a menu that closes on click.
 */
export function EditDetails({
  fields,
  ...props
}: ActionProps & { fields?: DetailField[] }) {
  const { store } = useEditor()
  const field = useFieldOptional()
  if (!field) throw new Error("<SchemaAction.EditDetails> must be inside a row")
  return (
    <ActionPrimitive
      icon={PencilLineIcon}
      label="Edit details"
      run={() => store.getState().openDetails(field.id, fields)}
      {...props}
    />
  )
}
