export type SlugCase = "kebab" | "camel" | "snake";

const words = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());

/** "Created at" → created-at | createdAt | created_at */
export function slugify(title: string, kase: SlugCase): string {
  const w = words(title);
  if (!w.length) return "";
  switch (kase) {
    case "kebab":
      return w.join("-");
    case "snake":
      return w.join("_");
    case "camel":
      return (
        w[0] +
        w
          .slice(1)
          .map((x) => x[0].toUpperCase() + x.slice(1))
          .join("")
      );
  }
}

const suffixSep: Record<SlugCase, string> = {
  kebab: "-",
  snake: "_",
  camel: "",
};

/** first of base, base2, base3… (sep per case) not in taken */
export function uniqueSlug(base: string, taken: Set<string>, kase: SlugCase): string {
  if (!base || !taken.has(base)) return base;
  // strip an existing numeric suffix so "email2" → "email" → "email3"
  const sep = suffixSep[kase];
  const root = base.replace(new RegExp(`${sep ? "\\" + sep : ""}\\d+$`), "") || base;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${root}${sep}${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return base;
}
