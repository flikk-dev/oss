/**
 * SchemaEditor — compound editor for a field tree that compiles to JSON Schema.
 *
 *   <SchemaEditor value={tree} onChange={setTree} variant="compact" />
 *
 * Variants: default · compact · wide · mobile (auto on coarse pointer).
 * Compose your own rows with the parts.
 */
import { createElement } from "react"
import { Add, List } from "./list"
import { TypePicker } from "./menu"
import { SchemaEditorRoot, type SchemaEditorProps } from "./root"
import { useField, useSchemaEditor, type Variant } from "@/context/editor"
import {
  Actions,
  Description,
  Examples,
  Group,
  Header,
  Row,
  Slug,
  Title,
} from "./row"

function Root(props: SchemaEditorProps) {
  return createElement(
    SchemaEditorRoot,
    props,
    props.children ?? createElement(List)
  )
}

export const SchemaEditor = Object.assign(Root, {
  List,
  Row,
  Header,
  Group,
  TypePicker,
  Title,
  Slug,
  Description,
  Examples,
  Actions,
  Add,
})

export { useSchemaEditor, useField }
export type { SchemaEditorProps, Variant }
export type { FieldTree, FieldNode, FieldMeta } from "@/store/tree"
