import {
  ALargeSmallIcon,
  HashIcon,
  BinaryIcon,
  ToggleLeftIcon,
  BracesIcon,
  SplitIcon,
  ListCheckIcon,
  CircleSlashIcon,
  CalendarIcon,
  MailIcon,
  LinkIcon,
  type LucideIcon,
} from "lucide-react"

export type JsonTypeKey =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "enum"
  | "object"
  | "oneOf"
  | "null"
  | "date"
  | "email"
  | "url"

export type JsonTypeGroup = "primitive" | "structure" | "format" | "special"

export type JsonType = {
  key: JsonTypeKey
  title: string
  description: string
  icon: LucideIcon
  group: JsonTypeGroup
  /** JSON Schema representation this editor type maps to */
  schema: Record<string, unknown>
  /** explicit class string so tailwind sees it; colors from --type-* in globals.css */
  color: string
}

export const jsonTypes: JsonType[] = [
  {
    key: "string",
    title: "Text",
    description: "Names, notes, free text",
    icon: ALargeSmallIcon,
    group: "primitive",
    schema: { type: "string" },
    color: "bg-type-string/10 text-type-string",
  },
  {
    key: "number",
    title: "Number",
    description: "Decimals, prices, ratios",
    icon: HashIcon,
    group: "primitive",
    schema: { type: "number" },
    color: "bg-type-number/10 text-type-number",
  },
  {
    key: "integer",
    title: "Integer",
    description: "Whole numbers, counts, ids",
    icon: BinaryIcon,
    group: "primitive",
    schema: { type: "integer" },
    color: "bg-type-integer/10 text-type-integer",
  },
  {
    key: "boolean",
    title: "Yes / No",
    description: "True or false",
    icon: ToggleLeftIcon,
    group: "primitive",
    schema: { type: "boolean" },
    color: "bg-type-boolean/10 text-type-boolean",
  },
  {
    key: "enum",
    title: "Choice",
    description: "Pick one from a fixed list",
    icon: ListCheckIcon,
    group: "primitive",
    schema: { type: "string", enum: [] },
    color: "bg-type-enum/10 text-type-enum",
  },
  {
    key: "object",
    title: "Object",
    description: "Group of named fields",
    icon: BracesIcon,
    group: "structure",
    schema: { type: "object", properties: {} },
    color: "bg-type-object/10 text-type-object",
  },
  {
    key: "oneOf",
    title: "One of",
    description: "Exactly one of several shapes",
    icon: SplitIcon,
    group: "structure",
    schema: { oneOf: [] },
    color: "bg-type-oneOf/10 text-type-oneOf",
  },
  {
    key: "date",
    title: "Date",
    description: "ISO 8601 date or date-time",
    icon: CalendarIcon,
    group: "format",
    schema: { type: "string", format: "date-time" },
    color: "bg-type-date/10 text-type-date",
  },
  {
    key: "email",
    title: "Email",
    description: "Valid email address",
    icon: MailIcon,
    group: "format",
    schema: { type: "string", format: "email" },
    color: "bg-type-email/10 text-type-email",
  },
  {
    key: "url",
    title: "URL",
    description: "Absolute web address",
    icon: LinkIcon,
    group: "format",
    schema: { type: "string", format: "uri" },
    color: "bg-type-url/10 text-type-url",
  },
  {
    key: "null",
    title: "Empty",
    description: "Always null",
    icon: CircleSlashIcon,
    group: "special",
    schema: { type: "null" },
    color: "bg-type-null/10 text-type-null",
  },
]

export const jsonTypeMap = Object.fromEntries(
  jsonTypes.map((t) => [t.key, t])
) as Record<JsonTypeKey, JsonType>

export const jsonTypeGroups: { key: JsonTypeGroup; label: string }[] = [
  { key: "primitive", label: "Values" },
  { key: "structure", label: "Structures" },
  { key: "format", label: "Formats" },
  { key: "special", label: "Special" },
]
