"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { CheckIcon, CircleSlashIcon, Settings2Icon, Trash2Icon } from "lucide-react";
import {
  createJsonSchema,
  type Json,
  type JsonSchema,
  type JsonSchemaOptions,
  type SchemaNode,
} from "@/registry/base-nova/ui/json/core";
import {
  useEditor,
  useEditorStore,
  useFieldContext,
  useVariant,
  type Variant,
} from "@/registry/base-nova/ui/json/editor/context";
import { useField } from "./hooks";
import * as Schema from "./schema";
import * as SchemaField from "./field";
import * as SchemaAction from "./action";

/** the handle, memoised for the owner's lifetime; never re-renders the owner */
export function useJsonSchema(initial: Json, options?: JsonSchemaOptions): JsonSchema {
  const [schema] = React.useState(() => createJsonSchema(initial, options));
  return schema;
}

/** re-render on every change with the current JSON; opt-in reactivity */
export function useJsonSchemaValue(schema: JsonSchema): Json {
  return React.useSyncExternalStore(
    (cb) => schema.subscribe(cb),
    () => schema.toJSON(),
    () => schema.toJSON(),
  );
}

/* -------------------------------- desktop -------------------------------- */

const pad: Record<Variant, string> = {
  compact: "gap-1 px-1.5 py-1",
  default: "gap-1.5 px-3 py-2",
  wide: "gap-3 px-4 py-3",
  mobile: "gap-2 px-3 py-2",
};
/** the head's vertical padding as a var on the row, so a column cell can line up with its first line */
const headPy: Record<Variant, string> = {
  compact: "[--head-py:--spacing(1)]",
  default: "[--head-py:--spacing(2)]",
  wide: "[--head-py:--spacing(3)]",
  mobile: "[--head-py:--spacing(2)]",
};

/** group rows: head + nested list under one <Nested>; leaves: just the head */
function GroupFrame({ node, head }: { node: SchemaNode; head: React.ReactNode }) {
  if (!node.isGroup) return head;
  return (
    <SchemaField.Nested>
      {head}
      <SchemaField.NestedList>
        <Schema.List />
        <Schema.AddField className="justify-self-end" />
      </SchemaField.NestedList>
    </SchemaField.Nested>
  );
}

/** is anything selected; mobile switches tap to "toggle this row" then */
const useSelecting = () => useEditorStore((s) => s.selected.length > 0);

/** the ⋯ menu; compact keeps description + examples behind Edit details */
function RowMenu() {
  const compact = useVariant() === "compact";
  return (
    <SchemaField.MenuPart>
      {compact && <SchemaAction.EditDetails fields={["description", "examples"]} />}
      <SchemaAction.Optional />
      <SchemaAction.Repeated />
      <SchemaAction.Nullable />
      <SchemaAction.Duplicate />
      <SchemaAction.Remove />
    </SchemaField.MenuPart>
  );
}

/** one template for default / compact / wide; compact moves description + examples into the menu */
const desktop = (node: SchemaNode) => <DesktopRow node={node} />;

function DesktopRow({ node }: { node: SchemaNode }) {
  const v = useVariant();
  return (
    <SchemaField.Row dragFrom="anywhere" className={cn("group/row", headPy[v])}>
      <GroupFrame
        node={node}
        head={
          <div
            data-slot="card"
            className={cn(
              "min-w-0 border bg-background",
              // a group's card is the top of its frame
              node.isGroup
                ? "rounded-t-md border-border"
                : "rounded-md border-transparent has-[>[data-slot=head]:hover]:border-border",
              // selected: the hover look, kept
              "group-data-[selected]/row:border-border group-data-[selected]/row:bg-muted/40 group-data-[selected]/row:[&_[data-slot=head]>*]:opacity-100",
            )}
          >
            <Head node={node} />
          </div>
        }
      />
    </SchemaField.Row>
  );
}

