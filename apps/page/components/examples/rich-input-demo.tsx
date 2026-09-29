"use client";

import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { defineInputField, RichInput, RichPicker } from "@/registry/base-nova/ui/rich/editor";

type Person = { username: string; name: string; title: string; team: string };

const PEOPLE: Person[] = [
  { username: "nadia", name: "Nadia Rahman", title: "Design lead", team: "Product" },
  { username: "tomas", name: "Tomás Iglesias", title: "Backend engineer", team: "Platform" },
  { username: "priya", name: "Priya Menon", title: "Data engineer", team: "Platform" },
  { username: "luka", name: "Luka Novak", title: "Support", team: "Operations" },
  { username: "amara", name: "Amara Okafor", title: "Product manager", team: "Product" },
];

const find = (username: string) => PEOPLE.find((p) => p.username === username.toLowerCase());

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

/**
 * Inline, an avatar has to fit the line it sits on.
 *
 * Avatar's own `data-[size]` class wins over a plain `size-4`, so the override
 * is marked important; at four it also has to lose the border ring, which at
 * that scale reads as grit rather than an edge.
 */
function Face({ name, big }: { name: string; big?: boolean }) {
  return big ? (
    <Avatar size="lg">
      <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
    </Avatar>
  ) : (
    <Avatar className="size-4! self-center after:hidden">
      <AvatarFallback className="text-[0.5rem] leading-none">{initials(name)}</AvatarFallback>
    </Avatar>
  );
}

/** the chip, and the card behind it */
function Mention({ person, raw }: { person?: Person; raw: string }) {
  if (!person) return <span>{raw}</span>;
  return (
    <HoverCard>
      <HoverCardTrigger
        render={<span className="inline-flex items-baseline gap-1 rounded-sm hover:bg-muted" />}
      >
        <Face name={person.name} />
        <span>{person.name}</span>
      </HoverCardTrigger>
      <HoverCardContent className="w-64">
        <div className="flex items-center gap-3">
          <Face name={person.name} big />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{person.name}</span>
            <span className="truncate font-mono text-xs text-muted-foreground">
              @{person.username}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{person.title}</Badge>
          <Badge variant="outline">{person.team}</Badge>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

const user = defineInputField("user", {
  pattern: /@([\w-]+)/,
  opens: /@([\w-]*)$/, // anchored at the caret
  className: "font-medium text-foreground",
  render: ({ groups, raw }) => <Mention person={find(groups[0]!)} raw={raw} />,
});

/** stands in for whatever a host would really call */
async function searchPeople(query: string) {
  await new Promise((r) => setTimeout(r, 200));
  const q = query.toLowerCase();
  return PEOPLE.filter((p) => p.username.startsWith(q) || p.name.toLowerCase().includes(q)).map(
    (p) => ({
      value: `@${p.username}`,
      icon: <Face name={p.name} />,
      label: (
        <span className="flex min-w-0 flex-col">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-foreground">{p.name}</span>
            <Badge variant="secondary">{p.title}</Badge>
          </span>
          <span className="truncate font-mono text-xs text-muted-foreground">@{p.username}</span>
        </span>
      ),
    }),
  );
}

export function RichInputDemo() {
  const [value, setValue] = React.useState("Ask @nadia to review it");
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
          search={searchPeople}
          onPick={replace}
          close={close}
        />
      )}
    />
  );
}
