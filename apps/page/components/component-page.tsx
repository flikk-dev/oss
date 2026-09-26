import { CodeBlock } from "@/components/code-block";
import { Example } from "@/components/example";
import { Tabs } from "@/components/tabs";
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
    /** the one-line add, when it is in the registry */
    cli?: string;
    /** what to do when it is not, or when you would rather not run anything */
    manual: string;
    /** anything it expects to already be there */
    dependencies?: string[];
  };
  /** the smallest thing that works */
  usage: { imports: string; code: string };
  /** how the parts nest, and what each one is for */
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
                    id: "cli",
                    label: "CLI",
                    content: <CodeBlock code={doc.install.cli} />,
                  },
                ]
              : []),
            {
              id: "manual",
              label: "Manual",
              content: <CodeBlock code={doc.install.manual} />,
            },
          ]}
        />
        {doc.install.dependencies?.length ? (
          <Prose>Expects {doc.install.dependencies.join(", ")} to already be in your app.</Prose>
        ) : null}
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
