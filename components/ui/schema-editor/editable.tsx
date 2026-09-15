"use client"

import * as React from "react"
import { cn } from "cn"

type Props = {
  value: string
  onChange: (v: string) => void
  /** fired on blur / Enter with final value */
  onCommit?: (v: string) => void
  placeholder?: string
  multiline?: boolean
  /** render as plain text (mobile rows) */
  readOnly?: boolean
  className?: string
  [key: `data-${string}`]: string | undefined
}

/** Inline text edit: always an input, styled as plain text, sized to content. */
export function Editable({
  value,
  onChange,
  onCommit,
  placeholder,
  multiline,
  readOnly,
  className,
  ...rest
}: Props) {
  if (readOnly)
    return (
      <span
        {...rest}
        className={cn(
          "truncate",
          !value && "text-muted-foreground/60",
          className
        )}
      >
        {value || placeholder}
      </span>
    )
  const Tag = multiline ? "textarea" : "input"
  return (
    <Tag
      {...rest}
      value={value}
      rows={multiline ? 1 : undefined}
      placeholder={placeholder}
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
        "-mx-0.5 field-sizing-content min-w-6 resize-none rounded-sm bg-transparent px-0.5 outline-none",
        "placeholder:text-muted-foreground/60 hover:bg-muted/60 focus:bg-muted",
        className
      )}
    />
  )
}
