"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { InfoIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { slugify, uniqueSlug, type SlugCase } from "@/lib/slug"
import { Editable, type EditMode } from "./editable"
import { TypePicker, type TypePickerProps } from "./type-picker"
import type { JsonTypeKey } from "./types"

/* -------------------------------------------------------------------------- */
/*                                  Variants                                  */
/* -------------------------------------------------------------------------- */

const headerVariants = cva("group/field flex min-w-0", {
  variants: {
    iconAlign: {
      top: "items-start",
      center: "items-center",
    },
    density: {
      tight: "gap-1.5",
      normal: "gap-2",
      loose: "gap-2.5",
    },
  },
  defaultVariants: { iconAlign: "top", density: "normal" },
})

/** text column next to icon */
const bodyVariants = cva("flex min-w-0 flex-1", {
  variants: {
    arrangement: {
      /** title line, then description line */
      card: "flex-col",
      /** everything on one line */
      inline: "flex-row items-baseline gap-2",
    },
    density: {
      tight: "gap-0",
      normal: "gap-0.5",
      loose: "gap-1",
    },
  },
  compoundVariants: [{ arrangement: "inline", density: "tight", className: "gap-1.5" }],
  defaultVariants: { arrangement: "card", density: "normal" },
})

const titleVariants = cva("truncate leading-5 text-foreground", {
  variants: {
    titleSize: {
      sm: "text-[13px]",
      md: "text-sm",
      lg: "text-base leading-6",
    },
    titleWeight: {
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
  },
  defaultVariants: { titleSize: "md", titleWeight: "medium" },
})

const slugVariants = cva("flex min-w-0 shrink-0 items-baseline leading-5", {
  variants: {
    slugStyle: {
      /** @slug, mono, muted */
      handle: "font-mono text-muted-foreground",
      /** mono chip w/ bg */
      chip: "rounded bg-muted px-1 font-mono text-muted-foreground",
      /** plain gray text, no @ */
      plain: "text-muted-foreground",
    },
    slugSize: {
      xs: "text-[11px]",
      sm: "text-xs",
    },
    conflict: {
      true: "text-destructive [&_input]:text-destructive [&_button]:text-destructive",
      false: "",
    },
  },
  defaultVariants: { slugStyle: "handle", slugSize: "xs", conflict: false },
})

const descriptionVariants = cva("min-w-0 leading-4 text-muted-foreground", {
  variants: {
    descriptionStyle: {
      muted: "",
      italic: "italic",
      /** shown on row hover / focus only */
      hover: "opacity-0 transition-opacity group-hover/field:opacity-100 group-focus-within/field:opacity-100",
    },
    descriptionSize: {
      xs: "text-[11px]",
      sm: "text-xs",
      md: "text-[13px] leading-[18px]",
    },
  },
  defaultVariants: { descriptionStyle: "muted", descriptionSize: "sm" },
})

const tooltipVariants = cva("flex flex-col", {
  variants: {
    tooltipStyle: {
      /** just the text(s), small popup */
      plain: "w-56 gap-1 p-2 text-xs",
      /** user-card: type icon, title, @slug, description */
      card: "w-64 gap-2 p-3 text-sm",
    },
  },
  defaultVariants: { tooltipStyle: "plain" },
})

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

export type FieldMeta = {
  type: JsonTypeKey
  title: string
  slug: string
  /** true once user typed slug by hand; stops auto-derive from title */
  slugEdited: boolean
  description: string
  examples: string[]
}

export type SlugPlacement = "inline" | "below" | "tooltip" | "hidden"
export type DescriptionPlacement = "below" | "tooltip"
export type TooltipTrigger = "title" | "icon" | "row"
export type SlugConflict = "suffix" | "mark" | "reject"

export type FieldHeaderProps = {
  field: FieldMeta
  onChange: (next: FieldMeta) => void
  /** slugs used by sibling fields; drives uniqueness */
  taken?: Set<string>
  /** what happens when hand-typed slug collides */
  slugConflict?: SlugConflict
  /** how title / slug / description get edited */
  editing?: EditMode
  /** auto-slug casing while slug not hand-edited */
  slugCase?: SlugCase
  slugPlacement?: SlugPlacement
  descriptionPlacement?: DescriptionPlacement
  /** what opens the tooltip; unused when nothing lives in tooltip */
  tooltipTrigger?: TooltipTrigger
  tooltipSide?: "top" | "right" | "bottom"
  examples?: "below" | "hidden"
  /** props forwarded to the type picker */
  picker?: Omit<TypePickerProps, "value" | "onChange">
  className?: string
} & VariantProps<typeof headerVariants> &
  VariantProps<typeof bodyVariants> &
  VariantProps<typeof titleVariants> &
  Omit<VariantProps<typeof slugVariants>, "conflict"> &
  VariantProps<typeof descriptionVariants> &
  VariantProps<typeof tooltipVariants>

const EMPTY = new Set<string>()

export function FieldHeader({
  field,
  onChange,
  taken = EMPTY,
  slugConflict = "suffix",
  editing = "ghost",
  slugCase = "camel",
  slugPlacement = "inline",
  descriptionPlacement = "below",
  tooltipTrigger = "title",
  tooltipSide = "top",
  tooltipStyle,
  examples = "below",
  picker,
  className,
  iconAlign,
  density,
  arrangement,
  titleSize,
  titleWeight,
  slugStyle,
  slugSize,
  descriptionStyle,
  descriptionSize,
}: FieldHeaderProps) {
  const arr = arrangement ?? "card"
  const conflict = field.slug.length > 0 && taken.has(field.slug)
  // last slug known to be unique; "reject" mode falls back to it
  const lastValid = React.useRef(field.slug)
  React.useEffect(() => {
    if (!conflict) lastValid.current = field.slug
  }, [conflict, field.slug])

  const setTitle = (title: string) =>
    onChange({
      ...field,
      title,
      slug: field.slugEdited
        ? field.slug
        : uniqueSlug(slugify(title, slugCase), taken, slugCase),
    })

  const setSlug = (slug: string) =>
    onChange({ ...field, slug, slugEdited: slug.length > 0 })

  /** conflict policy applies on commit, not per keystroke */
  const commitSlug = (slug: string) => {
    if (!taken.has(slug)) return
    if (slugConflict === "suffix")
      onChange({ ...field, slug: uniqueSlug(slug, taken, slugCase), slugEdited: true })
    else if (slugConflict === "reject")
      onChange({ ...field, slug: lastValid.current })
    // "mark": keep as typed, styled red
  }

  const conflictMsg = conflict ? `"${field.slug}" already used by another field` : undefined

  const slugEl = (
    <span
      className={slugVariants({ slugStyle, slugSize, conflict })}
      title={conflictMsg}
      aria-invalid={conflict || undefined}
    >
      {slugStyle !== "plain" && <span className="select-none">@</span>}
      <Editable
        mode={editing}
        value={field.slug}
        onChange={setSlug}
        onCommit={commitSlug}
        placeholder="slug"
        className="font-mono"
      />
    </span>
  )

  const descEl = (
    <Editable
      mode={editing}
      multiline={arr !== "inline"}
      value={field.description}
      onChange={(description) => onChange({ ...field, description })}
      placeholder="Add description"
      className={cn(
        descriptionVariants({ descriptionStyle, descriptionSize }),
        arr === "inline" && "truncate"
      )}
    />
  )

  const examplesEl =
    examples === "below" && field.examples.length > 0 ? (
      <div className="truncate text-[11px] leading-4 text-muted-foreground/70">
        e.g. {field.examples.join(", ")}
      </div>
    ) : null

  const titleEl = (
    <Editable
      mode={editing}
      value={field.title}
      onChange={setTitle}
      placeholder="Untitled"
      className={titleVariants({ titleSize, titleWeight })}
    />
  )

  /* ------------------------------- tooltip -------------------------------- */

  const slugInTip = slugPlacement === "tooltip"
  const descInTip = descriptionPlacement === "tooltip"
  const hasTip = slugInTip || descInTip

  /** hover-open popover; contents stay editable */
  const withTip = (trigger: React.ReactElement, key?: string) =>
    !hasTip ? (
      <React.Fragment key={key}>{trigger}</React.Fragment>
    ) : (
      <Popover key={key}>
        <PopoverTrigger
          openOnHover
          delay={300}
          nativeButton={false}
          render={<div className={cn("flex min-w-0 items-center gap-1.5", tooltipTrigger === "row" && "flex-1")} />}
        >
          {trigger}
        </PopoverTrigger>
        <PopoverContent
          side={tooltipSide}
          align="start"
          className={tooltipVariants({ tooltipStyle })}
        >
          {tooltipStyle === "card" && (
            <div className="flex flex-col gap-0.5">
              <div className="truncate text-sm font-medium">{field.title || "Untitled"}</div>
              {slugInTip && slugEl}
            </div>
          )}
          {tooltipStyle !== "card" && slugInTip && slugEl}
          {descInTip && (
            <Editable
              mode={editing}
              multiline
              value={field.description}
              onChange={(description) => onChange({ ...field, description })}
              placeholder="Add description"
              className="w-full text-xs leading-4 text-muted-foreground"
            />
          )}
        </PopoverContent>
      </Popover>
    )

  const infoIcon = hasTip && tooltipTrigger === "icon" && (
    <InfoIcon className="size-3.5 shrink-0 self-center text-muted-foreground/60 hover:text-foreground" />
  )

  // min-h = picker height so icon (top-aligned) centers on this line
  const titleLine = (
    <div className="flex min-h-[var(--line,28px)] min-w-0 items-center gap-1.5">
      {tooltipTrigger === "title" ? withTip(titleEl) : titleEl}
      {slugPlacement === "inline" && slugEl}
      {tooltipTrigger === "icon" && withTip(<span className="flex self-center">{infoIcon}</span>)}
    </div>
  )

  const body = (
    <div className={bodyVariants({ arrangement, density })}>
      {titleLine}
      {slugPlacement === "below" && slugEl}
      {descriptionPlacement === "below" &&
        (arr === "inline" ? (
          <>
            <span className="text-muted-foreground/50">—</span>
            {descEl}
          </>
        ) : (
          descEl
        ))}
      {examplesEl}
    </div>
  )

  const header = (
    <div className={cn(headerVariants({ iconAlign, density }), className)}>
      <TypePicker
        value={field.type}
        onChange={(type) => onChange({ ...field, type })}
        {...picker}
      />
      {body}
    </div>
  )

  return hasTip && tooltipTrigger === "row" ? withTip(header) : header
}

export {
  headerVariants,
  bodyVariants,
  titleVariants,
  slugVariants,
  descriptionVariants,
  tooltipVariants,
}
