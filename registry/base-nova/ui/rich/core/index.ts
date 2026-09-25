import type { ReactNode } from "react";

/**
 * A rich input is a text field whose value is still a plain string. Some runs
 * of that string are *one object* rather than a row of characters: the caret
 * cannot land inside them and Delete takes the whole thing.
 *
 * The host says which runs those are. Nothing here knows what a token means.
 */

export type FieldMatch = {
  /** which of the field's two patterns caught this: as typed, or settled */
  form: "draft" | "resolved";
  /** the whole matched run, exactly as it appears in the value */
  raw: string;
  /** capture groups, so a host can name a chip without re-parsing */
  groups: string[];
  /** where it sits in the value */
  start: number;
  end: number;
};

export type InputField = {
  key: string;
  /** a complete token; matched against the value, never against the DOM */
  pattern: RegExp;
  /**
   * The settled form of an async token, and the reason there are two patterns.
   *
   * `@sam` says who to look up but not who they are, so it only renders after a
   * fetch — and pasting it somewhere else needs the same fetch again. Once
   * `resolve` rewrites it to something self-describing, `@[Sam Okoye](sam)`,
   * the value carries the answer: this pattern matches that, renders straight
   * from its own groups, and a paste needs no network at all.
   */
  resolved?: RegExp;
  /**
   * Look a draft token up and return the settled text to put in its place, or
   * null to leave it as typed. Runs once a token stops being edited, never
   * mid-word, so it cannot move the caret out from under the user.
   */
  resolve?: (match: FieldMatch) => Promise<string | null>;
  /**
   * What a token looks like while it is still being typed, anchored to the
   * caret: `/@([\w-]*)$/`. When it matches, the field reports an open query and
   * the host may show a picker.
   *
   * The component does not own that picker. It says what is being typed, where
   * it sits, and how to replace it; everything else, the list, the filtering,
   * the keys, belongs to whoever knows what can be picked.
   */
  opens?: RegExp;
  /**
   * What the chip looks like.
   *
   * One function when a token has a single form. A pair when it settles, since
   * the two patterns capture different things — the draft holds a slug to look
   * up, the resolved form holds the answer — and a single renderer would spend
   * its first line working out which one it got.
   */
  render: Renderer | { draft: Renderer; resolved: Renderer };
  /**
   * Styling for the chip shell. The component only imposes what is structural —
   * atomic, one line tall, on the baseline — so a mention can read as a word in
   * the sentence while a reference reads as a tag.
   */
  className?: string;
  /**
   * Whether the caret may go back inside a committed token.
   *
   * Off by default, which is the point of a chip: once `@sam` is a person, the
   * caret steps over it and Backspace takes the whole thing — you replace it,
   * you do not repair it. Turn it on for a token whose text is worth amending
   * in place, like a URL or a number, and it melts back to characters when the
   * caret enters and deletes one at a time.
   *
   * Either way a token stays plain text while it is first being typed —
   * `@sam` matches at `@s`, and freezing there would make it untypeable.
   */
  editable?: boolean;
};

export type Renderer = (match: FieldMatch) => ReactNode;

/** a token being typed, which a host may offer to complete */
export type OpenToken = {
  field: InputField;
  /** the capture from `opens`, so far */
  query: string;
  /** what a pick replaces, in value space */
  start: number;
  end: number;
};

/** the token under the caret, if one is open */
export function openAt(value: string, caret: number, fields: InputField[]): OpenToken | null {
  const before = value.slice(0, caret);
  for (const field of fields) {
    if (!field.opens) continue;
    const m = field.opens.exec(before);
    if (!m) continue;
    return { field, query: m[1] ?? "", start: caret - m[0].length, end: caret };
  }
  return null;
}

/** the renderer for the form this match actually took */
export function rendererFor(field: InputField, form: FieldMatch["form"]): Renderer {
  return typeof field.render === "function" ? field.render : field.render[form];
}

export type Segment =
  | { type: "text"; text: string; start: number; end: number }
  | { type: "field"; field: InputField; match: FieldMatch };