/** the head line(s) of a row; `readOnly` is the mobile summary: plain text, type shown not picked */
function Head({
  node,
  readOnly,
  className,
}: {
  node: SchemaNode;
  readOnly?: boolean;
  className?: string;
}) {
  const v = useVariant();
  const compact = v === "compact";
  return (
    <div data-slot="head" className={cn("group/head flex items-start", pad[v], className)}>
      {readOnly ? (
        <SchemaField.Type />
      ) : (
        <>
          <SchemaAction.Drag className="opacity-0 group-hover/head:opacity-100" />
          <SchemaAction.ChangeType />
        </>
      )}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          v === "wide" ? "gap-1" : compact ? "gap-0" : "gap-0.5",
        )}
      >
        <div
          className={cn(
            "flex min-w-0 items-center",
            v === "wide" ? "min-h-7 gap-2" : "min-h-5 gap-1.5",
          )}
        >
          <SchemaField.Title readOnly={readOnly} />
          <SchemaField.Key readOnly={readOnly} />
          <SchemaField.Repeated />
          <SchemaField.ChildrenCount />
          <SchemaField.Optional />
          {node.isGroup && <SchemaField.NestedToggle className="ml-auto" />}
        </div>
        {!compact && (
          <>
            <SchemaField.Description multiline readOnly={readOnly} />
            <SchemaField.Examples readOnly={readOnly} />
          </>
        )}
        {!readOnly && <SchemaField.Extra />}
      </div>
    </div>
  );
}

/* --------------------------------- mobile -------------------------------- */

/** one swipe tile; the drawer is two of them, the select tile one */
const TILE = 48;
const SWIPE = TILE * 2;

/** read-only summary; tap opens the sheet, swipe left reveals actions, press-and-drag reorders */
const mobile = (node: SchemaNode) => <MobileRow node={node} />;

/** tap opens the sheet; while a selection is active, tap toggles this row instead */
function MobileSummary({ node }: { node: SchemaNode }) {
  const { select } = useField();
  const selecting = useSelecting();
  return (
    <SchemaAction.EditDetails
      render={<div className="active:bg-muted/60" />}
      onClick={(e) => {
        if (selecting) {
          e.preventDefault();
          select();
        }
      }}
    >
      <Head node={node} readOnly />
    </SchemaAction.EditDetails>
  );
}

function MobileRow({ node }: { node: SchemaNode }) {
  return (
    <SchemaField.Row dragFrom="anywhere" className="group/row">
      <GroupFrame node={node} head={<MobileHead node={node} />} />
    </SchemaField.Row>
  );
}

/** a swipe tile: full height, one centred icon, its own colour */
const tile = "flex w-(--tile) shrink-0 items-center justify-center [&_svg]:size-4 [&_svg]:shrink-0";

/**
 * The summary rides on top of two drawers. Left swipe pulls it off the right
 * one (settings, then delete on the outside, where a thumb lands last); right
 * swipe flashes the left one and toggles the selection.
 */
function MobileHead({ node }: { node: SchemaNode }) {
  const { select, selected } = useField();
  const x = useMotionValue(0);
  // where the summary sat when this gesture began: a drawer that is already
  // open has to be pushed shut, and that push must not read as a select
  const from = React.useRef(0);
  // a narrow row is not as wide as both drawers, so the far one would peek out
  // from under the summary: each shows only while it is the one being pulled
  const leftOpen = useTransform(x, [0, 1], [0, 1], { clamp: true });
  const rightOpen = useTransform(x, [-1, 0], [1, 0], { clamp: true });
  const spring = { type: "spring", stiffness: 500, damping: 40 } as const;
  return (
    <div
      data-slot="card"
      style={{ "--tile": `${TILE}px` } as React.CSSProperties}
      className={cn(
        "relative overflow-hidden border bg-background",
        node.isGroup ? "rounded-t-md border-border" : "rounded-md border-transparent",
        "group-data-[selected]/row:border-primary",
      )}
    >
      {/* swipe right */}
      <motion.div
        aria-hidden
        style={{ opacity: leftOpen }}
        className={cn(tile, "absolute inset-y-0 left-0 bg-primary text-primary-foreground")}
      >
        {selected ? <CircleSlashIcon /> : <CheckIcon />}
      </motion.div>
      {/* swipe left; destructive last so a long pull cannot land on it by accident */}
      <motion.div style={{ opacity: rightOpen }} className="absolute inset-y-0 right-0 flex">
        <SchemaAction.EditDetails
          render={<button className={cn(tile, "bg-muted text-foreground active:bg-muted/70")} />}
        >
          <Settings2Icon />
        </SchemaAction.EditDetails>
        <SchemaAction.Remove
          render={
            <button className={cn(tile, "bg-destructive text-white active:bg-destructive/80")} />
          }
        >
          <Trash2Icon />
        </SchemaAction.Remove>
      </motion.div>
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -SWIPE, right: TILE }}
        dragElastic={0.05}
        style={{ x }}
        onDragStart={() => {
          from.current = x.get();
        }}
        onDragEnd={(_, info) => {
          const v = info.velocity.x;
          // pushing an open drawer shut: that is all it is
          if (from.current < 0) return void animate(x, 0, spring);
          // right: a flick is enough, the drawer never stays open
          if (info.offset.x > TILE / 2 || v > 300) {
            select();
            return void animate(x, 0, spring);
          }
          const open = info.offset.x < -SWIPE / 2 || v < -200;
          animate(x, open ? -SWIPE : 0, spring);
        }}
        className="relative z-10 bg-background"
      >
        <MobileSummary node={node} />
      </motion.div>
    </div>
  );
}

