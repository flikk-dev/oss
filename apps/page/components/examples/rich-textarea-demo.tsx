"use client";

import * as React from "react";
import { PreviewCard } from "@base-ui/react/preview-card";
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

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "lg" }) {
  const hue = [...name].reduce((h, c) => h + c.charCodeAt(0), 0) % 360;
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
  return (
    <span
      aria-hidden
      style={{ background: `oklch(0.84 0.08 ${hue})`, color: `oklch(0.34 0.09 ${hue})` }}
      className={
        size === "lg"
          ? "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-medium"
          : "inline-flex size-4 shrink-0 items-center justify-center self-center rounded-full text-[0.55rem] font-medium"
      }
    >
      {initials}
    </span>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-sm border border-border px-1 py-px text-[0.65rem] font-medium text-muted-foreground">
      {children}
    </span>
  );
}

function Mention({ person, raw }: { person?: Person; raw: string }) {
  if (!person) return <span>{raw}</span>;
  return (
    <PreviewCard.Root>
      <PreviewCard.Trigger render={<span className="inline-flex items-baseline gap-1" />}>
        <Avatar name={person.name} />
        <span>{person.name}</span>
      </PreviewCard.Trigger>
      <PreviewCard.Portal>
        <PreviewCard.Positioner side="top" sideOffset={6} className="z-50">
          <PreviewCard.Popup className="flex w-64 flex-col gap-3 rounded-lg bg-popover p-3 text-popover-foreground shadow-md ring-1 ring-foreground/10">
            <div className="flex items-center gap-3">
              <Avatar name={person.name} size="lg" />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{person.name}</span>
                <span className="truncate font-mono text-xs text-muted-foreground">
                  @{person.username}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge>{person.title}</Badge>
              <Badge>{person.team}</Badge>
            </div>
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
}

const user = defineInputField("user", {
  pattern: /@([\w-]+)/,
  opens: /@([\w-]*)$/,
  className: "font-medium text-foreground",
  render: ({ groups, raw }) => <Mention person={find(groups[0]!)} raw={raw} />,
});

const ref = defineInputField("ref", {
  pattern: /\{\{([\w.]+)\}\}/,
  className: "rounded-sm bg-primary/12 px-1 font-mono text-[0.85em] text-primary",
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
  className: "rounded-sm bg-muted px-1 text-muted-foreground",
  render: ({ groups }) => (
    <>
      <CircleDotIcon className="size-3" />
      {groups[0]}
    </>
  ),
});

async function searchPeople(query: string) {
  await new Promise((r) => setTimeout(r, 200));
  const q = query.toLowerCase();
  return PEOPLE.filter((p) => p.username.startsWith(q) || p.name.toLowerCase().includes(q)).map(
    (p) => ({
      value: `@${p.username}`,
      icon: <Avatar name={p.name} />,
      label: (
        <span className="flex min-w-0 flex-col">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-foreground">{p.name}</span>
            <Badge>{p.title}</Badge>
          </span>
          <span className="truncate font-mono text-xs text-muted-foreground">@{p.username}</span>
        </span>
      ),
    }),
  );
}

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
