import { createEditorStore, toNode, type EditorStore } from "./editor"
import { fromJsonSchema, toExample as example, toJsonSchema } from "./schema"
import type { SlugCase } from "./slug"
import type { NodePatch, SchemaNode } from "./tree"
import { defaultTypes, type Json, type TypeModule } from "./types"

export type JsonSchemaOptions = { types?: TypeModule[]; slugCase?: SlugCase }

/**
 * The handle: a ref-like object the owner keeps. Stable identity, never
 * re-renders anything by itself; rows subscribe to their own node, the owner
 * pulls with `toJSON()` or opts into `subscribe`.
 */
export type JsonSchema = ReturnType<typeof createJsonSchema>

export function createJsonSchema(
  json: Json,
  { types = defaultTypes, slugCase = "camel" }: JsonSchemaOptions = {}
) {
  const store: EditorStore = createEditorStore(
    fromJsonSchema(json, types),
    types,
    slugCase
  )
  const s = () => store.getState()
  const node = (id: string) => (s().byId[id] ? toNode(s(), id) : undefined)
  // same tree → same JSON object, so useSyncExternalStore sees a stable snapshot
  let cache: { byId: unknown; children: unknown; json: Json } | null = null
  const toJSON = (): Json => {
    const { byId, children, root } = s()
    if (!cache || cache.byId !== byId || cache.children !== children)
      cache = { byId, children, json: toJsonSchema(toNode(s(), root), types) }
    return cache.json
  }

  return {
    store,
    types,
    get root() {
      return s().root
    },
    toJSON,
    toExample: () => example(toNode(s(), s().root), types),
    /** fires after every tree change with the new JSON */
    subscribe: (fn: (json: Json) => void) =>
      store.subscribe(
        (st) => [st.byId, st.children] as const,
        () => fn(toJSON()),
        { equalityFn: (a, b) => a[0] === b[0] && a[1] === b[1] }
      ),
    reset: (json: Json) => s().replace(fromJsonSchema(json, types)),

    get: node,
    /** id by key path, e.g. "address.street" */
    find: (path: string): string | undefined => {
      let id = s().root
      for (const key of path.split(".")) {
        const next = (s().children[id] ?? []).find(
          (c) => s().byId[c].key === key
        )
        if (!next) return undefined
        id = next
      }
      return id
    },
    update: (id: string, patch: NodePatch) => s().update(id, patch),
    insert: (parentId: string, type: string, index?: number) =>
      s().insert(parentId, type, index),
    move: (id: string | string[], parentId: string, index: number) =>
      s().move(id, parentId, index),
    remove: (ids: string | string[]) => s().remove(ids),
    duplicate: (id: string) => s().duplicate(id),

    select: (ids: string[]) => s().select(ids),
    selected: (): string[] => s().selected,
    removeSelected: () => s().remove(s().selected),
  }
}

export type { SchemaNode }
