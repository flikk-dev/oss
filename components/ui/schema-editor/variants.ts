import { cva } from "class-variance-authority"

/**
 * cva per primitive. Parts compose these and never hard-code sizes, so a
 * theme pick cascades. Spacing that children must undo (group frames) is
 * exposed as CSS vars (--sx / --sy / --gutter) instead of lookup tables.
 */

/* --------------------------------- text ---------------------------------- */

export const titleText = cva("text-foreground", {
  variants: { size: { xs: "text-xs", sm: "text-sm", md: "text-base", lg: "text-lg" } },
  defaultVariants: { size: "sm" },
})

export const descText = cva("text-muted-foreground", {
  variants: { size: { xs: "text-2xs", sm: "text-xs", md: "text-sm", lg: "text-base" } },
  defaultVariants: { size: "sm" },
})

export const slugText = cva("flex min-w-0 shrink-0 items-baseline tracking-tight", {
  variants: {
    size: { xs: "text-3xs", sm: "text-2xs", md: "text-xs", lg: "text-sm" },
    style: {
      handle: "font-mono text-muted-foreground",
      chip: "rounded bg-muted px-1 font-mono text-muted-foreground",
      plain: "text-muted-foreground",
    },
    conflict: {
      true: "text-destructive [&_input]:text-destructive [&_button]:text-destructive",
      false: "",
    },
  },
  defaultVariants: { size: "sm", style: "handle", conflict: false },
})

export const labelText = cva("text-muted-foreground", {
  variants: { size: { xs: "text-3xs", sm: "text-2xs", md: "text-2xs", lg: "text-xs" } },
  defaultVariants: { size: "sm" },
})

export const textWeight = cva("", {
  variants: { weight: { regular: "font-normal", medium: "font-medium", semibold: "font-semibold" } },
  defaultVariants: { weight: "regular" },
})

export const badge = cva("shrink-0 rounded bg-muted px-1 text-muted-foreground", {
  variants: { size: { xs: "text-3xs", sm: "text-2xs", md: "text-2xs", lg: "text-xs" } },
  defaultVariants: { size: "sm" },
})

/* --------------------------------- icon ---------------------------------- */

export const iconBox = cva("flex shrink-0 items-center justify-center [&_svg]:shrink-0", {
  variants: {
    style: {
      plain: "bg-transparent text-muted-foreground group-focus/menu-item:text-accent-foreground group-data-[tone=destructive]/menu-item:text-destructive",
      boxed: "rounded-md bg-muted text-muted-foreground group-data-[selected=true]/menu-item:bg-primary/10 group-data-[selected=true]/menu-item:text-primary group-data-[tone=destructive]/menu-item:bg-destructive/10 group-data-[tone=destructive]/menu-item:text-destructive",
      tinted: "rounded-md",
    },
    size: {
      xs: "size-4 [&_svg]:size-2.5",
      sm: "size-5 [&_svg]:size-3",
      md: "size-6 [&_svg]:size-3.5",
      lg: "size-7 [&_svg]:size-4",
    },
  },
  defaultVariants: { style: "boxed", size: "sm" },
})

/** type picker button: geometry extras on top of shadcn Button; height tracks icon size */
export const typeTriggerVariant = { icon: "ghost", "icon-boxed": "ghost", label: "outline", chip: "outline" } as const
export const typeTrigger = cva("shrink-0 rounded-md p-0", {
  variants: {
      trigger: {
        icon: "text-muted-foreground",
        "icon-boxed": "hover:bg-transparent dark:hover:bg-transparent",
        label: "",
        chip: "rounded-full",
      },
      size: {
        xs: "h-4 gap-1 [&_svg:not([class*='size-'])]:size-2.5",
        sm: "h-5 gap-1 [&_svg:not([class*='size-'])]:size-3",
        md: "h-6 gap-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-7 gap-1.5 [&_svg:not([class*='size-'])]:size-4",
      },
    },
    compoundVariants: [
      { trigger: ["icon", "icon-boxed"], size: "xs", className: "w-4" },
      { trigger: ["icon", "icon-boxed"], size: "sm", className: "w-5" },
      { trigger: ["icon", "icon-boxed"], size: "md", className: "w-6" },
      { trigger: ["icon", "icon-boxed"], size: "lg", className: "w-7" },
      { trigger: "label", className: "px-1.5" },
      { trigger: "chip", className: "pr-2 pl-0.5" },
    ],
    defaultVariants: { trigger: "icon-boxed", size: "sm" },
  }
)

