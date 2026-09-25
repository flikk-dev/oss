import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { Article, Prose, Section, SubSection } from "@/components/docs";
import { ComposedDemo, PlainDemo, RichDemo, RichTextareaDemo } from "@/components/rich-demo";
import { CATALOG } from "@/lib/catalog";

const entry = CATALOG.find((e) => e.slug === "rich-input")!;

export const metadata: Metadata = { title: entry.name, description: entry.summary };

const toc = [
  { id: "installation", label: "Installation" },
  { id: "usage", label: "Usage" },
  { id: "examples", label: "Examples" },
  { id: "textarea", label: "Textarea", depth: 2 as const },
  { id: "plain", label: "No fields", depth: 2 as const },
  { id: "composed", label: "Composed input", depth: 2 as const },
  { id: "api", label: "API reference" },
];

const INSTALL = `git clone https://github.com/flikk-dev/oss
cp -r oss/registry/base-nova/ui/rich components/ui/rich`;

const USAGE = `import { defineInputField, RichInput } from "@/components/ui/rich/editor"

const user = defineInputField("user", {
  pattern: /@([\\w-]+)/,
  render: ({ groups }) => <span>@{groups[0]}</span>,
})

export function Compose() {
  const [value, setValue] = useState("Hi @marc")
  return <RichInput components={[user]} value={value} onValueChange={setValue} />
}`;

const RESOLVE = `const user = defineInputField("user", {
  pattern: /@([\\w-]+)/,          // what you type
  resolved: /@\\[([^\\]]+)\\]\\(([\\w-]+)\\)/, // what it becomes
  resolve: async ({ groups }) => {
    const found = await lookup(groups[0])
    return found ? \`@[\${found.name}](\${found.id})\` : null
  },
  render: {
    draft: ({ groups }) => <Chip>{groups[0]}</Chip>,
    resolved: ({ groups }) => <Chip>{groups[0]}</Chip>,
  },
})`;

const API = `defineInputField(key, {
  pattern:   RegExp                      // a complete token
  render:    (match) => ReactNode        // or { draft, resolved }
  resolved?: RegExp                      // the settled form of an async token
  resolve?:  (match) => Promise<string | null>
  editable?: boolean                     // caret may re-enter it. default false
  className?: string                     // the chip shell
})

<RichInput | RichTextarea
  components={fields}
  value | defaultValue
  onValueChange={(value: string) => void}
  placeholder disabled className
  ref={{ value, selectionStart, selectionEnd, setSelectionRange, focus, undo, redo }}
/>`;

export default function Page() {
  return (
    <Article title={entry.name} lede={entry.summary} toc={toc}>
      <div className="rounded-lg border border-border p-6">
        <RichDemo />
      </div>

      <Section id="installation" title="Installation">
        <Prose>
          Not in the registry yet, so copy the folder. It has no dependencies beyond React and your{" "}
          <code className="font-mono text-xs text-foreground">cn</code> helper.
        </Prose>
        <CodeBlock code={INSTALL} />
      </Section>

      <Section id="usage" title="Usage">
        <Prose>
          A field is a pattern and a renderer. Text matching the pattern becomes one chip: the caret
          steps over it and Backspace takes the whole thing. The value stays a plain string.
        </Prose>
        <CodeBlock code={USAGE} />
        <Prose>
          A token stays ordinary text while you are still typing it, so
          <code className="mx-1 font-mono text-xs text-foreground">@marc</code>
          does not freeze at
          <code className="mx-1 font-mono text-xs text-foreground">@m</code>. It sets once the caret
          leaves.
        </Prose>
      </Section>

      <Section id="examples" title="Examples">
        <SubSection id="textarea" title="Textarea">
          <Prose>
            Same core. Enter inserts a line here and does nothing in the single line field, which
            also strips newlines out of its value.
          </Prose>
          <div className="rounded-lg border border-border p-6">
            <RichTextareaDemo />
          </div>
        </SubSection>

        <SubSection id="plain" title="No fields">
          <Prose>
            With nothing declared it is a text field, and it is tested against a native one: value
            and caret after the same keystrokes, across generated scripts.
          </Prose>
          <div className="rounded-lg border border-border p-6">
            <PlainDemo />
          </div>
        </SubSection>

        <SubSection id="composed" title="Composed input">
          <Prose>
            An input method writes into the field directly, the one case the component cannot
            intercept. Compose a word, accept a candidate, then edit around it.
          </Prose>
          <div className="rounded-lg border border-border p-6">
            <ComposedDemo />
          </div>
        </SubSection>
      </Section>

      <Section id="api" title="API reference">
        <CodeBlock code={API} />
        <Prose>
          An async token names a lookup but carries no answer, so it takes two patterns. Once
          resolve rewrites it into the settled form, the value holds the answer and a paste
          elsewhere renders with no network.
        </Prose>
        <CodeBlock code={RESOLVE} />
      </Section>
    </Article>
  );
}
