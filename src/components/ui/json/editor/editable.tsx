"use client"

import * as React from "react"
import { cn } from "cn"
import { useRender } from "@base-ui/react/use-render"

export type RenderProp = Parameters<typeof useRender>[0]["render"]

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
  /** your own element (e.g. shadcn <Input />); value / handlers merged in, none of our styling */
  render?: RenderProp
  /** `inline`: plain text until hover / focus. `input`: a bordered field */
  variant?: "inline" | "input"
}

/** Inline text edit: an input styled as plain text, sized to its content. */
export function Editable({
  value,
  onChange,
  onCommit,
  multiline,
  readOnly,
  className,
  render,
  variant = "inline",
  ...rest
}: EditableProps) {
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      (e.key === "Enter" && !(multiline && e.shiftKey)) ||
      e.key === "Escape"
    ) {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }
  const custom = useRender({
    render,
    enabled: !!render,
    defaultTagName: multiline ? "textarea" : "input",
    props: {
      ...(rest as object),
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        onChange(e.target.value),
      onBlur: (e: React.FocusEvent<HTMLInputElement>) =>
        onCommit?.(e.target.value),
      onKeyDown,
      className,
    },
  })
  if (render && !readOnly) return custom
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
      data-variant={variant}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onCommit?.(e.target.value)}
      onKeyDown={onKeyDown}
      className={cn(
        "resize-none rounded-md outline-none placeholder:text-muted-foreground/60",
        variant === "inline"
          ? // padding with matching negative margins: breathing room on hover / focus, no layout shift.
            // max width includes the margins, else a percentage clamp eats the last character
            "-mx-1.5 -my-0.5 field-sizing-content max-w-[calc(100%+--spacing(3))] min-w-6 bg-transparent px-1.5 py-0.5 hover:bg-muted/50 focus:bg-muted/70"
          : "w-full border border-input bg-background px-2 py-1 shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    />
  )
}
