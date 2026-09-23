import { createStore } from "zustand/vanilla";
import { subscribeWithSelector } from "zustand/middleware";
import { slugify, uniqueSlug, type SlugCase } from "./slug";
import { blankNode, newId, type NodePatch, type SchemaNode } from "./tree";
import { defaultTypes, type TypeModule } from "./types";

/**
 * Normalized tree: a row subscribes to its own node only, so a keystroke
 * re-renders one row. The root is a node like any other (type object, key "").
 */

/** a node without its subtree, as stored */
export type NodeRecord = Omit<SchemaNode, "children">;
export type DetailField = "type" | "title" | "key" | "description" | "examples";

export type EditorState = {
  root: string;
  byId: Record<string, NodeRecord>;
  children: Record<string, string[]>;
  parentOf: Record<string, string>;
  types: TypeModule[];
  slugCase: SlugCase;
  /** ids currently selected */
  selected: string[];
  /** last id toggled by hand; shift-select ranges from it */
  anchor: string | null;
  /** live drag: where the row(s) would land; index counts siblings without the moving rows */
  drop: {
    id: string;
    /** everything that moves: the row, or the selection it belongs to */
    ids: string[];
    parentId: string;
    index: number;
    height: number;
  } | null;
  /** details dialog / sheet: which field, and which of its fields to show (all when omitted) */
  details: { id: string; fields?: DetailField[] } | null;

  replace: (root: SchemaNode) => void;
  update: (id: string, patch: NodePatch) => void;
  remove: (ids: string | string[]) => void;
  duplicate: (id: string) => string;
  insert: (parentId: string, type: string, index?: number) => string;
  /** reparent + reorder in one step; index is among siblings excluding the moved rows */
  move: (id: string | string[], parentId: string, index: number) => void;
  /** what a drag of `id` carries: the selection when `id` is part of it, else just `id` */
  moving: (id: string) => string[];
  select: (ids: string[]) => void;
  toggleSelect: (id: string, on?: boolean) => void;
  /** add every node between the anchor and `id` (document order) to the selection */
  selectRange: (id: string) => void;
  setDrop: (drop: EditorState["drop"]) => void;
  openDetails: (id: string | null, fields?: DetailField[]) => void;
};

export function fromNode(root: SchemaNode) {
  const byId: EditorState["byId"] = {};
  const children: EditorState["children"] = {};
  const parentOf: EditorState["parentOf"] = {};
  const walk = (n: SchemaNode, parent: string | null) => {
    const { children: kids, ...field } = n;
    byId[n.id] = field;
    if (parent) parentOf[n.id] = parent;
    if (n.isGroup) {
      children[n.id] = (kids ?? []).map((c) => c.id);
      for (const c of kids ?? []) walk(c, n.id);
    }
  };
  walk(root, null);
  return { root: root.id, byId, children, parentOf };
}

export function toNode(s: Pick<EditorState, "byId" | "children">, id: string): SchemaNode {
  const n = s.byId[id];
  return n.isGroup ? { ...n, children: (s.children[id] ?? []).map((c) => toNode(s, c)) } : { ...n };
}

/** ids in document order, root excluded */
export function docOrder(s: Pick<EditorState, "root" | "children">) {
  const out: string[] = [];
  const walk = (x: string) => {
    if (x !== s.root) out.push(x);
    for (const c of s.children[x] ?? []) walk(c);
  };
  walk(s.root);
  return out;
}

export function isDescendant(
  s: Pick<EditorState, "parentOf">,
  ancestor: string,
  id: string,
): boolean {
  for (let p = s.parentOf[id]; p; p = s.parentOf[p]) if (p === ancestor) return true;
  return false;
}

