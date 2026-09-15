/** design-lab view of the component theme spec */
export {
  primitives as itemSpecs,
  defaultTheme as defaultConfig,
  mergeTheme,
  flag,
  type Axis,
  type Primitive as ItemSpec,
  type SchemaEditorTheme as VariantConfig,
  type PartialTheme,
  type Tier,
} from "@/components/ui/schema-editor/theme"

import { primitives } from "@/components/ui/schema-editor/theme"
export type ItemKey = (typeof primitives)[number]["key"]
