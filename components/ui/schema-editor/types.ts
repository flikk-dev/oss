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
  /** tailwind color token for tinted icon style */
  tone: "blue" | "amber" | "teal" | "green" | "pink" | "violet" | "orange" | "gray" | "sky" | "rose" | "indigo" | "fuchsia"
}

export const jsonTypes: JsonType[] = [
  {
    key: "string",
    title: "Text",
    description: "Names, notes, free text",
    icon: ALargeSmallIcon,
    group: "primitive",
    schema: { type: "string" },
    tone: "blue",
  },
  {
    key: "number",
    title: "Number",
    description: "Decimals, prices, ratios",
    icon: HashIcon,
    group: "primitive",
    schema: { type: "number" },
    tone: "amber",
  },
  {
    key: "integer",
    title: "Integer",
    description: "Whole numbers, counts, ids",
    icon: BinaryIcon,
    group: "primitive",
    schema: { type: "integer" },
    tone: "teal",
  },
  {
    key: "boolean",
    title: "Yes / No",
    description: "True or false",
    icon: ToggleLeftIcon,
    group: "primitive",
    schema: { type: "boolean" },
    tone: "green",
  },
  {
    key: "enum",
    title: "Choice",
    description: "Pick one from a fixed list",
    icon: ListCheckIcon,
    group: "primitive",
    schema: { type: "string", enum: [] },
    tone: "pink",
  },
  {
    key: "object",
    title: "Object",
    description: "Group of named fields",
    icon: BracesIcon,
    group: "structure",
    schema: { type: "object", properties: {} },
    tone: "violet",
  },
  {
    key: "oneOf",
    title: "One of",
    description: "Exactly one of several shapes",
    icon: SplitIcon,
    group: "structure",
    schema: { oneOf: [] },
    tone: "fuchsia",
  },
  {
    key: "date",
    title: "Date",
    description: "ISO 8601 date or date-time",
    icon: CalendarIcon,
    group: "format",
    schema: { type: "string", format: "date-time" },
    tone: "sky",
  },
  {
    key: "email",
    title: "Email",
    description: "Valid email address",
    icon: MailIcon,
    group: "format",
    schema: { type: "string", format: "email" },
    tone: "rose",
  },
  {
    key: "url",
    title: "URL",
    description: "Absolute web address",
    icon: LinkIcon,
    group: "format",
    schema: { type: "string", format: "uri" },
    tone: "indigo",
  },
  {
    key: "null",
    title: "Empty",
    description: "Always null",
    icon: CircleSlashIcon,
    group: "special",
    schema: { type: "null" },
    tone: "gray",
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

/** Explicit class strings so tailwind sees them at build time */
export const toneClasses: Record<JsonType["tone"], string> = {
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  green: "bg-green-500/10 text-green-600 dark:text-green-400",
  pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  fuchsia: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
  gray: "bg-muted text-muted-foreground",
}
