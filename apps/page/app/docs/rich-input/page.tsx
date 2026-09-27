import type { Metadata } from "next";
import { ComponentPage, type ComponentDoc } from "@/components/component-page";
import { Prose } from "@/components/docs";
import { RichInputDemo } from "@/components/examples/rich-input-demo";
import { RichPlainDemo } from "@/components/examples/rich-plain-demo";
import { RichAsyncDemo } from "@/components/examples/rich-async-demo";
import { EXAMPLES } from "@/lib/source";
import { CATALOG } from "@/lib/catalog";
import { FIELD_API, INSTALL, PICKER_API } from "../rich-shared";

const entry = CATALOG.find((e) => e.slug === "rich-input")!;

export const metadata: Metadata = { title: entry.name, description: entry.summary };

const doc: ComponentDoc = {
  name: entry.name,
  lede: entry.summary,
  example: { demo: <RichInputDemo />, code: EXAMPLES["rich-input-demo"] },
  install: INSTALL,

  usage: {
    imports: `import { defineInputField, RichInput } from "@/components/ui/rich/editor"`,
    code: `const user = defineInputField("user", {
  pattern: /@([\\w-]+)/,
  render: ({ groups }) => <span>@{groups[0]}</span>,
})

export function Compose() {
  const [value, setValue] = useState("Hi @marc")
  return <RichInput components={[user]} value={value} onValueChange={setValue} />
}`,
  },

  composition: {
    tree: `RichInput
└── renderPicker
    └── RichPicker`,
    notes: (
      <>
        <Prose>
          That is the whole tree. A rich input is not a compound component: there is no Root, no
          Item, nothing to arrange. The one thing you nest inside it is a picker, and only when you
          want one.
        </Prose>
        <Prose>
          What would be children elsewhere are values here. A token is an object you build with
          defineInputField and hand over in components, because the field matches patterns against a
          string long before anything renders, and an element cannot be matched against.
        </Prose>
      </>
    ),
  },

  examples: [
    {
      id: "async",
      title: "Async tokens",
      about:
        "A mention names a lookup but carries no answer. Type @sam, move the caret away, and watch the value underneath rewrite itself into a form that needs no second lookup.",
      demo: <RichAsyncDemo />,
      code: EXAMPLES["rich-async-demo"],
    },
    {
      id: "plain",
      title: "No fields",
      about:
        "With nothing declared it is a text field, and it is tested as one: value and caret against a native input after the same keystrokes, across a hundred generated scripts.",
      demo: <RichPlainDemo />,
      code: EXAMPLES["rich-plain-demo"],
    },
  ],

  api: [
    FIELD_API,
    {
      code: `<RichInput
  components={fields}
  value | defaultValue
  onValueChange={(value: string) => void}
  renderPicker={({ query, mode, current, rect, start, end, replace, close }) => ReactNode}
  placeholder disabled className
  ref={{ value, selectionStart, selectionEnd, setSelectionRange, focus, undo, redo }}
/>`,
      notes: (
        <Prose>
          One line means one line: Enter does nothing, and a newline arriving by paste, macro or
          input method is dropped, the way an input drops it. The handle is input shaped on purpose,
          so a host already driving a text field by ref keeps doing that.
        </Prose>
      ),
    },
    PICKER_API,
  ],
};

export default function Page() {
  return <ComponentPage doc={doc} />;
}
