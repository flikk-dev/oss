import { slugify } from "./slug"
import { blankNode, parseIds, type SchemaNode } from "./tree"
import { defaultTypes, type Json, type TypeModule } from "./types"

const META = ["title", "description", "examples"] as const
/** keywords the node model owns; anything else is `extra` */
const MODELED = [
  "type",
  "format",
  "const",
  "properties",
  "required",
  "additionalProperties",
  "oneOf",
  "anyOf",
  "items",
]

export const registry = (types: TypeModule[]) =>
  new Map(types.map((t) => [t.key, t]))

/* ------------------------------- tree → json ------------------------------ */

/** node tree → JSON Schema (draft 2020-12). Root must be an object node. */
export function toJsonSchema(
  root: SchemaNode,
  types: TypeModule[] = defaultTypes
): Json {
  return nodeSchema(root, registry(types))
}

function nodeSchema(n: SchemaNode, reg: Map<string, TypeModule>): Json {
  const mod = reg.get(n.type)
  if (!mod) throw new Error(`unknown type "${n.type}"`)
  let s: Json = { ...mod.schema(n) }
  if (n.type === "object") {
    const properties: Json = {}
    const required: string[] = []
    for (const c of n.children ?? []) {
      properties[c.key] = nodeSchema(c, reg)
      if (!c.optional) required.push(c.key)
    }
    s.properties = properties
    if (required.length) s.required = required
    s.additionalProperties = false
  } else if (mod.children) {
    s.oneOf = (n.children ?? []).map((c) => nodeSchema(c, reg))
  }
  if (n.title) s.title = n.title
  if (n.description) s.description = n.description
  if (mod.examples && n.examples.length) s.examples = n.examples
  Object.assign(s, n.extra)
  if (n.nullable) {
    if (typeof s.type === "string" && !mod.children) s.type = [s.type, "null"]
    else {
      const { title, description, examples, ...inner } = s
      s = { anyOf: [inner, { type: "null" }] }
      if (title !== undefined) s.title = title
      if (description !== undefined) s.description = description
      if (examples !== undefined) s.examples = examples
    }
  }
  if (n.repeated)
    s = { type: "array", items: s, ...(n.title ? { title: n.title } : {}) }
  return s
}

/* ------------------------------- json → tree ------------------------------ */

/** JSON Schema → node tree. Unknown keywords are kept on `node.extra`. */
export function fromJsonSchema(
  json: Json,
  types: TypeModule[] = defaultTypes
): SchemaNode {
  const root = parse(json, "", types, false, parseIds())
  if (root.type !== "object") throw new Error("root schema must be an object")
  root.key = ""
  return root
}

function parse(
  input: Json,
  key: string,
  types: TypeModule[],
  optional: boolean,
  nextId: () => string
): SchemaNode {
  let s = input
  const flags = { nullable: false, repeated: false }

  if (s.type === "array" && s.items && typeof s.items === "object") {
    flags.repeated = true
    const { items, type: _t, title, ...rest } = s
    s = { ...(items as Json), ...rest }
    if (title !== undefined && s.title === undefined) s.title = title
  }
  if (Array.isArray(s.type) && s.type.includes("null")) {
    flags.nullable = true
    const t = s.type.filter((x) => x !== "null")
    s = { ...s, type: t.length === 1 ? t[0] : t }
  } else if (
    Array.isArray(s.anyOf) &&
    s.anyOf.length === 2 &&
    (s.anyOf[1] as Json)?.type === "null"
  ) {
    flags.nullable = true
    const { anyOf, ...rest } = s
    s = { ...(anyOf[0] as Json), ...rest }
  }

  const mod = pickType(s, types)
  const title = typeof s.title === "string" ? s.title : ""
  const derived = title ? slugify(title, "camel") : ""
  const node = blankNode(mod.key, mod.children, {
    id: nextId(),
    key: mod.key === "const" ? String(s.const) : key || derived,
    // keys that came from JSON are real property names: never renamed by a title edit
    keyEdited: !!key,
    title,
    description: typeof s.description === "string" ? s.description : "",
    examples:
      mod.examples && Array.isArray(s.examples) ? s.examples.map(String) : [],
    optional,
    ...flags,
  })

  if (mod.key === "object") {
    const props = (s.properties ?? {}) as Record<string, Json>
    const required = (s.required ?? []) as string[]
    node.children = Object.entries(props).map(([k, v]) =>
      parse(v, k, types, !required.includes(k), nextId)
    )
  } else if (mod.children) {
    node.children = ((s.oneOf ?? []) as Json[]).map((v) =>
      parse(v, "", types, false, nextId)
    )
  }
  // everything the editor does not model rides along; type modules read what they need from it
  const consumed = new Set<string>([...META, ...MODELED])
  const extra = Object.fromEntries(
    Object.entries(s).filter(([k]) => !consumed.has(k))
  )
  if (Object.keys(extra).length) node.extra = extra
  return node
}

/**
 * Most specific matching module wins: the one claiming the most keys of the
 * schema (e.g. a `pattern` type beats plain string). Ties → registry order.
 */
function pickType(s: Json, types: TypeModule[]): TypeModule {
  let best: { mod: TypeModule; n: number } | null = null
  for (const mod of types) {
    if (!mod.matches(s)) continue
    const probe = blankNode(mod.key, mod.children, { extra: s })
    const claims = new Set(Object.keys(mod.schema(probe)))
    if (mod.children)
      for (const k of [
        "properties",
        "required",
        "additionalProperties",
        "oneOf",
      ])
        claims.add(k)
    const n = Object.keys(s).filter((k) => claims.has(k)).length
    if (!best || n > best.n) best = { mod, n }
  }
  return best?.mod ?? types.find((t) => t.key === "string")!
}

/* --------------------------------- example -------------------------------- */

/** node tree → plausible example document */
export function toExample(
  root: SchemaNode,
  types: TypeModule[] = defaultTypes
): unknown {
  return example(root, registry(types))
}

function example(n: SchemaNode, reg: Map<string, TypeModule>): unknown {
  const mod = reg.get(n.type)!
  let v: unknown
  if (n.type === "object")
    v = Object.fromEntries(
      (n.children ?? []).map((c) => [c.key, example(c, reg)])
    )
  else if (mod.children)
    v = n.children?.[0] ? example(n.children[0], reg) : null
  else v = mod.example(n)
  return n.repeated ? [v] : v
}
