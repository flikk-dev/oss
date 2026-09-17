import type { ComponentType } from "react"
import {
  ALargeSmallIcon,
  BinaryIcon,
  BracesIcon,
  CalendarIcon,
  CircleSlashIcon,
  EqualIcon,
  HashIcon,
  LinkIcon,
  MailIcon,
  SplitIcon,
  ToggleLeftIcon,
  type LucideIcon,
} from "lucide-react"
import type { SchemaNode } from "./tree"

export type Json = Record<string, unknown>

/**
 * A type is a module: everything type-specific lives here, the editor never
 * branches on `node.type`. Register custom ones through `createJsonSchema(json, { types })`.
 */
export type TypeModule = {
  key: string
  label: string
  description: string
  icon: LucideIcon
  /** tailwind classes for the icon tile; colours come from --type-* tokens */
  color: string
  /** node → JSON Schema (without title / description / examples / extra) */
  schema: (node: SchemaNode) => Json
  /** node → plausible example value */
  example: (node: SchemaNode) => unknown
  /** parsing: does this module own the given schema? first match in registry order wins */
  matches: (schema: Json) => boolean
  /** has child nodes (object properties, choice alternatives) */
  children: boolean
  /** which child types may be dropped inside; true = any */
  accepts: readonly string[] | boolean
  /** takes example values */
  examples: boolean
  /** badge text for the child count */
  countLabel?: (n: number) => string
  /** optional type-owned UI rendered in the row */
  Extra?: ComponentType<{
    node: SchemaNode
    set: (patch: Partial<SchemaNode>) => void
  }>
}

type Optional = "children" | "accepts" | "examples" | "matches" | "example"

export function defineType(
  def: Omit<TypeModule, Optional> & Partial<Pick<TypeModule, Optional>>
): TypeModule {
  return {
    children: false,
    accepts: false,
    examples: true,
    matches: (s) => s.type === def.key,
    example: (n) => n.examples[0] ?? "",
    ...def,
  }
}

const first = (n: SchemaNode) => n.examples[0]

/** built-in registry; order matters for parsing (specific before generic) */
export const types = {
  const: defineType({
    key: "const",
    label: "Fixed value",
    description: "Always exactly this; the key is the value",
    icon: EqualIcon,
    color: "bg-type-const/10 text-type-const",
    schema: (n) => ({ const: n.key }),
    example: (n) => n.key,
    matches: (s) => "const" in s,
    examples: false,
  }),
  oneOf: defineType({
    key: "oneOf",
    label: "Choice",
    description: "One of several options",
    icon: SplitIcon,
    color: "bg-type-oneOf/10 text-type-oneOf",
    children: true,
    accepts: true,
    examples: false,
    countLabel: (n) => `${n} ${n === 1 ? "option" : "options"}`,
    // a choice of only fixed values is a string enum
    schema: (n) =>
      n.children?.length && n.children.every((c) => c.type === "const")
        ? { type: "string" }
        : {},
    example: () => null,
    matches: (s) => Array.isArray(s.oneOf),
  }),
  object: defineType({
    key: "object",
    label: "Object",
    description: "Group of named fields",
    icon: BracesIcon,
    color: "bg-type-object/10 text-type-object",
    children: true,
    accepts: true,
    examples: false,
    countLabel: (n) => `${n} ${n === 1 ? "field" : "fields"}`,
    // properties / required / additionalProperties are filled by the compiler, which owns the children walk
    schema: () => ({ type: "object" }),
    example: () => ({}),
  }),
  email: defineType({
    key: "email",
    label: "Email",
    description: "Valid email address",
    icon: MailIcon,
    color: "bg-type-email/10 text-type-email",
    schema: () => ({ type: "string", format: "email" }),
    example: (n) => first(n) ?? "user@example.com",
    matches: (s) => s.type === "string" && s.format === "email",
  }),
  url: defineType({
    key: "url",
    label: "URL",
    description: "Absolute web address",
    icon: LinkIcon,
    color: "bg-type-url/10 text-type-url",
    schema: () => ({ type: "string", format: "uri" }),
    example: (n) => first(n) ?? "https://example.com",
    matches: (s) => s.type === "string" && s.format === "uri",
  }),
  date: defineType({
    key: "date",
    label: "Date",
    description: "ISO 8601 date or date-time",
    icon: CalendarIcon,
    color: "bg-type-date/10 text-type-date",
    schema: () => ({ type: "string", format: "date-time" }),
    example: (n) => first(n) ?? "2026-01-01T00:00:00Z",
    matches: (s) =>
      s.type === "string" && (s.format === "date-time" || s.format === "date"),
  }),
  string: defineType({
    key: "string",
    label: "Text",
    description: "Names, notes, free text",
    icon: ALargeSmallIcon,
    color: "bg-type-string/10 text-type-string",
    schema: () => ({ type: "string" }),
    example: (n) => first(n) ?? "text",
  }),
  number: defineType({
    key: "number",
    label: "Number",
    description: "Decimals, prices, ratios",
    icon: HashIcon,
    color: "bg-type-number/10 text-type-number",
    schema: () => ({ type: "number" }),
    example: (n) => Number(first(n)) || 1.5,
  }),
  integer: defineType({
    key: "integer",
    label: "Integer",
    description: "Whole numbers, counts, ids",
    icon: BinaryIcon,
    color: "bg-type-integer/10 text-type-integer",
    schema: () => ({ type: "integer" }),
    example: (n) => Number(first(n)) || 1,
  }),
  boolean: defineType({
    key: "boolean",
    label: "Yes / No",
    description: "True or false",
    icon: ToggleLeftIcon,
    color: "bg-type-boolean/10 text-type-boolean",
    schema: () => ({ type: "boolean" }),
    example: (n) => (first(n) ? first(n) === "true" : true),
  }),
  null: defineType({
    key: "null",
    label: "Empty",
    description: "Always null",
    icon: CircleSlashIcon,
    color: "bg-type-null/10 text-type-null",
    schema: () => ({ type: "null" }),
    example: () => null,
    examples: false,
  }),
} satisfies Record<string, TypeModule>

export type BuiltinTypeKey = keyof typeof types

export const defaultTypes: TypeModule[] = Object.values(types)

/** groups for the type menu */
export const typeGroups: { key: string; label: string; types: string[] }[] = [
  {
    key: "values",
    label: "Values",
    types: ["string", "number", "integer", "boolean", "const"],
  },
  { key: "structures", label: "Structures", types: ["object", "oneOf"] },
  { key: "formats", label: "Formats", types: ["date", "email", "url"] },
  { key: "special", label: "Special", types: ["null"] },
]