/* --------------------------------- preset -------------------------------- */

export function JsonSchemaEditor({
  schema,
  variant,
  portalContainer,
  className,
}: {
  schema: JsonSchema;
  /** default: `mobile` on a coarse pointer, else `default` */
  variant?: Variant;
  /** keep sheets, menus and the mobile toolbar inside this element */
  portalContainer?: React.RefObject<HTMLElement | null>;
  className?: string;
}) {
  return (
    <Schema.Root store={schema} portalContainer={portalContainer} className={className}>
      <Preset variant={variant} />
    </Schema.Root>
  );
}

function Preset({ variant }: { variant?: Variant }) {
  const { coarse } = useEditor();
  const v: Variant = variant ?? (coarse ? "mobile" : "default");
  const render = v === "mobile" ? mobile : desktop;
  return (
    <>
      {v === "mobile" ? (
        // floating, thumb reach: count, the destructive one, the rest behind ⋯
        <Schema.Toolbar
          variant="mobile"
          className="fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-40 gap-1.5 rounded-xl border border-border bg-popover p-2 shadow-lg data-[state=empty]:hidden"
        >
          <Schema.SelectAll className="ml-1" />
          <Schema.SelectionCount className="text-xs text-muted-foreground" />
          <SchemaAction.Remove className="ml-auto" />
          <Schema.SelectionMenu label="Selection">
            <SchemaAction.Optional />
            <SchemaAction.Repeated />
            <SchemaAction.Nullable />
            <SchemaAction.MoveInto />
            <SchemaAction.Duplicate />
          </Schema.SelectionMenu>
          <SchemaAction.ClearSelection />
        </Schema.Toolbar>
      ) : (
        <Schema.Toolbar className="mb-1 flex-wrap gap-1 rounded-md border border-border bg-muted/40 px-2 py-1 data-[state=empty]:hidden">
          <Schema.SelectAll className="mr-1" />
          <Schema.SelectionCount className="mr-2 text-xs text-muted-foreground" />
          <SchemaAction.Optional />
          <SchemaAction.Repeated />
          <SchemaAction.Nullable />
          <SchemaAction.MoveInto />
          <SchemaAction.Duplicate />
          <SchemaAction.Remove />
          <SchemaAction.ClearSelection className="ml-auto" />
        </Schema.Toolbar>
      )}
      <Schema.List variant={v} render={render}>
        {/* touch: no gutters. these reveal on hover, which a finger never does,
            so they would only reserve width; long-press selects and the
            toolbar carries the actions */}
        {!coarse && (
          <>
            <Schema.Column side="left" className="mr-1.5">
              {/* shown on hover, when checked, and while any selection is active */}
              <SchemaAction.Select className="mt-[calc(var(--head-py)+0.125rem)] opacity-0 group-hover/row:opacity-100 group-data-[selection=active]/editor:opacity-100 data-indeterminate:opacity-100 data-checked:opacity-100" />
            </Schema.Column>
            <Schema.Column
              side="right"
              className="ml-1.5 flex items-center gap-0.5 pt-(--head-py) opacity-0 group-hover/row:opacity-100 has-[[aria-expanded=true]]:opacity-100"
            >
              <SchemaAction.Remove />
              <RowMenu />
            </Schema.Column>
          </>
        )}
      </Schema.List>
      <div className="flex justify-end pt-1">
        <Schema.AddField />
      </div>
    </>
  );
}
