"use client";

import * as React from "react";
import { defineInputField, RichInput, RichPicker } from "@/registry/base-nova/ui/rich/editor";

const PEOPLE: Record<string, string> = {
  marc: "Marc Egger",
  ana: "Ana Ruiz",
  sam: "Sam Okoye",
  ana2: "Ana Beltrán",
  sami: "Sami Haddad",
};

/** stands in for whatever a host would really call */
async function findPeople(query: string) {
  await new Promise((r) => setTimeout(r, 250));
  const q = query.toLowerCase();
  return Object.entries(PEOPLE)
    .filter(([slug, name]) => slug.startsWith(q) || name.toLowerCase().includes(q))
    .map(([slug, name]) => ({ value: `@${slug}`, label: name, hint: `@${slug}` }));
}

const user = defineInputField("user", {
  pattern: /@([\w-]+)/,
  opens: /@([\w-]*)$/, // anchored at the caret
  className: "font-medium text-foreground",
  render: ({ groups }) => <span>{PEOPLE[groups[0]!] ?? groups[0]}</span>,
});

export function RichInputDemo() {
  const [value, setValue] = React.useState("Hi @marc, click that to change it");
  return (
    <RichInput
      aria-label="Rich input"
      components={[user]}
      value={value}
      onValueChange={setValue}
      placeholder="Type @ to pick someone"
      renderPicker={({ query, mode, rect, replace, close }) => (
        <RichPicker
          query={query}
          rect={rect}
          side="bottom"
          searchable={mode === "chip"}
          search={findPeople}
          onPick={replace}
          close={close}
        />
      )}
    />
  );
}
