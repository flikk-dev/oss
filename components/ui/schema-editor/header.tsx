"use client"

import * as React from "react"
import { cn } from "cn"
import { InfoIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { slugify, uniqueSlug } from "@/lib/schema-editor/slug"
import { isGroupType } from "@/lib/schema-editor/tree"
import { Editable } from "./editable"
import { GroupCount, GroupToggle } from "./group"
import { useEditorStore, useField, useTheme } from "./root"
import { flag } from "./theme"
import { TypePicker } from "./type-picker"
import {
  badge,
  descText,
  header as headerCva,
  headerBody,
  slugText,
  textWeight,
  titleLine,
  titleText,
  tooltipBox,
} from "./variants"

type Size = "xs" | "sm" | "md" | "lg"

/* --------------------------------- title --------------------------------- */

export function Title({
  size,
  weight,
  className,
}: {
  size?: Size
  weight?: "regular" | "medium" | "semibold"
  className?: string
}) {
  const t = useTheme()
  const { node, set, taken } = useField()
  const setTitle = (title: string) =>
    set({
      title,
      slug: node.slugEdited ? node.slug : uniqueSlug(slugify(title, t.slug.case), taken, t.slug.case),
    })
  return (
    <Editable
      data-slot="title"
      mode={t.text.editing}
      value={node.title}
      onChange={setTitle}
      placeholder={isGroupType(node.type) ? "Untitled group" : "Untitled"}
      className={cn(
        "truncate",
        titleText({ size: size ?? t.text.size }),
        textWeight({ weight: weight ?? t.text.weight }),
        className
      )}
    />
  )
}

/* --------------------------------- slug ---------------------------------- */

export function Slug({
  size,
  style,
  className,
}: {
  size?: Size
  style?: "handle" | "chip" | "plain"
  className?: string
}) {
  const t = useTheme()
  const { node, set, taken } = useField()
  const look = style ?? t.slug.style
  const conflict = node.slug.length > 0 && taken.has(node.slug)
  const lastValid = React.useRef(node.slug)
  React.useEffect(() => {
    if (!conflict) lastValid.current = node.slug
  }, [conflict, node.slug])

  /** conflict policy applies on commit, not per keystroke */
  const commit = (slug: string) => {
    if (!taken.has(slug)) return
    if (t.slug.conflict === "suffix") set({ slug: uniqueSlug(slug, taken, t.slug.case), slugEdited: true })
    else if (t.slug.conflict === "reject") set({ slug: lastValid.current })
  }

  return (
    <span
      data-slot="slug"
      className={cn(slugText({ size: size ?? t.text.size, style: look, conflict }), className)}
      title={conflict ? `"${node.slug}" already used by a sibling` : undefined}
      aria-invalid={conflict || undefined}
    >
      {look !== "plain" && <span className="select-none">@</span>}
      <Editable
        mode={t.text.editing}
        value={node.slug}
        onChange={(slug) => set({ slug, slugEdited: slug.length > 0 })}
        onCommit={commit}
        placeholder="slug"
        className="font-mono"
      />
    </span>
  )
}

/* ------------------------------ description ------------------------------ */

export function Description({
  size,
  multiline = true,
  className,
}: {
  size?: Size
  multiline?: boolean
  className?: string
}) {
  const t = useTheme()
  const { node, set } = useField()
  return (
    <Editable
      data-slot="description"
      mode={t.text.editing}
      multiline={multiline}
      value={node.description}
      onChange={(description) => set({ description })}
      placeholder="Add description"
      className={cn(descText({ size: size ?? t.text.size }), "min-w-0", !multiline && "truncate", className)}
    />
  )
}

export function Examples({ className }: { className?: string }) {
  const t = useTheme()
  const { node } = useField()
  if (!node.examples.length) return null
  return (
    <div data-slot="examples" className={cn("truncate", descText({ size: t.text.size }), "opacity-70", className)}>
      e.g. {node.examples.join(", ")}
    </div>
  )
}

/* --------------------------------- badges -------------------------------- */

/** "[ ]" when repeated */
export function ArrayMark({ className }: { className?: string }) {
  const t = useTheme()
  const { node } = useField()
  if (!node.isArray) return null
  return (
    <span data-slot="array-mark" title="Repeated: list of this field" className={cn(badge({ size: t.text.size }), "font-mono", className)}>
      [ ]
    </span>
  )
}

export function OptionalMark({ className }: { className?: string }) {
  const t = useTheme()
  const { node } = useField()
  const mode = t.layout.optionalMark
  if (mode === "tag" && node.optional)
    return (
      <span data-slot="optional-mark" className={cn(badge({ size: t.text.size }), className)}>
        optional
      </span>
    )
  if (mode === "asterisk" && !node.optional)
    return <span data-slot="required-mark" className={cn("shrink-0 text-xs text-destructive", className)}>*</span>
  return null
}

/** all badges, gated by layout.badges */
export function Badges({ className }: { className?: string }) {
  const t = useTheme()
  if (!flag(t.layout.badges)) return null
  return (
    <span data-slot="badges" className={cn("flex shrink-0 items-center gap-1", className)}>
      <ArrayMark />
      <GroupCount />
      <OptionalMark />
    </span>
  )
}

/* -------------------------------- tooltip -------------------------------- */

/** hover-open popover; contents stay editable. Trigger alone when nothing lives in it. */
export function Tooltip({ children, className }: { children: React.ReactElement; className?: string }) {
  const t = useTheme()
  const { node } = useField()
  const slugIn = t.layout.slug === "tooltip"
  const descIn = t.layout.description === "tooltip"
  if (!slugIn && !descIn) return children
  const card = t.tooltip.style === "card"

  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={300}
        nativeButton={false}
        render={<div className={cn("flex min-w-0 items-center gap-1.5", className)} />}
      >
        {children}
      </PopoverTrigger>
      <PopoverContent side={t.tooltip.side} align="start" className={tooltipBox({ style: t.tooltip.style })}>
        {card && (
          <div className="flex flex-col gap-0.5">
            <div className={cn("truncate", titleText({ size: t.text.size }))}>{node.title || "Untitled"}</div>
            {slugIn && <Slug />}
          </div>
        )}
        {!card && slugIn && <Slug />}
        {descIn && <Description className="w-full" />}
      </PopoverContent>
    </Popover>
  )
}

