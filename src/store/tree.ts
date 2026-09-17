/** One field. Root is an object node with key "". */
export type SchemaNode = {
  id: string
  type: string
  /** JSON key (property name / const value); auto from title until edited by hand */
  key: string
  keyEdited: boolean
  title: string
  description: string
  examples: string[]
  optional: boolean
  nullable: boolean
  /** array of this field */
  repeated: boolean
  collapsed?: boolean
  /** JSON Schema keywords the editor has no UI for; written back untouched */
  extra?: Record<string, unknown>
  /** derived from the type module */
  isGroup: boolean
  children?: SchemaNode[]
}

export type NodePatch = Partial<Omit<SchemaNode, "id" | "isGroup" | "children">>

let seq = 0
/** runtime ids (insert / duplicate) */
export const newId = () => `x${Date.now().toString(36)}${(seq++).toString(36)}`
/** deterministic ids for parsed trees, so server and client render the same DOM */
export const parseIds = () => {
  let n = 0
  return () => `n${++n}`
}

export function blankNode(
  type: string,
  isGroup: boolean,
  over: Partial<SchemaNode> = {}
): SchemaNode {
  return {
    id: newId(),
    type,
    key: "",
    keyEdited: false,
    title: "",
    description: "",
    examples: [],
    optional: false,
    nullable: false,
    repeated: false,
    isGroup,
    ...(isGroup ? { children: [] } : {}),
    ...over,
  }
}
