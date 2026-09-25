import { CATALOG } from "@/lib/catalog";
import { DocsNav } from "@/components/docs-nav";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:flex-row lg:gap-10">
      <aside className="lg:w-44 lg:shrink-0">
        <div className="lg:sticky lg:top-20">
          <p className="mb-2 text-xs font-medium">Components</p>
          <DocsNav entries={CATALOG} />
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
