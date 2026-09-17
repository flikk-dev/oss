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
import { useEditor, useField, useVariant, type Variant } from "@/context/editor"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { GripVerticalIcon, Trash2Icon } from "lucide-react"
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

/** how a group row folds: our Nested parts, or shadcn's Accordion (A/B) */
export type Groups = "nested" | "accordion"

/**
 * Group frame around a head. `nested`: chevron inside the head, our frame.
 * `accordion`: shadcn Accordion — its trigger is the chevron, its panel
 * animates the list.
 */
function GroupFrame({
  node,
  groups,
  head,
}: {
  node: SchemaNode
  groups: Groups
  head: React.ReactNode
}) {
  const { set } = useField()
  if (!node.isGroup) return head
  if (groups === "nested")
    return (
      <SchemaField.Nested>
        {head}
        <SchemaField.NestedList>
          <Schema.List />
          <Schema.AddField className="self-end" />
        </SchemaField.NestedList>
      </SchemaField.Nested>
    )
  return (
    <SchemaField.Nested>
      <Accordion
        value={node.collapsed ? [] : [node.id]}
        onValueChange={(v) => set({ collapsed: v.length === 0 })}
      >
        <AccordionItem value={node.id} className="border-0">
          <div className="flex items-start">
            <div className="min-w-0 flex-1">{head}</div>
            <AccordionTrigger
              aria-label={node.collapsed ? "Expand" : "Collapse"}
              className="m-1 size-6 flex-none items-center justify-center rounded-md p-0 text-muted-foreground hover:bg-muted hover:no-underline **:data-[slot=accordion-trigger-icon]:m-0"
            />
          </div>
          <AccordionContent className="p-0">
            <SchemaField.NestedList open>
              <Schema.List />
              <Schema.AddField className="self-end" />
            </SchemaField.NestedList>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <SchemaField.NestedSummary className="border-t border-border bg-group" />
    </SchemaField.Nested>
  )
}

/** one template for default / compact / wide; compact moves description + examples into the menu */
const desktop = (groups: Groups) => (node: SchemaNode) => (
  <DesktopRow node={node} groups={groups} />
)

function DesktopRow({ node, groups }: { node: SchemaNode; groups: Groups }) {
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
      <GroupFrame
        node={node}
        groups={groups}
        head={<Head node={node} toggle={groups === "nested"} />}
      />
    </SchemaField.Row>
  )
}

function Head({ node, toggle }: { node: SchemaNode; toggle: boolean }) {
  const v = useVariant()
  const compact = v === "compact"
  return (
    <div data-slot="head" className={cn("group/head flex items-start", pad[v])}>
      <SchemaAction.Drag className="opacity-0 group-hover/head:opacity-100" />
      <SchemaAction.ChangeType />
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
          {toggle && node.isGroup && (
            <SchemaField.NestedToggle className="ml-auto" />
          )}
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
const mobile = (groups: Groups) => (node: SchemaNode) => (
  <MobileRow node={node} groups={groups} />
)

function MobileRow({ node, groups }: { node: SchemaNode; groups: Groups }) {
  const x = useMotionValue(0)
  const head = (
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
              className={cn("flex items-start active:bg-muted/60", pad.mobile)}
            >
              <SchemaField.Type />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex min-h-5 min-w-0 items-center gap-1.5">
                  <SchemaField.Title readOnly />
                  <SchemaField.Key readOnly />
                  <SchemaField.Repeated />
                  <SchemaField.ChildrenCount />
                  <SchemaField.Optional />
                  {node.isGroup && (
                    <SchemaField.NestedToggle className="ml-auto" />
                  )}
                </div>
                <SchemaField.Description readOnly />
                <SchemaField.Examples readOnly />
              </div>
            </div>
          }
        />
      </motion.div>
    </div>
  )
  return (
    <SchemaField.Row
      dragFrom="anywhere"
      className={cn(
        "rounded-md border bg-background",
        node.isGroup ? "border-border" : "border-transparent"
      )}
    >
      <GroupFrame node={node} groups={groups} head={head} />
    </SchemaField.Row>
  )
}

/* --------------------------------- shadcn -------------------------------- */

/**
 * A/B: the same parts, every element swapped for a stock shadcn component via
 * `render`. Card per row, Input / Textarea for text, Badge for flags, Checkbox
 * for selection, Button for actions, Accordion for groups.
 */
const shadcn = (node: SchemaNode) => <ShadcnRow node={node} />

function ShadcnRow({ node }: { node: SchemaNode }) {
  const head = (
    <>
      <CardHeader className="flex flex-row flex-wrap items-center gap-2 px-3">
        <SchemaAction.Drag render={<Button variant="ghost" size="icon-xs" />}>
          <GripVerticalIcon />
        </SchemaAction.Drag>
        <SchemaAction.Select render={<Checkbox />} />
        <SchemaAction.ChangeType>
          <SchemaField.Type label render={<Badge variant="outline" />} />
        </SchemaAction.ChangeType>
        <SchemaField.Title render={<Input className="h-7 w-44 text-sm" />} />
        <SchemaField.Key
          render={<Input className="h-7 w-36 font-mono text-xs" />}
        />
        <SchemaField.Optional render={<Badge variant="secondary" />} />
        <SchemaField.Repeated render={<Badge variant="secondary" />}>
          list
        </SchemaField.Repeated>
        <SchemaField.Nullable render={<Badge variant="secondary" />} />
        <SchemaField.ChildrenCount render={<Badge variant="outline" />} />
        <div className="ml-auto flex items-center gap-1">
          <SchemaAction.Remove
            render={<Button variant="ghost" size="icon-xs" />}
          >
            <Trash2Icon />
          </SchemaAction.Remove>
          <SchemaField.MenuPart>
            <SchemaAction.Optional />
            <SchemaAction.Repeated />
            <SchemaAction.Nullable />
            <SchemaAction.Duplicate />
            <SchemaAction.Remove />
          </SchemaField.MenuPart>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-3">
        <SchemaField.Description
          multiline
          render={<Textarea className="min-h-0 text-xs" rows={1} />}
        />
        <SchemaField.Examples render={<Input className="h-7 text-xs" />} />
      </CardContent>
    </>
  )
  return (
    <SchemaField.Row dragFrom="handle">
      <Card size="sm" className="gap-2 py-2">
        <GroupFrame node={node} groups="accordion" head={head} />
      </Card>
    </SchemaField.Row>
  )
}

/* --------------------------------- preset -------------------------------- */

/** which head draws the rows: ours, or the stock-shadcn A/B */
export type Skin = "editor" | "shadcn"

export function JsonSchemaEditor({
  schema,
  variant,
  groups = "nested",
  skin = "editor",
  className,
}: {
  schema: JsonSchema
  /** default: `mobile` on a coarse pointer, else `default` */
  variant?: Variant
  groups?: Groups
  skin?: Skin
  className?: string
}) {
  return (
    <Schema.Root store={schema} className={className}>
      <Preset variant={variant} groups={groups} skin={skin} />
    </Schema.Root>
  )
}

function Preset({
  variant,
  groups,
  skin,
}: {
  variant?: Variant
  groups: Groups
  skin: Skin
}) {
  const { coarse } = useEditor()
  const v: Variant = variant ?? (coarse ? "mobile" : "default")
  const render = React.useMemo(
    () =>
      skin === "shadcn"
        ? shadcn
        : v === "mobile"
          ? mobile(groups)
          : desktop(groups),
    [v, groups, skin]
  )
  return (
    <>
      <Schema.List variant={v} render={render} />
      <div className="flex justify-end pt-1">
        <Schema.AddField />
      </div>
    </>
  )
}
