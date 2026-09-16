import type { JsonTypeKey } from "@/store/types"

/** One field. `children` only on group types (object, oneOf). */
export type FieldMeta = {
  type: JsonTypeKey
  title: string
  slug: string
  /** true once user typed slug by hand; stops auto-derive from title */
  slugEdited: boolean
  description: string
  examples: string[]
  optional: boolean
  nullable: boolean
  /** repeated: schema becomes { type: "array", items: … } */
  isArray?: boolean
  collapsed?: boolean
}

export type FieldNode = FieldMeta & { id: string; children?: FieldNode[] }

/** the editor's value */
export type FieldTree = FieldNode[]

export const isGroupType = (t: JsonTypeKey) => t === "object" || t === "oneOf"

let seq = 0
export const newId = () => `f${Date.now().toString(36)}${(seq++).toString(36)}`