/* --------------------------------- header -------------------------------- */

/**
 * Default header: type picker + title line + secondary lines, arranged by
 * the `layout` primitive. Pass children to compose your own.
 */
export function Header({ className, children }: { className?: string; children?: React.ReactNode }) {
  const t = useTheme()
  const L = t.layout
  const arrange = useEditorStore((s) => s.arrange)
  const inline = L.arrangement === "inline"
  const tipOn = L.slug === "tooltip" || L.description === "tooltip"
  const tipTrigger = t.tooltip.trigger

  const line1 = (
    <div className={titleLine({ size: t.icon.size })}>
      {tipOn && tipTrigger === "title" ? (
        <Tooltip>
          <Title />
        </Tooltip>
      ) : (
        <Title />
      )}
      {L.slug === "inline" && <Slug />}
      {tipOn && tipTrigger === "icon" && (
        <Tooltip>
          <span className="flex shrink-0">
            <InfoIcon className="size-3.5 text-muted-foreground/60 hover:text-foreground" />
          </span>
        </Tooltip>
      )}
      <Badges />
      <GroupToggle />
    </div>
  )

  const body = children ?? (
    <div className={headerBody({ arrangement: L.arrangement, lineGap: L.lineGap })}>
      {line1}
      {L.slug === "below" && <Slug />}
      {L.description === "below" &&
        (inline ? (
          <>
            <span className="text-muted-foreground/50">—</span>
            <Description multiline={false} />
          </>
        ) : (
          <Description />
        ))}
      {L.examples === "below" && <Examples />}
    </div>
  )

  const el = (
    <div
      data-slot="header"
      className={cn(headerCva({ iconAlign: L.iconAlign }), arrange && "pointer-events-none", className)}
    >
      <TypePicker />
      {body}
    </div>
  )
  return tipOn && tipTrigger === "row" ? <Tooltip className="flex-1">{el}</Tooltip> : el
}
