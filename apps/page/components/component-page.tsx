import { CodeBlock } from "@/components/code-block";
import { Example } from "@/components/example";
import { DEMOS, source, type ExampleKey } from "@/lib/examples";
import { Tabs } from "@/components/tabs";
import { Terminal } from "@/components/terminal";
import { runners } from "@/lib/runners";
import { Article, Prose, Section, SubSection, type TocItem } from "@/components/docs";

/**
 * The shape every component page takes.
 *
 * Not a suggestion: the order lives here, so a page supplies parts and cannot
 * reorder them, drop Installation, or invent a section the table of contents
 * does not know about. A reader who has read one of these has read them all.
 */

export type ComponentDoc = {
  name: string;
  /** one or two sentences, in the header */
  lede: string;
  /**
   * The component running, and the file behind it.
   *
   * One key, not a component and a filename: the two are bound together in
   * EXAMPLES, so the preview and the Code tab cannot be different things.
   */
  example: ExampleKey;
  install: {
    /** what `shadcn add` is given, when it is in the registry */
    cli?: string;
    /** what to do when it is not, or when you would rather not run anything */
    manual: string;
  };
  /** the smallest thing that works */
  usage: { imports: string; code: string };
  /**
   * The element tree: what you write inside what.
   *
   * Elements only. Props, options and the objects you pass belong in the API
   * reference, and a tree that lists them is an inventory wearing box
   * characters. A component with nothing to nest says so.
   */
  composition: { tree: string; notes?: React.ReactNode };
  /** one running demo each, named the same way */
  examples: { id: string; title: string; about: string; example: ExampleKey }[];
  /** the full surface, as a signature */
  api: { code: string; notes?: React.ReactNode }[];
};

const BASE: TocItem[] = [
  { id: "installation", label: "Installation" },
  { id: "usage", label: "Usage" },
  { id: "composition", label: "Composition" },
  { id: "examples", label: "Examples" },
];

/** the one place a demo and its source are put together */
function Preview({ of }: { of: ExampleKey }) {
  const Demo = DEMOS[of];
  return (
    <Example code={source(of)}>
      <Demo />
    </Example>
  );
}

export function ComponentPage({ doc }: { doc: ComponentDoc }) {
  const toc: TocItem[] = [
    ...BASE,
    ...doc.examples.map((e) => ({ id: e.id, label: e.title, depth: 2 as const })),
    { id: "api", label: "API reference" },
  ];

  return (
    <Article title={doc.name} lede={doc.lede} toc={toc}>
      <Preview of={doc.example} />

      <Section id="installation" title="Installation">
        <Tabs
          tabs={[
            ...(doc.install.cli
              ? [
                  {
                    id: "command",
                    label: "Command",
                    content: <Terminal commands={runners(doc.install.cli)} />,
                  },
                ]
              : []),
            {
              id: "manual",
              label: "Manual",
              content: <Terminal commands={{ shell: doc.install.manual }} />,
            },
          ]}
        />
      </Section>

      <Section id="usage" title="Usage">
        <CodeBlock code={doc.usage.imports} />
        <CodeBlock code={doc.usage.code} />
      </Section>

      <Section id="composition" title="Composition">
        <CodeBlock code={doc.composition.tree} />
        {doc.composition.notes}
      </Section>

      <Section id="examples" title="Examples">
        {doc.examples.map((e) => (
          <SubSection key={e.id} id={e.id} title={e.title}>
            <Prose>{e.about}</Prose>
            <Preview of={e.example} />
          </SubSection>
        ))}
      </Section>

      <Section id="api" title="API reference">
        {doc.api.map((a, i) => (
          <div key={i} className="flex flex-col gap-3">
            <CodeBlock code={a.code} />
            {a.notes}
          </div>
        ))}
      </Section>
    </Article>
  );
}
