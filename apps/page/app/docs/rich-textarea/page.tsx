import type { Metadata } from "next";
import { ComponentPage, type ComponentDoc } from "@/components/component-page";
import { Prose } from "@/components/docs";
import { CATALOG } from "@/lib/catalog";
import { FIELD_API, INSTALL, PICKER_API } from "../rich-shared";

const entry = CATALOG.find((e) => e.slug === "rich-textarea")!;

export const metadata: Metadata = { title: entry.name, description: entry.summary };

const doc: ComponentDoc = {
  name: entry.name,
  lede: entry.summary,
  example: "rich-textarea-demo",
  install: INSTALL,

  usage: {
    imports: `import { defineInputField, RichTextarea } from "@/components/ui/rich/editor"`,
    code: `const ref = defineInputField("ref", {
  pattern: /\\{\\{([\\w.]+)\\}\\}/,
  render: ({ groups }) => <span>{groups[0]}</span>,
})

export function Body() {
  const [value, setValue] = useState("Line one\\nLine two")
  return <RichTextarea components={[ref]} value={value} onValueChange={setValue} />
}`,
  },

  composition: {
    tree: `RichTextarea
└── renderPicker
    └── RichPicker`,
    notes: (
      <>
        <Prose>
          The same two nodes as the single line field, and the same reason: this is not a compound
          component. A token is a value you pass, not an element you nest.
        </Prose>
        <Prose>
          The two share one core. Everything below is the difference, which is smaller than having
          two pages might suggest: Enter, and what happens to a newline.
        </Prose>
      </>
    ),
  },

  examples: [
    {
      id: "composed",
      title: "Composed input",
      about:
        "An input method writes into the field directly, the one case the component cannot intercept. Compose a word, accept a candidate, press Enter, then edit around it.",
      example: "rich-composed-demo",
    },
    {
      id: "plain",
      title: "No fields",
      about:
        "With nothing declared it is a textarea, and it is tested as one: value and caret against a native textarea after the same keystrokes, newlines included.",
      example: "rich-textarea-plain-demo",
    },
  ],

  api: [
    FIELD_API,
    {
      code: `<RichTextarea
  components={fields}
  value | defaultValue
  onValueChange={(value: string) => void}
  renderPicker={({ query, mode, current, rect, start, end, replace, close }) => ReactNode}
  placeholder disabled className
  ref={{ value, selectionStart, selectionEnd, setSelectionRange, focus, undo, redo }}
/>`,
      notes: (
        <Prose>
          Identical to the single line field but for newlines: Enter inserts one, the value keeps
          it, and nothing strips it on the way in. A chip still cannot be split, and the caret still
          cannot land inside one, across lines as within them.
        </Prose>
      ),
    },
    PICKER_API,
  ],
};

export default function Page() {
  return <ComponentPage doc={doc} />;
}