/** declare a token. the key is yours, for your own switch statements */
export function defineInputField(key: string, spec: Omit<InputField, "key">): InputField {
  for (const [name, re] of [
    ["pattern", spec.pattern],
    ["resolved", spec.resolved],
    ["opens", spec.opens],
  ] as const)
    if (re && (re.global || re.sticky))
      throw new Error(
        `<defineInputField "${key}">: ${name} must not be global or sticky; ` +
          `tokenizing sets its own lastIndex and a shared one would skip matches`,
      );
  if (spec.resolved && typeof spec.render === "function")
    // not fatal, but almost always a mistake worth naming: the settled form's
    // capture groups are a different shape, so one renderer reads the wrong ones
    console.warn(
      `<defineInputField "${key}">: has a \`resolved\` pattern but one renderer. ` +
        `Pass { draft, resolved } unless both forms really capture the same groups.`,
    );
  if (spec.resolve && !spec.resolved)
    throw new Error(
      `<defineInputField "${key}">: a field that resolves needs a \`resolved\` ` +
        `pattern, or the text it rewrites itself into would not be recognised`,
    );
  return { key, ...spec };
}

/**
 * Value → segments. Earliest match wins; ties go to the field declared first,
 * so a host orders its own ambiguity rather than discovering ours. Matches
 * never overlap: scanning resumes after the one it took.
 */
export function parse(value: string, fields: InputField[]): Segment[] {
  const out: Segment[] = [];
  let at = 0;
  let text = 0; // where the current plain run began
  const push = (end: number) => {
    if (end > text) out.push({ type: "text", text: value.slice(text, end), start: text, end });
  };
  const forms = fields.flatMap((field) =>
    (
      [
        ["resolved", field.resolved],
        ["draft", field.pattern],
      ] as const
    ).flatMap(([form, re]) => (re ? [{ field, form, re }] : [])),
  );
  while (at < value.length) {
    let best: { field: InputField; form: "draft" | "resolved"; m: RegExpMatchArray } | null = null;
    for (const { field, form, re: src } of forms) {
      const re = new RegExp(src.source, src.flags + "g");
      re.lastIndex = at;
      const m = re.exec(value);
      if (!m) continue;
      // earliest wins; a tie goes to the longer run, so a settled token is
      // never mistaken for the draft form nested inside it
      if (
        !best ||
        m.index! < best.m.index! ||
        (m.index === best.m.index && m[0].length > best.m[0].length)
      )
        best = { field, form, m };
    }
    if (!best) break;
    const { field, form, m } = best;
    const start = m.index!;
    const raw = m[0];
    // a zero-width match would spin forever
    if (!raw.length) {
      at = start + 1;
      continue;
    }
    push(start);
    out.push({
      type: "field",
      field,
      match: {
        form,
        raw,
        groups: m.slice(1).map((g) => g ?? ""),
        start,
        end: start + raw.length,
      },
    });
    at = text = start + raw.length;
  }
  push(value.length);
  return out;
}

/** segments → value. the round trip is the contract: parse(serialize(s)) === s */
export function serialize(segments: Segment[]): string {
  return segments.map((s) => (s.type === "text" ? s.text : s.match.raw)).join("");
}

/** the token containing this offset, if the offset is strictly inside one */
export function fieldAt(segments: Segment[], offset: number): Segment | null {
  for (const s of segments)
    if (s.type === "field" && offset > s.match.start && offset < s.match.end) return s;
  return null;
}

/**
 * Push an offset out of the middle of a token.
 *
 * Nothing should produce such an offset, but a paste landing mid-token or a
 * host calling setSelectionRange with a number it made up both can — and a
 * caret inside a chip is the exact bug this component exists to remove.
 */
export function clampOut(segments: Segment[], offset: number, prefer: -1 | 1): number {
  const f = fieldAt(segments, offset);
  if (!f || f.type !== "field") return offset;
  return prefer < 0 ? f.match.start : f.match.end;
}
