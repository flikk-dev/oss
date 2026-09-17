import { EditorPreview } from "@demo/components/editor-preview"
import type { Groups, Variant } from "@/components/ui/json/editor"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string; groups?: string }>
}) {
  const { variant = "default", groups = "nested" } = await searchParams
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-3 p-6">
      <EditorPreview variant={variant as Variant} groups={groups as Groups} />
    </div>
  )
}
