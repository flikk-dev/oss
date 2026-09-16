import { jsonTypeMap } from "@/components/ui/schema-editor/types"
import type { FieldNode } from "./tree"

type Schema = Record<string, unknown>

/** field tree → JSON Schema (draft 2020-12 shape) */
export function toJsonSchema(nodes: FieldNode[]): Schema {
  return objectSchema(nodes)
}

function objectSchema(nodes: FieldNode[]): Schema {
  const properties: Record<string, Schema> = {}
  const required: string[] = []
  for (const n of nodes) {
    const key = n.slug || n.id
    properties[key] = fieldSchema(n)
    if (!n.optional) required.push(key)
  }
  const out: Schema = { type: "object", properties }
  if (required.length) out.required = required
  out.additionalProperties = false
  return out
}

function fieldSchema(n: FieldNode): Schema {
  let s: Schema
  switch (n.type) {
    case "object":
      s = objectSchema(n.children ?? [])
      break
    case "oneOf": {
      const kids = n.children ?? []
      // all constants → a string enum with titles; otherwise alternatives of shapes
      s = kids.every((k) => k.type === "const")
        ? { type: "string", oneOf: kids.map(fieldSchema) }
        : { oneOf: kids.map(fieldSchema) }
      break
    }
    case "const":
      s = { const: n.slug }
      break
    default:
      s = { ...jsonTypeMap[n.type].schema }
  }
  if (n.title) s.title = n.title
  if (n.description) s.description = n.description
  if (n.examples.length) s.examples = n.examples
  if (n.nullable) {
    if (typeof s.type === "string") s.type = [s.type, "null"]
    else s = { anyOf: [s, { type: "null" }] }
  }
  if (n.isArray)
    s = { type: "array", items: s, ...(n.title ? { title: n.title } : {}) }
  return s
}

/** field tree → plausible example document */
export function toExample(nodes: FieldNode[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const n of nodes) out[n.slug || n.id] = exampleValue(n)
  return out
}

function exampleValue(n: FieldNode): unknown {
  let v: unknown
  switch (n.type) {
    case "object":
      v = toExample(n.children ?? [])
      break
    case "oneOf": {
      const first = n.children?.[0]
      v = first ? exampleValue(first) : null
      break
    }
    case "string":
      v = n.examples[0] ?? "text"
      break
    case "number":
      v = Number(n.examples[0]) || 1.5
      break
    case "integer":
      v = Number(n.examples[0]) || 1
      break
    case "boolean":
      v = n.examples[0] ? n.examples[0] === "true" : true
      break
    case "const":
      v = n.slug
      break
    case "date":
      v = n.examples[0] ?? "2026-01-01T00:00:00Z"
      break
    case "email":
      v = n.examples[0] ?? "user@example.com"
      break
    case "url":
      v = n.examples[0] ?? "https://example.com"
      break
    case "null":
      v = null
      break
  }
  return n.isArray ? [v] : v
}