/* --------------------------------- menu ---------------------------------- */

export const menuContent = cva("", {
  variants: {
    layout: { list: "", compact: "", grid: "" },
    textSize: { xs: "", sm: "", md: "", lg: "" },
    density: { compact: "p-0.5", tight: "p-1", loose: "p-1.5" },
  },
  compoundVariants: [
    { layout: "list", textSize: ["lg", "md"], className: "w-60" },
    { layout: "list", textSize: ["sm", "xs"], className: "w-52" },
    { layout: "compact", textSize: ["lg", "md"], className: "w-44" },
    { layout: "compact", textSize: ["sm", "xs"], className: "w-38" },
    { layout: "grid", textSize: ["lg", "md"], className: "w-64" },
    { layout: "grid", textSize: ["sm", "xs"], className: "w-56" },
  ],
  defaultVariants: { layout: "compact", textSize: "sm", density: "tight" },
})

export const menuGroup = cva("", {
  variants: {
    layout: { list: "flex flex-col", compact: "flex flex-col", grid: "grid grid-cols-3" },
    density: { compact: "", tight: "", loose: "" },
  },
  compoundVariants: [
    { layout: "grid", density: "compact", className: "gap-0.5" },
    { layout: "grid", density: "tight", className: "gap-1" },
    { layout: "grid", density: "loose", className: "gap-1.5" },
  ],
  defaultVariants: { layout: "compact", density: "tight" },
})

export const menuItem = cva(
  "group/menu-item relative flex cursor-default rounded-md outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[selected=true]:data-[selection=highlight]:bg-accent data-[selected=true]:data-[selection=both]:bg-accent data-[tone=destructive]:text-destructive data-[tone=destructive]:focus:bg-destructive/10 data-[tone=destructive]:focus:text-destructive",
  {
    variants: {
      layout: {
        list: "items-center",
        compact: "items-center",
        grid: "flex-col items-center justify-center text-center",
      },
      density: { compact: "", tight: "", loose: "" },
      tap: { same: "", large: "" },
    },
    compoundVariants: [
      { layout: "list", density: "compact", className: "gap-2 px-1.5 py-0.5" },
      { layout: "list", density: "tight", className: "gap-2.5 px-2 py-1.5" },
      { layout: "list", density: "loose", className: "gap-3 px-2.5 py-2" },
      { layout: "compact", density: "compact", className: "gap-1.5 px-1.5 py-0.5" },
      { layout: "compact", density: "tight", className: "gap-2 px-2 py-1" },
      { layout: "compact", density: "loose", className: "gap-2.5 px-2.5 py-1.5" },
      { layout: "grid", density: "compact", className: "gap-1 px-0.5 py-1" },
      { layout: "grid", density: "tight", className: "gap-1.5 px-1 py-2" },
      { layout: "grid", density: "loose", className: "gap-2 px-1.5 py-2.5" },
      { tap: "large", layout: ["list", "compact"], className: "min-h-11 px-3" },
      { tap: "large", layout: "grid", className: "min-h-16" },
    ],
    defaultVariants: { layout: "compact", density: "tight", tap: "same" },
  }
)

/* -------------------------------- surface -------------------------------- */

/** --sx/--sy from the padding pick; set on row and surface so siblings (grip, actions) can align */
export const padVars = cva("", {
  variants: {
    padding: {
      normal: "[--sx:0.75rem] [--sy:0.5rem]",
      tight: "[--sx:0.5rem] [--sy:0.25rem]",
      none: "[--sx:0.25rem] [--sy:0.125rem]",
    },
  },
  defaultVariants: { padding: "tight" },
})