export function createEditorStore(
  root: SchemaNode,
  types: TypeModule[] = defaultTypes,
  slugCase: SlugCase = "camel",
) {
  return createStore<EditorState>()(
    subscribeWithSelector((set, get) => {
      const mod = (type: string) => get().types.find((t) => t.key === type);
      const taken = (s: EditorState, parent: string, except?: string) =>
        new Set(
          (s.children[parent] ?? []).filter((id) => id !== except).map((id) => s.byId[id].key),
        );

      const detach = (s: EditorState, id: string) => {
        const parent = s.parentOf[id];
        s.children[parent] = s.children[parent].filter((x) => x !== id);
      };
      const attach = (s: EditorState, id: string, parent: string, index?: number) => {
        const list = [...(s.children[parent] ?? [])];
        list.splice(index ?? list.length, 0, id);
        s.children[parent] = list;
        s.parentOf[id] = parent;
        const n = s.byId[id];
        const key = uniqueSlug(n.key, taken(s, parent, id), s.slugCase);
        if (key !== n.key) s.byId[id] = { ...n, key };
      };
      const drop = (s: EditorState, id: string) => {
        for (const c of s.children[id] ?? []) drop(s, c);
        delete s.byId[id];
        delete s.children[id];
        delete s.parentOf[id];
      };
      /** shallow-clone the maps we mutate so subscribers see new refs */
      const mutate = (fn: (s: EditorState) => void) =>
        set((prev) => {
          const s = {
            ...prev,
            byId: { ...prev.byId },
            children: { ...prev.children },
            parentOf: { ...prev.parentOf },
          };
          fn(s);
          s.selected = s.selected.filter((id) => s.byId[id]);
          return s;
        });

      return {
        ...fromNode(root),
        types,
        slugCase,
        selected: [],
        anchor: null,
        drop: null,
        details: null,

        replace: (root) =>
          set({
            ...fromNode(root),
            selected: [],
            anchor: null,
            drop: null,
            details: null,
          }),

        update: (id, patch) =>
          mutate((s) => {
            const prev = s.byId[id];
            const next = { ...prev, ...patch };
            if (patch.title !== undefined && !next.keyEdited && id !== s.root)
              next.key = uniqueSlug(
                slugify(next.title, s.slugCase),
                taken(s, s.parentOf[id], id),
                s.slugCase,
              );
            if (patch.key !== undefined) next.keyEdited = patch.key.length > 0;
            if (patch.type && patch.type !== prev.type) {
              const m = mod(patch.type);
              if (!m) return;
              next.isGroup = m.children;
              if (!m.examples) next.examples = [];
              // becoming a group needs a child list; leaving one drops the subtree
              if (m.children && !s.children[id]) s.children[id] = [];
              if (!m.children && s.children[id]) {
                for (const c of s.children[id]) drop(s, c);
                delete s.children[id];
              }
            }
            s.byId[id] = next;
          }),

        remove: (ids) =>
          mutate((s) => {
            for (const id of [ids].flat()) {
              if (id === s.root || !s.byId[id]) continue;
              detach(s, id);
              drop(s, id);
            }
          }),

        duplicate: (id) => {
          const nid = newId();
          mutate((s) => {
            const parent = s.parentOf[id];
            const clone = (x: string, into: string, forced?: string): string => {
              const cid = forced ?? newId();
              s.byId[cid] = { ...s.byId[x], id: cid };
              s.parentOf[cid] = into;
              if (s.children[x]) s.children[cid] = s.children[x].map((c) => clone(c, cid));
              return cid;
            };
            clone(id, parent, nid);
            s.byId[nid] = { ...s.byId[nid], keyEdited: true };
            attach(s, nid, parent, s.children[parent].indexOf(id) + 1);
          });
          return nid;
        },

        insert: (parentId, type, index) => {
          const m = mod(type);
          if (!m) throw new Error(`unknown type "${type}"`);
          const node = blankNode(type, m.children, {
            key: slugify(m.label, get().slugCase) || "field",
          });
          mutate((s) => {
            const { children: _c, ...field } = node;
            s.byId[node.id] = field;
            if (m.children) s.children[node.id] = [];
            attach(s, node.id, parentId, index);
          });
          return node.id;
        },

        move: (id, parentId, index) => {
          const s = get();
          const want = new Set([id].flat());
          // document order; a row inside another moved row travels with it
          const ids = docOrder(s).filter(
            (x) => want.has(x) && !Array.from(want).some((a) => a !== x && isDescendant(s, a, x)),
          );
          if (!ids.length || !s.children[parentId]) return;
          if (ids.some((x) => x === parentId || isDescendant(s, x, parentId))) return;
          mutate((s) => {
            for (const x of ids) detach(s, x);
            ids.forEach((x, i) => attach(s, x, parentId, index + i));
          });
        },
        moving: (id) => {
          const s = get();
          return s.selected.includes(id) ? s.selected : [id];
        },

        select: (selected) => set({ selected }),
        toggleSelect: (id, on) =>
          set((s) => {
            const has = s.selected.includes(id);
            const next = on ?? !has;
            return {
              anchor: id,
              selected: next
                ? has
                  ? s.selected
                  : [...s.selected, id]
                : s.selected.filter((x) => x !== id),
            };
          }),

        selectRange: (id) => {
          const s = get();
          if (!s.anchor || !s.byId[s.anchor]) return s.toggleSelect(id, true);
          const order = docOrder(s);
          const [a, b] = [order.indexOf(s.anchor), order.indexOf(id)].sort((x, y) => x - y);
          const range = order.slice(a, b + 1);
          set({
            selected: [...s.selected, ...range.filter((x) => !s.selected.includes(x))],
          });
        },

        setDrop: (drop) => {
          const cur = get().drop;
          if (
            cur === drop ||
            (cur && drop && cur.parentId === drop.parentId && cur.index === drop.index)
          )
            return;
          set({ drop });
        },
        openDetails: (id, fields) => set({ details: id ? { id, fields } : null }),
      };
    }),
  );
}

export type EditorStore = ReturnType<typeof createEditorStore>;
