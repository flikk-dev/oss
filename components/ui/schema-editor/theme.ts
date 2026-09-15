/**
 * Theme = one value per axis, grouped by PRIMITIVE (text, icon, menu, …).
 * Parts read the primitives they are made of, so a pick cascades.
 *
 *  - `tiered` axes hold { wide, compact }: resolved by container width.
 *  - `pointer: "coarse"` axes only apply on touch.
 *
 * Labels/hints exist for a design-lab UI; the component itself only needs
 * keys, options and defaults.
 */

export type Tier = "wide" | "compact"
export type Pointer = "fine" | "coarse"

export type AxisOption = { value: string; label: string; hint?: string }

export type Axis = {
  key: string
  label: string
  options: readonly AxisOption[]
  default: string
  tiered?: true
  pointer?: "coarse"
}

export type Primitive = { key: string; label: string; description: string; axes: readonly Axis[] }

const showHide = [
  { value: "true", label: "Show" },
  { value: "false", label: "Hide" },
] as const

/* ------------------------------------------------------------------------ */

export const text = {
  key: "text",
  label: "Text",
  description: "One size; description, @slug and labels step down from it",
  axes: [
    {
      key: "size",
      label: "Scale: title / description / @slug / labels",
      tiered: true,
      options: [
        { value: "xs", label: "xs / 2xs / 3xs / 3xs" },
        { value: "sm", label: "sm / xs / 2xs / 2xs" },
        { value: "md", label: "base / sm / xs / 2xs" },
        { value: "lg", label: "lg / base / sm / xs" },
      ],
      default: "sm",
    },
    {
      key: "weight",
      label: "Title weight",
      options: [
        { value: "regular", label: "Regular" },
        { value: "medium", label: "Medium" },
        { value: "semibold", label: "Semibold" },
      ],
      default: "regular",
    },
    {
      key: "editing",
      label: "Inline editing",
      options: [
        { value: "ghost", label: "Always editable, looks like text" },
        { value: "click", label: "Click to edit" },
      ],
      default: "ghost",
    },
  ],
} as const satisfies Primitive

export const icon = {
  key: "icon",
  label: "Icon",
  description: "Type icons in buttons and menus",
  axes: [
    {
      key: "style",
      label: "Background",
      options: [
        { value: "plain", label: "None" },
        { value: "boxed", label: "Gray tile" },
        { value: "tinted", label: "Color per type" },
      ],
      default: "tinted",
    },
    {
      key: "size",
      label: "Tile size",
      tiered: true,
      options: [
        { value: "xs", label: "16px" },
        { value: "sm", label: "20px" },
        { value: "md", label: "24px" },
        { value: "lg", label: "28px" },
      ],
      default: "sm",
    },
    {
      key: "trigger",
      label: "Type button",
      tiered: true,
      options: [
        { value: "icon", label: "Icon only, ghost" },
        { value: "icon-boxed", label: "Icon on tile" },
        { value: "label", label: "Icon + type name" },
        { value: "chip", label: "Pill + type name" },
      ],
      default: "icon-boxed",
    },
    { key: "chevron", label: "Dropdown arrow (name variants only)", options: showHide, default: "false" },
  ],
} as const satisfies Primitive

export const menu = {
  key: "menu",
  label: "Menu",
  description: "Every dropdown: type picker, ⋯ settings, add",
  axes: [
    {
      key: "layout",
      label: "Items",
      options: [
        { value: "list", label: "Rows + description" },
        { value: "compact", label: "Rows, name only" },
        { value: "grid", label: "3-col tiles" },
      ],
      default: "compact",
    },
    {
      key: "density",
      label: "Padding",
      options: [
        { value: "compact", label: "Very tight" },
        { value: "tight", label: "Tight" },
        { value: "loose", label: "Roomy" },
      ],
      default: "tight",
    },
    { key: "grouped", label: "Section headings", options: showHide, default: "true" },
    {
      key: "selection",
      label: "Current item marked by",
      options: [
        { value: "check", label: "Checkmark" },
        { value: "highlight", label: "Row highlight" },
        { value: "both", label: "Both" },
        { value: "none", label: "Nothing" },
      ],
      default: "check",
    },
    {
      key: "coarseOpen",
      label: "Opens as",
      pointer: "coarse",
      options: [
        { value: "sheet", label: "Bottom sheet" },
        { value: "dropdown", label: "Dropdown" },
      ],
      default: "sheet",
    },
    {
      key: "coarseTap",
      label: "Tap targets",
      pointer: "coarse",
      options: [
        { value: "large", label: "44px rows" },
        { value: "same", label: "Same as fine pointer" },
      ],
      default: "large",
    },
  ],
} as const satisfies Primitive