/** row box; nested frames cancel the padding via --sx/--sy */
export const surface = cva("flex min-w-0 flex-1 flex-col px-(--sx) py-(--sy)", {
  variants: {
      chrome: {
        /** border on the row's own hover (header/grip/actions), not when a child row is hovered */
        hover: "rounded-md border border-transparent bg-background [[data-hover]>&]:border-border",
        card: "rounded-md border border-border bg-background",
        divider: "rounded-md border border-transparent",
        /** non-group row inside a group: nothing at all */
        plain: "border-0 bg-transparent",
      },
      /** groups always outlined, regardless of chrome */
      groupChrome: {
        always: "group-data-[group]/row:border-border",
        same: "",
      },
      padding: {
        normal: "[--sx:0.75rem] [--sy:0.5rem]",
        tight: "[--sx:0.5rem] [--sy:0.25rem]",
        none: "[--sx:0.25rem] [--sy:0.125rem]",
      },
    },
    defaultVariants: { chrome: "hover", groupChrome: "always", padding: "tight" },
})

export const listGap = cva("flex flex-col", {
  variants: {
    chrome: { hover: "", card: "", divider: "divide-y divide-border" },
    gap: { "0": "gap-0", "1": "gap-1", "2": "gap-2" },
  },
  defaultVariants: { chrome: "hover", gap: "0" },
})

/* -------------------------------- layout --------------------------------- */

export const header = cva("group/field flex min-w-0 flex-1 gap-1.5", {
  variants: { iconAlign: { top: "items-start", center: "items-center" } },
  defaultVariants: { iconAlign: "top" },
})

export const headerBody = cva("flex min-w-0 flex-1", {
  variants: {
    arrangement: { card: "flex-col", inline: "flex-row items-center gap-2" },
    lineGap: { tight: "gap-0", normal: "gap-0.5", loose: "gap-1" },
  },
  compoundVariants: [{ arrangement: "inline", className: "gap-2" }],
  defaultVariants: { arrangement: "card", lineGap: "tight" },
})

/** title line height = type trigger height, so the icon centres on it */
export const titleLine = cva("flex min-h-(--line) min-w-0 items-center gap-1.5", {
  variants: { size: { xs: "", sm: "", md: "", lg: "" } },
  defaultVariants: { size: "sm" },
})

/** --line = title line height, from icon size; set on the row so grip/actions can align */
export const lineHeight = cva("", {
  variants: { size: { xs: "[--line:1rem]", sm: "[--line:1.25rem]", md: "[--line:1.5rem]", lg: "[--line:1.75rem]" } },
  defaultVariants: { size: "sm" },
})

export const tooltipBox = cva("flex flex-col", {
  variants: { style: { plain: "w-56 gap-1 p-2", card: "w-64 gap-2 p-3" } },
  defaultVariants: { style: "plain" },
})

/* -------------------------------- actions -------------------------------- */

/** maps theme → shadcn Button props; extras only for what Button lacks */
export const actionVariant = { ghost: "ghost", secondary: "secondary", bordered: "outline" } as const
export const actionSize = { sm: "icon-xs", md: "icon-sm" } as const
export const dangerTone = cva("", {
  variants: {
    tone: {
      default: "",
      danger: "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
      armed: "bg-destructive/10 text-destructive hover:bg-destructive/20",
    },
  },
  defaultVariants: { tone: "default" },
})

/** on the header line; reveal scoped to the row's own header hover */
export const actionsBar = cva("flex h-(--line) shrink-0 items-center gap-0.5", {
  variants: {
    reveal: {
      always: "",
      hover: "opacity-0 [[data-hover]>&]:opacity-100 has-[[aria-expanded=true]]:opacity-100",
      /** sits under the surface, revealed by swiping it left */
      swipe: "absolute inset-y-0 right-0 h-auto px-1",
    },
    placement: {
      /** one column outside every box, mirror of the grip */
      column: "absolute top-(--sy) w-(--acts) justify-end",
      overlay: "absolute top-(--sy) right-1 rounded-md bg-background/90 pl-2 backdrop-blur-[2px]",
      /** in-flow (table cells) */
      inline: "mt-(--sy)",
    },
    nested: { true: "", false: "" },
  },
  compoundVariants: [
    { placement: "column", nested: false, className: "right-[calc(var(--rgutter)-var(--acts))]" },
    { placement: "column", nested: true, className: "-right-(--acts)" },
  ],
  defaultVariants: { reveal: "hover", placement: "column", nested: false },
})

/* --------------------------------- drag ---------------------------------- */

