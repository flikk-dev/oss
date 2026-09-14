"use client"

import * as React from "react"
import { AnimatePresence, Reorder } from "motion/react"
import { cn } from "cn"
import { FieldRow, type FieldNode, type FieldRowProps } from "./field-row"

type RowOpts = Omit<
  FieldRowProps,
  "node" | "onChange" | "onDelete" | "onDuplicate" | "taken" | "children"
>

export type FieldListProps = {
  nodes: FieldNode[]
  onChange: (next: FieldNode[]) => void
  row: RowOpts
  depth?: number
  /** px per nesting level */
  indent?: number
  className?: string
}

const canNest = new Set(["object", "array"])

let seq = 0
const newId = () => `f${Date.now().toString(36)}${(seq++).toString(36)}`

function clone(n: FieldNode): FieldNode {
  return {
    ...n,
    id: newId(),
    children: n.children?.map(clone),
  }
}

/**
 * One Reorder.Group per sibling set — reorder stays within the parent,
 * same as flikk block-canvas. Nested lists render inside their parent row.
 */
export function FieldList({
  nodes,
  onChange,
  row,
  depth = 0,
  indent = 20,
  className,
}: FieldListProps) {
  const update = (i: number, next: FieldNode) =>
    onChange(nodes.map((n, j) => (j === i ? next : n)))
  const remove = (i: number) => onChange(nodes.filter((_, j) => j !== i))
  const duplicate = (i: number) => {
    const copy = clone(nodes[i])
    copy.slug = `${copy.slug}Copy`
    copy.slugEdited = true
    onChange([...nodes.slice(0, i + 1), copy, ...nodes.slice(i + 1)])
  }

  return (
    <Reorder.Group
      axis="y"
      values={nodes}
      onReorder={onChange}
      className={cn(
        "flex flex-col",
        row.chrome === "divider" ? "divide-y divide-border" : "gap-1",
        className
      )}
      style={{ paddingLeft: depth ? indent : 0 }}
    >
      <AnimatePresence initial={false}>
        {nodes.map((node, i) => {
          const taken = new Set(nodes.filter((n) => n.id !== node.id).map((n) => n.slug))
          return (
            <FieldRow
              key={node.id}
              node={node}
              taken={taken}
              onChange={(next) => update(i, next)}
              onDelete={() => remove(i)}
              onDuplicate={() => duplicate(i)}
              {...row}
            >
              {canNest.has(node.type) && node.children && node.children.length > 0 && (
                <FieldList
                  nodes={node.children}
                  onChange={(children) => update(i, { ...node, children })}
                  row={row}
                  depth={depth + 1}
                  indent={indent}
                />
              )}
            </FieldRow>
          )
        })}
      </AnimatePresence>
    </Reorder.Group>
  )
}