export const surface = {
  key: "surface",
  label: "Surface",
  description: "Box around each field row",
  axes: [
    {
      key: "chrome",
      label: "Field box",
      options: [
        { value: "hover", label: "Border on hover" },
        { value: "card", label: "Always bordered" },
        { value: "divider", label: "Divider lines, no box" },
      ],
      default: "hover",
    },
    {
      key: "groupChrome",
      label: "Group box",
      options: [
        { value: "always", label: "Always bordered" },
        { value: "same", label: "Same as fields" },
      ],
      default: "always",
    },
    {
      key: "padding",
      label: "Box padding",
      tiered: true,
      options: [
        { value: "normal", label: "12 / 8px" },
        { value: "tight", label: "8 / 4px" },
        { value: "none", label: "4 / 2px" },
      ],
      default: "tight",
    },
    {
      key: "gap",
      label: "Gap between rows",
      options: [
        { value: "0", label: "0" },
        { value: "1", label: "4px" },
        { value: "2", label: "8px" },
      ],
      default: "0",
    },
    {
      key: "coarseTap",
      label: "Tap on row",
      pointer: "coarse",
      options: [
        { value: "sheet", label: "Opens detail sheet", hint: "row is a summary; edit in sheet" },
        { value: "inline", label: "Edits inline" },
      ],
      default: "sheet",
    },
  ],
} as const satisfies Primitive

export const layout = {
  key: "layout",
  label: "Layout",
  description: "What shows on a row, and where",
  axes: [
    {
      key: "arrangement",
      label: "Lines",
      tiered: true,
      options: [
        { value: "card", label: "Title line, description below" },
        { value: "inline", label: "Everything on one line" },
      ],
      default: "card",
    },
    {
      key: "iconAlign",
      label: "Type icon",
      options: [
        { value: "top", label: "On title line" },
        { value: "center", label: "Centered on block" },
      ],
      default: "top",
    },
    {
      key: "lineGap",
      label: "Gap between lines",
      options: [
        { value: "tight", label: "0" },
        { value: "normal", label: "2px" },
        { value: "loose", label: "4px" },
      ],
      default: "tight",
    },
    {
      key: "slug",
      label: "@slug",
      tiered: true,
      options: [
        { value: "inline", label: "Next to title" },
        { value: "below", label: "Under title" },
        { value: "tooltip", label: "In tooltip" },
        { value: "hidden", label: "Hidden" },
      ],
      default: "inline",
    },
    {
      key: "description",
      label: "Description",
      tiered: true,
      options: [
        { value: "below", label: "Under title" },
        { value: "tooltip", label: "In tooltip" },
        { value: "hidden", label: "Hidden" },
      ],
      default: "below",
    },
    {
      key: "examples",
      label: "Examples",
      options: [
        { value: "below", label: "Under description" },
        { value: "hidden", label: "Hidden" },
      ],
      default: "hidden",
    },
    {
      key: "badges",
      label: "Badges ([ ], optional, count)",
      tiered: true,
      options: showHide,
      default: "true",
    },
    {
      key: "optionalMark",
      label: "Optional / required mark",
      options: [
        { value: "none", label: "None" },
        { value: "tag", label: "'optional' tag" },
        { value: "asterisk", label: "Red * on required" },
      ],
      default: "none",
    },
  ],
} as const satisfies Primitive

export const slug = {
  key: "slug",
  label: "Slug",
  description: "JSON key; auto from title until hand-edited",
  axes: [
    {
      key: "style",
      label: "Look",
      options: [
        { value: "handle", label: "@slug mono" },
        { value: "chip", label: "Mono chip" },
        { value: "plain", label: "Plain gray, no @" },
      ],
      default: "handle",
    },
    {
      key: "case",
      label: "Auto casing",
      options: [
        { value: "camel", label: "createdAt" },
        { value: "snake", label: "created_at" },
        { value: "kebab", label: "created-at" },
      ],
      default: "camel",
    },
    {
      key: "conflict",
      label: "Hand-typed slug already used by sibling",
      options: [
        { value: "mark", label: "Keep, mark red" },
        { value: "suffix", label: "Auto-suffix (email2)" },
        { value: "reject", label: "Revert on blur" },
      ],
      default: "mark",
    },
  ],
} as const satisfies Primitive

