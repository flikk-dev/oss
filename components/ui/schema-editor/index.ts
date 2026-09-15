/**
 * SchemaEditor — compound editor for a field tree that compiles to JSON Schema.
 *
 *   <SchemaEditor value={tree} onChange={setTree} />
 *
 * Compose your own rows with the parts; every part takes its cva props +
 * className and reads defaults from the theme. Override a subtree with
 * <SchemaEditor.Variants text={{ size: "xs" }}>.
 */
import { Actions, ArrangeToggle, DeleteButton, FieldSheet, SettingsMenu } from "./actions"
import { Add, Inserter } from "./add"
import { Group, GroupCount, GroupToggle } from "./group"
import { ArrayMark, Badges, Description, Examples, Header, OptionalMark, Slug, Title, Tooltip } from "./header"
import { List } from "./list"
import { SchemaEditorRoot, Variants, useEditorStore, useField, useSchemaEditor, useTheme, type SchemaEditorProps } from "./root"
import { Grip, Row, Surface } from "./row"
import { TypePicker } from "./type-picker"
import { createElement } from "react"

function Root(props: SchemaEditorProps) {
  return createElement(SchemaEditorRoot, props, props.children ?? createElement(List))
}

export const SchemaEditor = Object.assign(Root, {
  Variants,
  List,
  Row,
  Grip,
  Surface,
  Header,
  TypePicker,
  Title,
  Slug,
  Description,
  Examples,
  Badges,
  ArrayMark,
  OptionalMark,
  Tooltip,
  Group,
  GroupToggle,
  GroupCount,
  Actions,
  DeleteButton,
  SettingsMenu,
  FieldSheet,
  ArrangeToggle,
  Add,
  Inserter,
})

export { useSchemaEditor, useField, useTheme, useEditorStore }
export type { SchemaEditorProps }
export type { SchemaEditorTheme, PartialTheme, Tier, Pointer } from "./theme"
export { defaultTheme, mergeTheme, primitives } from "./theme"
export type { FieldTree, FieldNode, FieldMeta } from "@/lib/schema-editor/tree"
export { OptionMenu, type MenuEntry, type MenuSection } from "./menu"
