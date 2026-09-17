/**
 * JSON Schema editor — parts + presets.
 *
 *   const schema = useJsonSchema(json)
 *   <JsonSchemaEditor schema={schema} variant="compact" />
 *
 * Or compose: <Schema.Root store={schema}><Schema.List render={row} /></Schema.Root>
 * with SchemaField.* / SchemaAction.* inside `row`.
 */
import * as SchemaParts from "./schema"
import * as FieldParts from "./field"
import * as ActionParts from "./action"

export const Schema = {
  Root: SchemaParts.Root,
  List: SchemaParts.List,
  Skeleton: SchemaParts.Skeleton,
  AddField: SchemaParts.AddField,
  Toolbar: SchemaParts.Toolbar,
  SelectAll: SchemaParts.SelectAll,
  SelectionCount: SchemaParts.SelectionCount,
}

export const SchemaField = {
  Row: FieldParts.Row,
  Handle: FieldParts.Handle,
  Select: FieldParts.Select,
  Type: FieldParts.Type,
  Title: FieldParts.Title,
  Key: FieldParts.Key,
  Description: FieldParts.Description,
  Examples: FieldParts.Examples,
  Optional: FieldParts.Optional,
  Repeated: FieldParts.Repeated,
  Nullable: FieldParts.Nullable,
  ChildrenCount: FieldParts.ChildrenCount,
  Extra: FieldParts.Extra,
  Menu: FieldParts.MenuPart,
  Nested: FieldParts.Nested,
  NestedToggle: FieldParts.NestedToggle,
}

export const SchemaAction = {
  Primitive: ActionParts.ActionPrimitive,
  Optional: ActionParts.Optional,
  Repeated: ActionParts.Repeated,
  Nullable: ActionParts.Nullable,
  Duplicate: ActionParts.Duplicate,
  Remove: ActionParts.Remove,
  EditDetails: ActionParts.EditDetails,
}

export { JsonSchemaEditor, useJsonSchema, useJsonSchemaValue } from "./presets"
export type { Variant } from "@/context/editor"
