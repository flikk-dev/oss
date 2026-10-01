"use client";

import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { BracesIcon, CircleDotIcon } from "lucide-react";
import { defineInputField, RichPicker, RichTextarea } from "@/registry/base-nova/ui/rich/editor";

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

/** one hue per string, so a person and their team keep the same colour */
const hueOf = (text: string) => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

const tint = (hue: number, weight = 1) => ({
  background: `light-dark(oklch(0.94 ${0.05 * weight} ${hue}), oklch(0.3 ${0.06 * weight} ${hue}))`,
  color: `light-dark(oklch(0.4 ${0.12 * weight} ${hue}), oklch(0.88 ${0.1 * weight} ${hue}))`,
});

/**
 * Inline, an avatar has to fit the line it sits on.
 *
 * Avatar's own `data-[size]` class wins over a plain `size-4`, so the override
 * is marked important; at four it also has to lose the border ring, which at
 * that scale reads as grit rather than an edge.
 */
function Face({ name, big }: { name: string; big?: boolean }) {
  const skin = tint(hueOf(name));
  return big ? (
    <Avatar size="lg">
      <AvatarFallback style={skin} className="text-xs font-medium">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  ) : (
    <Avatar className="size-4! self-center after:hidden">
      <AvatarFallback style={skin} className="text-[0.5rem] leading-none font-medium">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * A label sat beside the handle, not under it.
 *
 * Smaller than the handle it follows: it qualifies the person, so it reads
 * after their name rather than competing with it. The colour comes from the
 * word, so two tags are two things at a glance.
 */
function Tag({ children }: { children: string }) {
  return (
    <Badge
      variant="secondary"
      style={tint(hueOf(children), 1.2)}
      className="h-4 shrink-0 border-transparent px-1.5 text-[0.625rem]"
    >
      {children}
    </Badge>
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
      {/* the popup is not a flex row of its own, so it stacks flush */}
      <HoverCardContent className="flex w-auto max-w-sm items-center gap-3 p-3">
        <Face name={person.name} big />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-medium">{person.name}</span>
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate font-mono text-xs text-muted-foreground">
              @{person.username}
            </span>
            <Tag>{person.title}</Tag>
            <Tag>{person.team}</Tag>
          </span>
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
            <Tag>{p.title}</Tag>
          </span>
          <span className="truncate font-mono text-xs text-muted-foreground">@{p.username}</span>
        </span>
      ),
    }),
  );
}

const ref = defineInputField("ref", {
  pattern: /\{\{([\w.]+)\}\}/,
  className: "mx-px gap-0.5 rounded-sm bg-primary/12 px-1 font-mono text-[0.85em] text-primary",
  render: ({ groups }) => (
    <>
      <BracesIcon className="size-3" />
      {groups[0]}
    </>
  ),
});

const issue = defineInputField("issue", {
  pattern: /#(\d+)/,
  editable: true, // a number is worth amending in place
  className: "mx-px gap-0.5 rounded-sm bg-muted px-1 text-muted-foreground",
  render: ({ groups }) => (
    <>
      <CircleDotIcon className="size-3" />
      {groups[0]}
    </>
  ),
});

export function RichTextareaDemo() {
  const [value, setValue] = React.useState(
    "@priya the run for {{trigger.customer}} finished.\nFiled as #1354, @luka is picking it up.",
  );
  return (
    <RichTextarea
      aria-label="Rich textarea"
      components={[user, ref, issue]}
      value={value}
      onValueChange={setValue}
      placeholder="Type @ for someone, {{ for a reference, # for an issue"
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