export const tooltip = {
  key: "tooltip",
  label: "Tooltip",
  description: "Only when slug or description placed in tooltip",
  axes: [
    {
      key: "trigger",
      label: "Opens on hover of",
      options: [
        { value: "title", label: "Title" },
        { value: "icon", label: "ⓘ after title" },
        { value: "row", label: "Whole header" },
      ],
      default: "title",
    },
    {
      key: "style",
      label: "Content",
      options: [
        { value: "plain", label: "Just the text" },
        { value: "card", label: "Card: title, @slug, description" },
      ],
      default: "plain",
    },
    {
      key: "side",
      label: "Position",
      options: [
        { value: "top", label: "Above" },
        { value: "bottom", label: "Below" },
        { value: "right", label: "Right" },
      ],
      default: "top",
    },
  ],
} as const satisfies Primitive

export const actions = {
  key: "actions",
  label: "Actions",
  description: "Trash + ⋯ on each row",
  axes: [
    {
      key: "style",
      label: "Buttons",
      options: [
        { value: "ghost", label: "Ghost" },
        { value: "secondary", label: "Gray fill" },
        { value: "bordered", label: "Bordered" },
      ],
      default: "ghost",
    },
    {
      key: "size",
      label: "Button size",
      options: [
        { value: "sm", label: "24px" },
        { value: "md", label: "28px" },
      ],
      default: "sm",
    },
    {
      key: "placement",
      label: "Position",
      tiered: true,
      options: [
        { value: "inline", label: "Right of box, takes width" },
        { value: "overlay", label: "Float over box edge" },
      ],
      default: "inline",
    },
    {
      key: "reveal",
      label: "Visible",
      options: [
        { value: "hover", label: "On row hover" },
        { value: "always", label: "Always" },
      ],
      default: "hover",
    },
    {
      key: "coarseReveal",
      label: "Visible",
      pointer: "coarse",
      options: [
        { value: "sheet", label: "Only in detail sheet" },
        { value: "swipe", label: "Swipe row left" },
        { value: "always", label: "Always" },
      ],
      default: "sheet",
    },
    {
      key: "deleteConfirm",
      label: "Trash click",
      options: [
        { value: "immediate", label: "Deletes at once" },
        { value: "twice", label: "Arms red, second click deletes" },
      ],
      default: "immediate",
    },
    {
      key: "settingsIcons",
      label: "⋯ menu icons",
      options: [
        { value: "none", label: "Text only" },
        { value: "gray", label: "Small gray icons" },
      ],
      default: "none",
    },
  ],
} as const satisfies Primitive

export const drag = {
  key: "drag",
  label: "Drag",
  description: "Reorder; drop onto a group to nest, drag out to un-nest",
  axes: [
    {
      key: "from",
      label: "Drag from",
      options: [
        { value: "row", label: "Anywhere on row" },
        { value: "hover", label: "Grip only, on hover" },
        { value: "always", label: "Grip only, always" },
      ],
      default: "row",
    },
    {
      key: "gutter",
      label: "Grip gutter",
      tiered: true,
      options: [
        { value: "wide", label: "24px" },
        { value: "narrow", label: "16px" },
        { value: "none", label: "None, grip hidden" },
      ],
      default: "narrow",
    },
    {
      key: "whileDrag",
      label: "Row while dragging",
      options: [
        { value: "fade", label: "Fade 90%" },
        { value: "lift", label: "Lift with shadow" },
      ],
      default: "fade",
    },
    {
      key: "coarseFrom",
      label: "Drag from",
      pointer: "coarse",
      options: [
        { value: "arrange", label: "Grips only in Arrange mode", hint: "toolbar toggle" },
        { value: "handle", label: "Grip, always visible" },
        { value: "row", label: "Anywhere on row" },
      ],
      default: "arrange",
    },
  ],
} as const satisfies Primitive

