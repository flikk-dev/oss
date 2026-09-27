import { CodeBlock } from "@/components/code-block";
import { Example } from "@/components/example";
import { Tabs } from "@/components/tabs";
import { runners, Terminal } from "@/components/terminal";
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
  /** the component running, plus the file behind it */
  example: { demo: React.ReactNode; code: string };
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
  /** one running demo each, with its own file */
  examples: { id: string; title: string; about: string; demo: React.ReactNode; code: string }[];
  /** the full surface, as a signature */
  api: { code: string; notes?: React.ReactNode }[];
};

const BASE: TocItem[] = [
  { id: "installation", label: "Installation" },
  { id: "usage", label: "Usage" },
  { id: "composition", label: "Composition" },
  { id: "examples", label: "Examples" },
];

export function ComponentPage({ doc }: { doc: ComponentDoc }) {
  const toc: TocItem[] = [
    ...BASE,
    ...doc.examples.map((e) => ({ id: e.id, label: e.title, depth: 2 as const })),
    { id: "api", label: "API reference" },
  ];

  return (
    <Article title={doc.name} lede={doc.lede} toc={toc}>
      <Example code={doc.example.code}>{doc.example.demo}</Example>

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
            <Example code={e.code}>{e.demo}</Example>
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