/** row shell; --gutter reserved left of the box for the grip */
/**
 * Row shell. `data-hover` is set by the row's own Header (not by children),
 * so grip/actions of a group light up only when its header is hovered.
 */
export const rowShell = cva(
  "group/row relative flex items-start pl-(--gutter) pr-(--rgutter)",
  {
    variants: {
      from: {
        row: "",
        hover: "",
        always: "",
        handle: "",
        arrange: "",
        longpress: "touch-pan-y select-none",
      },
      /** --gutter = padding reserved on root rows; --grip = grip column width */
      /** left: --gutter reserved / --grip column; right: --rgutter reserved / --acts column */
      gutter: {
        outside: "[--gutter:0px] [--grip:1rem] [--rgutter:0px]",
        hover: "[--gutter:0px] [--grip:1rem] [--rgutter:0px] data-[hover]:[--gutter:1rem] data-[hover]:[--rgutter:var(--acts)]",
        wide: "[--gutter:1.5rem] [--grip:1.5rem] [--rgutter:var(--acts)]",
        narrow: "[--gutter:1rem] [--grip:1rem] [--rgutter:var(--acts)]",
        none: "[--gutter:0px] [--grip:0px] [--rgutter:var(--acts)]",
      },
      /** width of the actions column, from button size */
      actionSize: { sm: "[--acts:3.25rem]", md: "[--acts:3.75rem]" },
      /** nested rows add no indent; grip and actions hang outside, in the shared columns */
      nested: { true: "pl-0 pr-0", false: "" },
      placement: { column: "", overlay: "", swipe: "" },
    },
    defaultVariants: { from: "row", gutter: "narrow", actionSize: "sm", nested: false, placement: "column" },
  }
)

/** sits in the gutter, vertically on the header line (--line = title line height) */
export const grip = cva(
  "absolute top-(--sy) flex h-(--line) w-(--grip) cursor-grab touch-none items-center justify-center text-muted-foreground active:cursor-grabbing",
  {
    variants: {
      /** root: inside the gutter (or just outside when gutter is 0); nested: always one column left */
      nested: { true: "-left-(--grip)", false: "left-[calc(var(--gutter)-var(--grip))]" },
      from: {
        row: "opacity-0 [[data-hover]>&]:opacity-100",
        hover: "opacity-0 [[data-hover]>&]:opacity-100",
        always: "",
        handle: "",
        /** only while arrange mode is on */
        arrange: "hidden group-data-[arrange=true]/editor:flex",
        longpress: "hidden",
      },
      gutter: {
        outside: "opacity-0 [[data-hover]>&]:opacity-100 [&_svg]:size-3",
        hover: "opacity-0 [[data-hover]>&]:opacity-100 [&_svg]:size-3",
        wide: "[&_svg]:size-4",
        narrow: "[&_svg]:size-3",
        none: "hidden",
      },
    },
    defaultVariants: { from: "row", gutter: "narrow", nested: false },
  }
)

export const whileDragStyles = {
  fade: { opacity: 0.9, borderRadius: 8 },
  lift: { scale: 1.01, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", borderRadius: 8, zIndex: 10 },
} as const

/* --------------------------------- group --------------------------------- */

/** children frame; cancels parent surface padding via --sx/--sy so rows run edge to edge */
export const groupFrame = cva(
  "-mx-(--sx) -mb-(--sy) mt-(--sy) flex min-w-0 flex-col transition-[box-shadow,background-color] data-[over=true]:bg-primary/5 data-[over=true]:ring-2 data-[over=true]:ring-primary/40",
  {
    variants: {
      frame: {
        rule: "border-t border-border",
        tint: "rounded-b-md border-t border-border bg-muted/30",
        none: "",
      },
    },
    defaultVariants: { frame: "rule" },
  }
)

/* ---------------------------------- add ---------------------------------- */

export const addVariant = { dashed: "outline", ghost: "ghost", icon: "ghost" } as const
/** extras on top of Button for the add control */
export const addExtras = cva("text-muted-foreground hover:text-foreground", {
  variants: {
    style: {
      dashed: "w-full border-dashed",
      ghost: "",
      icon: "",
    },
  },
  defaultVariants: { style: "ghost" },
})
