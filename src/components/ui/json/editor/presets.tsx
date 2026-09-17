"use client"

import * as React from "react"
import { cn } from "cn"
import { animate, motion, useMotionValue } from "motion/react"
import {
  createJsonSchema,
  type Json,
  type JsonSchema,
  type JsonSchemaOptions,
  type SchemaNode,
} from "@/store"
import { useEditor, useVariant, type Variant } from "@/context/editor"
import * as Schema from "./schema"
import * as SchemaField from "./field"
import * as SchemaAction from "./action"

/** the handle, memoised for the owner's lifetime; never re-renders the owner */
export function useJsonSchema(
  initial: Json,
  options?: JsonSchemaOptions
): JsonSchema {
  const [schema] = React.useState(() => createJsonSchema(initial, options))
  return schema
}

/** re-render on every change with the current JSON — opt-in reactivity */
export function useJsonSchemaValue(schema: JsonSchema): Json {
  return React.useSyncExternalStore(
    (cb) => schema.subscribe(cb),
    () => schema.toJSON(),
    () => schema.toJSON()
  )
}

/* -------------------------------- desktop -------------------------------- */

const pad: Record<Variant, string> = {
  compact: "gap-1 px-1.5 py-1",
  default: "gap-1.5 px-3 py-2",
  wide: "gap-3 px-4 py-3",
  mobile: "gap-2 px-3 py-2",
}

/** one template for default / compact / wide; compact moves description + examples into the menu */
const desktop = (node: SchemaNode) => <DesktopRow node={node} />

function DesktopRow({ node }: { node: SchemaNode }) {
  return (
    <SchemaField.Row
      dragFrom="anywhere"
      className={cn(
        "rounded-md border bg-background",
        node.isGroup
          ? "border-border"
          : "border-transparent has-[>[data-slot=head]:hover]:border-border"
      )}
    >
      <Head node={node} />
      {node.isGroup && <SchemaField.Nested />}
    </SchemaField.Row>
  )
}

function Head(_: { node: SchemaNode }) {
  const v = useVariant()
  const compact = v === "compact"
  return (
    <div data-slot="head" className={cn("group/head flex items-start", pad[v])}>
      <SchemaField.Handle className="opacity-0 group-hover/head:opacity-100" />
      <SchemaField.Type />
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          v === "wide" ? "gap-1" : compact ? "gap-0" : "gap-0.5"
        )}
      >
        <div
          className={cn(
            "flex min-w-0 items-center",
            v === "wide" ? "min-h-7 gap-2" : "min-h-5 gap-1.5"
          )}
        >
          <SchemaField.Title />
          <SchemaField.Key />
          <SchemaField.Repeated />
          <SchemaField.ChildrenCount />
          <SchemaField.Optional />
          <SchemaField.NestedToggle className="ml-auto" />
        </div>
        {!compact && (
          <>
            <SchemaField.Description multiline />
            <SchemaField.Examples />
          </>
        )}
        <SchemaField.Extra />
      </div>
      <div
        className={cn(
          "flex shrink-0 items-center gap-0.5 opacity-0 group-hover/head:opacity-100 has-[[aria-expanded=true]]:opacity-100"
        )}
      >
        <SchemaAction.Remove />
        <SchemaField.MenuPart>
          {compact && (
            <SchemaAction.EditDetails fields={["description", "examples"]} />
          )}
          <SchemaAction.Optional />
          <SchemaAction.Repeated />
          <SchemaAction.Nullable />
          <SchemaAction.Duplicate />
          <SchemaAction.Remove />
        </SchemaField.MenuPart>
      </div>
    </div>
  )
}

/* --------------------------------- mobile -------------------------------- */

const SWIPE = 88

/** read-only summary; tap opens the sheet, swipe left reveals actions, press-and-drag reorders */
const mobile = (node: SchemaNode) => <MobileRow node={node} />

function MobileRow({ node }: { node: SchemaNode }) {
  const x = useMotionValue(0)
  return (
    <SchemaField.Row
      dragFrom="anywhere"
      className={cn(
        "rounded-md border bg-background",
        node.isGroup ? "border-border" : "border-transparent"
      )}
    >
      <div className="relative overflow-hidden rounded-md">
        <div className="absolute inset-y-0 right-0 flex items-start gap-0.5 px-2 py-1">
          <SchemaAction.Remove />
          <SchemaField.MenuPart>
            <SchemaAction.Optional />
            <SchemaAction.Repeated />
            <SchemaAction.Nullable />
            <SchemaAction.Duplicate />
            <SchemaAction.Remove />
          </SchemaField.MenuPart>
        </div>
        <motion.div
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: -SWIPE, right: 0 }}
          dragElastic={0.05}
          style={{ x }}
          onDragEnd={(_, info) => {
            const open = info.offset.x < -SWIPE / 2 || info.velocity.x < -200
            animate(x, open ? -SWIPE : 0, {
              type: "spring",
              stiffness: 500,
              damping: 40,
            })
          }}
          className="relative z-10 bg-background"
        >
          <SchemaAction.EditDetails
            render={
              <div
                data-slot="head"
                className={cn(
                  "flex items-start active:bg-muted/60",
                  pad.mobile
                )}
              >
                <SchemaField.Type />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex min-h-5 min-w-0 items-center gap-1.5">
                    <SchemaField.Title readOnly />
                    <SchemaField.Key readOnly />
                    <SchemaField.Repeated />
                    <SchemaField.ChildrenCount />
                    <SchemaField.Optional />
                    <SchemaField.NestedToggle className="ml-auto" />
                  </div>
                  <SchemaField.Description readOnly />
                  <SchemaField.Examples readOnly />
                </div>
              </div>
            }
          />
        </motion.div>
      </div>
      {node.isGroup && <SchemaField.Nested />}
    </SchemaField.Row>
  )
}

/* --------------------------------- preset -------------------------------- */

export function JsonSchemaEditor({
  schema,
  variant,
  className,
}: {
  schema: JsonSchema
  /** default: `mobile` on a coarse pointer, else `default` */
  variant?: Variant
  className?: string
}) {
  return (
    <Schema.Root store={schema} className={className}>
      <Preset variant={variant} />
    </Schema.Root>
  )
}

function Preset({ variant }: { variant?: Variant }) {
  const { coarse } = useEditor()
  const v: Variant = variant ?? (coarse ? "mobile" : "default")
  return (
    <>
      <Schema.List variant={v} render={v === "mobile" ? mobile : desktop} />
      <div className="flex pt-1">
        <Schema.AddField />
      </div>
    </>
  )
}
