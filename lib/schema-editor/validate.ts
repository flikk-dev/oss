import { isGroupType, type FieldTree } from "./tree"

export type Issue = {
  id: string
  code: "empty-slug" | "duplicate-slug" | "empty-group"
  message: string
}

/** structural problems a consumer would refuse to save */
export function validate(tree: FieldTree): { ok: boolean; issues: Issue[] } {
  const issues: Issue[] = []
  const walk = (nodes: FieldTree) => {
    const seen = new Map<string, string>()
    for (const n of nodes) {
      if (!n.slug) issues.push({ id: n.id, code: "empty-slug", message: `"${n.title || "Untitled"}" has no key` })
      else if (seen.has(n.slug))
        issues.push({ id: n.id, code: "duplicate-slug", message: `key "${n.slug}" used twice` })
      else seen.set(n.slug, n.id)
      if (isGroupType(n.type)) {
        if (!n.children?.length)
          issues.push({ id: n.id, code: "empty-group", message: `"${n.title || n.slug}" has no fields` })
        else walk(n.children)
      }
    }
  }
  walk(tree)
  return { ok: issues.length === 0, issues }
}
