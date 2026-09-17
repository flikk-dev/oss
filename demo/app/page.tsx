import { EditorPreview } from "@demo/components/editor-preview"
import type { Groups, Skin, Variant } from "@/components/ui/json/editor"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string; groups?: string; skin?: string }>
}) {
  const {
    variant = "default",
    groups = "nested",
    skin = "editor",
  } = await searchParams
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-3 p-6">
      <EditorPreview
        variant={variant as Variant}
        groups={groups as Groups}
        skin={skin as Skin}
      />
    </div>
  )
}
