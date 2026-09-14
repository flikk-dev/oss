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

export const fieldHeaderSpec = {
  key: "fieldHeader",
  label: "Field header",
  description: "Title, @slug, description — like a user card",
  sections: [
    { key: "layout", label: "Layout", hint: "how lines stack" },
    { key: "title", label: "Title", hint: "human name of field" },
    { key: "slug", label: "Slug", hint: "JSON key, auto from title" },
    { key: "description", label: "Description", hint: "help text" },
    { key: "tooltip", label: "Tooltip", hint: "only when slug or description put there" },
    { key: "editing", label: "Editing", hint: "how text gets changed" },
  ],
  axes: [
    {
      key: "arrangement",
      label: "Arrangement",
      section: "layout",
      options: [
        { value: "card", label: "Two lines" },
        { value: "inline", label: "One line" },
      ],
      default: "card",
    },
    {
      key: "iconAlign",
      label: "Type icon vertical align",
      section: "layout",
      options: [
        { value: "top", label: "Top, next to title" },
        { value: "center", label: "Centered on block" },
      ],
      default: "top",
    },
    {
      key: "density",
      label: "Gap between lines",
      section: "layout",
      options: [
        { value: "tight", label: "None" },
        { value: "normal", label: "2px" },
        { value: "loose", label: "4px" },
      ],
      default: "normal",
    },
    {
      key: "titleSize",
      label: "Title size",
      section: "title",
      options: [
        { value: "sm", label: "13px" },
        { value: "md", label: "14px" },
        { value: "lg", label: "16px" },
      ],
      default: "md",
    },
    {
      key: "titleWeight",
      label: "Title weight",
      section: "title",
      options: [
        { value: "medium", label: "Medium" },
        { value: "semibold", label: "Semibold" },
        { value: "bold", label: "Bold" },
      ],
      default: "medium",
    },
    {
      key: "slugPlacement",
      label: "Slug shown",
      section: "slug",
      options: [
        { value: "inline", label: "Next to title" },
        { value: "below", label: "Under title" },
        { value: "tooltip", label: "In tooltip" },
        { value: "hidden", label: "Hidden" },
      ],
      default: "inline",
    },
    {
      key: "slugStyle",
      label: "Slug look",
      section: "slug",
      options: [
        { value: "handle", label: "@slug mono" },
        { value: "chip", label: "Mono chip" },
        { value: "plain", label: "Plain gray, no @" },
      ],
      default: "handle",
    },
    {
      key: "slugSize",
      label: "Slug size",
      section: "slug",
      options: [
        { value: "xs", label: "11px" },
        { value: "sm", label: "12px" },
      ],
      default: "xs",
    },
    {
      key: "slugCase",
      label: "Auto-slug casing (until hand-edited)",
      section: "slug",
      options: [
        { value: "camel", label: "createdAt" },
        { value: "snake", label: "created_at" },
        { value: "kebab", label: "created-at" },
      ],
      default: "camel",
    },
    {
      key: "slugConflict",
      label: "Hand-typed slug already used by sibling",
      section: "slug",
      options: [
        { value: "suffix", label: "Auto-suffix (email2)", hint: "on blur/Enter" },
        { value: "mark", label: "Keep, mark red", hint: "hover slug for message" },
        { value: "reject", label: "Revert on blur" },
      ],
      default: "suffix",
    },
    {
      key: "descriptionPlacement",
      label: "Description shown",
      section: "description",
      options: [
        { value: "below", label: "Under title" },
        { value: "tooltip", label: "In tooltip" },
      ],
      default: "below",
    },
    {
      key: "descriptionStyle",
      label: "Description look (Under title only)",
      section: "description",
      options: [
        { value: "muted", label: "Gray" },
        { value: "italic", label: "Gray italic" },
        { value: "hover", label: "Only on hover" },
      ],
      default: "muted",
    },
    {
      key: "descriptionSize",
      label: "Description size",
      section: "description",
      options: [
        { value: "xs", label: "11px" },
        { value: "sm", label: "12px" },
        { value: "md", label: "13px" },
      ],
      default: "sm",
    },
    {
      key: "examples",
      label: "Examples shown",
      section: "description",
      options: [
        { value: "below", label: "Under description, e.g. …" },
        { value: "hidden", label: "Hidden" },
      ],
      default: "below",
    },
    {
      key: "tooltipTrigger",
      label: "Opens on hover of",
      section: "tooltip",
      options: [
        { value: "title", label: "Title" },
        { value: "icon", label: "ⓘ after title" },
        { value: "row", label: "Whole header" },
      ],
      default: "title",
    },
    {
      key: "tooltipStyle",
      label: "Tooltip content",
      section: "tooltip",
      options: [
        { value: "plain", label: "Just the text" },
        { value: "card", label: "Card: title, @slug, description" },
      ],
      default: "plain",
    },
    {
      key: "tooltipSide",
      label: "Tooltip position",
      section: "tooltip",
      options: [
        { value: "top", label: "Above" },
        { value: "bottom", label: "Below" },
        { value: "right", label: "Right" },
      ],
      default: "top",
    },
    {
      key: "editing",
      label: "Text editing",
      section: "editing",
      options: [
        { value: "ghost", label: "Always editable, looks like text", hint: "inputs with no border; bg on hover" },
        { value: "click", label: "Click to edit", hint: "text until clicked; Enter/blur saves, Esc reverts" },
      ],
      default: "ghost",
    },
  ],
} as const satisfies ItemSpec

