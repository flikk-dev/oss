/**
 * What Flikk! has open-sourced.
 *
 * One entry per thing, and every list on the site reads from here: the docs
 * sidebar, the docs index, the landing page, the sitemap. Publishing the next
 * one is a row in this array plus its page.
 */

export type Entry = {
  slug: string;
  name: string;
  /** one line, for a card or a nav row */
  blurb: string;
  /** what it is, when a sentence of context helps */
  summary: string;
  /** a registry item you install; other kinds of work may not have one */
  registry?: string;
  status: "stable" | "in progress";
};

export const CATALOG: Entry[] = [
  {
    slug: "json-editor",
    name: "JSON Schema builder",
    blurb: "Edit a schema as a tree, get draft 2020-12 back.",
    summary:
      "Drag a field to any depth, select ten and move them together, add your own types. Four presets over one set of parts, and the keywords it has no UI for survive the round trip untouched.",
    registry: "json-editor",
    status: "stable",
  },
  {
    slug: "rich-input",
    name: "Rich input",
    blurb: "One line, where the host decides what becomes a chip.",
    summary:
      "A run matching a pattern you declared becomes one object: the caret steps over it and Backspace takes the whole thing. The value underneath stays a plain string.",
    status: "in progress",
  },
  {
    slug: "rich-textarea",
    name: "Rich textarea",
    blurb: "The same field over several lines.",
    summary:
      "Everything the rich input does, with newlines. Enter breaks a line instead of doing nothing, and the value keeps them.",
    status: "in progress",
  },
];

export const byStatus = (s: Entry["status"]) => CATALOG.filter((e) => e.status === s);
export const installCommand = (site: string, registry: string) =>
  `npx shadcn@latest add ${site}/r/${registry}.json`;
