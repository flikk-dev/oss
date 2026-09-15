"use client"

import * as React from "react"
import { cn } from "cn"

export type EditMode = "ghost" | "click"

type Props = {
  value: string
  onChange: (v: string) => void
  /** fired on blur / Enter with final value, both modes */
  onCommit?: (v: string) => void
  mode: EditMode
  placeholder?: string
  multiline?: boolean
  className?: string
  /** classes for the input itself (ghost bg etc.) */
  inputClassName?: string
  /** data-* passthrough */
  [key: `data-${string}`]: string | undefined
}

/**
 * Inline text edit.
 * ghost: always an input, styled as plain text, sized to content.
 * click: text until clicked, then input; Enter/blur commit, Esc reverts.
 */
export function Editable({
  value,
  onChange,
  onCommit,
  mode,
  placeholder,
  multiline,
  className,
  inputClassName,
  ...rest
}: Props) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(value)
  const ref = React.useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  React.useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  React.useEffect(() => {
    if (editing) ref.current?.select()
  }, [editing])

  const base = cn(
    "min-w-6 rounded-sm bg-transparent px-0.5 -mx-0.5 outline-none field-sizing-content",
    "placeholder:text-muted-foreground/60",
    className
  )

  const commit = () => {
    onChange(draft)
    onCommit?.(draft)
    setEditing(false)
  }
  const revert = () => {
    setDraft(value)
    setEditing(false)
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !(multiline && e.shiftKey)) {
      e.preventDefault()
      ;(e.target as HTMLElement).blur()
    }
    if (e.key === "Escape") {
      e.preventDefault()
      if (mode === "click") revert()
      else (e.target as HTMLElement).blur()
    }
  }

  const Tag = multiline ? "textarea" : "input"

  if (mode === "ghost") {
    return (
      <Tag
        ref={ref}
        {...rest}
        value={value}
        rows={multiline ? 1 : undefined}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onCommit?.(e.target.value)}
        onKeyDown={onKeyDown}
        className={cn(
          base,
          "resize-none hover:bg-muted/60 focus:bg-muted",
          inputClassName
        )}
      />
    )
  }

  if (!editing) {
    return (
      <button
        type="button"
        {...rest}
        onClick={() => setEditing(true)}
        className={cn(
          base,
          "cursor-text truncate text-left hover:bg-muted/60",
          !value && "text-muted-foreground/60",
          inputClassName
        )}
      >
        {value || placeholder}
      </button>
    )
  }

  return (
    <Tag
      ref={ref}
      {...rest}
      autoFocus
      value={draft}
      rows={multiline ? 1 : undefined}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={onKeyDown}
      className={cn(base, "resize-none bg-muted", inputClassName)}
    />
  )
}
