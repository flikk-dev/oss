import type { SchemaNode } from "./tree";

export type Issue = {
  id: string;
  code: "empty-slug" | "duplicate-slug" | "empty-group";
  message: string;
};

/** structural problems a consumer would refuse to save */
export function validate(root: SchemaNode): { ok: boolean; issues: Issue[] } {
  const issues: Issue[] = [];
  const walk = (nodes: SchemaNode[]) => {
    const seen = new Map<string, string>();
    for (const n of nodes) {
      if (!n.key)
        issues.push({
          id: n.id,
          code: "empty-slug",
          message: `"${n.title || "Untitled"}" has no key`,
        });
      else if (seen.has(n.key))
        issues.push({
          id: n.id,
          code: "duplicate-slug",
          message: `key "${n.key}" used twice`,
        });
      else seen.set(n.key, n.id);
      if (n.isGroup) {
        if (!n.children?.length)
          issues.push({
            id: n.id,
            code: "empty-group",
            message: `"${n.title || n.key}" has no fields`,
          });
        else walk(n.children);
      }
    }
  };
  walk(root.children ?? []);
  return { ok: issues.length === 0, issues };
}
