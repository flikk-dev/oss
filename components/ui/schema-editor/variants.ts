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

/** row box; sets --sx/--sy so nested frames can cancel the padding */
export const surface = cva(
  "flex min-w-0 flex-1 flex-col rounded-md border px-(--sx) py-(--sy) transition-[border-color,box-shadow]",
  {
    variants: {
      chrome: {
        hover: "border-transparent bg-background hover:border-border",
        card: "border-border bg-background",
        divider: "border-transparent",
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
  }
)

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
export const titleLine = cva("flex min-w-0 items-center gap-1.5", {
  variants: { size: { xs: "min-h-4", sm: "min-h-5", md: "min-h-6", lg: "min-h-7" } },
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

export const actionsBar = cva("flex shrink-0 items-center gap-0.5", {
  variants: {
    reveal: {
      always: "",
      hover: "opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-within/row:opacity-100 has-[[aria-expanded=true]]:opacity-100",
      /** sits under the surface, revealed by swiping it left */
      swipe: "absolute inset-y-0 right-0 px-1",
    },
    placement: {
      inline: "",
      overlay: "absolute top-1/2 right-1 -translate-y-1/2 rounded-md bg-background/90 pl-2 backdrop-blur-[2px]",
    },
  },
  defaultVariants: { reveal: "hover", placement: "inline" },
})

/* --------------------------------- drag ---------------------------------- */

/** row shell; --gutter reserved left of the box for the grip */
export const rowShell = cva("group/row relative flex items-center pl-(--gutter)", {
  variants: {
    from: { row: "cursor-grab active:cursor-grabbing", hover: "", always: "", handle: "", arrange: "" },
    gutter: { wide: "[--gutter:1.5rem]", narrow: "[--gutter:1rem]", none: "[--gutter:0px]" },
    placement: { inline: "gap-1.5", overlay: "gap-0" },
  },
  defaultVariants: { from: "row", gutter: "narrow", placement: "inline" },
})

export const grip = cva(
  "absolute top-1/2 left-0 flex w-(--gutter) -translate-y-1/2 cursor-grab touch-none items-center justify-center text-muted-foreground active:cursor-grabbing",
  {
    variants: {
      from: {
        row: "opacity-0 transition-opacity group-hover/row:opacity-100",
        hover: "opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-within/row:opacity-100",
        always: "",
        handle: "",
        /** only while arrange mode is on */
        arrange: "hidden group-data-[arrange=true]/editor:flex",
      },
      gutter: { wide: "[&_svg]:size-4", narrow: "[&_svg]:size-3", none: "hidden" },
    },
    defaultVariants: { from: "row", gutter: "narrow" },
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
        box: "rounded-b-md border-t border-border bg-muted/30",
        rule: "border-t border-border",
        none: "",
      },
    },
    defaultVariants: { frame: "box" },
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
