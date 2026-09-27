"use client";

import * as React from "react";
import { defineInputField, RichInput } from "@/registry/base-nova/ui/rich/editor";

const DIRECTORY: Record<string, string> = {
  nadia: "Nadia Rahman",
  tomas: "Tomás Iglesias",
  priya: "Priya Menon",
  luka: "Luka Novak",
  amara: "Amara Okafor",
};

/**
 * Two patterns, because a mention is a lookup.
 *
 * `@priya` says who to find but not who they are, so it renders only after a
 * fetch, and pasting it elsewhere would need the same fetch again. `resolve`
 * rewrites it into `@[Priya Menon](priya)`, which the second pattern matches and
 * renders from its own groups. The value ends up carrying the answer.
 */
const user = defineInputField("user", {
  pattern: /@([\w-]+)/,
  resolved: /@\[([^\]\n]+)\]\(([\w-]+)\)/,
  resolve: async ({ groups }) => {
    await new Promise((r) => setTimeout(r, 600)); // a real lookup would go here
    const name = DIRECTORY[groups[0]!.toLowerCase()];
    return name ? `@[${name}](${groups[0]})` : null;
  },
  className: "font-medium text-foreground",
  render: {
    draft: ({ groups }) => <span>{groups[0]}</span>,
    resolved: ({ groups }) => <span>{groups[0]}</span>,
  },
});

export function RichAsyncDemo() {
  const [value, setValue] = React.useState("Ping @amara about it");
  return (
    <div className="flex flex-col gap-2">
      <RichInput
        aria-label="Async tokens"
        components={[user]}
        value={value}
        onValueChange={setValue}
        placeholder="Type @priya and move the caret away"
      />
      <pre className="overflow-x-auto rounded-sm bg-muted/50 px-2 py-1.5 font-mono text-xs whitespace-pre-wrap text-muted-foreground">
        {value}
      </pre>
    </div>
  );
}
