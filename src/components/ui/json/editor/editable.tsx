"use client"

import * as React from "react"
import { cn } from "cn"

export type EditableProps = Omit<
  React.ComponentProps<"input">,
  "value" | "onChange"
> & {
  value: string
  onChange: (v: string) => void
  /** fired on blur / Enter with final value */
  onCommit?: (v: string) => void
  multiline?: boolean
  /** render as plain text (mobile summaries) */
  readOnly?: boolean
}

/** Inline text edit: an input styled as plain text, sized to its content. */
export function Editable({
  value,
  onChange,
  onCommit,
  multiline,
  readOnly,
  className,
  ...rest
}: EditableProps) {
  if (readOnly)
    return (
      <span
        {...(rest as React.ComponentProps<"span">)}
        className={cn(
          "truncate",
          !value && "text-muted-foreground/60",
          className
        )}
      >
        {value || rest.placeholder}
      </span>
    )
  const Tag = (multiline ? "textarea" : "input") as "input"
  return (
    <Tag
      {...(rest as React.ComponentProps<"input">)}
      {...(multiline ? { rows: 1 } : {})}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onCommit?.(e.target.value)}
      onKeyDown={(e) => {
        if (
          (e.key === "Enter" && !(multiline && e.shiftKey)) ||
          e.key === "Escape"
        ) {
          e.preventDefault()
          e.currentTarget.blur()
        }
      }}
      className={cn(
        // padding with matching negative margins: breathing room on hover / focus, no layout shift
        "-mx-1.5 -my-0.5 field-sizing-content max-w-full min-w-6 resize-none rounded-md bg-transparent px-1.5 py-0.5 outline-none",
        "placeholder:text-muted-foreground/60 hover:bg-muted/50 focus:bg-muted/70",
        className
      )}
    />
  )
}
