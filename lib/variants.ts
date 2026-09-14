/**
 * Registry of every variant axis for every editor item.
 * Dialog renders controls from this; components read chosen values.
 * Add new item here when a new editor piece gets its own cva set.
 */

export type AxisOption = { value: string; label: string; hint?: string }

export type Axis = {
  key: string
  /** what this axis changes, in plain words */
  label: string
  /** which visual part it touches — used as section heading */
  section: string
  options: readonly AxisOption[]
  default: string
}

export type ItemSpec = {
  key: string
  label: string
  description: string
  sections: readonly { key: string; label: string; hint: string }[]
  axes: readonly Axis[]
}

const showHide = [
  { value: "true", label: "Show" },
  { value: "false", label: "Hide" },
] as const

export const typePickerSpec = {
  key: "typePicker",
  label: "Type picker",
  description: "Button on each field that opens a menu of JSON Schema types",
  sections: [
    { key: "trigger", label: "Button", hint: "what sits next to field name" },
    { key: "menu", label: "Menu", hint: "dropdown that opens on click" },
    { key: "mobile", label: "Phone", hint: "below 768px, or Phone preview on" },
  ],
  axes: [
    {
      key: "trigger",
      label: "Button shape",
      section: "trigger",
      options: [
        { value: "icon", label: "Icon only", hint: "bare icon, ghost hover" },
        { value: "icon-boxed", label: "Icon in box", hint: "icon on small tile" },
        { value: "label", label: "Icon + name", hint: "outline button with type name" },
        { value: "chip", label: "Pill + name", hint: "rounded pill, tiled icon + name" },
      ],
      default: "icon-boxed",
    },
    {
      key: "size",
      label: "Button height",
      section: "trigger",
      options: [
        { value: "sm", label: "24px" },
        { value: "md", label: "28px" },
        { value: "lg", label: "32px" },
      ],
      default: "md",
    },
    {
      key: "chevron",
      label: "Dropdown arrow (Icon + name / Pill only)",
      section: "trigger",
      options: showHide,
      default: "false",
    },
    {
      key: "weight",
      label: "Type name weight (button and menu)",
      section: "trigger",
      options: [
        { value: "regular", label: "Regular" },
        { value: "medium", label: "Medium" },
        { value: "semibold", label: "Semibold" },
        { value: "bold", label: "Bold" },
      ],
      default: "medium",
    },
    {
      key: "iconStyle",
      label: "Icon background (button and menu)",
      section: "trigger",
      options: [
        { value: "plain", label: "None", hint: "gray icon, no tile" },
        { value: "boxed", label: "Gray tile" },
        { value: "tinted", label: "Color per type", hint: "text=blue, number=amber…" },
      ],
      default: "tinted",
    },
    {
      key: "layout",
      label: "Menu item layout",
      section: "menu",
      options: [
        { value: "list", label: "Rows + description" },
        { value: "compact", label: "Rows, name only" },
        { value: "grid", label: "3-col tiles" },
      ],
      default: "list",
    },
    {
      key: "grouped",
      label: "Group headings (Values / Structures / Formats)",
      section: "menu",
      options: showHide,
      default: "true",
    },
    {
      key: "showDescription",
      label: "Description under each type (Rows + description only)",
      section: "menu",
      options: showHide,
      default: "true",
    },
    {
      key: "selection",
      label: "How current type is marked",
      section: "menu",
      options: [
        { value: "check", label: "Checkmark" },
        { value: "highlight", label: "Row highlight" },
        { value: "both", label: "Both" },
        { value: "none", label: "Not marked" },
      ],
      default: "check",
    },
    {
      key: "density",
      label: "Menu padding (around and between items)",
      section: "menu",
      options: [
        { value: "compact", label: "Very tight" },
        { value: "tight", label: "Tight" },
        { value: "loose", label: "Roomy" },
      ],
      default: "tight",
    },
    {
      key: "textSize",
      label: "Menu text size (also narrows menu)",
      section: "menu",
      options: [
        { value: "xs", label: "11px" },
        { value: "sm", label: "12px" },
        { value: "md", label: "14px" },
      ],
      default: "md",
    },
    {
      key: "iconSize",
      label: "Menu icon tile size",
      section: "menu",
      options: [
        { value: "xs", label: "16px" },
        { value: "sm", label: "20px" },
        { value: "md", label: "24px" },
        { value: "lg", label: "32px" },
      ],
      default: "md",
    },
    {
      key: "mobileMenu",
      label: "Menu opens as",
      section: "mobile",
      options: [
        { value: "sheet", label: "Bottom sheet" },
        { value: "dropdown", label: "Same dropdown" },
      ],
      default: "sheet",
    },
    {
      key: "mobileTap",
      label: "Tap targets",
      section: "mobile",
      options: [
        { value: "large", label: "44px rows, 36px button" },
        { value: "same", label: "Same as desktop" },
      ],
      default: "large",
    },
  ],
} as const satisfies ItemSpec

export const itemSpecs = [typePickerSpec] as const satisfies readonly ItemSpec[]

export type ItemKey = (typeof itemSpecs)[number]["key"]

/** { typePicker: { trigger: "icon", ... }, ... } */
export type VariantConfig = {
  [I in (typeof itemSpecs)[number] as I["key"]]: {
    [A in I["axes"][number] as A["key"]]: A["options"][number]["value"]
  }
}

export function defaultConfig(): VariantConfig {
  return Object.fromEntries(
    itemSpecs.map((item) => [
      item.key,
      Object.fromEntries(item.axes.map((a) => [a.key, a.default])),
    ])
  ) as VariantConfig
}

/** "true"/"false" strings → booleans, everything else passthrough. Feeds component props. */
export function toProps<T extends Record<string, string>>(cfg: T) {
  return Object.fromEntries(
    Object.entries(cfg).map(([k, v]) => [
      k,
      v === "true" ? true : v === "false" ? false : v,
    ])
  ) as { [K in keyof T]: T[K] extends "true" | "false" ? boolean : T[K] }
}
