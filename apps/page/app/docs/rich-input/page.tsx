import type { Metadata } from "next";
import { RichDemo } from "@/components/rich-demo";
import { CATALOG } from "@/lib/catalog";

const entry = CATALOG.find((e) => e.slug === "rich-input")!;

export const metadata: Metadata = {
  title: entry.name,
  description: entry.summary,
};

const notes = [
  {
    title: "The host says what a token is",
    body: "defineInputField takes a pattern and a renderer. The surface never branches on what a token means, so @mentions, {{refs}} and #123 are the same machinery with different arguments.",
  },
  {
    title: "The value stays a plain string",
    body: "Hi {{trigger.name}} in, the same out. Copying a chip gives you the characters that made it, and pasting re-tokenizes them — so it drops into anything that already accepts text.",
  },
  {
    title: "A chip is one object",
    body: "The caret cannot land inside it and Backspace takes the whole thing. Set editable and it melts back to letters when the caret enters, for a token worth amending in place.",
  },
  {
    title: "Resolving rewrites the value",
    body: "@sam names a lookup but carries no answer. A second pattern matches the settled form it becomes, so a paste elsewhere renders with no network at all.",
  },
];

export default function Page() {
  return (
    <main className="flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{entry.name}</h1>
          <span className="rounded-xs border border-border px-1.5 py-px font-mono text-2xs tracking-wide text-muted-foreground uppercase">
            wip
          </span>
        </div>
        <p className="max-w-[62ch] text-sm text-pretty text-muted-foreground">{entry.summary}</p>
        <p className="max-w-[62ch] text-sm text-muted-foreground">
          Not in the registry yet. Undo, IME composition and selection are done; events, form
          participation and a resolve failure state are not.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Try it</h2>
        <RichDemo />
      </section>

      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {notes.map((n) => (
          <div key={n.title} className="flex flex-col gap-1">
            <h3 className="text-sm font-medium">{n.title}</h3>
            <p className="text-sm text-pretty text-muted-foreground">{n.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
