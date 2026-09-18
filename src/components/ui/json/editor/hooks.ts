"use client"

import * as React from "react"
import { useShallow } from "zustand/react/shallow"
import { useEditor, useEditorStore, useFieldContext } from "@/context/editor"
import { toNode, type EditorState } from "@/store/editor"
import { validate, type Issue } from "@/store/validate"
import type { Field, FieldPatch, Json, TypeModule } from "@/store"

/**
 * The headless layer: two hooks. `useSchema()` anywhere under <Schema.Root>,
 * `useField()` inside a <SchemaField.Row>. Fields are addressed by slug path
 * ("address.street"); an id works too.
 */

type Tree = Pick<EditorState, "byId" | "children">
const toField = (s: Tree, id: string): Field => {
  const n = s.byId[id]
  return n.isGroup
    ? { ...n, fields: (s.children[id] ?? []).map((c) => toField(s, c)) }
    : { ...n }
}

/** issues, computed once per tree (keyed on the maps' identity) */
const issueCache = new WeakMap<
  EditorState["byId"],
  { children: EditorState["children"]; issues: Issue[] }
>()
const issuesOf = (s: Pick<EditorState, "byId" | "children" | "root">) => {
  const hit = issueCache.get(s.byId)
  if (hit && hit.children === s.children) return hit.issues
  const issues = validate(toNode(s, s.root)).issues
  issueCache.set(s.byId, { children: s.children, issues })
  return issues
}

/** a new field: type is the only must; key derives from title unless given */
export type NewField = Partial<Omit<Field, "id" | "isGroup" | "fields">> & {
  type: string
}

export function useSchema() {
  const { schema: handle, store, types } = useEditor()
  const { byId, children, root, selected } = useEditorStore(
    useShallow((s) => ({
      byId: s.byId,
      children: s.children,
      root: s.root,
      selected: s.selected,
    }))
  )
  const schema = React.useMemo(
    () => toField({ byId, children }, root),
    [byId, children, root]
  )
  const selectedFields = React.useMemo(
    () =>
      selected
        .filter((id) => byId[id])
        .map((id) => toField({ byId, children }, id)),
    [selected, byId, children]
  )
  const issues = React.useMemo(
    () => issuesOf({ byId, children, root }),
    [byId, children, root]
  )

  const s = () => store.getState()
  /** slug path or id → id */
  const idOf = (ref: string | Field): string | undefined => {
    if (typeof ref !== "string") return ref.id
    if (ref === "" || ref === ".") return s().root
    return handle.find(ref) ?? (s().byId[ref] ? ref : undefined)
  }
  const idsOf = (refs: string | Field | (string | Field)[]) =>
    [refs]
      .flat()
      .map(idOf)
      .filter((x): x is string => !!x)

  const fields = React.useMemo(
    () => ({
      get: (ref: string): Field | undefined => {
        const id = idOf(ref)
        return id ? toField(s(), id) : undefined
      },
      add: (field: NewField, parent: string | Field = "", index?: number) => {
        const pid = idOf(parent)
        if (!pid) throw new Error(`no such field "${String(parent)}"`)
        const { type, ...rest } = field
        const id = s().insert(pid, type, index)
        if (Object.keys(rest).length) s().update(id, rest)
        return toField(s(), id)
      },
      update: (ref: string | Field, patch: FieldPatch) => {
        const id = idOf(ref)
        if (id) s().update(id, patch)
      },
      drop: (refs: string | Field | (string | Field)[]) =>
        s().remove(idsOf(refs)),
      duplicate: (ref: string | Field) => {
        const id = idOf(ref)
        return id ? toField(s(), s().duplicate(id)) : undefined
      },
      move: (
        refs: string | Field | (string | Field)[],
        parent: string | Field = "",
        index?: number
      ) => {
        const pid = idOf(parent)
        if (!pid) return
        s().move(idsOf(refs), pid, index ?? s().children[pid]?.length ?? 0)
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store]
  )

  return {
    /** the tree, live: root field with `fields` */
    schema,
    /** replace everything: JSON Schema in */
    setSchema: (json: Json) => handle.reset(json),
    selectedFields,
    setSelectedFields: (refs: (string | Field)[]) => s().select(idsOf(refs)),
    /** what would stop a save: empty / duplicate keys, empty groups */
    issues,
    fields,
    types: types as TypeModule[],
    toJSON: handle.toJSON,
    toExample: handle.toExample,
  }
}

/** the row: its field and what a row can do to it */
export function useField() {
  const { id, node, set } = useFieldContext()
  const { store, types } = useEditor()
  const type = types.find((t) => t.key === node.type)
  if (!type) throw new Error(`unknown type "${node.type}"`)
  const childrenCount = useEditorStore((s) => s.children[id]?.length ?? 0)
  const selected = useEditorStore((s) => s.selected.includes(id))
  const issue = useEditorStore((s) => issuesOf(s).find((i) => i.id === id))
  const s = () => store.getState()
  return {
    /** the field, without its subtree; `fields.get()` on useSchema() has the tree */
    field: node as Field,
    type,
    update: set,
    drop: () => s().remove(id),
    duplicate: () => s().duplicate(id),
    childrenCount,
    /** first problem on this field, if any */
    issue,
    selected,
    select: (on?: boolean) => s().toggleSelect(id, on),
  }
}