export const group = {
  key: "group",
  label: "Group",
  description: "Object / one-of rows holding child fields",
  axes: [
    {
      key: "frame",
      label: "Children area inside parent box",
      options: [
        { value: "box", label: "Tinted, top divider" },
        { value: "rule", label: "Top divider" },
        { value: "none", label: "Plain" },
      ],
      default: "box",
    },
    {
      key: "children",
      label: "Child fields read as",
      tiered: true,
      options: [
        { value: "table", label: "Table, aligned columns" },
        { value: "rows", label: "Rows, same as top level" },
      ],
      default: "table",
    },
    { key: "tableHeader", label: "Table column headings", options: showHide, default: "false" },
    { key: "collapsible", label: "Collapse toggle", options: showHide, default: "true" },
  ],
} as const satisfies Primitive

export const add = {
  key: "add",
  label: "Add",
  description: "Control that creates a field",
  axes: [
    {
      key: "placement",
      label: "Shown",
      options: [
        { value: "bottom", label: "Under list" },
        { value: "between", label: "On hover between rows" },
        { value: "both", label: "Both" },
      ],
      default: "bottom",
    },
    { key: "nested", label: "Inside groups too", options: showHide, default: "true" },
    {
      key: "style",
      label: "Button",
      options: [
        { value: "ghost", label: "+ Add field, text" },
        { value: "dashed", label: "Full-width dashed box" },
        { value: "icon", label: "+ only" },
      ],
      default: "ghost",
    },
    {
      key: "behavior",
      label: "Click",
      options: [
        { value: "menu", label: "Opens type menu, then adds" },
        { value: "instant", label: "Adds Text field at once" },
      ],
      default: "menu",
    },
  ],
} as const satisfies Primitive

/* ------------------------------------------------------------------------ */

export const primitives = [text, icon, menu, surface, layout, slug, tooltip, actions, drag, group, add] as const

export type PrimitiveKey = (typeof primitives)[number]["key"]

type OptionsOf<A> = A extends { options: readonly { value: infer V }[] } ? V : never

/** stored theme: tiered axes hold both tiers */
export type SchemaEditorTheme = {
  [P in (typeof primitives)[number] as P["key"]]: {
    [A in P["axes"][number] as A["key"]]: A extends { tiered: true }
      ? { wide: OptionsOf<A>; compact: OptionsOf<A> }
      : OptionsOf<A>
  }
}

/** resolved for one tier: every axis a single value */
export type ResolvedTheme = {
  [P in (typeof primitives)[number] as P["key"]]: {
    [A in P["axes"][number] as A["key"]]: OptionsOf<A>
  }
}

export type PartialTheme = {
  [P in keyof SchemaEditorTheme]?: {
    [A in keyof SchemaEditorTheme[P]]?: SchemaEditorTheme[P][A] extends { wide: infer V }
      ? V | { wide?: V; compact?: V }
      : SchemaEditorTheme[P][A]
  }
}

export function defaultTheme(): SchemaEditorTheme {
  return Object.fromEntries(
    primitives.map((p) => [
      p.key,
      Object.fromEntries(
        (p.axes as readonly Axis[]).map((a) => [a.key, a.tiered ? { wide: a.default, compact: a.default } : a.default])
      ),
    ])
  ) as SchemaEditorTheme
}

/** merge axis by axis; a bare value on a tiered axis sets both tiers */
export function mergeTheme(base: SchemaEditorTheme, over?: PartialTheme): SchemaEditorTheme {
  if (!over) return base
  const out = { ...base } as Record<string, Record<string, unknown>>
  for (const p of Object.keys(over) as (keyof PartialTheme)[]) {
    const axes = { ...out[p] }
    for (const [k, v] of Object.entries(over[p] ?? {})) {
      if (v === undefined) continue
      const cur = axes[k]
      axes[k] =
        cur && typeof cur === "object"
          ? typeof v === "object"
            ? { ...(cur as object), ...v }
            : { wide: v, compact: v }
          : v
    }
    out[p] = axes
  }
  return out as unknown as SchemaEditorTheme
}

export function resolveTheme(theme: SchemaEditorTheme, tier: Tier): ResolvedTheme {
  const out: Record<string, Record<string, unknown>> = {}
  for (const [p, axes] of Object.entries(theme)) {
    out[p] = {}
    for (const [k, v] of Object.entries(axes))
      out[p][k] = v && typeof v === "object" ? (v as Record<Tier, unknown>)[tier] : v
  }
  return out as unknown as ResolvedTheme
}

export const flag = (v: string) => v === "true"
