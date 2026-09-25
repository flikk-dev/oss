"use client";

import * as React from "react";
import { BracesIcon, HashIcon } from "lucide-react";
import { defineInputField, RichInput, RichTextarea } from "@/registry/base-nova/ui/rich/editor";

/** stand-ins for whatever a host would actually look these up in */
const PEOPLE: Record<string, string> = {
  marc: "Marc Egger",
  ana: "Ana Ruiz",
  sam: "Sam Okoye",
};

/** stand-in for whatever a host would really have: a name and a face */
function Avatar({ name }: { name: string }) {
  const hue = [...name].reduce((h, c) => h + c.charCodeAt(0), 0) % 360;
  return (
    <span
      aria-hidden
      style={{ background: `oklch(0.82 0.09 ${hue})`, color: `oklch(0.32 0.09 ${hue})` }}
      className="mx-0.5 inline-flex size-4 shrink-0 items-center justify-center self-center rounded-full text-[0.55rem] font-medium"
    >
      {name[0]}
    </span>
  );
}

function Mention({ name }: { name: string }) {
  return (
    <>
      <Avatar name={name} />
      <span>{name}</span>
    </>
  );
}

/**
 * Both @ signs, because a Japanese IME types the full-width one (U+FF20) and a
 * US keyboard types U+0040. The same character to a reader, two code points to
 * a regex. Which spellings count is the host's call, not the component's.
 *
 * Two patterns, because a mention is async. `@sam` names a lookup but carries
 * no answer, so it can only render after a fetch, and pasting it elsewhere
 * would need the same fetch again. `resolve` rewrites it into
 * `@[Sam Okoye](sam)`, which the second pattern matches and renders straight
 * from its own groups. The value ends up carrying the answer, so a copy-paste
 * lands complete and offline.
 */
const user = defineInputField("user", {
  pattern: /[@\uFF20]([\w\uFF21-\uFF3A\uFF41-\uFF5A\uFF10-\uFF19-]+)/,
  resolved: /@\[([^\]\n]+)\]\(([\w-]+)\)/,
  resolve: async ({ groups }) => {
    await new Promise((r) => setTimeout(r, 600)); // a real lookup would go here
    const name = PEOPLE[groups[0]!.toLowerCase()];
    return name ? `@[${name}](${groups[0]})` : null;
  },
  // a mention is a word in the sentence: no box, no tag, just a face and a name
  className:
    "font-medium text-foreground decoration-foreground/25 underline-offset-2 hover:underline",
  render: {
    // @sam: only the slug, so the name is a guess until the lookup lands
    draft: ({ groups }) => <Mention name={PEOPLE[groups[0]!.toLowerCase()] ?? groups[0]!} />,
    // @[Sam Okoye](sam): the name is right there in the value
    resolved: ({ groups }) => <Mention name={groups[0]!} />,
  },
});

/** a reference is machinery, so it reads as a tag */
const ref = defineInputField("ref", {
  pattern: /\{\{([\w.]+)\}\}/,
  className:
    "rounded-sm bg-primary/12 px-1 font-mono text-[0.8em] text-primary ring-1 ring-primary/25",
  render: ({ groups }) => (
    <>
      <BracesIcon className="size-3" />
      {groups[0]}
    </>
  ),
});

/** a number is worth amending in place, so it melts back to text on entry */
const issue = defineInputField("issue", {
  pattern: /#(\d+)/,
  editable: true,
  className: "rounded-sm bg-muted px-1 text-muted-foreground ring-1 ring-border",
  render: ({ groups }) => (
    <>
      <HashIcon className="size-3" />
      {groups[0]}
    </>
  ),
});

const FIELDS = [user, ref, issue];

export function RichDemo() {
  const [line, setLine] = React.useState("Hi @marc, {{trigger.order}} shipped, see #412");
  return (
    <RichInput
      aria-label="Rich input"
      components={FIELDS}
      value={line}
      onValueChange={setLine}
      placeholder="Try @marc, {{trigger.x}} or #412"
    />
  );
}

export function RichTextareaDemo() {
  const [body, setBody] = React.useState(
    "Hey @ana,\n\nThe run for {{trigger.customer}} finished.\nFiled as #1354.\n\n@sam",
  );
  return (
    <RichTextarea
      aria-label="Rich textarea"
      components={FIELDS}
      value={body}
      onValueChange={setBody}
      placeholder="Write something"
    />
  );
}

export function PlainDemo() {
  return <RichInput aria-label="Plain rich input" placeholder="Just a text field" />;
}

export function ComposedDemo() {
  const [cjk, setCjk] = React.useState(
    "おはようございます、@sam さん。\n{{trigger.order}} が発送されました。",
  );
  return (
    <RichTextarea
      aria-label="Composed input"
      components={FIELDS}
      value={cjk}
      onValueChange={setCjk}
      placeholder="かな入力でどうぞ"
    />
  );
}
