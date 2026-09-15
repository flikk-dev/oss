"use client"

import * as React from "react"
import { cn } from "cn"
import {
  BracketsIcon,
  CircleDashedIcon,
  CircleSlashIcon,
  CopyIcon,
  EllipsisIcon,
  MoveVerticalIcon,
  Trash2Icon,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Description, Slug, Title } from "./header"
import { OptionMenu, type MenuSection } from "./menu"
import { hoverProps, useEditorStore, useEnv, useField, useSchemaEditor, useTheme } from "./root"
import { TypePicker } from "./type-picker"
import { actionSize, actionVariant, actionsBar, dangerTone, labelText } from "./variants"

type ButtonProps = { style?: "ghost" | "secondary" | "bordered"; size?: "sm" | "md"; className?: string }

export function DeleteButton({ style, size, className }: ButtonProps) {
  const t = useTheme()
  const { node } = useField()
  const remove = useEditorStore((s) => s.remove)
  const [armed, setArmed] = React.useState(false)
  React.useEffect(() => {
    if (!armed) return
    const id = setTimeout(() => setArmed(false), 2000)
    return () => clearTimeout(id)
  }, [armed])

  return (
    <Button
      data-slot="delete"
      variant={actionVariant[style ?? t.actions.style]}
      size={actionSize[size ?? t.actions.size]}
      aria-label={armed ? "Click again to delete" : "Delete field"}
      title={armed ? "Click again to delete" : "Delete"}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => {
        if (t.actions.deleteConfirm === "twice" && !armed) return setArmed(true)
        remove(node.id)
      }}
      className={cn(dangerTone({ tone: armed ? "armed" : "danger" }), className)}
    >
      <Trash2Icon />
    </Button>
  )
}

/** entries for ⋯ menu and the detail sheet */
function useSettingsSections(): MenuSection[] {
  const t = useTheme()
  const { node, set } = useField()
  const remove = useEditorStore((s) => s.remove)
  const duplicate = useEditorStore((s) => s.duplicate)
  const icon = (i: LucideIcon) => (t.actions.settingsIcons === "gray" ? i : undefined)
  return [
    {
      key: "rules",
      label: "Rules",
      entries: [
        { key: "optional", title: "Optional", icon: icon(CircleDashedIcon), selected: node.optional, stayOpen: true, onSelect: () => set({ optional: !node.optional }) },
        { key: "array", title: "Repeated", icon: icon(BracketsIcon), selected: !!node.isArray, stayOpen: true, onSelect: () => set({ isArray: !node.isArray }) },
        { key: "nullable", title: "Allow null", icon: icon(CircleSlashIcon), selected: node.nullable, stayOpen: true, onSelect: () => set({ nullable: !node.nullable }) },
      ],
    },
    {
      key: "actions",
      label: "Actions",
      entries: [
        { key: "duplicate", title: "Duplicate", icon: icon(CopyIcon), onSelect: () => duplicate(node.id) },
        { key: "delete", title: "Delete", icon: icon(Trash2Icon), destructive: true, onSelect: () => remove(node.id) },
      ],
    },
  ]
}

export function SettingsMenu({ style, size, className }: ButtonProps) {
  const t = useTheme()
  const { node } = useField()
  const sections = useSettingsSections()
  return (
    <OptionMenu
      title={node.title || "Field settings"}
      sections={sections}
      align="end"
      pin={{ layout: "compact", iconStyle: "plain", iconSize: "xs", weight: "regular" }}
      trigger={
        <Button
          data-slot="settings"
          variant={actionVariant[style ?? t.actions.style]}
          size={actionSize[size ?? t.actions.size]}
          aria-label="Field settings"
          onPointerDown={(e) => e.stopPropagation()}
          className={cn("text-muted-foreground", className)}
        >
          <EllipsisIcon />
        </Button>
      }
    />
  )
}

/** trash + ⋯; reveal per pointer. On coarse+sheet, nothing renders here. */
export function Actions({
  reveal,
  placement,
  className,
  children,
}: {
  reveal?: "hover" | "always" | "swipe"
  placement?: "column" | "overlay" | "inline"
  className?: string
  children?: React.ReactNode
}) {
  const t = useTheme()
  const { pointer } = useEnv()
  const { depth } = useField()
  const coarse = pointer === "coarse"
  const mode = reveal ?? (coarse ? t.actions.coarseReveal : t.actions.reveal)
  if (mode === "sheet") return null
  return (
    <div
      data-slot="actions"
      {...hoverProps}
      className={cn(
        actionsBar({
          reveal: mode,
          placement: mode === "swipe" ? "inline" : (placement ?? t.actions.placement),
          nested: depth > 0,
        }),
        className
      )}
    >
      {children ?? (
        <>
          <DeleteButton />
          <SettingsMenu />
        </>
      )}
    </div>
  )
}

/* ------------------------------ detail sheet ----------------------------- */

/** coarse pointer: the row is a summary, this sheet is the editor */
export function FieldSheet() {
  const t = useTheme()
  const { node } = useField()
  const open = useEditorStore((s) => s.sheet === node.id)
  const openSheet = useEditorStore((s) => s.openSheet)
  const sections = useSettingsSections()
  return (
    <Sheet open={open} onOpenChange={(o) => openSheet(o ? node.id : null)}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] gap-3 overflow-y-auto rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="flex-row items-center gap-2 pb-0">
          <TypePicker trigger="chip" />
          <SheetTitle className="sr-only">Edit field</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-2">
          <label className={labelText({ size: t.text.size })}>Title</label>
          <Title size="md" className="rounded-md border px-2 py-1.5" />
          <label className={labelText({ size: t.text.size })}>Key</label>
          <Slug size="sm" style="plain" className="rounded-md border px-2 py-1.5" />
          <label className={labelText({ size: t.text.size })}>Description</label>
          <Description size="sm" className="rounded-md border px-2 py-1.5" />
        </div>
        {sections.map((s) => (
          <div key={s.key} className="flex flex-col gap-1">
            <span className={labelText({ size: t.text.size })}>{s.label}</span>
            <div className="flex flex-wrap gap-1.5">
              {s.entries.map((e) => (
                <Button
                  key={e.key}
                  size="sm"
                  variant={e.destructive ? "destructive" : e.selected ? "default" : "outline"}
                  onClick={() => {
                    e.onSelect()
                    if (!e.stayOpen) openSheet(null)
                  }}
                >
                  {e.title}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </SheetContent>
    </Sheet>
  )
}

/** host-chrome toggle for coarse pointer reordering */
export function ArrangeToggle({ className }: { className?: string }) {
  const { arrange, setArrange } = useSchemaEditor()
  return (
    <Button
      variant={arrange ? "default" : "outline"}
      size="sm"
      aria-pressed={arrange}
      onClick={() => setArrange(!arrange)}
      className={className}
    >
      <MoveVerticalIcon /> {arrange ? "Done" : "Arrange"}
    </Button>
  )
}
