import { createStore } from "zustand/vanilla"
import { subscribeWithSelector } from "zustand/middleware"
import { uniqueSlug, type SlugCase } from "@/lib/schema-editor/slug"
import {
  isGroupType,
  newId,
  type FieldMeta,
  type FieldNode,
  type FieldTree,
} from "@/lib/schema-editor/tree"
import { jsonTypeMap, type JsonTypeKey } from "./types"

/**
 * Per-editor store, normalized: a row subscribes to its own node only, so a
 * keystroke re-renders one row, not the tree. `value`/`onChange` sync at the
 * boundary (root.tsx).
 */

export const ROOT = "__root__"

export type Field = FieldMeta & { id: string }

export type EditorState = {
  byId: Record<string, Field>
  children: Record<string, string[]>
  parentOf: Record<string, string>
  /** mobile: id whose detail sheet is open */
  sheet: string | null
  slugCase: SlugCase

  replaceTree: (tree: FieldTree) => void
  update: (id: string, patch: Partial<FieldMeta>) => void
  remove: (id: string) => void
  duplicate: (id: string) => void
  insert: (parentId: string, type: JsonTypeKey, index?: number) => string
  reorder: (parentId: string, ids: string[]) => void
  moveInto: (id: string, groupId: string) => void
  popOut: (id: string) => void
  openSheet: (id: string | null) => void
  setSlugCase: (c: SlugCase) => void
}

export function fromTree(tree: FieldTree) {
  const byId: EditorState["byId"] = {}
  const children: EditorState["children"] = { [ROOT]: [] }
  const parentOf: EditorState["parentOf"] = {}
  const walk = (nodes: FieldNode[], parent: string) => {
    children[parent] = nodes.map((n) => n.id)
    for (const n of nodes) {
      const { children: kids, ...meta } = n
      byId[n.id] = meta
      parentOf[n.id] = parent
      if (isGroupType(n.type)) walk(kids ?? [], n.id)
    }
  }
  walk(tree, ROOT)
  return { byId, children, parentOf }
}

export function toTree(
  s: Pick<EditorState, "byId" | "children">,
  parent = ROOT
): FieldTree {
  return (s.children[parent] ?? []).map((id) => {
    const n = s.byId[id]
    return isGroupType(n.type) ? { ...n, children: toTree(s, id) } : { ...n }
  })
}

export function isDescendant(
  s: Pick<EditorState, "parentOf">,
  ancestor: string,
  id: string
): boolean {
  let p = s.parentOf[id]
  while (p && p !== ROOT) {
    if (p === ancestor) return true
    p = s.parentOf[p]
  }
  return false
}

export function createEditorStore(initial: FieldTree, slugCase: SlugCase) {
  return createStore<EditorState>()(
    subscribeWithSelector((set, get) => {
      const taken = (parent: string, except?: string) =>
        new Set(
          (get().children[parent] ?? [])
            .filter((id) => id !== except)
            .map((id) => get().byId[id].slug)
        )

      const detach = (s: EditorState, id: string) => {
        const parent = s.parentOf[id]
        s.children[parent] = s.children[parent].filter((x) => x !== id)
      }
      const attach = (
        s: EditorState,
        id: string,
        parent: string,
        index?: number
      ) => {
        const list = [...(s.children[parent] ?? [])]
        list.splice(index ?? list.length, 0, id)
        s.children[parent] = list
        s.parentOf[id] = parent
      }
      const drop = (s: EditorState, id: string) => {
        for (const c of s.children[id] ?? []) drop(s, c)
        delete s.byId[id]
        delete s.children[id]
        delete s.parentOf[id]
      }
      /** shallow-clone the maps we mutate so subscribers see new refs */
      const mutate = (fn: (s: EditorState) => void) =>
        set((prev) => {
          const s = {
            ...prev,
            byId: { ...prev.byId },
            children: { ...prev.children },
            parentOf: { ...prev.parentOf },
          }
          fn(s)
          return s
        })

      return {
        ...fromTree(initial),
        sheet: null,
        slugCase,

        replaceTree: (tree) => set(fromTree(tree)),

        update: (id, patch) =>
          mutate((s) => {
            s.byId[id] = { ...s.byId[id], ...patch }
            // becoming a group needs a child list; leaving one drops the subtree
            if (patch.type && isGroupType(patch.type) && !s.children[id])
              s.children[id] = []
            if (patch.type && !isGroupType(patch.type) && s.children[id]) {
              for (const c of s.children[id]) drop(s, c)
              delete s.children[id]
            }
          }),

        remove: (id) =>
          mutate((s) => {
            detach(s, id)
            drop(s, id)
          }),

        duplicate: (id) =>
          mutate((s) => {
            const parent = s.parentOf[id]
            const clone = (x: string, into: string): string => {
              const nid = newId()
              s.byId[nid] = { ...s.byId[x], id: nid }
              s.parentOf[nid] = into
              if (s.children[x])
                s.children[nid] = s.children[x].map((c) => clone(c, nid))
              return nid
            }
            const nid = clone(id, parent)
            s.byId[nid].slug = uniqueSlug(
              s.byId[nid].slug,
              taken(parent),
              s.slugCase
            )
            s.byId[nid].slugEdited = true
            attach(s, nid, parent, s.children[parent].indexOf(id) + 1)
          }),

        insert: (parent, type, index) => {
          const id = newId()
          mutate((s) => {
            const base = jsonTypeMap[type].title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "")
            s.byId[id] = {
              id,
              type,
              title: "",
              slug: uniqueSlug(base || "field", taken(parent), s.slugCase),
              slugEdited: false,
              description: "",
              examples: [],
              optional: false,
              nullable: false,
            }
            if (isGroupType(type)) s.children[id] = []
            attach(s, id, parent, index)
          })
          return id
        },

        reorder: (parent, ids) =>
          mutate((s) => void (s.children[parent] = ids)),

        moveInto: (id, groupId) => {
          const s = get()
          if (
            id === groupId ||
            s.parentOf[id] === groupId ||
            isDescendant(s, id, groupId)
          )
            return
          if (!s.children[groupId]) return
          mutate((s) => {
            detach(s, id)
            attach(s, id, groupId)
          })
        },

        popOut: (id) => {
          const s = get()
          const parent = s.parentOf[id]
          if (!parent || parent === ROOT) return
          const grand = s.parentOf[parent]
          mutate((s) => {
            detach(s, id)
            attach(s, id, grand, s.children[grand].indexOf(parent) + 1)
          })
        },

        openSheet: (sheet) => set({ sheet }),
        setSlugCase: (slugCase) => set({ slugCase }),
      }
    })
  )
}

export type EditorStore = ReturnType<typeof createEditorStore>
