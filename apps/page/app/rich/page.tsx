import type { Metadata } from "next";
import { RichDemo } from "@/components/rich-demo";

export const metadata: Metadata = {
  title: "Rich input",
  robots: { index: false, follow: false },
};

export default function RichPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2 border-b border-border pb-5">
        <p className="font-mono text-2xs tracking-widest text-primary uppercase">CRE-1354</p>
        <h1 className="text-2xl font-semibold tracking-tight">Rich input</h1>
        <p className="text-sm text-muted-foreground">
          Type. A run matching a declared pattern becomes one chip — the caret skips it and
          Backspace takes the whole thing. The value under it stays a plain string, so copying a
          chip gives you the characters that made it, not its label.
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground">@mentions</span> and{" "}
          <span className="text-foreground">{"{{refs}}"}</span> are atomic.{" "}
          <span className="text-foreground">#123</span> is{" "}
          <code className="font-mono text-xs">editable</code>: put the caret inside and it melts
          back to text, one character at a time.
        </p>
      </header>
      <RichDemo />
      <footer className="border-t border-border pt-4 text-2xs text-muted-foreground">
        First cut. Undo, IME composition and mobile are not handled yet.
      </footer>
    </main>
  );
}