export const fieldRowSpec = {
  key: "fieldRow",
  label: "Field row",
  description: "Row around header: drag to reorder, delete, settings menu",
  sections: [
    { key: "row", label: "Row", hint: "box around each field" },
    { key: "drag", label: "Reorder", hint: "drag and drop, motion" },
    { key: "actions", label: "Actions", hint: "trash + ⋯ on right" },
    { key: "optional", label: "Optional", hint: "set in ⋯ menu" },
  ],
  axes: [
    {
      key: "chrome",
      label: "Row box",
      section: "row",
      options: [
        { value: "hover", label: "Border on hover", hint: "flikk" },
        { value: "card", label: "Always bordered" },
        { value: "divider", label: "Divider lines, no box" },
      ],
      default: "hover",
    },
    {
      key: "dragHandle",
      label: "Drag from",
      section: "drag",
      options: [
        { value: "hover", label: "Grip, shows on hover" },
        { value: "always", label: "Grip, always visible" },
        { value: "row", label: "Anywhere on row", hint: "flikk; fights text selection in inputs" },
      ],
      default: "hover",
    },
    {
      key: "whileDrag",
      label: "Row while dragging",
      section: "drag",
      options: [
        { value: "fade", label: "Fade 90%", hint: "flikk" },
        { value: "lift", label: "Lift with shadow" },
      ],
      default: "fade",
    },
    {
      key: "actions",
      label: "Trash + ⋯ visible",
      section: "actions",
      options: [
        { value: "hover", label: "On row hover" },
        { value: "always", label: "Always" },
      ],
      default: "hover",
    },
    {
      key: "actionStyle",
      label: "Action buttons",
      section: "actions",
      options: [
        { value: "secondary", label: "Gray fill", hint: "flikk secondary" },
        { value: "ghost", label: "Ghost" },
        { value: "bordered", label: "Bordered" },
      ],
      default: "secondary",
    },
    {
      key: "deleteConfirm",
      label: "Trash click",
      section: "actions",
      options: [
        { value: "immediate", label: "Deletes at once" },
        { value: "twice", label: "Arms red, second click deletes", hint: "disarms after 2s" },
      ],
      default: "immediate",
    },
    {
      key: "requiredMark",
      label: "Show optional / required in header",
      section: "optional",
      options: [
        { value: "none", label: "Nothing" },
        { value: "optionalTag", label: "'optional' tag" },
        { value: "asterisk", label: "Red * on required" },
      ],
      default: "none",
    },
  ],
} as const satisfies ItemSpec

export const itemSpecs = [typePickerSpec, fieldHeaderSpec, fieldRowSpec] as const satisfies readonly ItemSpec[]

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
