"use client"

import * as React from "react"
import { cn } from "cn"
import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MenuIcon, OptionMenu, type MenuSection } from "./menu"
import { useEnv, useFieldOptional, useTheme } from "./root"
import { flag } from "./theme"
import { jsonTypeGroups, jsonTypeMap, jsonTypes, toneClasses, type JsonTypeKey } from "./types"
import { descText, textWeight, typeTrigger, typeTriggerVariant } from "./variants"

/** sections of every JSON type; shared by picker and add */
export function typeSections(onPick: (t: JsonTypeKey) => void, current?: JsonTypeKey): MenuSection[] {
  return jsonTypeGroups
    .map((g) => ({
      key: g.key,
      label: g.label,
      entries: jsonTypes
        .filter((t) => t.group === g.key)
        .map((t) => ({
          key: t.key,
          title: t.title,
          description: t.description,
          icon: t.icon,
          tone: t.tone,
          selected: t.key === current,
          onSelect: () => onPick(t.key),
        })),
    }))
    .filter((s) => s.entries.length)
}

export type TypePickerProps = {
  /** standalone; inside a row these come from the field */
  value?: JsonTypeKey
  onChange?: (t: JsonTypeKey) => void
  trigger?: "icon" | "icon-boxed" | "label" | "chip"
  iconStyle?: "plain" | "boxed" | "tinted"
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}

export function TypePicker(props: TypePickerProps) {
  const field = useFieldOptional()
  const t = useTheme()
  const { pointer } = useEnv()
  const value = props.value ?? field?.node.type ?? "string"
  const onChange = props.onChange ?? ((type: JsonTypeKey) => field?.set({ type }))
  const trigger = props.trigger ?? t.icon.trigger
  const iconStyle = props.iconStyle ?? t.icon.style
  const size = props.size ?? t.icon.size
  const selected = jsonTypeMap[value]
  const Icon = selected.icon
  const tinted = iconStyle === "tinted"
  const largeTap = pointer === "coarse" && t.menu.coarseTap === "large"
  const name = (
    <span className={cn(descText({ size: t.text.size }), "text-foreground", textWeight({ weight: t.text.weight }))}>
      {selected.title}
    </span>
  )
  const chevron = flag(t.icon.chevron) && <ChevronDownIcon className="size-3 text-muted-foreground" />

  const content = {
    icon: <Icon />,
    "icon-boxed": (
      <span
        className={cn(
          "flex size-full items-center justify-center rounded-md",
          tinted ? toneClasses[selected.tone] : "bg-muted text-muted-foreground"
        )}
      >
        <Icon />
      </span>
    ),
    label: (
      <>
        <Icon
          className={
            tinted
              ? toneClasses[selected.tone].split(" ").filter((c) => !c.startsWith("bg-")).join(" ")
              : "text-muted-foreground"
          }
        />
        {name}
        {chevron}
      </>
    ),
    chip: (
      <>
        <MenuIcon
          icon={selected.icon}
          tone={selected.tone}
          style={tinted ? "tinted" : "boxed"}
          size={size === "lg" || size === "md" ? "sm" : "xs"}
        />
        {name}
        {chevron}
      </>
    ),
  }[trigger]

  return (
    <OptionMenu
      title="Field type"
      sections={typeSections(onChange, value)}
      trigger={
        <Button
          data-slot="type-picker"
          variant={typeTriggerVariant[trigger]}
          size="icon-xs"
          aria-label={`Type: ${selected.title}`}
          title={selected.title}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(typeTrigger({ trigger, size }), largeTap && "min-h-9 min-w-9", props.className)}
        >
          {content}
        </Button>
      }
    />
  )
}
